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
      ORDER BY FIELD(a.day_of_week, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'), a.start_time
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
      WHERE a.day_of_week = ?
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
      ORDER BY FIELD(a.day_of_week, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'), a.start_time
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
        const { name, teacher_id, space_id, day_of_week, start_time, end_time, capacity, status } = updateData;

        const query = `
      UPDATE activities 
      SET name = ?, teacher_id = ?, space_id = ?, day_of_week = ?, 
          start_time = ?, end_time = ?, capacity = ?, status = ?
      WHERE id = ?
    `;

        await executeQuery(query, [
            name, teacher_id, space_id, day_of_week.toLowerCase(),
            start_time, end_time, capacity, status || 'active', id
        ]);

        return await Activity.findById(id);
    }

    // Eliminar actividad
    static async delete(id) {
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
}

module.exports = Activity;
