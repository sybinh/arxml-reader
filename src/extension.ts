import * as vscode from 'vscode';
import { ArxmlReadableProvider } from './arxmlReadableProvider';

/**
 * Check version and clean up old installations
 */
async function checkVersionAndCleanup(context: vscode.ExtensionContext) {
	try {
		const currentVersion = context.extension.packageJSON.version;
		const lastVersion = context.globalState.get<string>('arxmlReader.lastVersion');
		
		// If this is the first install or a version upgrade
		if (!lastVersion || lastVersion !== currentVersion) {
			// Store the current version
			await context.globalState.update('arxmlReader.lastVersion', currentVersion);
			
			// Show disclaimer for new users or version updates
			const disclaimerShown = context.globalState.get<boolean>('arxmlReader.disclaimerShown');
			if (!disclaimerShown) {
				const response = await vscode.window.showInformationMessage(
					'📋 ARXML Reader Disclaimer: Despite the name "ARXML Reader", this extension currently supports only ECUC configuration values. Other AUTOSAR elements (software components, interfaces, data types, etc.) will be added in future versions.',
					'Got it!', 'Don\'t show again'
				);
				
				if (response === 'Don\'t show again') {
					await context.globalState.update('arxmlReader.disclaimerShown', true);
				}
			}
			
			if (lastVersion) {
				// This is an upgrade
				vscode.window.showInformationMessage(
					`ARXML Reader updated from v${lastVersion} to v${currentVersion}!`
				);
			} else {
				// This is a fresh install
				vscode.window.showInformationMessage(
					`ARXML Reader v${currentVersion} installed successfully!`
				);
			}
			
			// Check for old versions with different IDs
			const allExtensions = vscode.extensions.all;
			const oldVersions = allExtensions.filter(ext => {
				const id = ext.id.toLowerCase();
				return id.includes('arxml-reader') && id !== 'sybinh.arxml-reader';
			});
			
			if (oldVersions.length > 0) {
				const oldIds = oldVersions.map(ext => ext.id).join(', ');
				const response = await vscode.window.showWarningMessage(
					`Found old ARXML Reader installations: ${oldIds}. These should be uninstalled to avoid conflicts.`,
					'Show Instructions', 'Ignore'
				);
				
				if (response === 'Show Instructions') {
					vscode.env.openExternal(vscode.Uri.parse('command:workbench.action.showRuntimeExtensions'));
					vscode.window.showInformationMessage(
						'In the Extensions view, search for "arxml-reader" and uninstall any versions other than "sybinh.arxml-reader"'
					);
				}
			}
		}
	} catch (error) {
		console.warn('Error in version check:', error);
	}
}

