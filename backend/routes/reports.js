const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Attendance = require('../models/Attendance');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireRole, ROLES } = require('../middleware/auth');

// GET /api/reports/dashboard - Estadísticas para el dashboard principal
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const userRoleId = req.user.role_id;
        const isAdminOrRecep = userRoleId === ROLES.ADMINISTRADOR || userRoleId === ROLES.RECEPCIONISTA;
        const isProfesor = userRoleId === ROLES.PROFESOR;

        // ======= ESTADÍSTICAS PARA PROFESOR =======
        if (isProfesor) {
            const teacherId = req.user.id;

            // Mis clases (actividades donde soy el profesor)
            const myClassesResult = await executeQuery(
                `SELECT COUNT(*) as total_classes FROM activities WHERE teacher_id = ? AND status = 'active'`,
                [teacherId]
            );

            // Mis alumnos (inscritos en mis clases)
            const myStudentsResult = await executeQuery(
                `SELECT COUNT(DISTINCT ae.user_id) as total_students
                 FROM activity_enrollments ae
                 INNER JOIN activities a ON ae.activity_id = a.id
                 WHERE a.teacher_id = ? AND ae.status = 'confirmed'`,
                [teacherId]
            );

            // Mis reservas próximas vinculadas a mi ID
            const myReservationsResult = await executeQuery(
                `SELECT COUNT(*) as pending_reservations FROM reservations
                 WHERE client_id = ? AND status = 'pending' AND reservation_date >= CURDATE()`,
                [teacherId]
            );

            return res.json({
                success: true,
                data: {
                    totalClasses: myClassesResult[0]?.total_classes || 0,
                    activeStudents: myStudentsResult[0]?.total_students || 0,
                    pendingReservations: myReservationsResult[0]?.pending_reservations || 0,
                    income: null,
                    subscriptions: null
                }
            });
        }

        // ======= ESTADÍSTICAS PARA ALUMNO =======
        const isAlumno = userRoleId === ROLES.ALUMNO;
        if (isAlumno) {
            const studentId = req.user.id;

            // Inscripciones actuales
            const enrollmentsResult = await executeQuery(
                `SELECT COUNT(*) as active_enrollments FROM activity_enrollments WHERE user_id = ?`,
                [studentId]
            );

            // Estado de suscripción
            const subResult = await executeQuery(
                `SELECT status, end_date FROM user_subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
                [studentId]
            );

            const hasActiveSub = subResult.length > 0 && subResult[0].status === 'active' && new Date(subResult[0].end_date) >= new Date();

            return res.json({
                success: true,
                data: {
                    pendingReservations: enrollmentsResult[0]?.active_enrollments || 0,
                    subscriptions: { active_count: hasActiveSub ? 1 : 0 },
                    totalClasses: 0 // Fetch available classes from frontend or add here if needed
                }
            });
        }

        // ======= ESTADÍSTICAS PARA ADMIN / RECEPCIONISTA =======
        let paymentStats = {};
        let subscriptionStats = {};

        if (isAdminOrRecep) {
            paymentStats = await Payment.getStats('month');
            subscriptionStats = await Subscription.getStats();
        }

        // Contar usuarios activos (alumnos con suscripción activa)
        const activeUsersQuery = `
      SELECT COUNT(DISTINCT us.user_id) as active_students
      FROM user_subscriptions us
      WHERE us.status = 'active' AND us.end_date >= CURDATE()
    `;
        const activeUsersResult = await executeQuery(activeUsersQuery);

        // Clases del mes
        const classesQuery = `
      SELECT COUNT(*) as total_classes
      FROM activities
      WHERE status = 'active'
    `;
        const classesResult = await executeQuery(classesQuery);

        // Reservas pendientes
        const pendingReservationsQuery = `
      SELECT COUNT(*) as pending_reservations
      FROM reservations
      WHERE status = 'pending' AND reservation_date >= CURDATE()
    `;
        const pendingResult = await executeQuery(pendingReservationsQuery);

        res.json({
            success: true,
            data: {
                income: paymentStats.total_income || 0,
                pendingPayments: paymentStats.pending_amount || 0,
                totalPayments: paymentStats.total_payments || 0,
                activeStudents: activeUsersResult[0]?.active_students || 0,
                totalClasses: classesResult[0]?.total_classes || 0,
                pendingReservations: pendingResult[0]?.pending_reservations || 0,
                subscriptions: subscriptionStats
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});


// GET /api/reports/income - Reporte de ingresos
router.get('/income', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const { period, startDate, endDate } = req.query;

        const stats = await Payment.getStats(period);
        const incomeByConceptStats = await Payment.getIncomeByConceptStats();
        const monthlyIncome = await Payment.getMonthlyIncome();

        res.json({
            success: true,
            data: {
                summary: stats,
                byConceptStats: incomeByConceptStats,
                monthly: monthlyIncome
            }
        });
    } catch (error) {
        console.error('Error al obtener reporte de ingresos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reporte' });
    }
});

// GET /api/reports/activities - Estadísticas de actividades
router.get('/activities', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        // Actividades más populares (por inscripciones)
        const popularQuery = `
      SELECT a.name, a.enrolled_count, a.capacity, 
             (a.enrolled_count / a.capacity * 100) as occupancy_percent,
             u.name as teacher_name
      FROM activities a
      LEFT JOIN users u ON a.teacher_id = u.id
      ORDER BY a.enrolled_count DESC
      LIMIT 10
    `;
        const popularActivities = await executeQuery(popularQuery);

        // Actividades por día
        const byDayQuery = `
      SELECT day_of_week, COUNT(*) as count
      FROM activities
      WHERE status = 'active'
      GROUP BY day_of_week
      ORDER BY FIELD(day_of_week, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
    `;
        const byDay = await executeQuery(byDayQuery);

        // Total de inscripciones
        const enrollmentQuery = `
      SELECT COUNT(*) as total_enrollments
      FROM activity_enrollments
      WHERE status = 'confirmed'
    `;
        const enrollments = await executeQuery(enrollmentQuery);

        res.json({
            success: true,
            data: {
                popular: popularActivities,
                byDay: byDay,
                totalEnrollments: enrollments[0]?.total_enrollments || 0
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de actividades:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});

// GET /api/reports/attendance - Estadísticas de asistencia
router.get('/attendance', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const stats = await Attendance.getGeneralStats(
            startDate || thirtyDaysAgo,
            endDate || today
        );

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error al obtener estadísticas de asistencia:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});

module.exports = router;
