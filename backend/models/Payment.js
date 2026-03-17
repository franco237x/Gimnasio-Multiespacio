const { executeQuery } = require('../config/database');

class Payment {
    constructor(data) {
        this.id = data.id;
        this.batch_id = data.batch_id || null;
        this.user_id = data.user_id;
        this.client_name_guest = data.client_name_guest || null;
        this.user_name = data.client_name_guest || data.user_name;
        this.user_email = data.user_email;
        this.subscription_id = data.subscription_id;
        this.billing_concept_id = data.billing_concept_id;
        this.billing_concept_name = data.billing_concept_name || null;
        this.billing_concept_icon = data.billing_concept_icon || null;
        this.billing_concept_color = data.billing_concept_color || null;
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
             u.name  AS user_name,
             u.email AS user_email,
             bc.name  AS billing_concept_name,
             bc.icon  AS billing_concept_icon,
             bc.color AS billing_concept_color
      FROM payments p
      LEFT JOIN users            u  ON p.user_id            = u.id
      LEFT JOIN billing_concepts bc ON p.billing_concept_id = bc.id
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
             u.name  AS user_name,
             u.email AS user_email,
             bc.name  AS billing_concept_name,
             bc.icon  AS billing_concept_icon,
             bc.color AS billing_concept_color
      FROM payments p
      LEFT JOIN users            u  ON p.user_id            = u.id
      LEFT JOIN billing_concepts bc ON p.billing_concept_id = bc.id
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
             u.name  AS user_name,
             u.email AS user_email,
             bc.name  AS billing_concept_name,
             bc.icon  AS billing_concept_icon,
             bc.color AS billing_concept_color
      FROM payments p
      LEFT JOIN users            u  ON p.user_id            = u.id
      LEFT JOIN billing_concepts bc ON p.billing_concept_id = bc.id
      WHERE p.id = ?
    `;
        const results = await executeQuery(query, [id]);
        if (results.length === 0) return null;
        return new Payment(results[0]);
    }

    // Crear pago individual
    static async create(paymentData) {
        const {
            user_id, client_name_guest, subscription_id, amount, concept,
            payment_method, status, notes,
            cash_register_id, activity_id,
            billing_concept_id, batch_id
        } = paymentData;

        // Derivar concept legacy del catálogo si se envía billing_concept_id
        let resolvedConcept = concept || 'otro';
        if (billing_concept_id) {
            try {
                const BillingConcept = require('./BillingConcept');
                const bc = await BillingConcept.getById(billing_concept_id);
                if (bc) resolvedConcept = bc.category;
            } catch (_) { /* usa el concept recibido si falla */ }
        }

        const result = await executeQuery(
            `INSERT INTO payments
                (batch_id, user_id, client_name_guest, subscription_id,
                 billing_concept_id, amount, concept,
                 payment_method, status, notes, cash_register_id, activity_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                batch_id || null,
                user_id || null,
                client_name_guest || null,
                subscription_id || null,
                billing_concept_id || null,
                amount,
                resolvedConcept,
                payment_method || 'efectivo',
                status || 'completed',
                notes || null,
                cash_register_id || null,
                activity_id || null
            ]
        );

        // Auto-confirmar inscripción si corresponde
        if (activity_id && user_id && resolvedConcept === 'inscripcion' && (status === 'completed' || !status)) {
            try {
                const Activity = require('./Activity');
                await Activity.activateEnrollment(activity_id, user_id);
            } catch (e) {
                console.warn('⚠️ No se pudo activar inscripción:', e.message);
            }
        }

        return await Payment.findById(result.insertId);
    }

    // ─────────────────────────────────────────────────────────────
    // Crear múltiples pagos en un solo checkout (batch)
    // Parámetros:
    //   user_id          → ID de usuario registrado (o null si es invitado)
    //   client_name_guest→ Nombre libre para clientes sin cuenta
    //   payment_method   → Medio de pago único para todo el batch
    //   status           → Estado de todas las transacciones
    //   notes            → Nota general del checkout
    //   items[]          → [{billing_concept_id, amount, activity_id?, notes?}]
    //   cash_register_id → ID de caja activa
    // ─────────────────────────────────────────────────────────────
    static async createBatch(batchData) {
        const {
            user_id, client_name_guest,
            payment_method, status, notes,
            items, cash_register_id
        } = batchData;

        if (!items || items.length === 0) {
            throw new Error('El carrito de pagos está vacío');
        }
        if (!user_id && !client_name_guest) {
            throw new Error('Debe indicar un cliente registrado o un nombre de cliente invitado');
        }

        // Generar UUID para agrupar los ítems del mismo checkout
        const batchId = require('crypto').randomUUID();
        const resolvedStatus = status || 'completed';

        // Pre-cargar conceptos para resolver categorías
        const BillingConcept = require('./BillingConcept');
        const createdPayments = [];

        for (const item of items) {
            let resolvedConcept = 'otro';
            if (item.billing_concept_id) {
                try {
                    const bc = await BillingConcept.getById(item.billing_concept_id);
                    if (bc) resolvedConcept = bc.category;
                } catch (_) {}
            }

            const result = await executeQuery(
                `INSERT INTO payments
                    (batch_id, user_id, client_name_guest, billing_concept_id,
                     amount, concept, payment_method, status,
                     notes, cash_register_id, activity_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    batchId,
                    user_id || null,
                    client_name_guest || null,
                    item.billing_concept_id || null,
                    item.amount,
                    resolvedConcept,
                    payment_method || 'efectivo',
                    resolvedStatus,
                    item.notes || notes || null,
                    cash_register_id || null,
                    item.activity_id || null
                ]
            );

            // Auto-confirmar inscripción si corresponde
            if (item.activity_id && user_id && resolvedConcept === 'inscripcion' && resolvedStatus === 'completed') {
                try {
                    const Activity = require('./Activity');
                    await Activity.activateEnrollment(item.activity_id, user_id);
                } catch (e) {
                    console.warn('⚠️ No se pudo activar inscripción:', e.message);
                }
            }

            const created = await Payment.findById(result.insertId);
            createdPayments.push(created);
        }

        const total = createdPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        return {
            batch_id: batchId,
            payments: createdPayments,
            total,
            count: createdPayments.length,
            client: client_name_guest || createdPayments[0]?.user_name || 'Sin identificar',
            payment_method: payment_method || 'efectivo',
            status: resolvedStatus
        };
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
