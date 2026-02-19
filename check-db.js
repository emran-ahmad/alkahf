const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/data.db');

db.all('SELECT COUNT(*) as count FROM customers', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Total customers:', rows[0].count);
    }
    
    db.all('SELECT uniqueID, name, phone FROM customers LIMIT 5', [], (err, rows) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('\nFirst 5 customers:');
            console.log(JSON.stringify(rows, null, 2));
        }
        db.close();
    });
});
