const express = require('express');
const router = express.Router();
const BillingConcept = require('../models/BillingConcept');
const { authenticateToken, requireRole, ROLES } = require('../middleware/auth');

// ──────────────────────────────────────────
// GET /api/billing-concepts
// Lista todos los conceptos (con JOINs enriquecidos)
// ──────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { all, category } = req.query;
        const concepts = await BillingConcept.getAll({
            onlyActive: all !== 'true',
            category: category || null
        });
        res.json({ success: true, data: concepts });
    } catch (error) {
        console.error('Error al obtener conceptos de facturación:', error);
        res.status(500).json({ success: false, message: 'Error al obtener conceptos' });
    }
});

// ──────────────────────────────────────────
// GET /api/billing-concepts/stats
// Lista con estadísticas de uso (admin)
// ──────────────────────────────────────────
router.get('/stats', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const stats = await BillingConcept.getWithStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas de conceptos' });
    }
});

// ──────────────────────────────────────────
// GET /api/billing-concepts/:id
// ──────────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const concept = await BillingConcept.getById(req.params.id);
        if (!concept) {
            return res.status(404).json({ success: false, message: 'Concepto no encontrado' });
        }
        res.json({ success: true, data: concept });
    } catch (error) {
        console.error('Error al obtener concepto:', error);
        res.status(500).json({ success: false, message: 'Error al obtener concepto' });
    }
});

// ──────────────────────────────────────────
// POST /api/billing-concepts
// Crear nuevo concepto (solo admin)
// ──────────────────────────────────────────
router.post('/', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const {
            name, category, description, icon, color,
            default_amount, is_subscription,
            subscription_plan_id, activity_id, space_id, sort_order
        } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'El nombre del concepto es requerido' });
        }

        const newConcept = await BillingConcept.create({
            name, category, description, icon, color,
            default_amount, is_subscription,
            subscription_plan_id, activity_id, space_id, sort_order
        });

        res.status(201).json({ success: true, data: newConcept });
    } catch (error) {
        console.error('Error al crear concepto:', error);
        res.status(500).json({ success: false, message: error.message || 'Error al crear concepto' });
    }
});

// ──────────────────────────────────────────
// PUT /api/billing-concepts/:id
// Actualizar concepto (solo admin)
// ──────────────────────────────────────────
router.put('/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const updated = await BillingConcept.update(req.params.id, req.body);
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error al actualizar concepto:', error);
        res.status(500).json({ success: false, message: error.message || 'Error al actualizar concepto' });
    }
});

// ──────────────────────────────────────────
// PATCH /api/billing-concepts/:id/toggle
// Activar / desactivar concepto
// ──────────────────────────────────────────
router.patch('/:id/toggle', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const concept = await BillingConcept.getById(req.params.id);
        if (!concept) {
            return res.status(404).json({ success: false, message: 'Concepto no encontrado' });
        }
        const updated = await BillingConcept.update(req.params.id, {
            ...concept,
            is_active: concept.is_active ? 0 : 1
        });
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ success: false, message: 'Error al cambiar estado del concepto' });
    }
});

// ──────────────────────────────────────────
// DELETE /api/billing-concepts/:id
// Eliminar concepto (solo si no tiene pagos)
// ──────────────────────────────────────────
router.delete('/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        await BillingConcept.delete(req.params.id);
        res.json({ success: true, message: 'Concepto eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar concepto:', error);
        res.status(400).json({ success: false, message: error.message || 'Error al eliminar concepto' });
    }
});

module.exports = router;
