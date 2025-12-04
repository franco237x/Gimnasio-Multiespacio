const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

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
      const query = `
        SELECT u.id, u.name, u.email, u.phone, u.role_id, u.created_at, u.updated_at,
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