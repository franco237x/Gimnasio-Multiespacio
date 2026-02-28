const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Space = require('../models/Space');
const { authenticateToken, requireRole, ROLES } = require('../middleware/auth');

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
router.post('/spaces', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const newSpace = await Space.create(req.body);
        res.status(201).json({ success: true, data: newSpace });
    } catch (error) {
        console.error('Error al crear espacio:', error);
        res.status(500).json({ success: false, message: 'Error al crear espacio' });
    }
});

// PUT /api/reservations/spaces/:id - Actualizar espacio
router.put('/spaces/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const updatedSpace = await Space.update(req.params.id, req.body);
        res.json({ success: true, data: updatedSpace });
    } catch (error) {
        console.error('Error al actualizar espacio:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar espacio' });
    }
});

// DELETE /api/reservations/spaces/:id - Eliminar espacio
router.delete('/spaces/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const deleted = await Space.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Espacio no encontrado' });
        }
        res.json({ success: true, message: 'Espacio eliminado correctamente' });
    } catch (error) {
        // Manejar error de llave foránea (si el espacio tiene reservas)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el espacio porque tiene reservas asociadas'
            });
        }
        console.error('Error al eliminar espacio:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar espacio' });
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

// GET /api/reservations - Listar reservas (Requiere ADMIN/RECEPCIONISTA para evitar fuga local de datos)
router.get('/', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
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
router.get('/pending', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const reservations = await Reservation.getPending();
        res.json({ success: true, data: reservations });
    } catch (error) {
        console.error('Error al obtener reservas pendientes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reservas' });
    }
});

// GET /api/reservations/upcoming - Próximas reservas
router.get('/upcoming', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
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
router.get('/date/:date', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const reservations = await Reservation.findByDate(req.params.date);
        res.json({ success: true, data: reservations });
    } catch (error) {
        console.error('Error al obtener reservas por fecha:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reservas' });
    }
});

// GET /api/reservations/:id - Obtener reserva por ID
router.get('/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
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
router.post('/', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
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

        // Manejo de pagos y caja
        const { payment_status, payment_amount, payment_method } = req.body;
        const totalAmount = req.body.total_amount || 0;
        let amountToPay = 0;

        if (payment_status === 'paid') amountToPay = totalAmount;
        if (payment_status === 'partial') amountToPay = payment_amount;

        let activeRegister = null;
        if (amountToPay > 0) {
            const CashRegister = require('../models/CashRegister');
            activeRegister = await CashRegister.getCurrentOpen();

            // Si intenta pagar en efectivo y no hay caja abierta, bloqueamos la creación de la reserva.
            if (!activeRegister && (payment_method === 'efectivo' || !payment_method)) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes abrir una caja en Gestión de Pagos para cobrar en efectivo.'
                });
            }
        }

        const newReservation = await Reservation.create({
            ...req.body,
            created_by: req.user.id
        });

        // Registrar el pago si corresponde
        if (amountToPay > 0) {
            const Payment = require('../models/Payment');
            await Payment.create({
                user_id: 1, // Usuario Genérico / Mostrador si no se tiene ID del cliente
                amount: amountToPay,
                concept: 'alquiler',
                payment_method: payment_method || 'efectivo',
                notes: `Reserva #${newReservation.id} - ${client_name}`,
                status: 'completed',
                cash_register_id: activeRegister ? activeRegister.id : null
            });
        }

        res.status(201).json({ success: true, data: newReservation });
    } catch (error) {
        console.error('Error al crear reserva:', error);
        res.status(500).json({ success: false, message: 'Error al crear reserva' });
    }
});

// PUT /api/reservations/:id - Actualizar (Editar) reserva
router.put('/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const { space_id, client_name, reservation_date, start_time, end_time } = req.body;

        if (!space_id || !client_name || !reservation_date || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
        }

        if (start_time >= end_time) {
            return res.status(400).json({ success: false, message: 'La hora de inicio debe ser menor a la hora de fin' });
        }

        // Verificar disponibilidad EXCLUYENDO esta reserva
        const isAvailable = await Space.checkAvailability(space_id, reservation_date, start_time, end_time, req.params.id);
        if (!isAvailable) {
            return res.status(400).json({ success: false, message: 'El espacio está ocupado en ese horario por otra reserva o clase' });
        }

        const updatedReservation = await Reservation.update(req.params.id, req.body);
        if (!updatedReservation) {
            return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
        }
        res.json({ success: true, data: updatedReservation });
    } catch (error) {
        console.error('Error al actualizar reserva:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar reserva' });
    }
});

// PATCH /api/reservations/:id/confirm - Confirmar reserva
router.patch('/:id/confirm', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const reservation = await Reservation.confirm(req.params.id);
        res.json({ success: true, data: reservation, message: 'Reserva confirmada' });
    } catch (error) {
        console.error('Error al confirmar reserva:', error);
        res.status(500).json({ success: false, message: 'Error al confirmar reserva' });
    }
});

// PATCH /api/reservations/:id/cancel - Cancelar reserva
router.patch('/:id/cancel', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const reservation = await Reservation.cancel(req.params.id);
        res.json({ success: true, data: reservation, message: 'Reserva cancelada' });
    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        res.status(500).json({ success: false, message: 'Error al cancelar reserva' });
    }
});

// DELETE /api/reservations/:id - Eliminar reserva
router.delete('/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
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
