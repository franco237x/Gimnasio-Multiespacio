const express = require('express');
const router = express.Router();
const GymConfig = require('../models/GymConfig');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/config - Obtener toda la configuración
router.get('/', authenticateToken, requireRole(1, 2, 3), async (req, res) => {
    try {
        const config = await GymConfig.getAll();
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ success: false, message: 'Error al obtener configuración' });
    }
});

// PUT /api/config - Actualizar configuración
router.put('/', authenticateToken, requireRole(1), async (req, res) => {
    try {
        const updatedConfig = await GymConfig.updateAll(req.body);
        res.json({ success: true, data: updatedConfig, message: 'Configuración guardada' });
    } catch (error) {
        console.error('Error al guardar configuración:', error);
        res.status(500).json({ success: false, message: 'Error al guardar configuración' });
    }
});

// GET /api/config/:key - Obtener valor específico
router.get('/:key', authenticateToken, requireRole(1, 2), async (req, res) => {
    try {
        const value = await GymConfig.get(req.params.key);
        res.json({ success: true, data: { [req.params.key]: value } });
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ success: false, message: 'Error al obtener configuración' });
    }
});

module.exports = router;
