require('dotenv').config({ path: __dirname + '/.env' });
const { executeQuery } = require('./config/database');

async function createCashRegistersTable() {
    try {
        console.log('Creando tabla cash_registers...');
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS cash_registers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                opened_by INT NOT NULL,
                closed_by INT DEFAULT NULL,
                opening_time DATETIME NOT NULL,
                closing_time DATETIME DEFAULT NULL,
                opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                closing_balance DECIMAL(10,2) DEFAULT NULL,
                counted_balance DECIMAL(10,2) DEFAULT NULL,
                discrepancy DECIMAL(10,2) DEFAULT NULL,
                status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
                notes TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (opened_by) REFERENCES users(id) ON DELETE RESTRICT,
                FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await executeQuery(createTableQuery);

        // Add cash_register_id to payments table
        console.log('Agregando columna cash_register_id a payments...');
        await executeQuery(`
            ALTER TABLE payments 
            ADD COLUMN cash_register_id INT DEFAULT NULL AFTER user_id,
            ADD CONSTRAINT fk_cash_register FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE SET NULL;
        `).catch(err => {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('La columna cash_register_id ya existe en payments.');
            } else {
                console.error('Error al agregar columna cash_register_id:', err.message);
            }
        });

        console.log('¡Tabla cash_registers creada y pagos actualizados exitosamente!');
    } catch (error) {
        console.error('Error al crear tabla:', error);
    } finally {
        process.exit(0);
    }
}

createCashRegistersTable();
