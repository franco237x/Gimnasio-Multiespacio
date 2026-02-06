const { executeQuery } = require('../config/database');

class Payment {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.user_name = data.user_name;
        this.user_email = data.user_email;
        this.subscription_id = data.subscription_id;
        this.amount = data.amount;
        this.concept = data.concept;
        this.payment_method = data.payment_method;
        this.status = data.status;
        this.notes = data.notes;
        this.payment_date = data.payment_date;
        this.created_at = data.created_at;
    }

    // Obtener todos los pagos
    static async findAll(filters = {}) {
        let query = `
      SELECT p.*, 
             u.name as user_name,
             u.email as user_email
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;

        const params = [];

        if (filters.startDate) {
            query += ' AND DATE(p.payment_date) >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND DATE(p.payment_date) <= ?';
            params.push(filters.endDate);
        }

        if (filters.concept) {
            query += ' AND p.concept = ?';
            params.push(filters.concept);
        }

        if (filters.status) {
            query += ' AND p.status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY p.payment_date DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const results = await executeQuery(query, params);
        return results.map(row => new Payment(row));
    }

    // Obtener pagos de un usuario
    static async findByUser(userId) {
        const query = `
      SELECT p.*, 
             u.name as user_name,
             u.email as user_email
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.payment_date DESC
    `;
        const results = await executeQuery(query, [userId]);
        return results.map(row => new Payment(row));
    }

    // Obtener un pago por ID
    static async findById(id) {
        const query = `
      SELECT p.*, 
             u.name as user_name,
             u.email as user_email
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;
        const results = await executeQuery(query, [id]);
        if (results.length === 0) return null;
        return new Payment(results[0]);
    }

    // Crear pago
    static async create(paymentData) {
        const { user_id, subscription_id, amount, concept, payment_method, status, notes } = paymentData;

        const query = `
      INSERT INTO payments (user_id, subscription_id, amount, concept, payment_method, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

        const result = await executeQuery(query, [
            user_id,
            subscription_id || null,
            amount,
            concept || 'mensualidad',
            payment_method || 'efectivo',
            status || 'completed',
            notes || null
        ]);

        return await Payment.findById(result.insertId);
    }

    // Obtener estadísticas de pagos
    static async getStats(period = 'month') {
        let dateFilter;
        switch (period) {
            case 'week':
                dateFilter = 'AND payment_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateFilter = 'AND MONTH(payment_date) = MONTH(NOW()) AND YEAR(payment_date) = YEAR(NOW())';
                break;
            case 'year':
                dateFilter = 'AND YEAR(payment_date) = YEAR(NOW())';
                break;
            default:
                dateFilter = '';
        }

        const query = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        COUNT(DISTINCT user_id) as unique_payers
      FROM payments
      WHERE status != 'refunded' ${dateFilter}
    `;

        const results = await executeQuery(query);
        return results[0];
    }

    // Obtener ingresos por concepto
    static async getIncomeByConceptStats() {
        const query = `
      SELECT 
        concept,
        SUM(amount) as total,
        COUNT(*) as count
      FROM payments
      WHERE status = 'completed'
        AND MONTH(payment_date) = MONTH(NOW()) 
        AND YEAR(payment_date) = YEAR(NOW())
      GROUP BY concept
      ORDER BY total DESC
    `;
        return await executeQuery(query);
    }

    // Obtener ingresos mensuales del año
    static async getMonthlyIncome() {
        const query = `
      SELECT 
        MONTH(payment_date) as month,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as income
      FROM payments
      WHERE YEAR(payment_date) = YEAR(NOW())
      GROUP BY MONTH(payment_date)
      ORDER BY month
    `;
        return await executeQuery(query);
    }
}

module.exports = Payment;
