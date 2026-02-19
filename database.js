/**
 * Database Module - SQLite3 Database Management
 * Handles all customer data operations, backups, and exports
 * @module database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

/**
 * Main database class for tailoring application
 * @class TailoringDatabase
 */
class TailoringDatabase {
    constructor() {
        // Use app.getPath('userData') for production to store database in user data directory
        // This ensures write permissions in packaged apps
        const isDev = !app.isPackaged;
        this.baseDir = isDev ? __dirname : app.getPath('userData');
        this.dbPath = path.join(this.baseDir, 'database', 'data.db');
        this.db = null;
        this.initialized = false;
    }

    ensureInitialized() {
        if (!this.initialized) {
            return this.init().then(() => {
                this.initialized = true;
            });
        }
        return Promise.resolve();
    }

    init() {
        return new Promise((resolve, reject) => {
            try {
                // Ensure database directory exists
                const dbDir = path.dirname(this.dbPath);
                if (!fs.existsSync(dbDir)) {
                    fs.mkdirSync(dbDir, { recursive: true });
                }

                // Check if existing file is not a valid SQLite database
                if (fs.existsSync(this.dbPath)) {
                    try {
                        // Try to open as SQLite to check if it's valid
                        const testDb = new sqlite3.Database(this.dbPath, (err) => {
                            if (err) {
                                if (err.message.includes('not a database')) {
                                    console.log('Existing data.db is not a SQLite database, creating new one...');
                                    // Backup the old file
                                    const backupPath = this.dbPath + '.backup.' + Date.now();
                                    fs.renameSync(this.dbPath, backupPath);
                                    console.log(`Old database backed up to: ${backupPath}`);
                                } else {
                                    throw err;
                                }
                            }
                        });
                        testDb.close();
                    } catch (error) {
                        console.log('Existing data.db is not a SQLite database, creating new one...');
                        // Backup the old file
                        const backupPath = this.dbPath + '.backup.' + Date.now();
                        fs.renameSync(this.dbPath, backupPath);
                        console.log(`Old database backed up to: ${backupPath}`);
                    }
                }

                // Initialize database
                this.db = new sqlite3.Database(this.dbPath, (err) => {
                    if (err) {
                        console.error('Failed to open database:', err);
                        reject(err);
                        return;
                    }
                    
                    // Enable WAL mode
                    this.db.run('PRAGMA journal_mode = WAL', (err) => {
                        if (err) {
                            console.warn('Failed to enable WAL mode:', err);
                        }
                        
                        this.createTables().then(() => {
                            // After tables exist, ensure any new columns are present (safe migration)
                            this.ensureColumns().then(() => {
                                // Database initialized successfully (silent)
                                resolve();
                            }).catch(err => {
                                console.warn('Failed to ensure columns:', err);
                                resolve();
                            });
                        }).catch(reject);
                    });
                });
            } catch (error) {
                console.error('Failed to initialize database:', error);
                reject(error);
            }
        });
    }

