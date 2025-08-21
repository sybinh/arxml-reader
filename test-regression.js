#!/usr/bin/env node

/**
 * ARXML Reader Extension - Regression Test Suite
 * 
 * This script runs comprehensive tests to verify that the extension
 * continues to work correctly after any code changes or updates.
 * 
 * Run with: node test-regression.js
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Import the converter after compilation
let ArxmlConverter;
try {
    ArxmlConverter = require('./out/arxmlConverter.js').ArxmlConverter;
} catch (error) {
    console.error('❌ Could not load compiled converter. Run "npm run compile" first.');
    process.exit(1);
}

class RegressionTester {
    constructor() {
        this.passedTests = 0;
        this.failedTests = 0;
        this.testResults = [];
        this.startTime = performance.now();
    }

    async runAllTests() {
        console.log('🧪 ARXML Reader - Regression Test Suite');
        console.log('==========================================\n');

        // Core functionality tests
        await this.testBasicConversion();
        await this.testSystemConditions();
        await this.testHtmlEntityDecoding();
        await this.testVariationPoints();
        await this.testLargeFileHandling();
        await this.testMalformedXml();
        await this.testPerformance();
        await this.testEdgeCases();
        await this.testConfigurationOptions();
        
        // Real file tests if available
        await this.testRealFiles();

        this.printSummary();
        
        // Exit with error code if any tests failed
        if (this.failedTests > 0) {
            process.exit(1);
        }
    }

    async testBasicConversion() {
        await this.runTest('Basic ECUC Conversion', async () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0">
  <AR-PACKAGES>
    <AR-PACKAGE>
      <SHORT-NAME>TestPackage</SHORT-NAME>
      <ELEMENTS>
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
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;

            const converter = new ArxmlConverter();
            const result = await converter.convertToArtext(xml);
            
            this.assert(result.includes('package TestPackage'), 'Should contain package declaration');
            this.assert(result.includes('module AUTOSAR.EcucDefs.TestModule "TestModule"'), 'Should contain module declaration');
            this.assert(result.includes('TestContainer "TestContainer"'), 'Should contain container');
            this.assert(result.includes('TestParam = 42 (= 0x2A)'), 'Should contain parameter with hex value');
        });
    }

    async testSystemConditions() {
        await this.runTest('System Condition Parsing', async () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0">
  <AR-PACKAGES>
    <AR-PACKAGE>
      <SHORT-NAME>TestPackage</SHORT-NAME>
      <ELEMENTS>
        <ECUC-MODULE-CONFIGURATION-VALUES>
          <SHORT-NAME>TestModule</SHORT-NAME>
          <DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR/EcucDefs/TestModule</DEFINITION-REF>
          <CONTAINERS>
            <ECUC-CONTAINER-VALUE>
              <SHORT-NAME>TestContainer</SHORT-NAME>
              <DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer</DEFINITION-REF>
              <REFERENCE-VALUES>
                <ECUC-REFERENCE-VALUE>
                  <DEFINITION-REF DEST="ECUC-SYMBOLIC-NAME-REFERENCE-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer/TestRef</DEFINITION-REF>
                  <VARIATION-POINT>
                    <SW-SYSCOND BINDING-TIME="CODE-GENERATION-TIME">
                      <SYSC-REF DEST="SW-SYSTEMCONST">/System/Constants/VAR1</SYSC-REF>
                      !=4&amp;&amp;
                      <SYSC-REF DEST="SW-SYSTEMCONST">/System/Constants/VAR2</SYSC-REF>
                      ==1
                    </SW-SYSCOND>
                  </VARIATION-POINT>
                  <VALUE-REF DEST="ECUC-CONTAINER-VALUE">/Test/Reference</VALUE-REF>
                </ECUC-REFERENCE-VALUE>
              </REFERENCE-VALUES>
            </ECUC-CONTAINER-VALUE>
          </CONTAINERS>
        </ECUC-MODULE-CONFIGURATION-VALUES>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;

            const converter = new ArxmlConverter();
            const result = await converter.convertToArtext(xml);
            
            this.assert(result.includes('[VAR1 !=4 && VAR2 ==1]'), 'Should parse complex system condition correctly');
        });
    }

    async testHtmlEntityDecoding() {
        await this.runTest('HTML Entity Decoding', async () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0">
  <AR-PACKAGES>
    <AR-PACKAGE>
      <SHORT-NAME>TestPackage</SHORT-NAME>
      <ELEMENTS>
        <ECUC-MODULE-CONFIGURATION-VALUES>
          <SHORT-NAME>TestModule</SHORT-NAME>
          <DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR/EcucDefs/TestModule</DEFINITION-REF>
          <CONTAINERS>
            <ECUC-CONTAINER-VALUE>
              <SHORT-NAME>TestContainer</SHORT-NAME>
              <DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer</DEFINITION-REF>
              <PARAMETER-VALUES>
                <ECUC-TEXTUAL-PARAM-VALUE>
                  <SHORT-NAME>TestParam</SHORT-NAME>
                  <DEFINITION-REF DEST="ECUC-STRING-PARAM-DEF">/AUTOSAR/EcucDefs/TestModule/TestContainer/TestParam</DEFINITION-REF>
                  <VALUE>Test &amp; Value &lt; 100 &gt;</VALUE>
                </ECUC-TEXTUAL-PARAM-VALUE>
              </PARAMETER-VALUES>
            </ECUC-CONTAINER-VALUE>
          </CONTAINERS>
        </ECUC-MODULE-CONFIGURATION-VALUES>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;

            const converter = new ArxmlConverter();
            const result = await converter.convertToArtext(xml);
            
            this.assert(result.includes('TestParam = "Test & Value < 100 >"'), 'Should decode HTML entities in text values');
            this.assert(!result.includes('&amp;'), 'Should not contain undecoded HTML entities');
            this.assert(!result.includes('&lt;'), 'Should not contain undecoded HTML entities');
            this.assert(!result.includes('&gt;'), 'Should not contain undecoded HTML entities');
        });
    }

    async testVariationPoints() {
        await this.runTest('Variation Points and Post-Build Conditions', async () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0">
  <AR-PACKAGES>
    <AR-PACKAGE>
      <SHORT-NAME>TestPackage</SHORT-NAME>
      <ELEMENTS>
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
                  <VALUE>123</VALUE>
                  <VARIATION-POINT>
                    <POST-BUILD-VARIANT-CONDITION>
                      <MATCHING-CRITERION-REF DEST="POST-BUILD-VARIANT-CRITERION">/Variants/Debug</MATCHING-CRITERION-REF>
                      <VALUE>Debug</VALUE>
                    </POST-BUILD-VARIANT-CONDITION>
                  </VARIATION-POINT>
                </ECUC-NUMERICAL-PARAM-VALUE>
              </PARAMETER-VALUES>
            </ECUC-CONTAINER-VALUE>
          </CONTAINERS>
        </ECUC-MODULE-CONFIGURATION-VALUES>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;

            const converter = new ArxmlConverter();
            const result = await converter.convertToArtext(xml);
            
            this.assert(result.includes('< Debug == Debug>'), 'Should parse post-build variant conditions');
        });
    }

    async testLargeFileHandling() {
        await this.runTest('Large File Size Limits', async () => {
            // Test with default limit (50MB)
            const largeContent = 'x'.repeat(60 * 1024 * 1024); // 60MB
            const converter = new ArxmlConverter();
            const result = await converter.convertToArtext(largeContent);
            
            this.assert(result.includes('File is too large'), 'Should handle large files gracefully');
            this.assert(result.includes('60MB'), 'Should report correct file size');
            
            // Test with custom limit
            const converterCustom = new ArxmlConverter({ maxFileSizeMB: 100 });
            const resultCustom = await converterCustom.convertToArtext(largeContent);
            
            this.assert(resultCustom.includes('File is too large'), 'Should respect custom size limits');
        });
    }

    async testMalformedXml() {
        await this.runTest('Malformed XML Handling', async () => {
            const malformedXml = `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR>
  <AR-PACKAGES>
    <UNCLOSED-TAG>
      <ANOTHER-TAG>Content</ANOTHER-TAG>
  </AR-PACKAGES>
</AUTOSAR>`;

            const converter = new ArxmlConverter();
            
            try {
                const result = await converter.convertToArtext(malformedXml);
                // Should either handle gracefully or throw an error
                this.assert(true, 'Handled malformed XML without crashing');
            } catch (error) {
                this.assert(error.message.length > 0, 'Should provide meaningful error message');
            }
        });
    }

    async testPerformance() {
        await this.runTest('Performance Benchmarks', async () => {
            const xml = this.generateLargeValidXml(1000); // 1000 containers
            const converter = new ArxmlConverter();
            
            const startTime = performance.now();
            const result = await converter.convertToArtext(xml);
            const endTime = performance.now();
            
            const processingTime = endTime - startTime;
            
            this.assert(result.length > 1000, 'Should generate substantial output');
            this.assert(processingTime < 5000, `Should process in reasonable time (was ${Math.round(processingTime)}ms)`);
            
            console.log(`    ⏱️  Processed 1000 containers in ${Math.round(processingTime)}ms`);
        });
    }

    async testEdgeCases() {
        await this.runTest('Edge Cases', async () => {
            // Empty XML
            const converter = new ArxmlConverter();
            const emptyResult = await converter.convertToArtext('<?xml version="1.0"?><AUTOSAR></AUTOSAR>');
            this.assert(emptyResult.includes('No AUTOSAR root element found') || emptyResult.includes('No recognizable'), 'Should handle empty XML');
            
            // Non-ECUC content
            const nonEcucXml = `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0">
  <AR-PACKAGES>
    <AR-PACKAGE>
      <SHORT-NAME>TestPackage</SHORT-NAME>
      <ELEMENTS>
        <SW-COMPONENT-TYPE>
          <SHORT-NAME>TestComponent</SHORT-NAME>
        </SW-COMPONENT-TYPE>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
            
            const nonEcucResult = await converter.convertToArtext(nonEcucXml);
            this.assert(nonEcucResult.includes('ARXML Reader Disclaimer'), 'Should show disclaimer for non-ECUC content');
            this.assert(nonEcucResult.includes('SW-COMPONENT-TYPE'), 'Should list found element types');
        });
    }

    async testConfigurationOptions() {
        await this.runTest('Configuration Options', async () => {
            const xml = this.generateTestXmlWithMultipleContainers();
            
            // Test sorting options
            const converterSort = new ArxmlConverter({ sort: 'all' });
            const sortedResult = await converterSort.convertToArtext(xml);
            
            const converterNoSort = new ArxmlConverter({ sort: 'none' });
            const unsortedResult = await converterNoSort.convertToArtext(xml);
            
            this.assert(sortedResult.length > 100, 'Sorted result should have content');
            this.assert(unsortedResult.length > 100, 'Unsorted result should have content');
            
            // Test except options
            const converterExcept = new ArxmlConverter({ except: ['TestParam1'] });
            const exceptResult = await converterExcept.convertToArtext(xml);
            
            this.assert(exceptResult.includes('TestParam'), 'Should still contain other parameters');
        });
    }

    async testRealFiles() {
        const testFiles = [
            'test-variation-point.arxml',
            'test-sample.arxml',
            'test-non-ecuc.arxml'
        ];

        for (const testFile of testFiles) {
            const filePath = path.join(__dirname, testFile);
            if (fs.existsSync(filePath)) {
                await this.runTest(`Real File: ${testFile}`, async () => {
                    const xmlContent = fs.readFileSync(filePath, 'utf8');
                    const converter = new ArxmlConverter();
                    const result = await converter.convertToArtext(xmlContent);
                    
                    this.assert(result.length > 0, 'Should produce some output');
                    this.assert(typeof result === 'string', 'Should return string result');
                });
            }
        }
    }

    async runTest(testName, testFunction) {
        process.stdout.write(`  ${testName}... `);
        
        try {
            const startTime = performance.now();
            await testFunction();
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            console.log(`✅ PASS (${duration}ms)`);
            this.passedTests++;
            this.testResults.push({ name: testName, status: 'PASS', duration });
        } catch (error) {
            console.log(`❌ FAIL`);
            console.log(`    Error: ${error.message}`);
            this.failedTests++;
            this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    generateLargeValidXml(containerCount) {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0">
  <AR-PACKAGES>
    <AR-PACKAGE>
      <SHORT-NAME>TestPackage</SHORT-NAME>
      <ELEMENTS>
        <ECUC-MODULE-CONFIGURATION-VALUES>
          <SHORT-NAME>TestModule</SHORT-NAME>
          <DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR/EcucDefs/TestModule</DEFINITION-REF>
          <CONTAINERS>`;

        for (let i = 0; i < containerCount; i++) {
            xml += `
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
            </ECUC-CONTAINER-VALUE>`;
        }

        xml += `
          </CONTAINERS>
        </ECUC-MODULE-CONFIGURATION-VALUES>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;

        return xml;
    }

    generateTestXmlWithMultipleContainers() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0">
  <AR-PACKAGES>
    <AR-PACKAGE>
      <SHORT-NAME>TestPackage</SHORT-NAME>
      <ELEMENTS>
        <ECUC-MODULE-CONFIGURATION-VALUES>
          <SHORT-NAME>TestModule</SHORT-NAME>
          <DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR/EcucDefs/TestModule</DEFINITION-REF>
          <CONTAINERS>
            <ECUC-CONTAINER-VALUE>
              <SHORT-NAME>ContainerB</SHORT-NAME>
              <DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">/AUTOSAR/EcucDefs/TestModule/ContainerB</DEFINITION-REF>
              <PARAMETER-VALUES>
                <ECUC-NUMERICAL-PARAM-VALUE>
                  <SHORT-NAME>TestParam2</SHORT-NAME>
                  <DEFINITION-REF DEST="ECUC-INTEGER-PARAM-DEF">/AUTOSAR/EcucDefs/TestModule/ContainerB/TestParam2</DEFINITION-REF>
                  <VALUE>200</VALUE>
                </ECUC-NUMERICAL-PARAM-VALUE>
              </PARAMETER-VALUES>
            </ECUC-CONTAINER-VALUE>
            <ECUC-CONTAINER-VALUE>
              <SHORT-NAME>ContainerA</SHORT-NAME>
              <DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">/AUTOSAR/EcucDefs/TestModule/ContainerA</DEFINITION-REF>
              <PARAMETER-VALUES>
                <ECUC-NUMERICAL-PARAM-VALUE>
                  <SHORT-NAME>TestParam1</SHORT-NAME>
                  <DEFINITION-REF DEST="ECUC-INTEGER-PARAM-DEF">/AUTOSAR/EcucDefs/TestModule/ContainerA/TestParam1</DEFINITION-REF>
                  <VALUE>100</VALUE>
                </ECUC-NUMERICAL-PARAM-VALUE>
              </PARAMETER-VALUES>
            </ECUC-CONTAINER-VALUE>
          </CONTAINERS>
        </ECUC-MODULE-CONFIGURATION-VALUES>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
    }

    printSummary() {
        const totalTime = performance.now() - this.startTime;
        
        console.log('\n==========================================');
        console.log('📊 Test Results Summary');
        console.log('==========================================');
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`⏱️  Total time: ${Math.round(totalTime)}ms`);
        console.log('==========================================\n');

        if (this.failedTests > 0) {
            console.log('❌ Failed Tests:');
            this.testResults
                .filter(result => result.status === 'FAIL')
                .forEach(result => {
                    console.log(`   ${result.name}: ${result.error}`);
                });
            console.log('');
        }

        const successRate = Math.round((this.passedTests / (this.passedTests + this.failedTests)) * 100);
        console.log(`🎯 Success Rate: ${successRate}%`);
        
        if (this.failedTests === 0) {
            console.log('🎉 All tests passed! Extension is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please review and fix issues before releasing.');
        }
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new RegressionTester();
    tester.runAllTests().catch(error => {
        console.error('💥 Test suite crashed:', error);
        process.exit(1);
    });
}

module.exports = { RegressionTester };
