require('dotenv').config({ path: __dirname + '/../.env' });
const { executeQuery } = require('../config/database');

async function checkExpirations() {
    console.log('--- Iniciando Cron Job: Verificación de Vencimientos ---');
    try {
        // RN3: Periodo de gracia de 3 días.
        // Las suscripciones cuya end_date fue hace más de 3 días pasan a 'expired' y el usuario a inactivo.
        const expireQuery = `
            UPDATE user_subscriptions us
            JOIN users u ON us.user_id = u.id
            SET us.status = 'expired', u.is_active = 0
            WHERE us.status = 'active' AND us.end_date < DATE_SUB(CURDATE(), INTERVAL 3 DAY)
        `;
        const result = await executeQuery(expireQuery);
        console.log(`[RN3] Suscripciones vencidas y usuarios inactivados: ${result.affectedRows}`);

        // Las que vencieron hace 1 a 3 días siguen activas, pero podríamos marcarlas como "grace_period".
        // Para simplificar, la BD las considera "active" porque la fecha manda, pero el frontend puede 
        // mostrar "Por Vencer" o "Vencida (En Gracia)".

        // RN4: Enviar avisos automáticos a las cuotas próximas a vencer (ej. en 5 o 10 días)
        // Simularemos el envío de correos aquí buscando a quiénes notificar
        const notifyQuery = `
            SELECT u.email, u.name, us.end_date 
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            WHERE us.status = 'active' AND us.end_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY)
        `;
        const toNotify = await executeQuery(notifyQuery);

        toNotify.forEach(user => {
            console.log(`[RN4] Simulando envío de email a ${user.email}: "Hola ${user.name}, tu plan vence en 5 días (${user.end_date})."`);
        });

        console.log('--- Cron Job finalizado con éxito ---');
    } catch (error) {
        console.error('Error ejecutando el cron job:', error);
    } finally {
        process.exit(0);
    }
}

checkExpirations();
