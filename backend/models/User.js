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
    this.is_active = data.is_active;
    this.medical_notes = data.medical_notes;
    this.is_fit = data.is_fit !== undefined ? Boolean(data.is_fit) : true;
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

    // Revocar tokens previos del mismo tipo para este usuario
    await executeQuery(
      'UPDATE user_tokens SET is_revoked = 1 WHERE user_id = ? AND token_type = ? AND used_at IS NULL AND is_revoked = 0',
      [userId, 'email_verification']
    );

    await executeQuery(
      'INSERT INTO user_tokens (user_id, token_type, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [userId, 'email_verification', hashedToken, expiresAt]
    );

    return { token: rawToken, expiresAt };
  }

  // Confirmar email usando token
  static async verifyEmailWithToken(rawToken) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const query = `
      SELECT ut.id as token_id, ut.user_id
      FROM user_tokens ut
      JOIN users u ON ut.user_id = u.id
      WHERE ut.token_hash = ?
        AND ut.token_type = 'email_verification'
        AND ut.expires_at > NOW()
        AND ut.used_at IS NULL
        AND ut.is_revoked = 0
        AND u.email_verified = 0
      LIMIT 1
    `;

    const results = await executeQuery(query, [hashedToken]);

    if (results.length === 0) {
      throw new Error('Token inválido o expirado');
    }

    const { token_id, user_id } = results[0];

    // Marcar el token como usado
    await executeQuery(
      'UPDATE user_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [token_id]
    );

    // Marcar el email como verificado
    await executeQuery(
      'UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user_id]
    );

    return await User.findById(user_id);
  }

  // Generar y guardar token de recuperación de contraseña
  static async createPasswordResetToken(userId, hoursToExpire = 1) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + hoursToExpire * 60 * 60 * 1000);

    // Revocar tokens previos del mismo tipo para este usuario
    await executeQuery(
      'UPDATE user_tokens SET is_revoked = 1 WHERE user_id = ? AND token_type = ? AND used_at IS NULL AND is_revoked = 0',
      [userId, 'password_reset']
    );

    await executeQuery(
      'INSERT INTO user_tokens (user_id, token_type, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [userId, 'password_reset', hashedToken, expiresAt]
    );

    return { token: rawToken, expiresAt };
  }

  // Restablecer contraseña usando token
  static async resetPasswordWithToken(rawToken, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const query = `
      SELECT ut.id as token_id, ut.user_id
      FROM user_tokens ut
      WHERE ut.token_hash = ?
        AND ut.token_type = 'password_reset'
        AND ut.expires_at > NOW()
        AND ut.used_at IS NULL
        AND ut.is_revoked = 0
      LIMIT 1
    `;

    const results = await executeQuery(query, [hashedToken]);

    if (results.length === 0) {
      throw new Error('Token inválido o expirado');
    }

    const { token_id, user_id } = results[0];
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Marcar el token como usado
    await executeQuery(
      'UPDATE user_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [token_id]
    );

    // Actualizar la contraseña
    await executeQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, user_id]
    );

    return await User.findById(user_id);
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
      medical_notes: this.medical_notes,
      is_fit: this.is_fit,
      role: {
        id: this.role_id,
        name: this.role_name,
        hierarchy: this.role_hierarchy
      },
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Actualizar ficha médica
  static async updateMedicalInfo(userId, isFit, medicalNotes) {
    try {
      const query = 'UPDATE users SET is_fit = ?, medical_notes = ? WHERE id = ?';
      const fitVal = isFit ? 1 : 0;
      await executeQuery(query, [fitVal, medicalNotes || null, userId]);
      return await User.findById(userId);
    } catch (error) {
      throw error;
    }
  }

  // Obtener progreso de un usuario
  static async getProgressLogs(userId) {
    try {
      const query = `
        SELECT p.*, u.name as teacher_name 
        FROM user_progress p
        LEFT JOIN users u ON p.teacher_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.date DESC, p.created_at DESC
      `;
      return await executeQuery(query, [userId]);
    } catch (error) {
      throw error;
    }
  }

  // Obtener estudiantes de un profesor (por las actividades que dicta)
  static async getStudentsByTeacher(teacherId) {
    try {
      const query = `
        SELECT DISTINCT u.id, u.name, u.email, u.phone, u.medical_notes, u.is_fit 
        FROM users u
        JOIN activity_enrollments ae ON u.id = ae.user_id
        JOIN activities a ON ae.activity_id = a.id
        WHERE a.teacher_id = ? AND ae.status = 'confirmed'
      `;
      const results = await executeQuery(query, [teacherId]);
      return results;
    } catch (error) {
      throw error;
    }
  }

  // Agregar log de progreso a un usuario
  static async addProgressLog(userId, teacherId, date, weight, notes) {
    try {
      const query = `
        INSERT INTO user_progress (user_id, teacher_id, date, weight, notes)
        VALUES (?, ?, ?, ?, ?)
      `;
      const result = await executeQuery(query, [userId, teacherId, date, weight || null, notes || null]);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar el modelo y las constantes de roles
module.exports = User;
module.exports.ROLES = ROLES;