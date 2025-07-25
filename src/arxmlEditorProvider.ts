import * as vscode from 'vscode';
import { ArxmlConverter, ArxmlConverterOptions } from './arxmlConverter';

/**
 * Provider for ARXML custom text editors.
 */
export class ArxmlEditorProvider implements vscode.CustomTextEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new ArxmlEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            ArxmlEditorProvider.viewType,
            provider
        );
        return providerRegistration;
    }

    private static readonly viewType = 'arxml-reader.arxmlEditor';

    constructor(private readonly context: vscode.ExtensionContext) {}

    /**
     * Called when our custom editor is opened.
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        // Convert and display ARXML content
        await this.updateWebview(document, webviewPanel.webview);

        // Hook up event handlers
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                this.updateWebview(document, webviewPanel.webview);
            }
        });

        // Handle messages from webview
        webviewPanel.webview.onDidReceiveMessage(e => {
            switch (e.type) {
                case 'refresh':
                    this.updateWebview(document, webviewPanel.webview);
                    return;
                case 'sort':
                    this.updateWebviewWithSort(document, webviewPanel.webview, e.sortType);
                    return;
                case 'showOriginal':
                    this.sendOriginalContent(document, webviewPanel.webview);
                    return;
            }
        });

        // Make sure we get rid of the listener when our editor is closed.
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    /**
     * Get the static html used for the editor webviews.
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        // Local path to script and css for the webview
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'arxmlEditor.js')
        );

        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'reset.css')
        );

        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vscode.css')
        );

        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'arxmlEditor.css')
        );

        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <title>ARXML Reader</title>
            </head>
            <body>
                <div class="toolbar">
                    <button id="refresh-btn" class="button">
                        <span class="codicon codicon-refresh"></span>
                        Refresh
                    </button>
                    <button id="sort-btn" class="button">
                        <span class="codicon codicon-sort-precedence"></span>
                        Sort
                    </button>
                    <select id="sort-select">
                        <option value="none">No Sorting</option>
                        <option value="all">Sort All</option>
                    </select>
                    <button id="show-original-btn" class="button toggle-button" data-mode="converted">
                        <span class="codicon codicon-file-code"></span>
                        Show Original
                    </button>
                </div>
                <div class="content">
                    <pre id="artext-content" class="artext-content"></pre>
                    <pre id="original-content" class="original-content" style="display: none;"></pre>
                </div>
                <div id="loading" class="loading" style="display: none;">
                    <span class="codicon codicon-loading codicon-modifier-spin"></span>
                    Converting ARXML...
                </div>
                <div id="error" class="error" style="display: none;"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    /**
     * Update the webview content with converted ARXML
     */
    private async updateWebview(document: vscode.TextDocument, webview: vscode.Webview, options?: ArxmlConverterOptions): Promise<void> {
        try {
            webview.postMessage({
                type: 'loading',
                value: true
            });

            const converter = new ArxmlConverter(options);
            const artextContent = await converter.convertToArtext(document.getText());

            webview.postMessage({
                type: 'update',
                content: artextContent
            });

            webview.postMessage({
                type: 'loading',
                value: false
            });
        } catch (error) {
            webview.postMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            });

            webview.postMessage({
                type: 'loading',
                value: false
            });
        }
    }

    /**
     * Update webview with sorting options
     */
    private async updateWebviewWithSort(document: vscode.TextDocument, webview: vscode.Webview, sortType: string): Promise<void> {
        const options: ArxmlConverterOptions = {
            sort: sortType === 'all' ? 'all' : 'none'
        };

        await this.updateWebview(document, webview, options);
    }

    /**
     * Send original XML content to webview
     */
    private sendOriginalContent(document: vscode.TextDocument, webview: vscode.Webview): void {
        const originalContent = document.getText();
        
        webview.postMessage({
            type: 'showOriginal',
            content: originalContent
        });
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
