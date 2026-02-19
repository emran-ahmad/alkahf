/**
 * Preload Script - Secure IPC Bridge
 * Exposes limited API to renderer processes using contextBridge
 * @module preload
 */

const { contextBridge, ipcRenderer } = require("electron");

/**
 * Exposed API for renderer processes
 * All IPC communication must go through these methods
 */
contextBridge.exposeInMainWorld("api", {
    // Customer Management
    getCustomers: () => ipcRenderer.invoke("get-customers"),
    saveCustomer: (customerData) => ipcRenderer.invoke("save-customer", customerData),
    updateCustomer: (customerData) => ipcRenderer.invoke("update-customer", customerData),
    deleteCustomer: (uniqueID) => ipcRenderer.invoke("delete-customer", uniqueID),
    getNextUniqueID: () => ipcRenderer.invoke('get-next-uniqueid'),
    
    // Data Export & Import
    exportCSV: () => ipcRenderer.invoke("export-csv"),
    backupDatabase: () => ipcRenderer.invoke("backup-db"),
    restoreDatabase: () => ipcRenderer.invoke("restore-db"),
    importNeDB: () => ipcRenderer.invoke('import-nedb'),
    
    // Navigation
    navigate: (page) => ipcRenderer.send("navigate", page),
    
    // Settings Management
    getSetting: (key, defaultValue) => ipcRenderer.invoke("get-setting", key, defaultValue),
    setSetting: (key, value) => ipcRenderer.invoke("set-setting", key, value),
    getAllSettings: () => ipcRenderer.invoke("get-all-settings"),
    
    // Order Tracking
    // Order tracking removed
    
    // Dashboard removed
});

// Apply saved font size globally for all renderer pages early
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const fontSize = await ipcRenderer.invoke('get-setting', 'fontSize', '14');
        if (fontSize) {
            // Set a CSS variable and also inject a high-specificity stylesheet so it overrides page rules
            document.documentElement.style.setProperty('--app-font-size', fontSize + 'px');

            // Apply to root and body as fallback
            document.documentElement.style.fontSize = fontSize + 'px';
            if (document.body) document.body.style.fontSize = fontSize + 'px';

            // Inject style to force use of root variable across common containers
            const style = document.createElement('style');
            style.id = 'app-font-size-override';
            style.textContent = `
                :root { --app-font-size: ${fontSize}px !important; }
                /* Base elements */
                html, body, .container, .print-container, .main-content, .form-container { font-size: var(--app-font-size) !important; }
                /* Form elements */
                label, .measurement-label, .section-title, .customer-info-title, .customer-id, input, textarea, button, select, .notes, td, th, table, .pair-button, .inline-pair-button { font-size: var(--app-font-size) !important; }
                /* Urdu specific elements and placeholders */
                .urdu-text, .pocket-section, .measurements-section, .collar-cuff-card, .other-options-section { font-size: var(--app-font-size) !important; }
                ::placeholder { font-size: var(--app-font-size) !important; }
                /* Ensure numbers in .en-num also scale */
                .en-num { font-size: var(--app-font-size) !important; }
                /* Inputs and buttons slightly smaller if desired (keeps layout) */
                input, textarea, select, button { font-size: calc(var(--app-font-size) - 0px) !important; }
            `;
            // Ensure this is the last thing in head so it has higher priority
            document.head.appendChild(style);

            // As a final guarantee, set inline font-size styles on common elements so they override page rules
            try {
                const selectors = [
                    'label', '.measurement-label', '.section-title', '.customer-info-title', '.customer-id',
                    'input', 'textarea', 'button', 'select', '.notes', 'td', 'th', 'table',
                    '.pair-button', '.inline-pair-button', '.urdu-text', '.pocket-section', '.measurements-section', '.collar-cuff-card', '.other-options-section', '.en-num'
                ];

                // Small delay to ensure elements exist on the page
                setTimeout(() => {
                    selectors.forEach(sel => {
                        document.querySelectorAll(sel).forEach(el => {
                            try {
                                // apply inline style (overrides most other CSS)
                                el.style.fontSize = fontSize + 'px';
                            } catch (e) {
                                // ignore individual failures
                            }
                        });
                    });
                }, 50);
            } catch (e) {
                // ignore
            }
        }
    } catch (err) {
        // ignore errors
    }
});