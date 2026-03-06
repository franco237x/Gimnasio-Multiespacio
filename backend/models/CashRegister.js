const { executeQuery } = require('../config/database');

class CashRegister {
    static async getCurrentOpen() {
        const query = `
            SELECT * FROM cash_registers 
            WHERE status = 'open' 
            ORDER BY opening_time DESC LIMIT 1
        `;
        const results = await executeQuery(query);
        return results.length > 0 ? results[0] : null;
    }

    static async open(userId, openingBalance) {
        // Verificar si ya hay una abierta
        const current = await this.getCurrentOpen();
        if (current) {
            throw new Error('Ya existe una caja abierta en este momento.');
        }

        const query = `
            INSERT INTO cash_registers (opened_by, opening_time, opening_balance, status)
            VALUES (?, NOW(), ?, 'open')
        `;
        const result = await executeQuery(query, [userId, openingBalance]);
        return await this.findById(result.insertId);
    }

    static async close(id, userId, countedBalance, notes) {
        // Obtener la caja actual
        const register = await this.findById(id);
        if (!register || register.status === 'closed') {
            throw new Error('La caja no existe o ya está cerrada.');
        }

        // Calcular los ingresos reales desde 'payments' durante el periodo de esta caja
        const paymentsQuery = `
            SELECT SUM(amount) as total_collected 
            FROM payments 
            WHERE cash_register_id = ? AND status = 'completed' AND payment_method = 'efectivo'
        `;
        const paymentsResult = await executeQuery(paymentsQuery, [id]);
        const totalCollected = parseFloat(paymentsResult[0].total_collected || 0);

        // El balance final teórico es lo que había al inicio + lo que ingresó en efectivo
        const expectedBalance = parseFloat(register.opening_balance) + totalCollected;
        const discrepancy = parseFloat(countedBalance) - expectedBalance;

        const closeQuery = `
            UPDATE cash_registers 
            SET closed_by = ?, 
                closing_time = NOW(),
                closing_balance = ?, 
                counted_balance = ?, 
                discrepancy = ?, 
                notes = ?, 
                status = 'closed'
            WHERE id = ?
        `;

        await executeQuery(closeQuery, [userId, expectedBalance, countedBalance, discrepancy, notes || null, id]);
        return await this.findById(id);
    }

    static async findById(id) {
        const query = `
            SELECT cr.*, 
                   u_open.name as opened_by_name, 
                   u_close.name as closed_by_name
            FROM cash_registers cr
            LEFT JOIN users u_open ON cr.opened_by = u_open.id
            LEFT JOIN users u_close ON cr.closed_by = u_close.id
            WHERE cr.id = ?
        `;
        const results = await executeQuery(query, [id]);
        return results.length > 0 ? results[0] : null;
    }

    static async findAll(limit = 30) {
        const query = `
            SELECT cr.*, 
                   u_open.name as opened_by_name, 
                   u_close.name as closed_by_name,
                   (SELECT COUNT(*) FROM payments WHERE cash_register_id = cr.id) as payment_count
            FROM cash_registers cr
            LEFT JOIN users u_open ON cr.opened_by = u_open.id
            LEFT JOIN users u_close ON cr.closed_by = u_close.id
            ORDER BY cr.opening_time DESC
            LIMIT ?
        `;
        return await executeQuery(query, [limit]);
    }

    static async getRegisterSummary(id) {
        // Resumen detallado: Efectivo, tarjeta, mercado pago, transferencias
        const query = `
            SELECT payment_method, SUM(amount) as total, COUNT(*) as tx_count
            FROM payments
            WHERE cash_register_id = ? AND status = 'completed'
            GROUP BY payment_method
        `;
        return await executeQuery(query, [id]);
    }
}

module.exports = CashRegister;
