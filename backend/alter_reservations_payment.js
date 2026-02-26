const { executeQuery } = require('./config/database');

async function addPaymentStatus() {
    try {
        console.log('Agregando columna payment_status en reservations...');
        await executeQuery("ALTER TABLE reservations ADD COLUMN payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending';");

        console.log('Agregando columna payment_amount en reservations...');
        await executeQuery("ALTER TABLE reservations ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0.00;");

        console.log('¡Modificación exitosa!');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Las columnas ya existen. Todo en orden.');
        } else {
            console.error('Error modificando la tabla:', error);
        }
    } finally {
        process.exit(0);
    }
}

addPaymentStatus();
