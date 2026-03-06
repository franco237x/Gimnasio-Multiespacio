const { executeQuery } = require('../config/database');

class Space {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.capacity = data.capacity;
        this.price_per_hour = data.price_per_hour;
        this.status = data.status;
        this.description = data.description;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Obtener todos los espacios
    static async findAll() {
        const query = `SELECT * FROM spaces ORDER BY name`;
        const results = await executeQuery(query);
        return results.map(row => new Space(row));
    }

    // Obtener espacios disponibles
    static async findAvailable() {
        const query = `SELECT * FROM spaces WHERE status = 'available' ORDER BY name`;
        const results = await executeQuery(query);
        return results.map(row => new Space(row));
    }

    // Obtener espacio por ID
    static async findById(id) {
        const query = `SELECT * FROM spaces WHERE id = ?`;
        const results = await executeQuery(query, [id]);
        if (results.length === 0) return null;
        return new Space(results[0]);
    }

    // Crear espacio
    static async create(spaceData) {
        const { name, type, capacity, price_per_hour, description } = spaceData;

        const query = `
      INSERT INTO spaces (name, type, capacity, price_per_hour, description)
      VALUES (?, ?, ?, ?, ?)
    `;

        const result = await executeQuery(query, [
            name, type, capacity, price_per_hour, description || null
        ]);

        return await Space.findById(result.insertId);
    }

    // Actualizar espacio
    static async update(id, updateData) {
        const { name, type, capacity, price_per_hour, status, description } = updateData;

        const query = `
      UPDATE spaces 
      SET name = ?, type = ?, capacity = ?, price_per_hour = ?, status = ?, description = ?
      WHERE id = ?
    `;

        await executeQuery(query, [
            name, type, capacity, price_per_hour, status || 'available', description, id
        ]);

        return await Space.findById(id);
    }

    // Eliminar espacio
    static async delete(id) {
        const query = 'DELETE FROM spaces WHERE id = ?';
        const result = await executeQuery(query, [id]);
        return result.affectedRows > 0;
    }

    // Verificar disponibilidad para fecha/hora específica
    static async checkAvailability(spaceId, date, startTime, endTime, excludeReservationId = null) {
        let query = `
      SELECT COUNT(*) as conflicts FROM reservations
      WHERE space_id = ?
        AND reservation_date = ?
        AND status != 'cancelled'
        AND (
          (start_time <= ? AND end_time > ?) OR
          (start_time < ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
    `;

        const params = [spaceId, date, startTime, startTime, endTime, endTime, startTime, endTime];

        if (excludeReservationId) {
            query += ' AND id != ?';
            params.push(excludeReservationId);
        }

        const resResults = await executeQuery(query, params);
        if (resResults[0].conflicts > 0) return false;

        // --- RN1 Extendida: También debemos verificar que no choque con clases fijas (activities) ---
        // Determinar qué día de la semana es la fecha para buscar en activities
        const dateObj = new Date(date);
        const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        // Ajustamos para obtener el día local donde se crea la fecha
        const dayOfWeek = days[(dateObj.getDay() + 1) % 7] || days[dateObj.getDay()];

        const activityQuery = `
            SELECT COUNT(*) as activityConflicts FROM activities
            WHERE space_id = ?
            AND FIND_IN_SET(?, day_of_week) > 0
            AND (
                (start_time < ? AND end_time > ?) OR
                (start_time >= ? AND start_time < ?)
            )
        `;

        const actParams = [spaceId, dayOfWeek.toLowerCase(), endTime, startTime, startTime, endTime];
        const actResults = await executeQuery(activityQuery, actParams);

        return actResults[0].activityConflicts === 0;
    }
}

module.exports = Space;
