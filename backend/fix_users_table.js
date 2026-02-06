require('dotenv').config();
const { executeQuery, testConnection } = require('./config/database');

async function fixUsersTable() {
    try {
        console.log("Probando conexión...");
        await testConnection();

        console.log("Intentando agregar columna 'name'...");
        try {
            await executeQuery(`
                ALTER TABLE users 
                ADD COLUMN name VARCHAR(100) NOT NULL AFTER id;
            `);
            console.log("✅ Columna 'name' agregada correctamente.");
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ La columna 'name' ya existe.");
            } else {
                console.error("❌ Error al agregar columna 'name':", error.message);
            }
        }

        console.log("Intentando agregar columna 'phone' (por si acaso)...");
        try {
            await executeQuery(`
                ALTER TABLE users 
                ADD COLUMN phone VARCHAR(20) AFTER password;
            `);
            console.log("✅ Columna 'phone' agregada correctamente.");
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ La columna 'phone' ya existe.");
            } else {
                console.error("ℹ️ Nota sobre columna 'phone':", error.message);
            }
        }

        console.log("Reparación finalizada.");

    } catch (error) {
        console.error("Error general:", error);
    } finally {
        process.exit();
    }
}

fixUsersTable();
