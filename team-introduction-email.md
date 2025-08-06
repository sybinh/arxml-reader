Subject: New Tool: ARXML Reader Extension - Makes ARXML Files Easier to Read

Dear Team,

I'd like to introduce a simple VS Code extension that converts ARXML files to a more readable text format: ARXML Reader.

=== WHAT IT DOES ===
Converts ARXML files to readable text format so you can easily read, search, and review configurations without struggling with raw XML.

=== ⚠️ IMPORTANT DISCLAIMER ⚠️ ===
Currently supports ONLY ECUC configuration files. Other AUTOSAR elements (software components, interfaces, etc.) will be added in future versions.

WORKS WITH:
• ECUC configuration files (EcuC_EcucValues.arxml, module configs, etc.)
• ECUC containers, parameters, and references
• Variation point conditions

DOESN'T WORK WITH:
• Software component files (.swc)
• Interface definitions
• Data type definitions
• System configurations

=== HOW TO USE ===
1. Install the extension: arxml-reader-0.0.1.vsix
2. Open any ECUC ARXML file in VS Code
3. It automatically shows both original XML and readable text
4. Use normal VS Code features: search, copy/paste, find/replace

=== NEED YOUR FEEDBACK ===
Please test with your ECUC files and let me know:
• Does the conversion look correct?
• Any errors or missing information?
• Performance issues with large files?

Send me any issues you find - file size, error messages, or screenshots help.

Thanks for testing!

[Your Name]
