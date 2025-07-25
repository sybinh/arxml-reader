// @ts-check

(function() {
    // @ts-ignore
    const vscode = acquireVsCodeApi();

    const refreshButton = document.getElementById('refresh-btn');
    const sortButton = document.getElementById('sort-btn');
    const sortSelect = /** @type {HTMLSelectElement} */ (document.getElementById('sort-select'));
    const showOriginalButton = document.getElementById('show-original-btn');
    const artextContent = document.getElementById('artext-content');
    const originalContent = document.getElementById('original-content');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    // Handle refresh button
    refreshButton?.addEventListener('click', () => {
        vscode.postMessage({
            type: 'refresh'
        });
    });

    // Handle sort button
    sortButton?.addEventListener('click', () => {
        const sortType = sortSelect?.value || 'none';
        vscode.postMessage({
            type: 'sort',
            sortType: sortType
        });
    });

    // Handle sort select change
    sortSelect?.addEventListener('change', () => {
        const sortType = sortSelect?.value || 'none';
        vscode.postMessage({
            type: 'sort',
            sortType: sortType
        });
    });

    // Handle show original button
    showOriginalButton?.addEventListener('click', () => {
        const currentMode = showOriginalButton.getAttribute('data-mode');
        
        if (currentMode === 'converted') {
            // Switch to original view
            vscode.postMessage({
                type: 'showOriginal'
            });
        } else {
            // Switch back to converted view
            vscode.postMessage({
                type: 'refresh'
            });
        }
    });

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.type) {
            case 'update':
                if (artextContent && originalContent && showOriginalButton) {
                    // Show converted content
                    const highlightedContent = applySyntaxHighlighting(message.content);
                    artextContent.innerHTML = highlightedContent;
                    artextContent.style.display = 'block';
                    originalContent.style.display = 'none';
                    
                    // Update button state
                    showOriginalButton.setAttribute('data-mode', 'converted');
                    showOriginalButton.innerHTML = '<span class="codicon codicon-file-code"></span> Show Original';
                }
                break;

            case 'showOriginal':
                if (artextContent && originalContent && showOriginalButton) {
                    // Show original XML content
                    originalContent.textContent = message.content;
                    artextContent.style.display = 'none';
                    originalContent.style.display = 'block';
                    
                    // Update button state
                    showOriginalButton.setAttribute('data-mode', 'original');
                    showOriginalButton.innerHTML = '<span class="codicon codicon-arrow-left"></span> Show Converted';
                }
                break;

            case 'loading':
                if (loading) {
                    loading.style.display = message.value ? 'flex' : 'none';
                }
                if (error) {
                    error.style.display = 'none';
                }
                break;

            case 'error':
                if (error) {
                    error.textContent = `Error: ${message.message}`;
                    error.style.display = 'block';
                }
                if (loading) {
                    loading.style.display = 'none';
                }
                break;
        }
    });

    /**
     * Apply basic syntax highlighting to Artext content
     */
    function applySyntaxHighlighting(content) {
        // Escape HTML first
        const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Apply syntax highlighting patterns
        let highlighted = escaped
            // Keywords (schema, package, module, context)
            .replace(/\b(schema|package|module|context)\b/g, '<span class="keyword">$1</span>')
            
            // Strings in double quotes
            .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
            
            // Hex values
            .replace(/\b0x[0-9A-Fa-f]+\b/g, '<span class="hex-value">$&</span>')
            
            // Numbers
            .replace(/\b\d+\b/g, '<span class="number">$&</span>')
            
            // Boolean values
            .replace(/\b(true|false)\b/g, '<span class="keyword">$1</span>')
            
            // References (dot notation)
            .replace(/\b[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_\.]*\b/g, '<span class="reference">$&</span>')
            
            // System conditions [...]
            .replace(/\[([^\]]*)\]/g, '<span class="annotation">[$1]</span>')
            
            // Variant conditions <...>
            .replace(/<([^>]*)>/g, '<span class="annotation">&lt;$1&gt;</span>')
            
            // Comments /* ... */
            .replace(/\/\*([^*]|\*(?!\/))*\*\//g, '<span class="comment">$&</span>')
            
            // Line comments //
            .replace(/\/\/.*$/gm, '<span class="comment">$&</span>');

        return highlighted;
    }

    // Request initial content
    vscode.postMessage({
        type: 'refresh'
    });
})();
