## Manual Test Instructions for ARXML Reader Extension

### Test 1: Check Extension is Loaded
1. Open VS Code
2. Go to Extensions panel (Ctrl+Shift+X)
3. Search for "ARXML Reader"
4. Verify it shows:
   - Publisher: sybinh
   - Name: ARXML Reader
   - Version: 0.0.1
   - Status: Enabled

### Test 2: Test Commands Without ARXML File Open
1. Open Command Palette (Ctrl+Shift+P)
2. Type "ARXML" 
3. You should see these commands:
   - "Change ARXML Open Mode"
   - "Clear ARXML Cache (Free RAM)"
   - "Show ARXML Cache Stats"
4. Click "Change ARXML Open Mode"
5. Should show options: both, readable-only, original-only

### Test 3: Test with ARXML File
1. Open the file: example/EcuC_EcucValues.arxml
2. Extension should automatically convert it to readable format
3. You should see readable text format instead of XML
4. Try the "Show Original XML" button in the toolbar

### Test 4: Check Console for Errors
1. Open Developer Tools (Help > Toggle Developer Tools)
2. Check Console tab for any errors related to arxml-reader
3. Should not see any "command not found" errors

### Expected Results:
- ✅ All commands available in Command Palette
- ✅ No "command not found" errors
- ✅ ARXML files open in readable format
- ✅ Can switch between readable and original XML
- ✅ Configuration options work properly

### If Tests Fail:
- Check VS Code Output panel for extension logs
- Restart VS Code completely
- Uninstall and reinstall extension
