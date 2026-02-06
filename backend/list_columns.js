require('dotenv').config();
const { executeQuery, testConnection } = require('./config/database');

async function listColumns() {
    try {
        await testConnection();
        const results = await executeQuery("SHOW COLUMNS FROM users");
        console.log("Columns in 'users' table:");
        results.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
    } catch (error) {
        console.error("Error showing columns:", error);
    } finally {
        process.exit();
    }
}

listColumns();
