# Copilot Instructions for ARXML Reader Extension

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a VS Code extension project. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

## Project Overview
This extension provides enhanced viewing capabilities for ARXML (AUTOSAR XML) files by converting them to a more readable text format, similar to the MapForce script transformation.

## Key Features
- Custom text editor provider for .arxml files
- ARXML to readable text conversion based on AUTOSAR ECUC configuration
- Syntax highlighting for the converted readable format
- Tree view and navigation for ARXML structure
- Support for sorting and filtering ECUC elements

## Technical Implementation
- Use CustomTextEditorProvider for ARXML file handling
- Implement XML parsing and transformation logic similar to the MapForce script
- Convert ECUC elements to readable format:
  - ECUC-MODULE-CONFIGURATION-VALUES → module declarations
  - ECUC-CONTAINER-VALUE → container blocks
  - ECUC-NUMERICAL-PARAM-VALUE → parameter assignments with hex values
  - ECUC-TEXTUAL-PARAM-VALUE → text parameter assignments
  - ECUC-REFERENCE-VALUE → reference assignments
- Provide proper indentation and hierarchical structure
- Include annotations, system conditions, and variant conditions

## Code Style
- Use TypeScript with strict typing
- Follow VS Code extension development best practices
- Implement proper error handling for XML parsing
- Use async/await for file operations
- Maintain clean separation between XML parsing and UI rendering
