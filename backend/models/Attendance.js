const { executeQuery } = require('../config/database');

class Attendance {
    constructor(data) {
        this.id = data.id;
        this.activity_id = data.activity_id;
        this.activity_name = data.activity_name;
        this.user_id = data.user_id;
        this.user_name = data.user_name;
        this.attendance_date = data.attendance_date;
        this.status = data.status;
        this.marked_by = data.marked_by;
        this.created_at = data.created_at;
    }

    // Registrar asistencia
    static async markAttendance(activityId, userId, status, markedBy) {
        const query = `
      INSERT INTO attendance (activity_id, user_id, attendance_date, status, marked_by)
      VALUES (?, ?, CURDATE(), ?, ?)
      ON DUPLICATE KEY UPDATE status = ?, marked_by = ?
    `;

        await executeQuery(query, [activityId, userId, status, markedBy, status, markedBy]);
        return true;
    }

    // Registrar asistencia masiva
    static async markBulkAttendance(activityId, attendanceList, markedBy) {
        for (const item of attendanceList) {
            await Attendance.markAttendance(activityId, item.user_id, item.status, markedBy);
        }
        return true;
    }

    // Obtener asistencia de una clase en una fecha
    static async getByActivityAndDate(activityId, date) {
        const query = `
      SELECT a.*, u.name as user_name
      FROM attendance a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.activity_id = ? AND a.attendance_date = ?
    `;
        const results = await executeQuery(query, [activityId, date || new Date().toISOString().split('T')[0]]);
        return results.map(row => new Attendance(row));
    }

    // Obtener historial de asistencia de un usuario
    static async getByUser(userId, limit = 30) {
        const query = `
      SELECT a.*, ac.name as activity_name
      FROM attendance a
      LEFT JOIN activities ac ON a.activity_id = ac.id
      WHERE a.user_id = ?
      ORDER BY a.attendance_date DESC
      LIMIT ?
    `;
        const results = await executeQuery(query, [userId, limit]);
        return results.map(row => new Attendance(row));
    }

    // Obtener estadísticas de asistencia de un usuario
    static async getUserStats(userId) {
        const query = `
      SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as attended,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
      FROM attendance
      WHERE user_id = ?
    `;
        const results = await executeQuery(query, [userId]);
        return results[0];
    }

    // Estadísticas generales para reportes
    static async getGeneralStats(startDate, endDate) {
        const query = `
      SELECT 
        COUNT(*) as total_attendances,
        COUNT(DISTINCT user_id) as unique_students,
        COUNT(DISTINCT activity_id) as activities_with_attendance,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count
      FROM attendance
      WHERE attendance_date BETWEEN ? AND ?
    `;
        const results = await executeQuery(query, [startDate, endDate]);
        return results[0];
    }
}

module.exports = Attendance;
