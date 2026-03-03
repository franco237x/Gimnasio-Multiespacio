const { executeQuery } = require('../config/database');

class Activity {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.teacher_id = data.teacher_id;
        this.teacher_name = data.teacher_name;
        this.space_id = data.space_id;
        this.space_name = data.space_name;
        this.day_of_week = data.day_of_week;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
        this.capacity = data.capacity;
        this.enrolled_count = data.enrolled_count;
        this.status = data.status;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Obtener todas las actividades
    static async findAll() {
        const query = `
      SELECT a.*, 
             u.name as teacher_name,
             s.name as space_name
      FROM activities a
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN spaces s ON a.space_id = s.id
      ORDER BY a.start_time
    `;
        const results = await executeQuery(query);
        return results.map(row => new Activity(row));
    }

    // Obtener actividades por día
    static async findByDay(dayOfWeek) {
        const query = `
      SELECT a.*, 
             u.name as teacher_name,
             s.name as space_name
      FROM activities a
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN spaces s ON a.space_id = s.id
      WHERE FIND_IN_SET(?, a.day_of_week) > 0
      ORDER BY a.start_time
    `;
        const results = await executeQuery(query, [dayOfWeek.toLowerCase()]);
        return results.map(row => new Activity(row));
    }

    // Obtener actividades por profesor
    static async findByTeacher(teacherId) {
        const query = `
      SELECT a.*, 
             u.name as teacher_name,
             s.name as space_name
      FROM activities a
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN spaces s ON a.space_id = s.id
      WHERE a.teacher_id = ?
      ORDER BY a.start_time
    `;
        const results = await executeQuery(query, [teacherId]);
        return results.map(row => new Activity(row));
    }

    // Obtener una actividad por ID
    static async findById(id) {
        const query = `
      SELECT a.*, 
             u.name as teacher_name,
             s.name as space_name
      FROM activities a
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN spaces s ON a.space_id = s.id
      WHERE a.id = ?
    `;
        const results = await executeQuery(query, [id]);
        if (results.length === 0) return null;
        return new Activity(results[0]);
    }

    // Crear actividad
    static async create(activityData) {
        const { name, teacher_id, space_id, day_of_week, start_time, end_time, capacity } = activityData;

        const query = `
      INSERT INTO activities (name, teacher_id, space_id, day_of_week, start_time, end_time, capacity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

        const result = await executeQuery(query, [
            name, teacher_id, space_id, day_of_week.toLowerCase(), start_time, end_time, capacity || 20
        ]);

        return await Activity.findById(result.insertId);
    }

    // Actualizar actividad
    static async update(id, updateData) {
        const { name, teacher_id, space_id, day_of_week, start_time, end_time, capacity } = updateData;

        // Recuperamos los inscritos actuales para evitar que la actividad pase a "activa" si sigue llena
        const currentActivity = await Activity.findById(id);
        if (!currentActivity) return null;

        const newStatus = currentActivity.enrolled_count >= capacity ? 'full' : 'active';

        const query = `
      UPDATE activities 
      SET name = ?, teacher_id = ?, space_id = ?, day_of_week = ?, 
          start_time = ?, end_time = ?, capacity = ?, status = ?
      WHERE id = ?
    `;

        await executeQuery(query, [
            name, teacher_id, space_id, day_of_week.toLowerCase(),
            start_time, end_time, capacity || 20, newStatus, id
        ]);

        return await Activity.findById(id);
    }

    // Eliminar actividad
    static async delete(id) {
        // Ejecutamos una cascada manual por seguridad para evitar el error 500 (Foreign Key Constraint)
        await executeQuery('DELETE FROM activity_enrollments WHERE activity_id = ?', [id]);

        const query = 'DELETE FROM activities WHERE id = ?';
        const result = await executeQuery(query, [id]);
        return result.affectedRows > 0;
    }

    // Inscribir alumno en actividad
    static async enrollStudent(activityId, userId) {
        const insertQuery = `
      INSERT INTO activity_enrollments (activity_id, user_id)
      VALUES (?, ?)
    `;

        await executeQuery(insertQuery, [activityId, userId]);

        // Actualizar contador
        await executeQuery(
            'UPDATE activities SET enrolled_count = enrolled_count + 1 WHERE id = ?',
            [activityId]
        );

        // Verificar si está llena
        const activity = await Activity.findById(activityId);
        if (activity.enrolled_count >= activity.capacity) {
            await executeQuery("UPDATE activities SET status = 'full' WHERE id = ?", [activityId]);
        }

        return activity;
    }

    // Cancelar inscripción
    static async unenrollStudent(activityId, userId) {
        const deleteQuery = `
      DELETE FROM activity_enrollments WHERE activity_id = ? AND user_id = ?
    `;

        const result = await executeQuery(deleteQuery, [activityId, userId]);

        if (result.affectedRows > 0) {
            await executeQuery(
                'UPDATE activities SET enrolled_count = GREATEST(enrolled_count - 1, 0), status = "active" WHERE id = ?',
                [activityId]
            );
        }

        return result.affectedRows > 0;
    }

    // Obtener alumnos inscritos
    static async getEnrolledStudents(activityId) {
        const query = `
      SELECT u.id, u.name, u.email, u.phone, ae.enrolled_at, ae.status
      FROM activity_enrollments ae
      JOIN users u ON ae.user_id = u.id
      WHERE ae.activity_id = ?
      ORDER BY ae.enrolled_at
    `;
        return await executeQuery(query, [activityId]);
    }

    // Obtener las actividades en las que está inscripto un alumno
    static async getStudentEnrollments(userId) {
        const query = `
      SELECT a.*, 
             u.name as teacher_name,
             s.name as space_name,
             ae.enrolled_at, ae.status as enrollment_status
      FROM activity_enrollments ae
      JOIN activities a ON ae.activity_id = a.id
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN spaces s ON a.space_id = s.id
      WHERE ae.user_id = ?
      ORDER BY a.start_time
    `;
        const results = await executeQuery(query, [userId]);
        return results; // No devolvemos clase Activity para no perder columnas extra (enrollment_status) 
    }

    // Obtener profesores disponibles
    static async getTeachers() {
        const query = `
      SELECT u.id, u.name, u.email
      FROM users u
      WHERE u.role_id = 3
      ORDER BY u.name
    `;
        return await executeQuery(query);
    }

    // Verificar superposición de horarios
    static async checkScheduleCollision(spaceId, startTime, endTime, daysOfWeek, excludeActivityId = null) {
        const days = Array.isArray(daysOfWeek) ? daysOfWeek : daysOfWeek.split(',');

        // Construimos una condición FIND_IN_SET para cada día solicitado:
        // (FIND_IN_SET('lunes', day_of_week) > 0 OR FIND_IN_SET('miercoles', day_of_week) > 0)
        const dayConditions = days.map(d => `FIND_IN_SET('${d.trim().toLowerCase()}', day_of_week) > 0`).join(' OR ');

        let query = `
            SELECT id, name, start_time, end_time, day_of_week 
            FROM activities 
            WHERE space_id = ? 
            AND (${dayConditions})
            AND (
                (start_time < ? AND end_time > ?) OR  -- Nueva actividad envuelve a existente o se solapa al inicio
                (start_time >= ? AND start_time < ?)    -- Nueva actividad empiza durante una existente
            )
        `;

        const params = [spaceId, endTime, startTime, startTime, endTime];

        if (excludeActivityId) {
            query += ` AND id != ?`;
            params.push(excludeActivityId);
        }

        const results = await executeQuery(query, params);
        return results.length > 0 ? results[0] : null;
    }
}

module.exports = Activity;
