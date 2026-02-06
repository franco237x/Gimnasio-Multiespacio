require('dotenv').config();
const { executeQuery, testConnection } = require('./config/database');

async function checkSchema() {
    try {
        await testConnection();
        const results = await executeQuery("DESCRIBE users");
        console.log("Current schema of 'users' table:");
        console.table(results);
    } catch (error) {
        console.error("Error describing table:", error);
    } finally {
        process.exit();
    }
}

checkSchema();
