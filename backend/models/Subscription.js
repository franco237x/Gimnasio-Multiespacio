const { executeQuery } = require('../config/database');

class Subscription {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.user_name = data.user_name;
        this.user_email = data.user_email;
        this.plan_id = data.plan_id;
        this.plan_name = data.plan_name;
        this.plan_price = data.plan_price;
        this.start_date = data.start_date;
        this.end_date = data.end_date;
        this.status = data.status;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ============= PLANES DE SUSCRIPCIÓN =============

    // Obtener todos los planes
    static async getAllPlans() {
        const query = `SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price`;
        return await executeQuery(query);
    }

    // Obtener plan por ID
    static async getPlanById(id) {
        const query = `SELECT * FROM subscription_plans WHERE id = ?`;
        const results = await executeQuery(query, [id]);
        return results.length > 0 ? results[0] : null;
    }

    // Crear plan
    static async createPlan(planData) {
        const { name, description, price, duration_days, features } = planData;

        const query = `
      INSERT INTO subscription_plans (name, description, price, duration_days, features)
      VALUES (?, ?, ?, ?, ?)
    `;

        const result = await executeQuery(query, [
            name, description || null, price, duration_days || 30,
            features ? JSON.stringify(features) : null
        ]);

        return await Subscription.getPlanById(result.insertId);
    }

    // Actualizar plan
    static async updatePlan(id, updateData) {
        const { name, description, price, duration_days, features, is_active } = updateData;

        const query = `
      UPDATE subscription_plans 
      SET name = ?, description = ?, price = ?, duration_days = ?, features = ?, is_active = ?
      WHERE id = ?
    `;

        await executeQuery(query, [
            name, description, price, duration_days,
            features ? JSON.stringify(features) : null,
            is_active !== undefined ? is_active : 1, id
        ]);

        return await Subscription.getPlanById(id);
    }

    // ============= SUSCRIPCIONES DE USUARIOS =============

    // Obtener todas las suscripciones
    static async findAll(filters = {}) {
        let query = `
      SELECT us.*, 
             u.name as user_name, u.email as user_email,
             sp.name as plan_name, sp.price as plan_price
      FROM user_subscriptions us
      LEFT JOIN users u ON us.user_id = u.id
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE 1=1
    `;

        const params = [];

        if (filters.status) {
            query += ' AND us.status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY us.created_at DESC';

        const results = await executeQuery(query, params);
        return results.map(row => new Subscription(row));
    }

    // Obtener suscripción activa de un usuario
    static async findActiveByUser(userId) {
        const query = `
      SELECT us.*, 
             u.name as user_name, u.email as user_email,
             sp.name as plan_name, sp.price as plan_price, sp.features as plan_features
      FROM user_subscriptions us
      LEFT JOIN users u ON us.user_id = u.id
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
      ORDER BY us.end_date DESC
      LIMIT 1
    `;
        const results = await executeQuery(query, [userId]);
        return results.length > 0 ? new Subscription(results[0]) : null;
    }

    // Obtener historial de suscripciones de un usuario
    static async findByUser(userId) {
        const query = `
      SELECT us.*, 
             sp.name as plan_name, sp.price as plan_price
      FROM user_subscriptions us
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ?
      ORDER BY us.start_date DESC
    `;
        const results = await executeQuery(query, [userId]);
        return results.map(row => new Subscription(row));
    }

    // Crear suscripción
    static async create(subscriptionData) {
        const { user_id, plan_id, start_date, end_date, status } = subscriptionData;

        // Si no se especifica end_date, calcular según duración del plan
        let finalEndDate = end_date;
        if (!finalEndDate) {
            const plan = await Subscription.getPlanById(plan_id);
            if (plan) {
                const startDateObj = new Date(start_date || Date.now());
                startDateObj.setDate(startDateObj.getDate() + plan.duration_days);
                finalEndDate = startDateObj.toISOString().split('T')[0];
            }
        }

        const query = `
      INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?)
    `;

        const finalStartDate = start_date || new Date().toISOString().split('T')[0];

        const result = await executeQuery(query, [
            user_id, plan_id, finalStartDate, finalEndDate, status || 'active'
        ]);

        // Obtener la suscripción completa
        const selectQuery = `
      SELECT us.*, sp.name as plan_name, sp.price as plan_price
      FROM user_subscriptions us
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.id = ?
    `;
        const results = await executeQuery(selectQuery, [result.insertId]);
        return results.length > 0 ? new Subscription(results[0]) : null;
    }

    // Renovar suscripción
    static async renew(userId, planId) {
        // Marcar suscripción actual como expirada
        await executeQuery(
            "UPDATE user_subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active'",
            [userId]
        );

        // Crear nueva suscripción
        return await Subscription.create({
            user_id: userId,
            plan_id: planId,
            start_date: new Date().toISOString().split('T')[0]
        });
    }

    // Cancelar suscripción
    static async cancel(subscriptionId) {
        await executeQuery(
            "UPDATE user_subscriptions SET status = 'cancelled' WHERE id = ?",
            [subscriptionId]
        );
    }

    // Verificar y actualizar suscripciones expiradas
    static async updateExpiredSubscriptions() {
        const query = `
      UPDATE user_subscriptions 
      SET status = 'expired' 
      WHERE status = 'active' AND end_date < CURDATE()
    `;
        const result = await executeQuery(query);
        return result.affectedRows;
    }

    // Obtener estadísticas de suscripciones
    static async getStats() {
        const query = `
      SELECT 
        COUNT(CASE WHEN status = 'active' AND end_date >= CURDATE() THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'expired' OR end_date < CURDATE() THEN 1 END) as expired_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
      FROM user_subscriptions
    `;
        const results = await executeQuery(query);
        return results[0];
    }
}

module.exports = Subscription;
