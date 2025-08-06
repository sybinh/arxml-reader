# Change Log

All notable changes to the "arxml-reader" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.1] - 2025-01-24

### Added
- Initial release of ARXML Reader extension
- Custom text editor provider for .arxml files
- ARXML to readable text format conversion based on MapForce script
- Support for ECUC module configuration values
- Support for ECUC container values with proper nesting
- Support for numerical parameters with hex value display
- Support for textual parameters
- Support for reference values and instance reference values
- Syntax highlighting for the converted Artext format
- Sorting functionality for ECUC elements
- Real-time refresh capabilities
- Proper handling of annotations, system conditions, and variant conditions
- Package hierarchy display in dot notation
- Schema version extraction and display

### Features
- **ECUC Elements**: Complete support for all major ECUC configuration elements
- **Readable Format**: Clean, indented text output similar to MapForce transformation
- **Interactive UI**: Toolbar with refresh and sort options
- **Syntax Highlighting**: Color-coded display for better readability
- **TypeScript Implementation**: Modern TypeScript codebase with proper error handling

## [0.0.2] - 2025-08-06

### Fixed
- **Critical**: Fixed "Maximum call stack size exceeded" error for large/deeply nested ARXML files
- **Critical**: Fixed content duplication bug where ECUC elements appeared twice in output
- Added comprehensive stack overflow protection with configurable limits
- Added file size limits (configurable via `arxml-reader.maxFileSize` setting)
- Enhanced error handling with user-friendly messages instead of crashes

### Added
- Configurable file size limit with smart error messages
- Recursion depth protection (20 levels for packages, 50 for containers)
- Better integration with VS Code configuration system
- Graceful fallback handling for problematic files

### Changed
- Improved memory management and performance for large files
- Enhanced error messages with helpful troubleshooting suggestions
- Default file size limit set to 50MB (configurable)