export async function activate(context: vscode.ExtensionContext) {
	console.log('ARXML Reader extension is now active!');
	
	// Show activation message for debugging
	vscode.window.showInformationMessage('ARXML Reader extension activated!');

	// Check for version updates and clean up old installations
	await checkVersionAndCleanup(context);

	// Configure settings for ARXML files to disable XML validation
	const config = vscode.workspace.getConfiguration();
	
	// Disable XML validation to prevent schema errors
	config.update('xml.validation.enabled', false, vscode.ConfigurationTarget.Global);
	config.update('xml.validation.schema.enabled', 'never', vscode.ConfigurationTarget.Global);
	
	// Associate ARXML files with XML language but handle them specially
	const fileAssociations: Record<string, string> = config.get('files.associations') || {};
	if (!fileAssociations['*.arxml']) {
		config.update('files.associations', { ...fileAssociations, '*.arxml': 'xml' }, vscode.ConfigurationTarget.Global);
	}

	// Register the text document content provider for ARXML readable view
	const arxmlReadableProvider = new ArxmlReadableProvider();
	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider('arxml-readable', arxmlReadableProvider)
	);

	// Automatically open ARXML files based on user preference
	const openHandler = vscode.workspace.onDidOpenTextDocument(async (document) => {
		if (document.uri.scheme === 'file' && document.uri.fsPath.toLowerCase().endsWith('.arxml')) {
			const config = vscode.workspace.getConfiguration('arxml-reader');
			const openMode = config.get<string>('openMode', 'both');
			
			// Get the editor for this document
			const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
			
			if (openMode === 'original-only') {
				// Keep the original XML open, do nothing
				return;
			}

			// Check if the file contains ECUC content before opening readable tab
			const readableUri = vscode.Uri.parse(`arxml-readable:${document.uri.toString()}.artext`);
			const hasEcuc = await arxmlReadableProvider.hasEcucContent(readableUri);
			
			if (!hasEcuc) {
				// File doesn't contain ECUC content, show notification and keep only original XML
				vscode.window.showWarningMessage(
					`This ARXML file doesn't contain ECUC configuration values. ARXML Reader currently supports only ECUC elements. Use "Show Readable Text" command to see the disclaimer.`,
					'Got it'
				);
				return; // Don't open readable tab
			}
			
			if (openMode === 'readable-only') {
				// Close the original XML document and open only readable
				if (editor) {
					await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
				}
				
				// Create and open readable document
				const readableDoc = await vscode.workspace.openTextDocument(readableUri);
				await vscode.window.showTextDocument(readableDoc, { 
					preserveFocus: false 
				});
				await vscode.languages.setTextDocumentLanguage(readableDoc, 'artext');
			}
			
			if (openMode === 'both') {
				// Keep original and also open readable in the same area
				const readableDoc = await vscode.workspace.openTextDocument(readableUri);
				await vscode.window.showTextDocument(readableDoc, { 
					viewColumn: vscode.ViewColumn.Active,
					preserveFocus: false 
				});
				await vscode.languages.setTextDocumentLanguage(readableDoc, 'artext');
			}
		}
	});

	// Register command to open ARXML as readable text
	const openAsReadableCommand = vscode.commands.registerCommand('arxml-reader.openAsReadable', async (uri?: vscode.Uri) => {
		if (!uri && vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
		if (!uri) {
			vscode.window.showWarningMessage('No ARXML file selected');
			return;
		}

		// Create a virtual URI for the readable content
		const readableUri = vscode.Uri.parse(`arxml-readable:${uri.toString()}.artext`);
		
		// Open the readable document in a normal text editor
		const readableDoc = await vscode.workspace.openTextDocument(readableUri);
		const readableEditor = await vscode.window.showTextDocument(readableDoc, { 
			viewColumn: vscode.ViewColumn.Active,
			preserveFocus: false 
		});
		
		// Set the language mode to artext for syntax highlighting
		await vscode.languages.setTextDocumentLanguage(readableDoc, 'artext');
	});

	// Register command to show original XML
	const showOriginalCommand = vscode.commands.registerCommand('arxml-reader.showOriginalXml', async (uri?: vscode.Uri) => {
		if (!uri && vscode.window.activeTextEditor) {
			// If called from a readable arxml document, extract the original URI
			const activeDoc = vscode.window.activeTextEditor.document;
			if (activeDoc.uri.scheme === 'arxml-readable') {
				const originalUriString = activeDoc.uri.path.slice(0, -7); // Remove '.artext' suffix
				uri = vscode.Uri.parse(originalUriString);
			} else {
				uri = activeDoc.uri;
			}
		}
		if (!uri) {
			vscode.window.showWarningMessage('No ARXML file selected');
			return;
		}

		// Open the original XML file
		const doc = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(doc, { 
			viewColumn: vscode.ViewColumn.Active,
			preserveFocus: false 
		});
	});

	// Register command to show readable text (complement to showOriginalXml)
	const showReadableCommand = vscode.commands.registerCommand('arxml-reader.showReadableText', async (uri?: vscode.Uri) => {
		if (!uri && vscode.window.activeTextEditor) {
			const activeDoc = vscode.window.activeTextEditor.document;
			if (activeDoc.uri.scheme === 'file' && activeDoc.uri.fsPath.toLowerCase().endsWith('.arxml')) {
				// Already have the original ARXML file URI
				uri = activeDoc.uri;
			} else if (activeDoc.uri.scheme === 'arxml-readable') {
				// Extract original URI from readable document
				const originalUriString = activeDoc.uri.path.slice(0, -7); // Remove '.artext' suffix
				uri = vscode.Uri.parse(originalUriString);
			}
		}
		if (!uri) {
			vscode.window.showWarningMessage('No ARXML file selected');
			return;
		}

		// Create and open readable document (this will show disclaimer if no ECUC content)
		const readableUri = vscode.Uri.parse(`arxml-readable:${uri.toString()}.artext`);
		const readableDoc = await vscode.workspace.openTextDocument(readableUri);
		await vscode.window.showTextDocument(readableDoc, { 
			viewColumn: vscode.ViewColumn.Active,
			preserveFocus: false 
		});
		await vscode.languages.setTextDocumentLanguage(readableDoc, 'artext');
	});

	// Register command to change open mode
	const changeOpenModeCommand = vscode.commands.registerCommand('arxml-reader.changeOpenMode', async () => {
		const config = vscode.workspace.getConfiguration('arxml-reader');
		const currentMode = config.get<string>('openMode', 'both');
		
		const options = [
			{ label: 'Both (Original + Readable)', value: 'both', description: 'Open both original XML and readable text as tabs' },
			{ label: 'Readable Only', value: 'readable-only', description: 'Open only the readable text format' },
			{ label: 'Original Only', value: 'original-only', description: 'Open only the original XML (disable conversion)' }
		];
		
		const selected = await vscode.window.showQuickPick(options, {
			placeHolder: `Current mode: ${currentMode}. Select new open mode:`,
			canPickMany: false
		});
		
		if (selected) {
			await config.update('openMode', selected.value, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage(`ARXML open mode changed to: ${selected.label}`);
		}
	});

	// Register command to clear conversion cache
	const clearCacheCommand = vscode.commands.registerCommand('arxml-reader.clearCache', async () => {
		arxmlReadableProvider.clearCache();
	});

	// Register command to show cache stats
	const showCacheStatsCommand = vscode.commands.registerCommand('arxml-reader.showCacheStats', () => {
		const stats = arxmlReadableProvider.getCacheStats();
		vscode.window.showInformationMessage(
			`ARXML Reader Cache: ${stats.entries} files, ~${stats.estimatedSizeMB}MB RAM used`
		);
	});

	context.subscriptions.push(openHandler, openAsReadableCommand, showOriginalCommand, showReadableCommand, changeOpenModeCommand, clearCacheCommand, showCacheStatsCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
