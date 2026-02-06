const { executeQuery } = require('../config/database');

class Reservation {
    constructor(data) {
        this.id = data.id;
        this.space_id = data.space_id;
        this.space_name = data.space_name;
        this.client_name = data.client_name;
        this.client_phone = data.client_phone;
        this.client_email = data.client_email;
        this.reservation_date = data.reservation_date;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
        this.total_amount = data.total_amount;
        this.status = data.status;
        this.notes = data.notes;
        this.created_by = data.created_by;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Obtener todas las reservas
    static async findAll(filters = {}) {
        let query = `
      SELECT r.*, s.name as space_name
      FROM reservations r
      LEFT JOIN spaces s ON r.space_id = s.id
      WHERE 1=1
    `;

        const params = [];

        if (filters.status) {
            query += ' AND r.status = ?';
            params.push(filters.status);
        }

        if (filters.startDate) {
            query += ' AND r.reservation_date >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND r.reservation_date <= ?';
            params.push(filters.endDate);
        }

        if (filters.spaceId) {
            query += ' AND r.space_id = ?';
            params.push(filters.spaceId);
        }

        query += ' ORDER BY r.reservation_date, r.start_time';

        const results = await executeQuery(query, params);
        return results.map(row => new Reservation(row));
    }

    // Obtener reserva por ID
    static async findById(id) {
        const query = `
      SELECT r.*, s.name as space_name
      FROM reservations r
      LEFT JOIN spaces s ON r.space_id = s.id
      WHERE r.id = ?
    `;
        const results = await executeQuery(query, [id]);
        if (results.length === 0) return null;
        return new Reservation(results[0]);
    }

    // Obtener reservas por fecha
    static async findByDate(date) {
        const query = `
      SELECT r.*, s.name as space_name
      FROM reservations r
      LEFT JOIN spaces s ON r.space_id = s.id
      WHERE r.reservation_date = ?
      ORDER BY r.start_time
    `;
        const results = await executeQuery(query, [date]);
        return results.map(row => new Reservation(row));
    }

    // Crear reserva
    static async create(reservationData) {
        const {
            space_id, client_name, client_phone, client_email,
            reservation_date, start_time, end_time, total_amount, notes, created_by
        } = reservationData;

        const query = `
      INSERT INTO reservations 
        (space_id, client_name, client_phone, client_email, reservation_date, start_time, end_time, total_amount, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const result = await executeQuery(query, [
            space_id, client_name, client_phone || null, client_email || null,
            reservation_date, start_time, end_time, total_amount, notes || null, created_by || null
        ]);

        return await Reservation.findById(result.insertId);
    }

    // Confirmar reserva
    static async confirm(id) {
        const query = "UPDATE reservations SET status = 'confirmed' WHERE id = ?";
        await executeQuery(query, [id]);
        return await Reservation.findById(id);
    }

    // Cancelar reserva
    static async cancel(id) {
        const query = "UPDATE reservations SET status = 'cancelled' WHERE id = ?";
        await executeQuery(query, [id]);
        return await Reservation.findById(id);
    }

    // Eliminar reserva
    static async delete(id) {
        const query = 'DELETE FROM reservations WHERE id = ?';
        const result = await executeQuery(query, [id]);
        return result.affectedRows > 0;
    }

    // Obtener reservas pendientes
    static async getPending() {
        return await Reservation.findAll({ status: 'pending' });
    }

    // Obtener reservas próximas
    static async getUpcoming(days = 7) {
        const query = `
      SELECT r.*, s.name as space_name
      FROM reservations r
      LEFT JOIN spaces s ON r.space_id = s.id
      WHERE r.reservation_date >= CURDATE()
        AND r.reservation_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND r.status != 'cancelled'
      ORDER BY r.reservation_date, r.start_time
    `;
        const results = await executeQuery(query, [days]);
        return results.map(row => new Reservation(row));
    }
}

module.exports = Reservation;
