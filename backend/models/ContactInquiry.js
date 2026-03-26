const { executeQuery } = require('../config/database');

class ContactInquiry {
  static async create({ name, email, message }) {
    const query = `
      INSERT INTO contact_inquiries (name, email, message, status)
      VALUES (?, ?, ?, 'pending')
    `;
    const result = await executeQuery(query, [name, email, message]);
    return {
      id: result.insertId,
      name,
      email,
      message,
      status: 'pending'
    };
  }

  static async findAll() {
    const query = `
      SELECT id, name, email, message, status, created_at, updated_at
      FROM contact_inquiries
      ORDER BY created_at DESC
    `;
    return await executeQuery(query);
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE contact_inquiries
      SET status = ?
      WHERE id = ?
    `;
    const result = await executeQuery(query, [status, id]);
    return result.affectedRows > 0;
  }
}

module.exports = ContactInquiry;
