const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { authenticateToken } = require('../middleware/auth');

// GET /api/activities - Listar todas las actividades
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { day } = req.query;

        let activities;
        if (day) {
            activities = await Activity.findByDay(day);
        } else {
            activities = await Activity.findAll();
        }

        res.json({ success: true, data: activities });
    } catch (error) {
        console.error('Error al obtener actividades:', error);
        res.status(500).json({ success: false, message: 'Error al obtener actividades' });
    }
});

// GET /api/activities/teachers - Obtener lista de profesores
router.get('/teachers', authenticateToken, async (req, res) => {
    try {
        const teachers = await Activity.getTeachers();
        res.json({ success: true, data: teachers });
    } catch (error) {
        console.error('Error al obtener profesores:', error);
        res.status(500).json({ success: false, message: 'Error al obtener profesores' });
    }
});

// GET /api/activities/teacher/:id - Obtener actividades de un profesor
router.get('/teacher/:id', authenticateToken, async (req, res) => {
    try {
        const activities = await Activity.findByTeacher(req.params.id);
        res.json({ success: true, data: activities });
    } catch (error) {
        console.error('Error al obtener actividades del profesor:', error);
        res.status(500).json({ success: false, message: 'Error al obtener actividades' });
    }
});

// GET /api/activities/:id - Obtener actividad por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
        }
        res.json({ success: true, data: activity });
    } catch (error) {
        console.error('Error al obtener actividad:', error);
        res.status(500).json({ success: false, message: 'Error al obtener actividad' });
    }
});

// POST /api/activities - Crear actividad
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, teacher_id, space_id, day_of_week, start_time, end_time, capacity } = req.body;

        if (!name || !teacher_id || !space_id || !day_of_week || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        const newActivity = await Activity.create({
            name, teacher_id, space_id, day_of_week, start_time, end_time, capacity
        });

        res.status(201).json({ success: true, data: newActivity });
    } catch (error) {
        console.error('Error al crear actividad:', error);
        res.status(500).json({ success: false, message: 'Error al crear actividad' });
    }
});

// PUT /api/activities/:id - Actualizar actividad
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updatedActivity = await Activity.update(req.params.id, req.body);
        if (!updatedActivity) {
            return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
        }
        res.json({ success: true, data: updatedActivity });
    } catch (error) {
        console.error('Error al actualizar actividad:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar actividad' });
    }
});

// DELETE /api/activities/:id - Eliminar actividad
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await Activity.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
        }
        res.json({ success: true, message: 'Actividad eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar actividad:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar actividad' });
    }
});

// POST /api/activities/:id/enroll - Inscribir alumno
router.post('/:id/enroll', authenticateToken, async (req, res) => {
    try {
        const { user_id } = req.body;
        const activity = await Activity.enrollStudent(req.params.id, user_id);
        res.json({ success: true, data: activity, message: 'Inscripción exitosa' });
    } catch (error) {
        console.error('Error al inscribir:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'El alumno ya está inscrito' });
        }
        res.status(500).json({ success: false, message: 'Error al inscribir' });
    }
});

// DELETE /api/activities/:id/enroll/:userId - Cancelar inscripción
router.delete('/:id/enroll/:userId', authenticateToken, async (req, res) => {
    try {
        const unenrolled = await Activity.unenrollStudent(req.params.id, req.params.userId);
        if (!unenrolled) {
            return res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
        }
        res.json({ success: true, message: 'Inscripción cancelada' });
    } catch (error) {
        console.error('Error al cancelar inscripción:', error);
        res.status(500).json({ success: false, message: 'Error al cancelar inscripción' });
    }
});

// GET /api/activities/:id/students - Obtener alumnos inscritos
router.get('/:id/students', authenticateToken, async (req, res) => {
    try {
        const students = await Activity.getEnrolledStudents(req.params.id);
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Error al obtener alumnos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener alumnos' });
    }
});

module.exports = router;
