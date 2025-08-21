# Test Automation for ARXML Reader Extension

This directory contains comprehensive test automation for the ARXML Reader extension, ensuring runtime performance and regression protection after every fix or update.

## Test Structure

### 🧪 Regression Tests (`regression-test.js`)
Comprehensive test suite covering:
- **Basic ECUC Conversion** - Core functionality
- **HTML Entities Decoding** - Fixes user-reported `&amp;&amp;` issue
- **Stack Overflow Protection** - Prevents crashes on deeply nested XML
- **File Size Limit Protection** - Configurable memory protection
- **Non-ECUC Content Disclaimer** - Proper messaging for unsupported content
- **Performance Benchmark** - 100 containers conversion in <5s
- **Error Handling** - Graceful failure handling
- **Textual Parameters** - String parameter formatting
- **Reference Values** - Cross-reference handling
- **Boolean Parameters** - Boolean value formatting

### ⚡ Performance Tests (`test-runner.js`)
Local test runner with:
- TypeScript compilation verification
- Real file conversion benchmarks
- Extension packaging validation
- Performance monitoring

### 🔧 CI/CD Pipeline (`.github/workflows/ci.yml`)
Automated GitHub Actions workflow:
- Multi-version Node.js testing (18.x, 20.x)
- Code quality checks (ESLint, TypeScript)
- Security auditing
- Automated packaging and artifact upload

## Usage

### Run All Tests Locally
```bash
# Quick regression test
npm run test:regression

# Comprehensive test suite
npm run test:local

# Watch mode (re-run on file changes)
npm run test:watch

# CI-style verification
npm run verify
```

### Pre-commit Testing
```powershell
# Windows PowerShell
.\scripts\pre-commit.ps1
```

### Individual Test Categories
```bash
# Just regression tests
npm run test:regression

# Just performance tests
npm run test:performance

# Official VS Code extension tests
npm run test
```

## Test Results

All tests currently **PASS** ✅:
- ✅ Basic ECUC Conversion
- ✅ HTML Entities Decoding (&&) - **Fixes user bug**
- ✅ Stack Overflow Protection
- ✅ File Size Limit Protection
- ✅ Non-ECUC Content Disclaimer
- ✅ Performance Benchmark (31ms for 100 containers)
- ✅ Error Handling
- ✅ Textual Parameters
- ✅ Reference Values
- ✅ Boolean Parameters

## Automated Quality Gates

### Every Commit
- TypeScript compilation
- Regression test suite
- Code linting (ESLint)

### Every Pull Request
- Multi-version Node.js testing
- Security audit
- Extension packaging test

### Every Release
- Full test suite
- Performance benchmarking
- VSIX artifact generation

## Adding New Tests

To add a new test to the regression suite:

```javascript
testSuite.addTest('Your Test Name', async () => {
    const testXml = testSuite.createTestXml(`
        <!-- Your test ARXML content -->
    `);

    const result = await testSuite.converter.convertToArtext(testXml);
    
    if (!result.includes('expected content')) {
        return 'Failure reason';
    }
    
    return true; // Pass
});
```

## Performance Benchmarks

Current performance targets:
- **Small files** (<1MB): <100ms
- **Medium files** (1-10MB): <5s  
- **Large files** (>10MB): Configurable limit with graceful fallback

## Continuous Monitoring

The test suite monitors:
- Conversion accuracy
- Performance regression
- Memory usage
- Error handling
- API compatibility

This ensures every update maintains backward compatibility and performance standards.
