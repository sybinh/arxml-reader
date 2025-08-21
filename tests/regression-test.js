const { ArxmlConverter } = require('../out/arxmlConverter.js');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive test suite for ARXML Reader extension
 * Tests runtime performance, regression, and functionality after every fix or update
 */

class ArxmlTestSuite {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            total: 0
        };
        this.converter = new ArxmlConverter();
        this.startTime = 0;
    }

    // Test registration
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }

    // Main test runner
    async runAll() {
        console.log('🚀 Starting ARXML Reader Test Suite\n');
        this.startTime = Date.now();

        for (const test of this.tests) {
            await this.runTest(test);
        }

        this.printSummary();
        return this.results.failed === 0;
    }

    async runTest(test) {
        console.log(`📋 Running: ${test.name}`);
        this.results.total++;

        try {
            const result = await test.testFn();
            if (result === true) {
                console.log(`✅ PASS: ${test.name}\n`);
                this.results.passed++;
            } else if (result === 'warning') {
                console.log(`⚠️  WARN: ${test.name}\n`);
                this.results.warnings++;
            } else {
                console.log(`❌ FAIL: ${test.name} - ${result}\n`);
                this.results.failed++;
            }
        } catch (error) {
            console.log(`❌ FAIL: ${test.name} - Error: ${error.message}\n`);
            this.results.failed++;
        }
    }

    printSummary() {
        const duration = Date.now() - this.startTime;
        console.log('==================================================');
        console.log('📊 Test Results Summary');
        console.log('==================================================');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⚠️  Warnings: ${this.results.warnings}`);
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log('==================================================');

        if (this.results.failed > 0) {
            console.log('❌ Some tests failed. Please review the issues above.');
            process.exit(1);
        } else {
            console.log('✅ All tests passed successfully!');
        }
    }

    // Helper method to create test ARXML content
    createTestXml(content) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-2-2.xsd">
  <AR-PACKAGES>
    <AR-PACKAGE>
      <SHORT-NAME>TestEcucConfig</SHORT-NAME>
      <ELEMENTS>
        ${content}
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
    }
}

// Create test suite instance
const testSuite = new ArxmlTestSuite();

// 1. Basic functionality test
testSuite.addTest('Basic ECUC Conversion', async () => {
    const testXml = testSuite.createTestXml(`
        <ECUC-MODULE-CONFIGURATION-VALUES>
            <SHORT-NAME>TestModule</SHORT-NAME>
            <DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR/EcucDefs/TestModule</DEFINITION-REF>
            <CONTAINERS>
                <ECUC-CONTAINER-VALUE>
                    <SHORT-NAME>TestContainer</SHORT-NAME>
                    <DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer</DEFINITION-REF>
                    <PARAMETER-VALUES>
                        <ECUC-NUMERICAL-PARAM-VALUE>
                            <SHORT-NAME>TestParam</SHORT-NAME>
                            <DEFINITION-REF DEST="ECUC-INTEGER-PARAM-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer/TestParam</DEFINITION-REF>
                            <VALUE>42</VALUE>
                        </ECUC-NUMERICAL-PARAM-VALUE>
                    </PARAMETER-VALUES>
                </ECUC-CONTAINER-VALUE>
            </CONTAINERS>
        </ECUC-MODULE-CONFIGURATION-VALUES>
    `);

    const result = await testSuite.converter.convertToArtext(testXml);
    
    if (!result.includes('package TestEcucConfig')) return 'Missing package declaration';
    if (!result.includes('module AUTOSAR.EcucDefs.TestModule "TestModule"')) return 'Missing module declaration';
    if (!result.includes('TestContainer "TestContainer"')) return 'Missing container';
    if (!result.includes('TestParam = 42 (= 0x2A)')) return 'Missing parameter or incorrect hex value';
    
    return true;
});

// 2. HTML entities decoding test (user reported bug)
testSuite.addTest('HTML Entities Decoding (&&)', async () => {
    const testXml = testSuite.createTestXml(`
        <ECUC-MODULE-CONFIGURATION-VALUES>
            <SHORT-NAME>BswM</SHORT-NAME>
            <DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR_BswM/EcucModuleDefs/BswM</DEFINITION-REF>
            <CONTAINERS>
                <ECUC-CONTAINER-VALUE>
                    <SHORT-NAME>TestContainer</SHORT-NAME>
                    <DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">/AUTOSAR_BswM/EcucModuleDefs/BswM/TestContainer</DEFINITION-REF>
                    <REFERENCE-VALUES>
                        <ECUC-REFERENCE-VALUE>
                            <DEFINITION-REF DEST="ECUC-SYMBOLIC-NAME-REFERENCE-DEF">/AUTOSAR_BswM/EcucModuleDefs/BswM/BswMConfig/BswMModeControl/BswMAction/BswMAvailableActions/BswMPduGroupSwitch/BswMEnabledPduGroupRef</DEFINITION-REF>
                            <VARIATION-POINT>
                                <SW-SYSCOND BINDING-TIME="CODE-GENERATION-TIME">
                                    <SYSC-REF DEST="SW-SYSTEMCONST">/RB/UBK/Project/SwSystemconsts/DIAGCOM_NETVRNT_SC</SYSC-REF>
                                    !=4&amp;&amp;
                                    <SYSC-REF DEST="SW-SYSTEMCONST">/RB/UBK/Project/SwSystemconsts/LIN_SY</SYSC-REF>
                                    ==1
                                </SW-SYSCOND>
                            </VARIATION-POINT>
                            <VALUE-REF DEST="ECUC-CONTAINER-VALUE">/RB/UBK/Project/EcucModuleConfigurationValuess/Com/ComConfig/Motor_LIN1_RX</VALUE-REF>
                        </ECUC-REFERENCE-VALUE>
                    </REFERENCE-VALUES>
                </ECUC-CONTAINER-VALUE>
            </CONTAINERS>
        </ECUC-MODULE-CONFIGURATION-VALUES>
    `);

    const result = await testSuite.converter.convertToArtext(testXml);
    
    if (result.includes('&amp;')) return 'HTML entities not decoded';
    if (!result.includes('DIAGCOM_NETVRNT_SC !=4 && LIN_SY ==1')) return 'System condition not correctly parsed';
    
    return true;
});

// 3. Stack overflow protection test
testSuite.addTest('Stack Overflow Protection', async () => {
    // Create deeply nested XML structure
    let deepXml = testSuite.createTestXml(`
        <ECUC-MODULE-CONFIGURATION-VALUES>
            <SHORT-NAME>TestModule</SHORT-NAME>
            <DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR/EcucDefs/TestModule</DEFINITION-REF>
    `);
    
    // Add 25 levels of nested containers (should trigger depth protection)
    let containerXml = '<CONTAINERS>';
    for (let i = 0; i < 25; i++) {
        containerXml += `
            <ECUC-CONTAINER-VALUE>
                <SHORT-NAME>Container${i}</SHORT-NAME>
                <DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">/AUTOSAR/EcucDefs/TestModule/Container${i}</DEFINITION-REF>
                <SUB-CONTAINERS>`;
    }
    
    // Close all containers
    for (let i = 0; i < 25; i++) {
        containerXml += `
                </SUB-CONTAINERS>
            </ECUC-CONTAINER-VALUE>`;
    }
    containerXml += '</CONTAINERS>';
    
    deepXml = deepXml.replace('<CONTAINERS>', containerXml);
    deepXml += `
        </ECUC-MODULE-CONFIGURATION-VALUES>
    `;

    const result = await testSuite.converter.convertToArtext(deepXml);
    
    // Should not crash and should contain some content
    if (result.length === 0) return 'Empty result from deeply nested structure';
    if (result.includes('Error: File structure is too deeply nested')) return 'warning'; // This is expected behavior
    
    return true;
});

// 4. File size limit test
testSuite.addTest('File Size Limit Protection', async () => {
    const converter = new ArxmlConverter({ maxFileSizeMB: 1 }); // Very small limit for testing
    
    // Create a large XML string (over 1MB)
    const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB of content
    const largeXml = `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR>
    <COMMENT>${largeContent}</COMMENT>
</AUTOSAR>`;

    const result = await converter.convertToArtext(largeXml);
    
    if (!result.includes('File is too large')) return 'File size limit not enforced';
    if (!result.includes('2MB')) return 'Incorrect file size calculation';
    
    return true;
});

// 5. Non-ECUC content handling test
testSuite.addTest('Non-ECUC Content Disclaimer', async () => {
    const nonEcucXml = testSuite.createTestXml(`
        <SW-COMPONENT-TYPE>
            <SHORT-NAME>TestComponent</SHORT-NAME>
        </SW-COMPONENT-TYPE>
    `);

    const result = await testSuite.converter.convertToArtext(nonEcucXml);
    
    if (!result.includes('ARXML Reader Disclaimer')) return 'Missing disclaimer for non-ECUC content';
    if (!result.includes('only ECUC (ECU Configuration) values')) return 'Missing explanation';
    if (!result.includes('SW-COMPONENT-TYPE')) return 'Should list found element types';
    
    return true;
});

// 6. Performance test
testSuite.addTest('Performance Benchmark', async () => {
    const testXml = testSuite.createTestXml(`
        <ECUC-MODULE-CONFIGURATION-VALUES>
            <SHORT-NAME>TestModule</SHORT-NAME>
            <DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR/EcucDefs/TestModule</DEFINITION-REF>
            <CONTAINERS>
                ${Array(100).fill(0).map((_, i) => `
                    <ECUC-CONTAINER-VALUE>
                        <SHORT-NAME>Container${i}</SHORT-NAME>
                        <DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">/AUTOSAR/EcucDefs/TestModule/Container${i}</DEFINITION-REF>
                        <PARAMETER-VALUES>
                            <ECUC-NUMERICAL-PARAM-VALUE>
                                <SHORT-NAME>Param${i}</SHORT-NAME>
                                <DEFINITION-REF DEST="ECUC-INTEGER-PARAM-DEF">/AUTOSAR/EcucDefs/TestModule/Container${i}/Param${i}</DEFINITION-REF>
                                <VALUE>${i}</VALUE>
                            </ECUC-NUMERICAL-PARAM-VALUE>
                        </PARAMETER-VALUES>
                    </ECUC-CONTAINER-VALUE>
                `).join('')}
            </CONTAINERS>
        </ECUC-MODULE-CONFIGURATION-VALUES>
    `);

    const startTime = Date.now();
    const result = await testSuite.converter.convertToArtext(testXml);
    const duration = Date.now() - startTime;
    
    if (duration > 5000) return `Too slow: ${duration}ms (should be < 5000ms)`;
    if (result.length === 0) return 'Empty result';
    if (!result.includes('Container99')) return 'Missing expected content';
    
    console.log(`   ⏱️  Performance: ${duration}ms for 100 containers`);
    return true;
});

// 7. Error handling test
testSuite.addTest('Error Handling', async () => {
    const invalidXml = '<?xml version="1.0"?><invalid><unclosed>';
    
    try {
        const result = await testSuite.converter.convertToArtext(invalidXml);
        // The converter should handle this gracefully instead of throwing
        if (result.includes('Error:') || result.includes('❌')) {
            return true; // Graceful error handling
        } else {
            return 'Should have returned an error message for invalid XML';
        }
    } catch (error) {
        // This is also acceptable behavior
        return true;
    }
});

// 8. Textual parameters test
testSuite.addTest('Textual Parameters', async () => {
    const testXml = testSuite.createTestXml(`
        <ECUC-MODULE-CONFIGURATION-VALUES>
            <SHORT-NAME>TestModule</SHORT-NAME>
            <DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR/EcucDefs/TestModule</DEFINITION-REF>
            <CONTAINERS>
                <ECUC-CONTAINER-VALUE>
                    <SHORT-NAME>TestContainer</SHORT-NAME>
                    <DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer</DEFINITION-REF>
                    <PARAMETER-VALUES>
                        <ECUC-TEXTUAL-PARAM-VALUE>
                            <SHORT-NAME>TextParam</SHORT-NAME>
                            <DEFINITION-REF DEST="ECUC-STRING-PARAM-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer/TextParam</DEFINITION-REF>
                            <VALUE>TestValue</VALUE>
                        </ECUC-TEXTUAL-PARAM-VALUE>
                    </PARAMETER-VALUES>
                </ECUC-CONTAINER-VALUE>
            </CONTAINERS>
        </ECUC-MODULE-CONFIGURATION-VALUES>
    `);

    const result = await testSuite.converter.convertToArtext(testXml);
    
    if (!result.includes('TextParam = "TestValue"')) return 'Textual parameter not correctly formatted';
    
    return true;
});

// 9. Reference values test
testSuite.addTest('Reference Values', async () => {
    const testXml = testSuite.createTestXml(`
        <ECUC-MODULE-CONFIGURATION-VALUES>
            <SHORT-NAME>TestModule</SHORT-NAME>
            <DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR/EcucDefs/TestModule</DEFINITION-REF>
            <CONTAINERS>
                <ECUC-CONTAINER-VALUE>
                    <SHORT-NAME>TestContainer</SHORT-NAME>
                    <DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer</DEFINITION-REF>
                    <REFERENCE-VALUES>
                        <ECUC-REFERENCE-VALUE>
                            <SHORT-NAME>RefParam</SHORT-NAME>
                            <DEFINITION-REF DEST="ECUC-REFERENCE-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer/RefParam</DEFINITION-REF>
                            <VALUE-REF DEST="ECUC-CONTAINER-VALUE">/Path/To/Target</VALUE-REF>
                        </ECUC-REFERENCE-VALUE>
                    </REFERENCE-VALUES>
                </ECUC-CONTAINER-VALUE>
            </CONTAINERS>
        </ECUC-MODULE-CONFIGURATION-VALUES>
    `);

    const result = await testSuite.converter.convertToArtext(testXml);
    
    if (!result.includes('RefParam = Path.To.Target')) return 'Reference value not correctly formatted';
    
    return true;
});

// 10. Boolean parameter test
testSuite.addTest('Boolean Parameters', async () => {
    const testXml = testSuite.createTestXml(`
        <ECUC-MODULE-CONFIGURATION-VALUES>
            <SHORT-NAME>TestModule</SHORT-NAME>
            <DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR/EcucDefs/TestModule</DEFINITION-REF>
            <CONTAINERS>
                <ECUC-CONTAINER-VALUE>
                    <SHORT-NAME>TestContainer</SHORT-NAME>
                    <DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer</DEFINITION-REF>
                    <PARAMETER-VALUES>
                        <ECUC-NUMERICAL-PARAM-VALUE>
                            <SHORT-NAME>BoolParam</SHORT-NAME>
                            <DEFINITION-REF DEST="ECUC-BOOLEAN-PARAM-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer/BoolParam</DEFINITION-REF>
                            <VALUE>true</VALUE>
                        </ECUC-NUMERICAL-PARAM-VALUE>
                    </PARAMETER-VALUES>
                </ECUC-CONTAINER-VALUE>
            </CONTAINERS>
        </ECUC-MODULE-CONFIGURATION-VALUES>
    `);

    const result = await testSuite.converter.convertToArtext(testXml);
    
    // Boolean values should not have hex representation
    if (!result.includes('BoolParam = true')) return 'Boolean parameter not found';
    if (result.includes('(= 0x')) return 'Boolean parameter should not have hex value';
    
    return true;
});

// Run all tests
if (require.main === module) {
    testSuite.runAll().catch(console.error);
}

module.exports = { ArxmlTestSuite };
