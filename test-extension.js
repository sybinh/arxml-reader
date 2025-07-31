// Test script to verify ARXML Reader extension commands
// Run this in VS Code terminal or Node.js

const vscode = require('vscode');

async function testExtensionCommands() {
    console.log('Testing ARXML Reader Extension Commands...');
    
    try {
        // Test if commands are registered
        const commands = await vscode.commands.getCommands();
        const arxmlCommands = commands.filter(cmd => cmd.startsWith('arxml-reader.'));
        
        console.log('Available ARXML Reader commands:');
        arxmlCommands.forEach(cmd => console.log(`  - ${cmd}`));
        
        // Test change open mode command
        console.log('\nTesting changeOpenMode command...');
        await vscode.commands.executeCommand('arxml-reader.changeOpenMode');
        console.log('✅ changeOpenMode command executed successfully');
        
        // Test cache stats command
        console.log('\nTesting showCacheStats command...');
        await vscode.commands.executeCommand('arxml-reader.showCacheStats');
        console.log('✅ showCacheStats command executed successfully');
        
    } catch (error) {
        console.error('❌ Error testing commands:', error.message);
    }
}

// Export for VS Code extension context
module.exports = testExtensionCommands;
