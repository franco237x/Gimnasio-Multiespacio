/**
 * Migración: agrega batch_id y client_name_guest a payments
 * para soportar pagos multi-ítem y clientes no registrados.
 */
const { executeQuery, testConnection } = require('./config/database');

const run = async () => {
    await testConnection();

    console.log('🔄 Agregando batch_id a payments...');
    try {
        await executeQuery(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS batch_id VARCHAR(36) NULL AFTER id`);
        console.log('✅ batch_id agregado');
    } catch (e) { console.log('ℹ️ batch_id ya existe:', e.message); }

    console.log('🔄 Agregando client_name_guest a payments...');
    try {
        await executeQuery(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_name_guest VARCHAR(120) NULL AFTER user_id`);
        console.log('✅ client_name_guest agregado');
    } catch (e) { console.log('ℹ️ client_name_guest ya existe:', e.message); }

    console.log('\n✅ Migración multi-pago completada!');
    process.exit(0);
};

run().catch(e => { console.error('❌', e.message); process.exit(1); });
