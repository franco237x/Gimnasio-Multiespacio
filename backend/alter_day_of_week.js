const { executeQuery } = require('./config/database');

async function fixDatabase() {
    try {
        console.log('Modificando columna day_of_week en activities...');
        await executeQuery("ALTER TABLE activities MODIFY COLUMN day_of_week VARCHAR(255) NOT NULL;");
        console.log('¡Modificación exitosa!');
    } catch (error) {
        console.error('Error modificando la tabla:', error);
    } finally {
        process.exit(0);
    }
}

fixDatabase();
