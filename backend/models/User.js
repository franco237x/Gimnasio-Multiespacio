const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.phone = data.phone;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Crear un nuevo usuario
  static async create(userData) {
    try {
      const { name, email, password, phone } = userData;
      
      // Hashear la contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (name, email, password, phone) 
        VALUES (?, ?, ?, ?)
      `;
      
      // Convertir undefined a null para phone
      const phoneValue = phone || null;
      
      const result = await executeQuery(query, [name, email, hashedPassword, phoneValue]);
      
      // Retornar el usuario creado (sin la contraseña)
      return await User.findById(result.insertId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Ya existe un usuario con ese email');
      }
      throw error;
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = ?';
      const results = await executeQuery(query, [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      const userData = results[0];
      // No incluir la contraseña en el resultado
      delete userData.password;
      return new User(userData);
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = ?';
      const results = await executeQuery(query, [email]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new User(results[0]);
    } catch (error) {
      throw error;
    }
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw error;
    }
  }

  // Actualizar información del usuario
  static async update(id, updateData) {
    try {
      const { name, phone } = updateData;
      
      const query = `
        UPDATE users 
        SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      // Convertir undefined a null para phone
      const phoneValue = phone || null;
      
      await executeQuery(query, [name, phoneValue, id]);
      return await User.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los usuarios (para administración)
  static async findAll() {
    try {
      const query = 'SELECT id, name, email, phone, created_at, updated_at FROM users ORDER BY created_at DESC';
      const results = await executeQuery(query);
      
      return results.map(userData => new User(userData));
    } catch (error) {
      throw error;
    }
  }

  // Eliminar usuario
  static async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = ?';
      const result = await executeQuery(query, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Método para retornar datos seguros del usuario (sin contraseña)
  toSafeObject() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = User;