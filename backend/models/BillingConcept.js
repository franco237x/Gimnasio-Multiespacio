/**
 * BillingConcept — Catálogo único de conceptos/ítems cobrables
 *
 * Estructura de relaciones:
 *   billing_concepts ──(FK opcional)──► subscription_plans
 *   billing_concepts ──(FK opcional)──► activities
 *   billing_concepts ──(FK opcional)──► spaces
 *   payments         ──(FK opcional)──► billing_concepts
 *
 * Categorías soportadas:
 *   mensualidad | inscripcion | clase_especial | alquiler | otro
 */

const { executeQuery } = require('../config/database');

class BillingConcept {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.category = data.category;
        this.description = data.description;
        this.icon = data.icon;
        this.color = data.color;
        this.default_amount = data.default_amount;
        this.is_subscription = data.is_subscription;
        this.subscription_plan_id = data.subscription_plan_id;
        this.activity_id = data.activity_id;
        this.space_id = data.space_id;
        this.is_active = data.is_active;
        this.sort_order = data.sort_order;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        // Campos enriquecidos desde JOINs
        this.plan_name = data.plan_name || null;
        this.plan_price = data.plan_price || null;
        this.plan_duration_days = data.plan_duration_days || null;
        this.activity_name = data.activity_name || null;
        this.space_name = data.space_name || null;
        this.space_price_per_hour = data.space_price_per_hour || null;
    }

    // ─────────────────────────────────────────────
    // SELECT con todos los JOINs (fuente de verdad)
    // ─────────────────────────────────────────────
    static get _baseQuery() {
        return `
            SELECT
                bc.*,
                sp.name          AS plan_name,
                sp.price         AS plan_price,
                sp.duration_days AS plan_duration_days,
                a.name           AS activity_name,
                s.name           AS space_name,
                s.price_per_hour AS space_price_per_hour
            FROM billing_concepts bc
            LEFT JOIN subscription_plans sp ON bc.subscription_plan_id = sp.id
            LEFT JOIN activities          a  ON bc.activity_id          = a.id
            LEFT JOIN spaces              s  ON bc.space_id             = s.id
        `;
    }

    // Listar todos los conceptos (con filtros opcionales)
    static async getAll({ onlyActive = true, category = null } = {}) {
        let where = [];
        const params = [];

        if (onlyActive) {
            where.push('bc.is_active = 1');
        }
        if (category) {
            where.push('bc.category = ?');
            params.push(category);
        }

        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const query = `${BillingConcept._baseQuery} ${whereClause} ORDER BY bc.sort_order ASC, bc.name ASC`;
        const results = await executeQuery(query, params);
        return results.map(r => new BillingConcept(r));
    }

    // Obtener un concepto por ID
    static async getById(id) {
        const results = await executeQuery(
            `${BillingConcept._baseQuery} WHERE bc.id = ?`,
            [id]
        );
        return results.length > 0 ? new BillingConcept(results[0]) : null;
    }

    // Crear concepto
    static async create(data) {
        const {
            name, category, description, icon, color,
            default_amount, is_subscription,
            subscription_plan_id, activity_id, space_id,
            sort_order
        } = data;

        const result = await executeQuery(
            `INSERT INTO billing_concepts
                (name, category, description, icon, color,
                 default_amount, is_subscription,
                 subscription_plan_id, activity_id, space_id, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                category || 'otro',
                description || null,
                icon || 'bx-receipt',
                color || '#6366f1',
                default_amount || null,
                is_subscription ? 1 : 0,
                subscription_plan_id || null,
                activity_id || null,
                space_id || null,
                sort_order || 99
            ]
        );
        return await BillingConcept.getById(result.insertId);
    }

    // Actualizar concepto
    static async update(id, data) {
        const {
            name, category, description, icon, color,
            default_amount, is_subscription,
            subscription_plan_id, activity_id, space_id,
            is_active, sort_order
        } = data;

        await executeQuery(
            `UPDATE billing_concepts SET
                name = ?, category = ?, description = ?, icon = ?, color = ?,
                default_amount = ?, is_subscription = ?,
                subscription_plan_id = ?, activity_id = ?, space_id = ?,
                is_active = ?, sort_order = ?
             WHERE id = ?`,
            [
                name, category || 'otro',
                description || null,
                icon || 'bx-receipt',
                color || '#6366f1',
                default_amount || null,
                is_subscription ? 1 : 0,
                subscription_plan_id || null,
                activity_id || null,
                space_id || null,
                is_active !== undefined ? is_active : 1,
                sort_order || 99,
                id
            ]
        );
        return await BillingConcept.getById(id);
    }

    // Eliminar concepto (solo si no tiene pagos vinculados)
    static async delete(id) {
        const [{ count }] = await executeQuery(
            `SELECT COUNT(*) AS count FROM payments WHERE billing_concept_id = ?`,
            [id]
        );
        if (count > 0) {
            throw new Error(
                'Este concepto tiene pagos registrados y no puede eliminarse. Podés desactivarlo en su lugar.'
            );
        }
        await executeQuery(`DELETE FROM billing_concepts WHERE id = ?`, [id]);
        return true;
    }

    // ─────────────────────────────────────────────
    // Sincronización automática:
    // Cuando se crea un plan de suscripción nuevo,
    // crear automáticamente su concepto en billing_concepts
    // ─────────────────────────────────────────────
    static async syncFromPlan(plan) {
        // Verificar si ya existe un concepto para este plan
        const existing = await executeQuery(
            `SELECT id FROM billing_concepts WHERE subscription_plan_id = ? LIMIT 1`,
            [plan.id]
        );
        if (existing.length > 0) return; // Ya está sincronizado

        await BillingConcept.create({
            name: `Mensualidad - ${plan.name}`,
            category: 'mensualidad',
            description: plan.description || `Cuota mensual Plan ${plan.name}`,
            icon: 'bx-calendar-check',
            color: '#10b981',
            default_amount: plan.price,
            is_subscription: 1,
            subscription_plan_id: plan.id,
            sort_order: 10 + plan.id
        });
    }

    // Obtener conceptos con estadísticas de uso (para admin)
    static async getWithStats() {
        const query = `
            SELECT
                bc.*,
                sp.name           AS plan_name,
                sp.price          AS plan_price,
                a.name            AS activity_name,
                s.name            AS space_name,
                COUNT(p.id)       AS total_payments,
                SUM(p.amount)     AS total_billed
            FROM billing_concepts bc
            LEFT JOIN subscription_plans sp ON bc.subscription_plan_id = sp.id
            LEFT JOIN activities          a  ON bc.activity_id          = a.id
            LEFT JOIN spaces              s  ON bc.space_id             = s.id
            LEFT JOIN payments            p  ON p.billing_concept_id    = bc.id
                                            AND p.status = 'completed'
            GROUP BY bc.id
            ORDER BY bc.sort_order ASC, bc.name ASC
        `;
        return await executeQuery(query);
    }
}

module.exports = BillingConcept;
