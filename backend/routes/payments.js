const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const { authenticateToken, requireRole, ROLES } = require('../middleware/auth');

// GET /api/payments - Listar pagos (Admin/Recep)
router.get('/', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const { startDate, endDate, concept, status, limit } = req.query;
        const payments = await Payment.findAll({ startDate, endDate, concept, status, limit });
        res.json({ success: true, data: payments });
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener pagos' });
    }
});

// GET /api/payments/stats - Estadísticas de pagos
router.get('/stats', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const { period } = req.query;
        const stats = await Payment.getStats(period || 'month');
        const incomeByConceptStats = await Payment.getIncomeByConceptStats();

        res.json({
            success: true,
            data: {
                ...stats,
                incomeByConceptStats
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});

// GET /api/payments/monthly - Ingresos mensuales
router.get('/monthly', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const monthlyIncome = await Payment.getMonthlyIncome();
        res.json({ success: true, data: monthlyIncome });
    } catch (error) {
        console.error('Error al obtener ingresos mensuales:', error);
        res.status(500).json({ success: false, message: 'Error al obtener ingresos mensuales' });
    }
});

// GET /api/payments/user/:id - Pagos de un usuario
router.get('/user/:id', authenticateToken, async (req, res) => {
    try {
        const payments = await Payment.findByUser(req.params.id);
        res.json({ success: true, data: payments });
    } catch (error) {
        console.error('Error al obtener pagos del usuario:', error);
        res.status(500).json({ success: false, message: 'Error al obtener pagos' });
    }
});

// POST /api/payments - Registrar pago
router.post('/', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const { user_id, subscription_id, amount, concept, payment_method, notes, status } = req.body;

        if (!user_id || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y monto son requeridos'
            });
        }

        const CashRegister = require('../models/CashRegister');
        const activeRegister = await CashRegister.getCurrentOpen();

        if (!activeRegister && payment_method === 'efectivo') {
            return res.status(400).json({
                success: false,
                message: 'Debes abrir una caja en la sección de Gestión de Pagos para cobrar en efectivo.'
            });
        }

        const newPayment = await Payment.create({
            user_id, subscription_id, amount, concept, payment_method, notes,
            status: status || 'completed',
            cash_register_id: activeRegister ? activeRegister.id : null
        });

        res.status(201).json({ success: true, data: newPayment });
    } catch (error) {
        console.error('Error al registrar pago:', error);
        res.status(500).json({ success: false, message: 'Error al registrar pago' });
    }
});

// PATCH /api/payments/:id/cancel - Anular pago contablemente (RN5)
router.patch('/:id/cancel', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const { reason } = req.body;
        const { executeQuery } = require('../config/database');

        await executeQuery(
            `UPDATE payments 
             SET status = 'refunded', 
                 notes = CONCAT(IFNULL(notes, ''), ' | ANULADO: ', ?) 
             WHERE id = ?`,
            [reason || 'Error administrativo', req.params.id]
        );
        res.json({ success: true, message: 'Pago anulado contablemente' });
    } catch (error) {
        console.error('Error al anular pago:', error);
        res.status(500).json({ success: false, message: 'Error al anular pago' });
    }
});

// ============= SUSCRIPCIONES/CUOTAS =============

// GET /api/payments/plans - Listar planes de suscripción
router.get('/plans', authenticateToken, async (req, res) => {
    try {
        const plans = await Subscription.getAllPlans();
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error('Error al obtener planes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener planes' });
    }
});

// POST /api/payments/plans - Crear plan
router.post('/plans', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const { name, description, price, duration_days, features } = req.body;

        if (!name || !price) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y precio son requeridos'
            });
        }

        const newPlan = await Subscription.createPlan({
            name, description, price, duration_days, features
        });

        res.status(201).json({ success: true, data: newPlan });
    } catch (error) {
        console.error('Error al crear plan:', error);
        res.status(500).json({ success: false, message: 'Error al crear plan' });
    }
});

// GET /api/payments/subscription/:userId - Suscripción activa de un usuario
router.get('/subscription/:userId', authenticateToken, async (req, res) => {
    try {
        const subscription = await Subscription.findActiveByUser(req.params.userId);
        res.json({ success: true, data: subscription });
    } catch (error) {
        console.error('Error al obtener suscripción:', error);
        res.status(500).json({ success: false, message: 'Error al obtener suscripción' });
    }
});

// POST /api/payments/subscription - Crear suscripción
router.post('/subscription', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const { user_id, plan_id, start_date, status } = req.body;

        if (!user_id || !plan_id) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y plan son requeridos'
            });
        }

        // RN6 Automático: Si ya tiene, usar Renew.
        const currentSub = await Subscription.findActiveByUser(user_id);
        let subscription;
        if (currentSub) {
            subscription = await Subscription.renew(user_id, plan_id);
        } else {
            subscription = await Subscription.create({ user_id, plan_id, start_date, status: status || 'active' });
        }

        // Activar al usuario si el pago está aprobado / activo
        if (!status || status === 'active') {
            const User = require('../models/User');
            await User.update(user_id, { is_active: 1 });
        }

        res.status(201).json({ success: true, data: subscription });
    } catch (error) {
        console.error('Error al crear suscripción:', error);
        res.status(500).json({ success: false, message: 'Error al crear suscripción' });
    }
});

// POST /api/payments/subscription/:userId/renew - Renovar suscripción
router.post('/subscription/:userId/renew', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const { plan_id } = req.body;
        const subscription = await Subscription.renew(req.params.userId, plan_id);
        res.json({ success: true, data: subscription });
    } catch (error) {
        console.error('Error al renovar suscripción:', error);
        res.status(500).json({ success: false, message: 'Error al renovar suscripción' });
    }
});

module.exports = router;
