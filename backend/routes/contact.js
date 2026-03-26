const express = require('express');
const router = express.Router();
const ContactInquiry = require('../models/ContactInquiry');
const { authenticateToken, requireMinRole, ROLES } = require('../middleware/auth');

// Funciones para manejar límite de peticiones simple (basic rate limiting para spam)
// Guardará la IP y la cantidad de peticiones en los últimos 15 min.
const rateLimitMap = new Map();
const windowMs = 15 * 60 * 1000; // 15 minutos
const maxRequests = 3; // 3 mensajes cada 15 min por IP

const rateLimitMiddleware = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    if (rateLimitMap.has(ip)) {
        const data = rateLimitMap.get(ip);
        if (now - data.firstRequestTime > windowMs) {
            // Pasó el tiempo, resetear
            rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
        } else if (data.count >= maxRequests) {
            return res.status(429).json({ success: false, message: 'Demasiados envíos desde esta IP. Por favor, intenta más tarde (15 min).' });
        } else {
            data.count++;
            rateLimitMap.set(ip, data);
        }
    } else {
        rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    }
    
    next();
};

// @route   POST /api/contact
// @desc    Enviar un mensaje de contacto (Público)
// @access  Public
router.post('/', rateLimitMiddleware, async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validaciones
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Por favor, complete todos los campos requeridos.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
             return res.status(400).json({ success: false, message: 'El formato del email es inválido.' });
        }

        const inquiry = await ContactInquiry.create({ name, email, message });
        
        // Aquí iría el envío real de correo mediante nodemailer (omitido para cumplir RN2 independientemente del email).
        console.log(`Mensaje de contacto recibido de: ${email}`);

        res.status(201).json({ 
            success: true, 
            message: '¡Tu consulta fue enviada! Te responderemos a la brevedad.',
            data: inquiry 
        });
    } catch (error) {
        console.error('Error al guardar consulta de contacto:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al enviar la consulta.' });
    }
});

// @route   GET /api/contact
// @desc    Obtener todos los mensajes de contacto
// @access  Protected (Admin, Receptionist)
router.get('/', [authenticateToken, requireMinRole(ROLES.RECEPCIONISTA)], async (req, res) => {
    try {
        const inquiries = await ContactInquiry.findAll();
        res.json({ success: true, data: inquiries });
    } catch (error) {
        console.error('Error obteniendo consultas de contacto:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las consultas.' });
    }
});

// @route   PUT /api/contact/:id/status
// @desc    Actualizar el estado de una consulta
// @access  Protected (Admin, Receptionist)
router.put('/:id/status', [authenticateToken, requireMinRole(ROLES.RECEPCIONISTA)], async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'in_progress', 'resolved'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Estado inválido.' });
        }

        const updated = await ContactInquiry.updateStatus(id, status);
        if (!updated) {
             return res.status(404).json({ success: false, message: 'Consulta no encontrada.' });
        }

        res.json({ success: true, message: 'Estado de consulta actualizado exitosamente.' });
    } catch (error) {
        console.error('Error actualizando estado de consulta:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el estado de la consulta.' });
    }
});

module.exports = router;