    // Ensure optional columns are present in customers table (safe ALTER TABLE)
    ensureColumns() {
        return new Promise((resolve, reject) => {
            const required = ['shoulderDown', 'samneSize'];
            this.db.all("PRAGMA table_info(customers)", [], (err, rows) => {
                if (err) return reject(err);
                const existing = new Set(rows.map(r => r.name));
                const toAdd = required.filter(col => !existing.has(col));
                if (toAdd.length === 0) return resolve();

                // Sequentially add columns
                const addNext = () => {
                    if (toAdd.length === 0) return resolve();
                    const col = toAdd.shift();
                    // Re-check column exists (in case it was added concurrently)
                    this.db.all("PRAGMA table_info(customers)", [], (err, rows2) => {
                        if (err) {
                            console.warn(`Failed to re-check table info for ${col}: ${err.message}`);
                            // still attempt to add
                        }
                        const existsNow = rows2 && rows2.some(r => r.name === col);
                        if (existsNow) {
                            // column already present, continue
                            return addNext();
                        }
                        const stmt = `ALTER TABLE customers ADD COLUMN ${col} TEXT DEFAULT ''`;
                        this.db.run(stmt, (err) => {
                            if (err) {
                                // Log concise message only to avoid noisy stack traces for duplicate column errors
                                console.warn(`Failed to add column ${col}: ${err && err.message ? err.message : err}`);
                            }
                            addNext();
                        });
                    });
                };
                addNext();
            });
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            const createCustomersTable = `
                CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uniqueID TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    address TEXT NOT NULL,
                    lambai TEXT DEFAULT '',
                    bazo TEXT DEFAULT '',
                    shoulder TEXT DEFAULT '',
                    shoulderDown TEXT DEFAULT '',
                    kalarSize TEXT DEFAULT '',
                    chati TEXT DEFAULT '',
                    mora TEXT DEFAULT '',
                    kamar TEXT DEFAULT '',
                    gira TEXT DEFAULT '',
                    shalwar TEXT DEFAULT '',
                    girashalwar TEXT DEFAULT '',
                    pancha TEXT DEFAULT '',
                    daman TEXT DEFAULT '',
                    kanda TEXT DEFAULT '',
                    plat TEXT DEFAULT '',
                    samne TEXT DEFAULT '',
                    samneSize TEXT DEFAULT '',
                    dblSide TEXT DEFAULT '',
                    pakat TEXT DEFAULT '',
                    pati TEXT DEFAULT '',
                    kalar_Ban TEXT DEFAULT '',
                    kaf TEXT DEFAULT '',
                    btnDesign TEXT DEFAULT '',
                    chamakPatiBtn TEXT DEFAULT '',
                    salai TEXT DEFAULT '',
                    designNo TEXT DEFAULT '',
                    karigarName TEXT DEFAULT '',
                    size TEXT DEFAULT '',
                    notes TEXT DEFAULT '',
                    orderStatus TEXT DEFAULT 'pending',
                    orderDate TEXT DEFAULT '',
                    deliveryDate TEXT DEFAULT '',
                    advancePayment INTEGER DEFAULT 0,
                    totalAmount INTEGER DEFAULT 0,
                    balanceAmount INTEGER DEFAULT 0,
                    itemsOrdered TEXT DEFAULT '',
                    priorityLevel TEXT DEFAULT 'normal',
                    statusHistory TEXT DEFAULT '',
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const createSettingsTable = `
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE NOT NULL,
                    value TEXT NOT NULL,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Create indexes for better performance
            const createIndexes = [
                'CREATE INDEX IF NOT EXISTS idx_customers_uniqueID ON customers(uniqueID)',
                'CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)',
                'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)',
                'CREATE INDEX IF NOT EXISTS idx_customers_createdAt ON customers(createdAt)',
                'CREATE INDEX IF NOT EXISTS idx_customers_orderDate ON customers(orderDate)',
                'CREATE INDEX IF NOT EXISTS idx_customers_designNo ON customers(designNo)',
                'CREATE INDEX IF NOT EXISTS idx_customers_orderStatus ON customers(orderStatus)',
                'CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)'
            ];

            this.db.run(createCustomersTable, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                this.db.run(createSettingsTable, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Create indexes
                    let completed = 0;
                    const total = createIndexes.length;
                    
                    if (total === 0) {
                        resolve();
                        return;
                    }

                    createIndexes.forEach(index => {
                        this.db.run(index, (err) => {
                            if (err) {
                                console.warn('Failed to create index:', err);
                            }
                            completed++;
                            if (completed === total) {
                                resolve();
                            }
                        });
                    });
                });
            });
        });
    }

    // Get all customers sorted by uniqueID (descending)
    getAllCustomers() {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const stmt = `
                    SELECT * FROM customers 
                    ORDER BY CAST(uniqueID AS INTEGER) DESC
                `;
                
                this.db.all(stmt, [], (err, rows) => {
                    if (err) {
                        console.error('Error getting all customers:', err);
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                });
            }).catch(reject);
        });
    }

    // Get customer by uniqueID
    getCustomerById(uniqueID) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const stmt = 'SELECT * FROM customers WHERE uniqueID = ?';
                
                this.db.get(stmt, [uniqueID], (err, row) => {
                    if (err) {
                        console.error('Error getting customer by ID:', err);
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            }).catch(reject);
        });
    }

    // Save new customer
    saveCustomer(customerData) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const insertStmt = `
                    INSERT INTO customers (
                        uniqueID, name, phone, address, lambai, bazo, shoulder, shoulderDown, kalarSize,
                        chati, mora, kamar, gira, shalwar, girashalwar, pancha, daman,
                        kanda, plat, samne, samneSize, dblSide, pakat, pati, kalar_Ban, kaf,
                        btnDesign, chamakPatiBtn, salai, designNo, karigarName, size, notes,
                        orderStatus, orderDate, deliveryDate, itemsOrdered, totalAmount, advancePayment, 
                        balanceAmount, priorityLevel, statusHistory
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const statusHistory = customerData.orderStatus ? JSON.stringify([{
                    status: customerData.orderStatus,
                    timestamp: new Date().toISOString(),
                    note: 'Order created'
                }]) : null;

                const params = [
                    customerData.uniqueID,
                    customerData.name,
                    customerData.phone,
                    customerData.address,
                    customerData.lambai || '',
                    customerData.bazo || '',
                    customerData.shoulder || '',
                    customerData.shoulderDown || '',
                    customerData.kalarSize || '',
                    customerData.chati || '',
                    customerData.mora || '',
                    customerData.kamar || '',
                    customerData.gira || '',
                    customerData.shalwar || '',
                    customerData.girashalwar || '',
                    customerData.pancha || '',
                    customerData.daman || '',
                    customerData.kanda || '',
                    customerData.plat || '',
                    customerData.samne || '',
                    customerData.samneSize || '',
                    customerData.dblSide || '',
                    customerData.pakat || '',
                    customerData.pati || '',
                    customerData.kalar_Ban || '',
                    customerData.kaf || '',
                    customerData.btnDesign || '',
                    customerData.chamakPatiBtn || '',
                    customerData.salai || '',
                    customerData.designNo || '',
                    customerData.karigarName || '',
                    customerData.size || '',
                    customerData.notes || '',
                    customerData.orderStatus || 'pending',
                    customerData.orderDate || new Date().toISOString().split('T')[0],
                    customerData.deliveryDate || null,
                    customerData.itemsOrdered || null,
                    customerData.totalAmount || 0,
                    customerData.advancePayment || 0,
                    customerData.balanceAmount || (customerData.totalAmount || 0) - (customerData.advancePayment || 0),
                    customerData.priorityLevel || 'normal',
                    statusHistory
                ];

                this.db.run(insertStmt, params, function(err) {
                    if (err) {
                        console.error('Error saving customer:', err);
                        if (err.message.includes('UNIQUE constraint failed')) {
                            resolve({
                                success: false,
                                error: 'Customer with this ID already exists'
                            });
                        } else {
                            resolve({
                                success: false,
                                error: err.message
                            });
                        }
                    } else {
                        resolve({
                            success: true,
                            id: this.lastID,
                            uniqueID: customerData.uniqueID
                        });
                    }
                });
            }).catch(reject);
        });
    }

    // Update existing customer
    updateCustomer(customerData) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const updateStmt = `
                    UPDATE customers SET
                        name = ?, phone = ?, address = ?, lambai = ?, bazo = ?, shoulder = ?,
                        shoulderDown = ?, kalarSize = ?, chati = ?, mora = ?, kamar = ?, gira = ?, 
                        shalwar = ?, girashalwar = ?, pancha = ?, daman = ?, kanda = ?, plat = ?,
                        samne = ?, samneSize = ?, dblSide = ?, pakat = ?, pati = ?, kalar_Ban = ?,
                        kaf = ?, btnDesign = ?, chamakPatiBtn = ?, salai = ?, designNo = ?,
                        karigarName = ?, size = ?, notes = ?, orderStatus = ?, orderDate = ?,
                        deliveryDate = ?, itemsOrdered = ?, totalAmount = ?, advancePayment = ?,
                        balanceAmount = ?, priorityLevel = ?, updatedAt = CURRENT_TIMESTAMP
                    WHERE uniqueID = ?
                `;

                const params = [
                    customerData.name,
                    customerData.phone,
                    customerData.address,
                    customerData.lambai || '',
                    customerData.bazo || '',
                    customerData.shoulder || '',
                    customerData.shoulderDown || '',
                    customerData.kalarSize || '',
                    customerData.chati || '',
                    customerData.mora || '',
                    customerData.kamar || '',
                    customerData.gira || '',
                    customerData.shalwar || '',
                    customerData.girashalwar || '',
                    customerData.pancha || '',
                    customerData.daman || '',
                    customerData.kanda || '',
                    customerData.plat || '',
                    customerData.samne || '',
                    customerData.samneSize || '',
                    customerData.dblSide || '',
                    customerData.pakat || '',
                    customerData.pati || '',
                    customerData.kalar_Ban || '',
                    customerData.kaf || '',
                    customerData.btnDesign || '',
                    customerData.chamakPatiBtn || '',
                    customerData.salai || '',
                    customerData.designNo || '',
                    customerData.karigarName || '',
                    customerData.size || '',
                    customerData.notes || '',
                    customerData.orderStatus || 'pending',
                    customerData.orderDate || new Date().toISOString().split('T')[0],
                    customerData.deliveryDate || null,
                    customerData.itemsOrdered || null,
                    customerData.totalAmount || 0,
                    customerData.advancePayment || 0,
                    customerData.balanceAmount || (customerData.totalAmount || 0) - (customerData.advancePayment || 0),
                    customerData.priorityLevel || 'normal',
                    customerData.uniqueID
                ];

                this.db.run(updateStmt, params, function(err) {
                    if (err) {
                        console.error('Error updating customer:', err);
                        resolve({
                            success: false,
                            error: err.message
                        });
                    } else {
                        if (this.changes === 0) {
                            resolve({
                                success: false,
                                error: 'Customer not found'
                            });
                        } else {
                            resolve({
                                success: true,
                                changes: this.changes
                            });
                        }
                    }
                });
            }).catch(reject);
        });
    }

    // Delete customer
    deleteCustomer(uniqueID) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const deleteStmt = 'DELETE FROM customers WHERE uniqueID = ?';
                
                this.db.run(deleteStmt, [uniqueID], function(err) {
                    if (err) {
                        console.error('Error deleting customer:', err);
                        resolve({
                            success: false,
                            error: err.message
                        });
                    } else {
                        resolve({
                            success: this.changes > 0,
                            changes: this.changes
                        });
                    }
                });
            }).catch(reject);
        });
    }

    // Search customers
    searchCustomers(query) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const searchStmt = `
                    SELECT * FROM customers 
                    WHERE name LIKE ? OR phone LIKE ? OR uniqueID LIKE ?
                    ORDER BY CAST(uniqueID AS INTEGER) DESC
                `;
                const searchTerm = `%${query}%`;
                
                this.db.all(searchStmt, [searchTerm, searchTerm, searchTerm], (err, rows) => {
                    if (err) {
                        console.error('Error searching customers:', err);
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                });
            }).catch(reject);
        });
    }

    // Get next available uniqueID
    getNextUniqueID() {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const stmt = `
                    SELECT MAX(CAST(uniqueID AS INTEGER)) as maxID FROM customers
                `;
                
                this.db.get(stmt, [], (err, row) => {
                    if (err) {
                        console.error('Error getting next unique ID:', err);
                        resolve(1);
                    } else {
                        resolve((row.maxID || 0) + 1);
                    }
                });
            }).catch(() => resolve(1));
        });
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }

    // Get database statistics
    getStats() {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const countStmt = 'SELECT COUNT(*) as count FROM customers';
                
                this.db.get(countStmt, [], (err, count) => {
                    if (err) {
                        console.error('Error getting database stats:', err);
                        resolve({ totalCustomers: 0, latestCustomer: null });
                        return;
                    }
                    
                    const latestStmt = `
                        SELECT uniqueID, name, createdAt FROM customers 
                        ORDER BY createdAt DESC LIMIT 1
                    `;
                    
                    this.db.get(latestStmt, [], (err, latest) => {
                        if (err) {
                            console.error('Error getting latest customer:', err);
                        }
                        
                        resolve({
                            totalCustomers: count.count,
                            latestCustomer: latest
                        });
                    });
                });
            }).catch(() => resolve({ totalCustomers: 0, latestCustomer: null }));
        });
    }

    // Settings management methods
    getSetting(key, defaultValue = null) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const stmt = 'SELECT value FROM settings WHERE key = ?';
                
                this.db.get(stmt, [key], (err, row) => {
                    if (err) {
                        console.error('Error getting setting:', err);
                        resolve(defaultValue);
                    } else {
                        resolve(row ? row.value : defaultValue);
                    }
                });
            }).catch(() => resolve(defaultValue));
        });
    }

    setSetting(key, value) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const stmt = `
                    INSERT OR REPLACE INTO settings (key, value, updatedAt) 
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                `;
                
                this.db.run(stmt, [key, value], function(err) {
                    if (err) {
                        console.error('Error setting setting:', err);
                        resolve({ success: false, error: err.message });
                    } else {
                        resolve({ success: true });
                    }
                });
            }).catch(reject);
        });
    }

    getAllSettings() {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const stmt = 'SELECT key, value FROM settings';
                
                this.db.all(stmt, [], (err, rows) => {
                    if (err) {
                        console.error('Error getting all settings:', err);
                        resolve({});
                    } else {
                        const settings = {};
                        rows.forEach(row => {
                            settings[row.key] = row.value;
                        });
                        resolve(settings);
                    }
                });
            }).catch(() => resolve({}));
        });
    }

    // ===== ORDER TRACKING METHODS =====

    // Get customers by order status
    getCustomersByStatus(status) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const stmt = `
                    SELECT * FROM customers 
                    WHERE orderStatus = ?
                    ORDER BY CAST(uniqueID AS INTEGER) DESC
                `;
                
                this.db.all(stmt, [status], (err, rows) => {
                    if (err) {
                        console.error('Error getting customers by status:', err);
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                });
            }).catch(reject);
        });
    }

    // Get overdue orders
    getOverdueOrders() {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const today = new Date().toISOString().split('T')[0];
                const stmt = `
                    SELECT * FROM customers 
                    WHERE orderStatus != 'delivered' 
                    AND deliveryDate < ? 
                    AND deliveryDate != ''
                    ORDER BY deliveryDate ASC
                `;
                
                this.db.all(stmt, [today], (err, rows) => {
                    if (err) {
                        console.error('Error getting overdue orders:', err);
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                });
            }).catch(reject);
        });
    }

    // Update order status with history
    updateOrderStatus(uniqueID, newStatus) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                // First get current customer to preserve existing data
                this.db.get('SELECT * FROM customers WHERE uniqueID = ?', [uniqueID], (err, customer) => {
                    if (err) {
                        console.error('Error fetching customer:', err);
                        resolve({ success: false, error: err.message });
                        return;
                    }
                    
                    if (!customer) {
                        resolve({ success: false, error: 'Customer not found' });
                        return;
                    }

                    // Parse existing history
                    let history = [];
                    try {
                        history = customer.statusHistory ? JSON.parse(customer.statusHistory) : [];
                    } catch (e) {
                        history = [];
                    }

                    // Add new status entry
                    history.push({
                        status: newStatus,
                        timestamp: new Date().toISOString()
                    });

                    const updateStmt = `
                        UPDATE customers SET
                            orderStatus = ?,
                            statusHistory = ?,
                            updatedAt = CURRENT_TIMESTAMP
                        WHERE uniqueID = ?
                    `;

                    this.db.run(updateStmt, [newStatus, JSON.stringify(history), uniqueID], function(err) {
                        if (err) {
                            console.error('Error updating order status:', err);
                            resolve({ success: false, error: err.message });
                        } else {
                            resolve({ success: true, changes: this.changes });
                        }
                    });
                });
            }).catch(reject);
        });
    }

    // ===== DASHBOARD METHODS =====

    // Get monthly summary (defaults to current month)
    getMonthlySummary(year, month) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const now = new Date();
                const yy = year || now.getFullYear();
                const mm = month || (now.getMonth() + 1).toString().padStart(2, '0');
                const datePattern = `${yy}-${mm}%`;

                const stmt = `
                    SELECT 
                        (SELECT COUNT(*) FROM customers WHERE (orderDate LIKE ? OR (orderDate = '' AND createdAt LIKE ?))) as totalCustomers,
                        (SELECT SUM(COALESCE(totalAmount, 0)) FROM customers WHERE (orderDate LIKE ? OR (orderDate = '' AND createdAt LIKE ?))) as totalRevenue,
                        (SELECT AVG(CASE WHEN totalAmount IS NULL OR totalAmount = 0 THEN 0 ELSE totalAmount END) FROM customers WHERE (orderDate LIKE ? OR (orderDate = '' AND createdAt LIKE ?))) as avgOrderValue,
                        (SELECT COUNT(*) FROM customers WHERE COALESCE(orderStatus, 'pending') = 'pending') as pendingOrders
                `;

                this.db.get(stmt, [datePattern, datePattern, datePattern, datePattern, datePattern, datePattern], (err, row) => {
                    if (err) {
                        console.error('Error getting monthly summary:', err);
                        resolve({ totalCustomers: 0, totalRevenue: 0, avgOrderValue: 0, pendingOrders: 0 });
                        return;
                    }
                    resolve({
                        totalCustomers: row.totalCustomers || 0,
                        totalRevenue: row.totalRevenue || 0,
                        avgOrderValue: row.avgOrderValue || 0,
                        pendingOrders: row.pendingOrders || 0
                    });
                });
            }).catch(reject);
        });
    }

    // Get most popular designs
    getMostPopularDesigns(limit = 5) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const stmt = `
                    SELECT designNo, COUNT(*) as count 
                    FROM customers
                    WHERE designNo IS NOT NULL AND TRIM(designNo) != ''
                    GROUP BY designNo
                    ORDER BY count DESC
                    LIMIT ?
                `;
                this.db.all(stmt, [limit], (err, rows) => {
                    if (err) {
                        console.error('Error getting popular designs:', err);
                        resolve([]);
                    } else {
                        resolve(rows || []);
                    }
                });
            }).catch(reject);
        });
    }

    // Get busy days (defaults to current month)
    getBusyDays(year, month) {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                const now = new Date();
                const yy = year || now.getFullYear();
                const mm = month || (now.getMonth() + 1).toString().padStart(2, '0');
                const datePattern = `${yy}-${mm}%`;

                const stmt = `
                    SELECT 
                        DATE(CASE WHEN orderDate = '' OR orderDate IS NULL THEN createdAt ELSE orderDate END) as day,
                        COUNT(*) as count
                    FROM customers
                    WHERE (orderDate LIKE ? OR (orderDate = '' AND createdAt LIKE ?))
                    GROUP BY day
                    ORDER BY day ASC
                `;

                this.db.all(stmt, [datePattern, datePattern], (err, rows) => {
                    if (err) {
                        console.error('Error getting busy days:', err);
                        resolve([]);
                    } else {
                        resolve(rows || []);
                    }
                });
            }).catch(reject);
        });
    }

    // Backup database to specified path
    backupDatabase(backupPath) {
        return new Promise((resolve, reject) => {
            try {
                if (!backupPath) {
                    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
                    backupPath = path.join(this.baseDir, 'database', 'backups', `backup_${timestamp}.db`);
                }

                const backupDir = path.dirname(backupPath);
                if (!fs.existsSync(backupDir)) {
                    fs.mkdirSync(backupDir, { recursive: true });
                }

                fs.copyFileSync(this.dbPath, backupPath);
                resolve({
                    success: true,
                    path: backupPath,
                    message: 'Backup created successfully'
                });
            } catch (error) {
                console.error('Error creating backup:', error);
                reject(error);
            }
        });
    }

    // Restore database from backup
    restoreDatabase(backupPath) {
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(backupPath)) {
                    return reject(new Error('Backup file not found'));
                }

                // Create a backup of current database before restoring
                const currentBackup = this.dbPath + '.pre-restore.' + Date.now() + '.db';
                fs.copyFileSync(this.dbPath, currentBackup);

                // Close current connection
                if (this.db) {
                    this.db.close();
                }

                // Restore from backup
                fs.copyFileSync(backupPath, this.dbPath);

                // Reinitialize
                this.initialized = false;
                this.init().then(() => {
                    this.initialized = true;
                    
                    // Get count of restored customers
                    this.db.get('SELECT COUNT(*) as count FROM customers', [], (err, row) => {
                        const count = err ? 0 : (row?.count || 0);
                        resolve({
                            success: true,
                            message: 'Database restored successfully',
                            currentBackup: currentBackup,
                            count: count
                        });
                    });
                }).catch(reject);
            } catch (error) {
                console.error('Error restoring backup:', error);
                reject(error);
            }
        });
    }

    // Export all customers to CSV format
    exportToCSV() {
        return new Promise((resolve, reject) => {
            this.ensureInitialized().then(() => {
                this.db.all('SELECT * FROM customers ORDER BY uniqueID DESC', [], (err, rows) => {
                    if (err) {
                        console.error('Error exporting to CSV:', err);
                        reject(err);
                    } else {
                        try {
                            // CSV Header
                            const headers = [
                                'ID', 'Name', 'Phone', 'Address', 'Lambai', 'Bazo', 'Shoulder', 'Shoulder Down',
                                'Kalar Size', 'Chati', 'Mora', 'Kamar', 'Gira', 'Shalwar', 'Gira Shalwar',
                                'Pancha', 'Daman', 'Kanda', 'Plat', 'Samne', 'Samne Size', 'Side Jeeb',
                                'Pakat', 'Pati', 'Kalar Ban', 'Kaf', 'Button Design', 'Chamak Pati Button',
                                'Salai', 'Design No', 'Karigar', 'Size', 'Notes', 'Order Status',
                                'Order Date', 'Delivery Date', 'Items Ordered', 'Total Amount',
                                'Advance Payment', 'Balance Amount', 'Priority Level', 'Created At', 'Updated At'
                            ];

                            let csv = headers.join(',') + '\n';

                            rows.forEach(row => {
                                const values = [
                                    row.uniqueID || '',
                                    `"${(row.name || '').replace(/"/g, '""')}"`,
                                    row.phone || '',
                                    `"${(row.address || '').replace(/"/g, '""')}"`,
                                    row.lambai || '',
                                    row.bazo || '',
                                    row.shoulder || '',
                                    row.shoulderDown || '',
                                    row.kalarSize || '',
                                    row.chati || '',
                                    row.mora || '',
                                    row.kamar || '',
                                    row.gira || '',
                                    row.shalwar || '',
                                    row.girashalwar || '',
                                    row.pancha || '',
                                    row.daman || '',
                                    row.kanda || '',
                                    row.plat || '',
                                    row.samne || '',
                                    row.samneSize || '',
                                    row.dblSide || '',
                                    row.pakat || '',
                                    row.pati || '',
                                    `"${(row.kalar_Ban || '').replace(/"/g, '""')}"`,
                                    `"${(row.kaf || '').replace(/"/g, '""')}"`,
                                    row.btnDesign || '',
                                    row.chamakPatiBtn || '',
                                    row.salai || '',
                                    row.designNo || '',
                                    row.karigarName || '',
                                    row.size || '',
                                    `"${(row.notes || '').replace(/"/g, '""')}"`,
                                    row.orderStatus || '',
                                    row.orderDate || '',
                                    row.deliveryDate || '',
                                    row.itemsOrdered || '',
                                    row.totalAmount || '',
                                    row.advancePayment || '',
                                    row.balanceAmount || '',
                                    row.priorityLevel || '',
                                    row.createdAt || '',
                                    row.updatedAt || ''
                                ];
                                csv += values.join(',') + '\n';
                            });

                            const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
                            const csvPath = path.join(this.baseDir, 'database', 'exports', `customers_${timestamp}.csv`);
                            
                            const exportDir = path.dirname(csvPath);
                            if (!fs.existsSync(exportDir)) {
                                fs.mkdirSync(exportDir, { recursive: true });
                            }

                            fs.writeFileSync(csvPath, csv, 'utf8');

                            resolve({
                                success: true,
                                path: csvPath,
                                count: rows.length,
                                message: `Exported ${rows.length} customers to CSV`
                            });
                        } catch (error) {
                            console.error('Error writing CSV:', error);
                            reject(error);
                        }
                    }
                });
            }).catch(reject);
        });
    }

    // Automatic backup on startup
    autoBackup() {
        return new Promise((resolve, reject) => {
            try {
                const backupDir = path.join(this.baseDir, 'database', 'backups', 'auto');
                if (!fs.existsSync(backupDir)) {
                    fs.mkdirSync(backupDir, { recursive: true });
                }

                // If database file does not yet exist (first run), skip backup gracefully
                if (!fs.existsSync(this.dbPath)) {
                    console.warn('Auto backup skipped: database file not found (first run).');
                    return resolve({ success: false, skipped: true, message: 'Database not found - first run' });
                }

                // Keep only last 7 auto backups
                const files = fs.readdirSync(backupDir)
                    .filter(f => f.startsWith('auto_backup_'))
                    .map(f => ({
                        name: f,
                        path: path.join(backupDir, f),
                        time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
                    }))
                    .sort((a, b) => b.time - a.time);

                // Delete old backups (keep only 7)
                if (files.length >= 7) {
                    files.slice(7).forEach(file => {
                        try {
                            fs.unlinkSync(file.path);
                        } catch (e) {
                            console.error('Error deleting old backup:', e);
                        }
                    });
                }

                // Create new backup
                const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
                const backupPath = path.join(backupDir, `auto_backup_${timestamp}.db`);
                
                fs.copyFileSync(this.dbPath, backupPath);
                
                resolve({
                    success: true,
                    path: backupPath,
                    message: 'Auto backup created'
                });
            } catch (error) {
                console.error('Error creating auto backup:', error);
                reject(error);
            }
        });
    }

    // Import legacy NeDB line-delimited JSON backup into current SQLite schema
    importFromNeDB(filePath) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.ensureInitialized();
                if (!filePath || !fs.existsSync(filePath)) {
                    return reject(new Error('NeDB backup file not found'));
                }

                const raw = fs.readFileSync(filePath, 'utf8');
                const lines = raw.split('\n').filter(l => l.trim().length > 0);
                let imported = 0;
                let updated = 0;
                let skipped = 0;
                const errors = [];

                for (const line of lines) {
                    let record;
                    try {
                        record = JSON.parse(line);
                    } catch (e) {
                        errors.push(`Parse error: ${e.message}`);
                        skipped++;
                        continue;
                    }
                    if (!record || !record.uniqueID) {
                        skipped++;
                        continue;
                    }

                    // Fetch existing customer if any
                    let existing;
                    try {
                        existing = await this.getCustomerById(record.uniqueID);
                    } catch (e) {
                        // treat as non-existent
                        existing = null;
                    }

                    // Map fields to current schema, providing defaults
                    const mapped = {
                        uniqueID: String(record.uniqueID),
                        name: record.name || '',
                        phone: record.phone || '',
                        address: record.address || '',
                        lambai: record.lambai || '',
                        bazo: record.bazo || '',
                        shoulder: record.shoulder || '',
                        shoulderDown: record.shoulderDown || '',
                        kalarSize: record.kalarSize || '',
                        chati: record.chati || '',
                        mora: record.mora || '',
                        kamar: record.kamar || '',
                        gira: record.gira || '',
                        shalwar: record.shalwar || '',
                        girashalwar: record.girashalwar || '',
                        pancha: record.pancha || '',
                        daman: record.daman || '',
                        kanda: record.kanda || '',
                        plat: record.plat || '',
                        samne: record.samne || '',
                        samneSize: record.samneSize || '',
                        dblSide: record.dblSide || '',
                        pakat: record.pakat || '',
                        pati: record.pati || '',
                        kalar_Ban: record.kalar_Ban || '',
                        kaf: record.kaf || '',
                        btnDesign: record.btnDesign || '',
                        chamakPatiBtn: record.chamakPatiBtn || '',
                        salai: record.salai || '',
                        designNo: record.designNo || '',
                        karigarName: record.karigarName || '',
                        size: record.size || '',
                        notes: record.notes || '',
                        orderStatus: record.orderStatus || 'pending',
                        orderDate: record.orderDate || (record.createdAt ? record.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
                        deliveryDate: record.deliveryDate || '',
                        itemsOrdered: record.itemsOrdered || '',
                        totalAmount: record.totalAmount || 0,
                        advancePayment: record.advancePayment || 0,
                        balanceAmount: (record.totalAmount || 0) - (record.advancePayment || 0),
                        priorityLevel: record.priorityLevel || 'normal'
                    };

                    try {
                        if (!existing) {
                            const res = await this.saveCustomer(mapped);
                            if (res.success) imported++; else skipped++;
                        } else {
                            // Merge: prefer existing non-empty fields; overwrite with imported if existing empty
                            const merged = { ...existing };
                            Object.keys(mapped).forEach(k => {
                                if (!merged[k] || merged[k] === '') {
                                    merged[k] = mapped[k];
                                }
                            });
                            // keep original uniqueID
                            merged.uniqueID = existing.uniqueID;
                            const res2 = await this.updateCustomer(merged);
                            if (res2.success) updated++; else skipped++;
                        }
                    } catch (e) {
                        errors.push(`Row uniqueID=${record.uniqueID}: ${e.message}`);
                        skipped++;
                    }
                }

                resolve({
                    success: true,
                    imported,
                    updated,
                    skipped,
                    totalLines: lines.length,
                    errors
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

// Create singleton instance
const db = new TailoringDatabase();

// Export functions for main.js compatibility
module.exports = {
    getAllCustomers: () => db.getAllCustomers(),
    getCustomerById: (id) => db.getCustomerById(id),
    saveCustomer: (customerData) => db.saveCustomer(customerData),
    updateCustomer: (customerData) => db.updateCustomer(customerData),
    deleteCustomer: (uniqueID) => db.deleteCustomer(uniqueID),
    searchCustomers: (query) => db.searchCustomers(query),
    getNextUniqueID: () => db.getNextUniqueID(),
    getStats: () => db.getStats(),
    getCustomersByStatus: (status) => db.getCustomersByStatus(status),
    getOverdueOrders: () => db.getOverdueOrders(),
    updateOrderStatus: (uniqueID, newStatus) => db.updateOrderStatus(uniqueID, newStatus),
    getSetting: (key, defaultValue) => db.getSetting(key, defaultValue),
    setSetting: (key, value) => db.setSetting(key, value),
    getAllSettings: () => db.getAllSettings(),
    getMonthlySummary: (year, month) => db.getMonthlySummary(year, month),
    getMostPopularDesigns: (limit) => db.getMostPopularDesigns(limit),
    getBusyDays: (year, month) => db.getBusyDays(year, month),
    closeDatabase: () => db.close(),
    backupDatabase: (backupPath) => db.backupDatabase(backupPath),
    restoreDatabase: (backupPath) => db.restoreDatabase(backupPath),
    exportToCSV: () => db.exportToCSV(),
    autoBackup: () => db.autoBackup()
    ,importFromNeDB: (filePath) => db.importFromNeDB(filePath)
};