#!/usr/bin/env node

/**
 * Local test runner for ARXML Reader extension
 * Runs comprehensive tests and performance benchmarks
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class LocalTestRunner {
    constructor() {
        this.testResults = {
            compilation: false,
            regression: false,
            performance: false,
            packaging: false
        };
    }

    async run() {
        console.log('🧪 ARXML Reader - Local Test Runner');
        console.log('=' * 50);
        
        try {
            await this.runCompilation();
            await this.runRegressionTests();
            await this.runPerformanceTests();
            await this.runPackagingTest();
            
            this.printSummary();
            
            if (Object.values(this.testResults).every(result => result)) {
                console.log('\n✅ All tests passed! Ready for deployment.');
                process.exit(0);
            } else {
                console.log('\n❌ Some tests failed. Please fix the issues before deploying.');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('\n💥 Test runner failed:', error.message);
            process.exit(1);
        }
    }

    async runCompilation() {
        console.log('\n📦 Running TypeScript compilation...');
        
        try {
            await this.execCommand('npm', ['run', 'compile']);
            console.log('✅ Compilation successful');
            this.testResults.compilation = true;
        } catch (error) {
            console.log('❌ Compilation failed:', error.message);
            this.testResults.compilation = false;
        }
    }

    async runRegressionTests() {
        console.log('\n🔍 Running regression tests...');
        
        try {
            await this.execCommand('node', ['tests/regression-test.js']);
            console.log('✅ Regression tests passed');
            this.testResults.regression = true;
        } catch (error) {
            console.log('❌ Regression tests failed:', error.message);
            this.testResults.regression = false;
        }
    }

    async runPerformanceTests() {
        console.log('\n⚡ Running performance benchmarks...');
        
        try {
            const startTime = Date.now();
            
            // Test with example files if they exist
            const exampleDir = path.join(__dirname, 'example');
            if (fs.existsSync(exampleDir)) {
                const files = fs.readdirSync(exampleDir)
                    .filter(file => file.endsWith('.arxml'))
                    .slice(0, 3); // Test with first 3 files only
                
                for (const file of files) {
                    const filePath = path.join(exampleDir, file);
                    const stats = fs.statSync(filePath);
                    const fileSizeMB = Math.round(stats.size / 1024 / 1024 * 10) / 10;
                    
                    console.log(`   Testing ${file} (${fileSizeMB}MB)...`);
                    await this.testFileConversion(filePath);
                }
            }
            
            const duration = Date.now() - startTime;
            console.log(`✅ Performance tests completed in ${duration}ms`);
            this.testResults.performance = true;
            
        } catch (error) {
            console.log('❌ Performance tests failed:', error.message);
            this.testResults.performance = false;
        }
    }

    async runPackagingTest() {
        console.log('\n📦 Testing extension packaging...');
        
        try {
            // Check if we can package the extension
            await this.execCommand('npm', ['run', 'package']);
            
            // Verify VSIX file was created
            const vsixFiles = fs.readdirSync('.')
                .filter(file => file.endsWith('.vsix'))
                .sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime);
            
            if (vsixFiles.length > 0) {
                const latestVsix = vsixFiles[0];
                const stats = fs.statSync(latestVsix);
                const sizeMB = Math.round(stats.size / 1024 / 1024 * 10) / 10;
                
                console.log(`✅ Extension packaged successfully: ${latestVsix} (${sizeMB}MB)`);
                this.testResults.packaging = true;
            } else {
                throw new Error('No VSIX file found after packaging');
            }
            
        } catch (error) {
            console.log('❌ Packaging failed:', error.message);
            this.testResults.packaging = false;
        }
    }

    async testFileConversion(filePath) {
        const { ArxmlConverter } = require('./out/arxmlConverter.js');
        
        const content = fs.readFileSync(filePath, 'utf8');
        const converter = new ArxmlConverter();
        
        const startTime = Date.now();
        const result = await converter.convertToArtext(content);
        const duration = Date.now() - startTime;
        
        if (duration > 10000) { // 10 second limit
            throw new Error(`File conversion too slow: ${duration}ms`);
        }
        
        if (result.length === 0) {
            throw new Error('Empty conversion result');
        }
        
        console.log(`     Converted in ${duration}ms -> ${result.length} chars`);
    }

    async execCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const process = spawn(command, args, { 
                stdio: ['inherit', 'pipe', 'pipe'],
                shell: process.platform === 'win32'
            });
            
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
                }
            });
            
            process.on('error', (error) => {
                reject(error);
            });
        });
    }

    printSummary() {
        console.log('\n' + '=' * 50);
        console.log('📊 Test Summary');
        console.log('=' * 50);
        
        Object.entries(this.testResults).forEach(([test, passed]) => {
            const icon = passed ? '✅' : '❌';
            const status = passed ? 'PASS' : 'FAIL';
            console.log(`${icon} ${test.padEnd(20)} ${status}`);
        });
    }
}

// Run tests if called directly
if (require.main === module) {
    const runner = new LocalTestRunner();
    runner.run();
}

module.exports = { LocalTestRunner };
