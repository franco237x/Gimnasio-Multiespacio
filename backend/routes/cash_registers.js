const express = require('express');
const router = express.Router();
const CashRegister = require('../models/CashRegister');
const { authenticateToken, requireRole, ROLES } = require('../middleware/auth');

// GET /api/cash-registers/current
router.get('/current', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const register = await CashRegister.getCurrentOpen();
        if (register) {
            const summary = await CashRegister.getRegisterSummary(register.id);
            res.json({ success: true, data: { register, summary } });
        } else {
            res.json({ success: true, data: null, message: 'Ninguna caja abierta' });
        }
    } catch (error) {
        console.error('Error al obtener caja actual:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estado de caja' });
    }
});

// GET /api/cash-registers
router.get('/', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const history = await CashRegister.findAll();
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('Error al obtener historial de cajas:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// POST /api/cash-registers/open
router.post('/open', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const { opening_balance } = req.body;
        const newRegister = await CashRegister.open(req.user.id, opening_balance || 0);
        res.json({ success: true, data: newRegister, message: 'Caja abierta correctamente' });
    } catch (error) {
        console.error('Error al abrir caja:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// POST /api/cash-registers/close
router.post('/close', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const { id, counted_balance, notes } = req.body;
        const closedRegister = await CashRegister.close(id, req.user.id, counted_balance || 0, notes);
        res.json({ success: true, data: closedRegister, message: 'Caja cerrada y conciliada' });
    } catch (error) {
        console.error('Error al cerrar caja:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;
