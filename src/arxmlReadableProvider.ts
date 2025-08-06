import * as vscode from 'vscode';
import { ArxmlConverter, ArxmlConverterOptions } from './arxmlConverter';

/**
 * Provider for readonly ARXML readable text documents.
 * This creates virtual documents with converted ARXML content that preserve
 * normal text editor functionality like search, selection, etc.
 */
export class ArxmlReadableProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _cache = new Map<string, string>(); // Cache converted content
    private _processing = new Set<string>(); // Track files being processed

    readonly onDidChange = this._onDidChange.event;

    constructor() {}

    /**
     * Called to provide the content of a virtual document
     */
    async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string> {
        const cacheKey = uri.toString();
        
        // Return cached content if available
        const config = vscode.workspace.getConfiguration('arxml-reader');
        const enableCaching = config.get<boolean>('enableCaching', true);
        
        if (enableCaching && this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey)!;
        }
        
        // Prevent duplicate processing
        if (this._processing.has(cacheKey)) {
            return 'Converting ARXML file, please wait...';
        }
        
        this._processing.add(cacheKey);
        
        try {
            // Extract the original URI from the virtual URI
            const originalUriString = uri.path.slice(0, -7); // Remove '.artext' suffix
            const originalUri = vscode.Uri.parse(originalUriString);
            
            // Read the original ARXML file
            const document = await vscode.workspace.openTextDocument(originalUri);
            const xmlContent = document.getText();
            
            // Get RAM-related configurations
            const maxFileSize = config.get<number>('maxFileSize', 50) * 1024 * 1024; // Convert MB to bytes
            const streamProcessing = config.get<boolean>('streamProcessing', false);
            const fileSizeBytes = Buffer.byteLength(xmlContent, 'utf8');
            
            // Check if file is too large
            if (fileSizeBytes > maxFileSize) {
                const fileSizeMB = Math.round(fileSizeBytes / 1024 / 1024);
                const response = await vscode.window.showWarningMessage(
                    `Large ARXML file (${fileSizeMB}MB). Continue processing? This may use significant RAM.`,
                    'Yes', 'No'
                );
                if (response !== 'Yes') {
                    this._processing.delete(cacheKey);
                    return `File too large (${fileSizeMB}MB). Processing cancelled to save RAM.`;
                }
            }
            
            const showProgress = fileSizeBytes > 1024 * 1024; // 1MB threshold
            
            let readableContent: string;
            
            if (showProgress) {
                // Show progress for large files
                readableContent = await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Converting large ARXML file (${Math.round(fileSizeBytes / 1024)}KB)...`,
                    cancellable: true
                }, async (progress, progressToken) => {
                    progress.report({ increment: 0, message: 'Starting conversion...' });
                    
                    // Convert in chunks to allow cancellation
                    const converterOptions: ArxmlConverterOptions = {
                        maxFileSizeMB: config.get<number>('maxFileSize', 50)
                    };
                    const converter = new ArxmlConverter(converterOptions);
                    
                    // Check for cancellation
                    if (progressToken.isCancellationRequested || token.isCancellationRequested) {
                        throw new Error('Conversion cancelled');
                    }
                    
                    progress.report({ increment: 50, message: 'Processing ARXML structure...' });
                    
                    const result = await converter.convertToArtext(xmlContent);
                    
                    progress.report({ increment: 100, message: 'Conversion complete' });
                    return result;
                });
            } else {
                // Convert smaller files normally
                const converterOptions: ArxmlConverterOptions = {
                    maxFileSizeMB: config.get<number>('maxFileSize', 50)
                };
                const converter = new ArxmlConverter(converterOptions);
                readableContent = await converter.convertToArtext(xmlContent);
            }
            
            // Cache the result if caching is enabled
            if (enableCaching) {
                this._cache.set(cacheKey, readableContent);
                
                // Limit cache size to prevent memory issues
                if (this._cache.size > 20) { // Reduced from 50 to save RAM
                    const firstKey = this._cache.keys().next().value;
                    if (firstKey) {
                        this._cache.delete(firstKey);
                    }
                }
            }
            
            return readableContent;
            
        } catch (error) {
            console.error('ARXML conversion error:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            
            const errorMessage = `Error converting ARXML file: ${error instanceof Error ? error.message : 'Unknown error'}`;
            // Don't cache errors if caching is disabled
            if (enableCaching) {
                this._cache.set(cacheKey, errorMessage);
            }
            return errorMessage;
        } finally {
            this._processing.delete(cacheKey);
        }
    }

    /**
     * Check if an ARXML file contains ECUC content
     */
    async hasEcucContent(uri: vscode.Uri): Promise<boolean> {
        try {
            // Extract the original URI from the virtual URI
            const originalUriString = uri.path.slice(0, -7); // Remove '.artext' suffix
            const originalUri = vscode.Uri.parse(originalUriString);
            
            // Read the original ARXML file
            const document = await vscode.workspace.openTextDocument(originalUri);
            const xmlContent = document.getText();
            
            // Create converter and check for ECUC content
            const config = vscode.workspace.getConfiguration('arxml-reader');
            const converterOptions: ArxmlConverterOptions = {
                maxFileSizeMB: config.get<number>('maxFileSize', 50)
            };
            const converter = new ArxmlConverter(converterOptions);
            return await converter.hasEcucContent(xmlContent);
        } catch (error) {
            console.error('Error checking ECUC content:', error);
            return false; // Assume no ECUC content on error
        }
    }

    /**
     * Trigger a refresh of the content
     */
    refresh(uri: vscode.Uri): void {
        // Clear cache for this URI
        this._cache.delete(uri.toString());
        this._onDidChange.fire(uri);
    }
    
    /**
     * Clear all cached content to free RAM
     */
    clearCache(): void {
        this._cache.clear();
        vscode.window.showInformationMessage(`ARXML Reader cache cleared. RAM freed.`);
    }
    
    /**
     * Get cache statistics
     */
    getCacheStats(): { entries: number; estimatedSizeMB: number } {
        let totalSize = 0;
        for (const content of this._cache.values()) {
            totalSize += content.length * 2; // Rough estimate (UTF-16)
        }
        return {
            entries: this._cache.size,
            estimatedSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
        };
    }
}
