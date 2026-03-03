const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { authenticateToken, requireRole, ROLES } = require('../middleware/auth');

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
router.post('/', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const { name, teacher_id, space_id, day_of_week, start_time, end_time, capacity } = req.body;

        if (!name || !teacher_id || !space_id || !day_of_week || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        if (start_time >= end_time) {
            return res.status(400).json({ success: false, message: 'La hora de inicio debe ser menor a la hora de fin' });
        }

        const collision = await Activity.checkScheduleCollision(space_id, start_time, end_time, day_of_week);
        if (collision) {
            return res.status(400).json({
                success: false,
                message: `El espacio ya está ocupado en ese horario por la actividad "${collision.name}" (${collision.start_time.slice(0, 5)} - ${collision.end_time.slice(0, 5)})`
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
router.put('/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
    try {
        const { name, teacher_id, space_id, day_of_week, start_time, end_time, capacity } = req.body;

        if (!name || !teacher_id || !space_id || !day_of_week || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        if (start_time >= end_time) {
            return res.status(400).json({ success: false, message: 'La hora de inicio debe ser menor a la hora de fin' });
        }

        const collision = await Activity.checkScheduleCollision(space_id, start_time, end_time, day_of_week, req.params.id);
        if (collision) {
            return res.status(400).json({
                success: false,
                message: `El espacio ya está ocupado en ese horario por la actividad "${collision.name}" (${collision.start_time.slice(0, 5)} - ${collision.end_time.slice(0, 5)})`
            });
        }

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
router.delete('/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), async (req, res) => {
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
router.post('/:id/enroll', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.PROFESOR, ROLES.ALUMNO), async (req, res) => {
    try {
        const { user_id } = req.body;

        // Si es Profesor, verifica que la actividad sea suya
        if (req.user.role_id === ROLES.PROFESOR) {
            const activity = await Activity.findById(req.params.id);
            if (!activity) {
                return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
            }
            if (activity.teacher_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Solo puedés gestionar alumnos de tus propias clases' });
            }
        }

        // Si es Alumno, solo puede inscribirse a sí mismo
        if (req.user.role_id === ROLES.ALUMNO) {
            if (parseInt(user_id) !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Solo puedes inscribirte a ti mismo' });
            }
        }

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
router.delete('/:id/enroll/:userId', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.PROFESOR, ROLES.ALUMNO), async (req, res) => {
    try {
        // Si es Profesor, verifica que la actividad sea suya
        if (req.user.role_id === ROLES.PROFESOR) {
            const activity = await Activity.findById(req.params.id);
            if (!activity) {
                return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
            }
            if (activity.teacher_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Solo puedés gestionar alumnos de tus propias clases' });
            }
        }

        // Si es Alumno, solo puede desinscribirse a sí mismo
        if (req.user.role_id === ROLES.ALUMNO) {
            if (parseInt(req.params.userId) !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Solo puedes desinscribirte a ti mismo' });
            }
        }

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
router.get('/:id/students', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.PROFESOR), async (req, res) => {
    try {
        // Si es Profesor, solo puede ver alumnos de sus propias clases
        if (req.user.role_id === ROLES.PROFESOR) {
            const activity = await Activity.findById(req.params.id);
            if (!activity) {
                return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
            }
            if (activity.teacher_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Solo puedés ver alumnos de tus propias clases' });
            }
        }

        const students = await Activity.getEnrolledStudents(req.params.id);
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Error al obtener alumnos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener alumnos' });
    }
});

// GET /api/activities/student/:userId/enrollments - Obtener actividades en las que está inscripto un alumno
router.get('/student/:userId/enrollments', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.PROFESOR, ROLES.ALUMNO), async (req, res) => {
    try {
        if (req.user.role_id === ROLES.ALUMNO && parseInt(req.params.userId) !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Solo puedes ver tus propias inscripciones' });
        }

        // Si es profesor, quizá no pueda ver que hace el alumno en OTROS profes, pero podemos dejarlo simple por ahora
        // O restringir a admin y alumno.

        const enrollments = await Activity.getStudentEnrollments(req.params.userId);
        res.json({ success: true, data: enrollments });
    } catch (error) {
        console.error('Error al obtener inscripciones del alumno:', error);
        res.status(500).json({ success: false, message: 'Error al obtener inscripciones' });
    }
});

// =================== ASISTENCIA =================== //
const Attendance = require('../models/Attendance');

// GET /api/activities/:id/attendance?date=YYYY-MM-DD
router.get('/:id/attendance', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.PROFESOR), async (req, res) => {
    try {
        // Si es Profesor, solo puede ver asistencia de sus propias clases
        if (req.user.role_id === ROLES.PROFESOR) {
            const activity = await Activity.findById(req.params.id);
            if (!activity) {
                return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
            }
            if (activity.teacher_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Solo puedés ver asistencia de tus propias clases' });
            }
        }

        const date = req.query.date;
        const attendance = await Attendance.getByActivityAndDate(req.params.id, date);
        res.json({ success: true, data: attendance });
    } catch (error) {
        console.error('Error al obtener asistencia:', error);
        res.status(500).json({ success: false, message: 'Error al obtener asistencia' });
    }
});

// POST /api/activities/:id/attendance
router.post('/:id/attendance', authenticateToken, requireRole(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.PROFESOR), async (req, res) => {
    try {
        // Si es Profesor, solo puede registrar asistencia en sus propias clases
        if (req.user.role_id === ROLES.PROFESOR) {
            const activity = await Activity.findById(req.params.id);
            if (!activity) {
                return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
            }
            if (activity.teacher_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Solo puedés registrar asistencia en tus propias clases' });
            }
        }

        const { attendanceList } = req.body;
        if (!attendanceList || !Array.isArray(attendanceList)) {
            return res.status(400).json({ success: false, message: 'Se requiere una lista de asistencias válida' });
        }

        await Attendance.markBulkAttendance(req.params.id, attendanceList, req.user.id);
        res.json({ success: true, message: 'Asistencia registrada correctamente' });
    } catch (error) {
        console.error('Error al registrar asistencia:', error);
        res.status(500).json({ success: false, message: 'Error al registrar asistencia' });
    }
});

module.exports = router;
