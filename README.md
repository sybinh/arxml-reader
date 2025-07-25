# ARXML Reader

Enhanced ARXML file viewer for AUTOSAR development. This extension automatically converts ARXML files to a readable text format while preserving all VS Code editor features.

## Features

### 🔧 Core Features

- **Automatic Conversion**: ARXML files automatically open in readable text format
- **Full Editor Features**: Search (`Ctrl+F`), find/replace, select text, copy/paste, and all standard VS Code features
- **Syntax Highlighting**: Custom syntax highlighting for the converted readable format
- **Original XML Access**: Command to view the original XML when needed
- **Schema Validation Disabled**: Prevents XML validation errors from missing AUTOSAR XSD schemas

### 📂 Supported Elements

- `ECUC-MODULE-CONFIGURATION-VALUES` → module declarations
- `ECUC-CONTAINER-VALUE` → container blocks  
- `ECUC-NUMERICAL-PARAM-VALUE` → parameter assignments with hex values
- `ECUC-TEXTUAL-PARAM-VALUE` → text parameter assignments
- `ECUC-REFERENCE-VALUE` → reference assignments
- Annotations, system conditions, and variant conditions

## Usage

### 🔧 **Configurable Open Modes**

The extension offers three ways to open ARXML files (configurable in settings):

1. **Both (Default)**: Opens original XML and readable text side by side
2. **Readable Only**: Opens only the converted readable format  
3. **Original Only**: Opens only the original XML (disables conversion)

### **Quick Setup**
1. **Open any `.arxml` file** - behavior depends on your current setting
2. **Change mode**: `Ctrl+Shift+P` → "Change ARXML Open Mode"
3. **Manual control**: Use "Open as Readable Text" or "Show Original XML" commands

### **Available Commands**
- **"Open as Readable Text"**: Force open as readable (regardless of setting)
- **"Show Original XML"**: Force open original XML  
- **"Change ARXML Open Mode"**: Switch between the three modes

## Example Output

**Input (ARXML):**
```xml
<ECUC-MODULE-CONFIGURATION-VALUES>
  <SHORT-NAME>rba_Nds</SHORT-NAME>
  <DEFINITION-REF DEST="ECUC-MODULE-DEF">/RB/RBA/rba_Nds/EcucModuleDefs/rba_Nds</DEFINITION-REF>
  <CONTAINERS>
    <ECUC-CONTAINER-VALUE>
      <SHORT-NAME>rba_Nds_Project</SHORT-NAME>
      <PARAMETER-VALUES>
        <ECUC-NUMERICAL-PARAM-VALUE>
          <VALUE>2303</VALUE>
        </ECUC-NUMERICAL-PARAM-VALUE>
      </PARAMETER-VALUES>
    </ECUC-CONTAINER-VALUE>
  </CONTAINERS>
</ECUC-MODULE-CONFIGURATION-VALUES>
```

**Automatic Output (Readable):**
```
schema 00048
package RB.UBK.Project.EcucModuleConfigurationValuess

module RB.RBA.rba_Nds.EcucModuleDefs.rba_Nds "rba_Nds"
{
    rba_Nds_Project "rba_Nds_Project"
    {
        rba_Nds_BswVersion = 2303 (= 0x8FF)
        rba_Nds_Customer = "VW"
        // ... more parameters
    }
}
```

## Benefits

✅ **No learning curve**: Uses standard VS Code editor  
✅ **Full functionality**: All editor features work normally  
✅ **Automatic**: No extra steps needed  
✅ **Fast**: Lightweight text documents vs heavy webviews  
✅ **Familiar**: Standard VS Code experience  

## Requirements

- VS Code 1.54.0 or higher
- ARXML files following AUTOSAR specification

## Release Notes

### 0.0.1

Initial release of ARXML Reader with:
- Automatic ARXML-to-readable conversion
- Full VS Code editor feature compatibility
- Syntax highlighting
- Original XML access when needed

**Enjoy!**
