/**
 * Main Process - Electron Application Entry Point
 * Handles window management, IPC communication, and database operations
 * @module main
 */

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const {
    getAllCustomers,
    saveCustomer,
    updateCustomer,
    getSetting,
    setSetting,
    getAllSettings,
    getNextUniqueID,
    closeDatabase,
    backupDatabase,
    restoreDatabase,
    exportToCSV,
    autoBackup
} = require("./database");

let mainWindow;

/**
 * Creates the main application window
 * @returns {BrowserWindow} The created window instance
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 700,
        minWidth: 1100,
        minHeight: 700,
        icon: path.join(__dirname, "assets", "icon256.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true
        },
    });
    
    mainWindow.loadFile("main.html").catch(err => {
        
    });
    
    // DevTools disabled for production
    // mainWindow.webContents.openDevTools();
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    
    return mainWindow;
}

app.whenReady().then(() => {
    try {
        // Create automatic backup on startup
        autoBackup()
            .then(result => {
                console.log('✅ Auto backup created:', result.path);
            })
            .catch(err => {
                console.error('⚠️  Auto backup failed:', err);
            });
        
        createWindow();
    } catch (error) {
        console.error("Error creating window:", error);
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ========================================
// IPC HANDLERS
// ========================================

// ✅ Get customers sorted by ID (desc)
ipcMain.handle("get-customers", async () => {
    try {
        return getAllCustomers();
    } catch (error) {
        console.error("Error getting customers:", error);
        return [];
    }
});

// ✅ Save new customer
ipcMain.handle("save-customer", async (event, customerData) => {
    try {
        return saveCustomer(customerData);
    } catch (error) {
        console.error("Error in save-customer handler:", error);
        return {
            success: false,
            error: "An unexpected error occurred"
        };
    }
});

// ✅ Update customer
ipcMain.handle("update-customer", async (event, customerData) => {
    try {
        return updateCustomer(customerData);
    } catch (error) {
        console.error("Error in update-customer handler:", error);
        return {
            success: false,
            error: "An unexpected error occurred"
        };
    }
});

// ✅ Delete customer
ipcMain.handle("delete-customer", async (event, uniqueID) => {
    try {
        const { deleteCustomer } = require("./database");
        return deleteCustomer(uniqueID);
    } catch (error) {
        console.error("Error in delete-customer handler:", error);
        return {
            success: false,
            error: "An unexpected error occurred"
        };
    }
});

// ✅ Backup API
ipcMain.handle("backup-db", async () => {
    try {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: "Save Database Backup",
            defaultPath: `alkahf_backup_${new Date().toISOString().split('T')[0]}.db`,
            filters: [
                { name: 'Database Files', extensions: ['db'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (canceled || !filePath) return { success: false, canceled: true };
        
        const result = await backupDatabase(filePath);
        return result;
    } catch (err) {
        console.error("Backup failed:", err);
        return { 
            success: false, 
            error: err.message 
        };
    }
});

// ✅ Restore from backup
ipcMain.handle("restore-db", async () => {
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: "Select Database File to Import",
            filters: [
                { name: 'Database Files', extensions: ['db'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
        });
        
        if (canceled || !filePaths || filePaths.length === 0) {
            return { success: false, canceled: true };
        }
        
        const result = await restoreDatabase(filePaths[0]);
        return result;
    } catch (err) {
        console.error("Restore failed:", err);
        return { 
            success: false, 
            error: err.message 
        };
    }
});

// ✅ Export to CSV
ipcMain.handle("export-csv", async () => {
    try {
        // Open save dialog FIRST before creating the export
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: "Save CSV Export",
            defaultPath: `customers_export_${new Date().toISOString().split('T')[0]}.csv`,
            filters: [
                { name: 'CSV Files', extensions: ['csv'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        // If user canceled, return immediately
        if (canceled || !filePath) {
            return { 
                success: false, 
                canceled: true,
                message: "Export canceled by user" 
            };
        }
        
        // Only create export if user didn't cancel
        const result = await exportToCSV();
        
        // Copy to user's chosen location
        fs.copyFileSync(result.path, filePath);
        
        // Clean up temp file
        fs.unlinkSync(result.path);
        
        return { 
            success: true, 
            path: filePath,
            count: result.count,
            message: result.message
        };
    } catch (err) {
        console.error("Export failed:", err);
        return { 
            success: false, 
            error: err.message 
        };
    }
});

// ✅ Import legacy NeDB backup file
ipcMain.handle('import-nedb', async () => {
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: 'Select NeDB Backup File',
            filters: [
                { name: 'Backup / Data Files', extensions: ['db', 'txt', 'json'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
        });
        if (canceled || !filePaths || filePaths.length === 0) {
            return { success: false, canceled: true };
        }
        const filePath = filePaths[0];
        const { importFromNeDB } = require('./database');
        const result = await importFromNeDB(filePath);
        return result;
    } catch (err) {
        console.error('Import NeDB failed:', err);
        return { success: false, error: err.message };
    }
});

// ✅ Settings handlers
ipcMain.handle("get-setting", async (event, key, defaultValue) => {
    try {
        return await getSetting(key, defaultValue);
    } catch (error) {
        console.error("Error getting setting:", error);
        return defaultValue;
    }
});

ipcMain.handle("set-setting", async (event, key, value) => {
    try {
        return await setSetting(key, value);
    } catch (error) {
        console.error("Error setting setting:", error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle("get-all-settings", async () => {
    try {
        return await getAllSettings();
    } catch (error) {
        console.error("Error getting all settings:", error);
        return {};
    }
});

// ✅ Get next unique ID from DB
ipcMain.handle("get-next-uniqueid", async () => {
    try {
        return await getNextUniqueID();
    } catch (error) {
        console.error('Error getting next unique ID:', error);
        return 1;
    }
});

// ✅ Navigation handler
ipcMain.on("navigate", (event, page, params) => {
    if (!mainWindow) {
        console.error("Main window not available");
        return;
    }
    
    try {
        if (page === "home") {
            mainWindow.loadFile("main.html");
        } else if (page === "customers") {
            mainWindow.loadFile("./screens/add-customer.html");
        } else if (page === "settings") {
            mainWindow.loadFile("./screens/settings.html");
        } else if (page === "customer-details") {
            if (params) {
                mainWindow.loadFile(`./screens/customer-details.html?id=${params}`);
            } else {
                mainWindow.loadFile("./screens/customer-details.html");
            }
        } else if (page === "edit-customer") {
            if (params) {
                mainWindow.loadFile(`./screens/edit-customer.html?id=${params}`);
            } else {
                mainWindow.loadFile("./screens/edit-customer.html");
            }
        } else {
            console.error(`Unknown navigation page: ${page}`);
        }
    } catch (error) {
        console.error(`Error navigating to ${page}:`, error);
    }
});

// ========================================
// APP LIFECYCLE
// ========================================

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        closeDatabase();
        app.quit();
    }
});

app.on('will-quit', () => {
    closeDatabase();
});