const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Constantes de roles para usar en el código
const ROLES = {
  ADMINISTRADOR: 1,
  RECEPCIONISTA: 2,
  PROFESOR: 3,
  ALUMNO: 4
};

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.phone = data.phone;
    this.email_verified = Boolean(data.email_verified);
    this.verification_token = data.verification_token;
    this.verification_token_expires = data.verification_token_expires;
    this.reset_token = data.reset_token;
    this.reset_token_expires = data.reset_token_expires;
    this.is_active = data.is_active;
    this.role_id = data.role_id;
    this.role_name = data.role_name;
    this.role_hierarchy = data.role_hierarchy;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Crear un nuevo usuario
  static async create(userData) {
    try {
      const { name, email, password, phone, role_id = ROLES.ALUMNO } = userData;

      // Hashear la contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (name, email, password, phone, role_id) 
        VALUES (?, ?, ?, ?, ?)
      `;

      // Convertir undefined a null para phone
      const phoneValue = phone || null;

      const result = await executeQuery(query, [name, email, hashedPassword, phoneValue, role_id]);

      // Retornar el usuario creado (sin la contraseña)
      return await User.findById(result.insertId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Ya existe un usuario con ese email');
      }
      throw error;
    }
  }

  // Buscar usuario por ID (con información del rol)
  static async findById(id) {
    try {
      const query = `
        SELECT u.*, r.name as role_name, r.hierarchy as role_hierarchy 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.id = ?
      `;
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

  // Buscar usuario por email (con información del rol)
  static async findByEmail(email) {
    try {
      const query = `
        SELECT u.*, r.name as role_name, r.hierarchy as role_hierarchy 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.email = ?
      `;
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

  // Generar y guardar token de verificación de email
  static async createEmailVerification(userId, hoursToExpire = 24) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + hoursToExpire * 60 * 60 * 1000);

    await executeQuery(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [hashedToken, expiresAt, userId]
    );

    return { token: rawToken, expiresAt };
  }

  // Confirmar email usando token
  static async verifyEmailWithToken(rawToken) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const query = `
      SELECT * FROM users
      WHERE verification_token = ?
        AND verification_token_expires > NOW()
        AND email_verified = 0
      LIMIT 1
    `;

    const results = await executeQuery(query, [hashedToken]);

    if (results.length === 0) {
      throw new Error('Token inválido o expirado');
    }

    const userId = results[0].id;

    await executeQuery(
      `UPDATE users 
       SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [userId]
    );

    return await User.findById(userId);
  }

  // Generar y guardar token de recuperación de contraseña
  static async createPasswordResetToken(userId, hoursToExpire = 1) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + hoursToExpire * 60 * 60 * 1000);

    await executeQuery(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [hashedToken, expiresAt, userId]
    );

    return { token: rawToken, expiresAt };
  }

  // Restablecer contraseña usando token
  static async resetPasswordWithToken(rawToken, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const query = `
      SELECT * FROM users
      WHERE reset_token = ?
        AND reset_token_expires > NOW()
      LIMIT 1
    `;

    const results = await executeQuery(query, [hashedToken]);

    if (results.length === 0) {
      throw new Error('Token inválido o expirado');
    }

    const userId = results[0].id;
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await executeQuery(
      `UPDATE users 
       SET password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [hashedPassword, userId]
    );

    return await User.findById(userId);
  }

  // Actualizar contraseña directamente
  static async updatePassword(userId, newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await executeQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );
    return await User.findById(userId);
  }

  // Actualizar información del usuario
  static async update(id, updateData) {
    try {
      const { name, email, phone, role_id, is_active, password } = updateData;

      let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
      const values = [];

      if (name !== undefined) {
        query += ', name = ?';
        values.push(name);
      }

      if (phone !== undefined) {
        query += ', phone = ?';
        values.push(phone || null);
      }

      if (email !== undefined) {
        query += ', email = ?';
        values.push(email);
      }

      if (role_id !== undefined) {
        query += ', role_id = ?';
        values.push(role_id);
      }

      if (is_active !== undefined) {
        query += ', is_active = ?';
        values.push(is_active === true || is_active === 1 || is_active === '1' ? 1 : 0);
      }

      if (password) {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        query += ', password = ?';
        values.push(hashedPassword);
      }

      query += ' WHERE id = ?';
      values.push(id);

      await executeQuery(query, values);
      return await User.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los usuarios (para administración)
  static async findAll() {
    try {
      const query = `
        SELECT u.id, u.name, u.email, u.phone, u.role_id, u.is_active, u.created_at, u.updated_at,
               r.name as role_name, r.hierarchy as role_hierarchy
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.created_at DESC
      `;
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

  // Cambiar rol de usuario
  static async updateRole(userId, roleId) {
    try {
      const query = 'UPDATE users SET role_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(query, [roleId, userId]);
      return await User.findById(userId);
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los roles disponibles
  static async getAllRoles() {
    try {
      const query = 'SELECT * FROM roles ORDER BY hierarchy DESC';
      return await executeQuery(query);
    } catch (error) {
      throw error;
    }
  }

  // Verificar si el usuario tiene un rol específico o superior
  hasRole(roleName) {
    return this.role_name === roleName;
  }

  // Verificar si el usuario tiene jerarquía igual o superior a un rol
  hasMinimumRole(minimumHierarchy) {
    return this.role_hierarchy >= minimumHierarchy;
  }

  // Verificar si es administrador
  isAdmin() {
    return this.role_id === ROLES.ADMINISTRADOR;
  }

  // Método para retornar datos seguros del usuario (sin contraseña)
  toSafeObject() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      email_verified: this.email_verified,
      role: {
        id: this.role_id,
        name: this.role_name,
        hierarchy: this.role_hierarchy
      },
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

// Exportar el modelo y las constantes de roles
module.exports = User;
module.exports.ROLES = ROLES;