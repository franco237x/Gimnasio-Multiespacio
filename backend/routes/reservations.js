const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Space = require('../models/Space');
const { authenticateToken } = require('../middleware/auth');

// ============= ESPACIOS =============

// GET /api/reservations/spaces - Listar espacios
router.get('/spaces', authenticateToken, async (req, res) => {
    try {
        const { available } = req.query;
        let spaces;
        if (available === 'true') {
            spaces = await Space.findAvailable();
        } else {
            spaces = await Space.findAll();
        }
        res.json({ success: true, data: spaces });
    } catch (error) {
        console.error('Error al obtener espacios:', error);
        res.status(500).json({ success: false, message: 'Error al obtener espacios' });
    }
});

// POST /api/reservations/spaces - Crear espacio
router.post('/spaces', authenticateToken, async (req, res) => {
    try {
        const newSpace = await Space.create(req.body);
        res.status(201).json({ success: true, data: newSpace });
    } catch (error) {
        console.error('Error al crear espacio:', error);
        res.status(500).json({ success: false, message: 'Error al crear espacio' });
    }
});

// PUT /api/reservations/spaces/:id - Actualizar espacio
router.put('/spaces/:id', authenticateToken, async (req, res) => {
    try {
        const updatedSpace = await Space.update(req.params.id, req.body);
        res.json({ success: true, data: updatedSpace });
    } catch (error) {
        console.error('Error al actualizar espacio:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar espacio' });
    }
});

// GET /api/reservations/spaces/:id/availability - Verificar disponibilidad
router.get('/spaces/:id/availability', authenticateToken, async (req, res) => {
    try {
        const { date, startTime, endTime } = req.query;
        const isAvailable = await Space.checkAvailability(req.params.id, date, startTime, endTime);
        res.json({ success: true, data: { available: isAvailable } });
    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        res.status(500).json({ success: false, message: 'Error al verificar disponibilidad' });
    }
});

// ============= RESERVAS =============

// GET /api/reservations - Listar reservas
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, startDate, endDate, spaceId } = req.query;
        const reservations = await Reservation.findAll({ status, startDate, endDate, spaceId });
        res.json({ success: true, data: reservations });
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reservas' });
    }
});

// GET /api/reservations/pending - Reservas pendientes
router.get('/pending', authenticateToken, async (req, res) => {
    try {
        const reservations = await Reservation.getPending();
        res.json({ success: true, data: reservations });
    } catch (error) {
        console.error('Error al obtener reservas pendientes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reservas' });
    }
});

// GET /api/reservations/upcoming - Próximas reservas
router.get('/upcoming', authenticateToken, async (req, res) => {
    try {
        const { days } = req.query;
        const reservations = await Reservation.getUpcoming(parseInt(days) || 7);
        res.json({ success: true, data: reservations });
    } catch (error) {
        console.error('Error al obtener próximas reservas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reservas' });
    }
});

// GET /api/reservations/date/:date - Reservas por fecha
router.get('/date/:date', authenticateToken, async (req, res) => {
    try {
        const reservations = await Reservation.findByDate(req.params.date);
        res.json({ success: true, data: reservations });
    } catch (error) {
        console.error('Error al obtener reservas por fecha:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reservas' });
    }
});

// GET /api/reservations/:id - Obtener reserva por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
        }
        res.json({ success: true, data: reservation });
    } catch (error) {
        console.error('Error al obtener reserva:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reserva' });
    }
});

// POST /api/reservations - Crear reserva
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { space_id, client_name, reservation_date, start_time, end_time, total_amount } = req.body;

        if (!space_id || !client_name || !reservation_date || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Espacio, cliente, fecha y horarios son requeridos'
            });
        }

        // Verificar disponibilidad
        const isAvailable = await Space.checkAvailability(space_id, reservation_date, start_time, end_time);
        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'El espacio no está disponible en ese horario'
            });
        }

        const newReservation = await Reservation.create(req.body);
        res.status(201).json({ success: true, data: newReservation });
    } catch (error) {
        console.error('Error al crear reserva:', error);
        res.status(500).json({ success: false, message: 'Error al crear reserva' });
    }
});

// PATCH /api/reservations/:id/confirm - Confirmar reserva
router.patch('/:id/confirm', authenticateToken, async (req, res) => {
    try {
        const reservation = await Reservation.confirm(req.params.id);
        res.json({ success: true, data: reservation, message: 'Reserva confirmada' });
    } catch (error) {
        console.error('Error al confirmar reserva:', error);
        res.status(500).json({ success: false, message: 'Error al confirmar reserva' });
    }
});

// PATCH /api/reservations/:id/cancel - Cancelar reserva
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const reservation = await Reservation.cancel(req.params.id);
        res.json({ success: true, data: reservation, message: 'Reserva cancelada' });
    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        res.status(500).json({ success: false, message: 'Error al cancelar reserva' });
    }
});

// DELETE /api/reservations/:id - Eliminar reserva
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await Reservation.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
        }
        res.json({ success: true, message: 'Reserva eliminada' });
    } catch (error) {
        console.error('Error al eliminar reserva:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar reserva' });
    }
});

module.exports = router;
