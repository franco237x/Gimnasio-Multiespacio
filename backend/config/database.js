const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gimnasio_multiespacio',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

// Crear el pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
  try {
    // Primero intentamos conectar sin especificar la base de datos
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    const tempConnection = await mysql.createConnection(tempConfig);
    
    // Crear la base de datos si no existe
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    console.log(`✅ Base de datos '${dbConfig.database}' verificada/creada`);
    
    await tempConnection.end();
    
    // Ahora conectar con la base de datos específica
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    return false;
  }
};

// Función para ejecutar queries
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  }
};

// Función para inicializar las tablas
const initializeTables = async () => {
  try {
    // Crear tabla de roles
    const createRolesTable = `
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        hierarchy INT NOT NULL DEFAULT 0,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createRolesTable);
    console.log('✅ Tabla roles creada/verificada correctamente');

    // Insertar roles por defecto si no existen
    const insertRoles = `
      INSERT IGNORE INTO roles (name, hierarchy, description) VALUES
        ('administrador', 4, 'Acceso total al sistema'),
        ('recepcionista', 3, 'Gestión de recepción y atención al cliente'),
        ('profesor', 2, 'Gestión de clases y alumnos'),
        ('alumno', 1, 'Usuario básico del gimnasio');
    `;

    await executeQuery(insertRoles);
    console.log('✅ Roles por defecto insertados/verificados');

    // Crear tabla de usuarios
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email_verified TINYINT(1) NOT NULL DEFAULT 0,
        verification_token VARCHAR(255),
        verification_token_expires DATETIME,
        reset_token VARCHAR(255),
        reset_token_expires DATETIME,
        role_id INT DEFAULT 4,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createUsersTable);
    console.log('✅ Tabla users creada/verificada correctamente');

    // Si la tabla users ya existe pero no tiene role_id, agregarlo
    try {
      const addRoleColumn = `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS role_id INT DEFAULT 4,
        ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
      `;
      await executeQuery(addRoleColumn);
    } catch (alterError) {
      // Ignorar si la columna ya existe o hay error de constraint duplicado
      if (!alterError.message.includes('Duplicate')) {
        console.log('ℹ️ Columna role_id ya existe o se agregó correctamente');
      }
    }

    // Agregar columnas de verificación y recuperación si faltan
    const authColumns = [
      'ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER phone',
      'ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) AFTER email_verified',
      'ADD COLUMN IF NOT EXISTS verification_token_expires DATETIME AFTER verification_token',
      'ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) AFTER verification_token_expires',
      'ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME AFTER reset_token'
    ];

    for (const clause of authColumns) {
      try {
        await executeQuery(`ALTER TABLE users ${clause};`);
      } catch (alterError) {
        if (!alterError.message.includes('Duplicate')) {
          console.log('ℹ️ Columna de autenticación ya existe o se agregó correctamente:', clause);
        }
      }
    }

    // Actualizar usuarios existentes sin rol para que tengan rol de alumno
    const updateUsersWithoutRole = `
      UPDATE users SET role_id = 4 WHERE role_id IS NULL;
    `;
    await executeQuery(updateUsersWithoutRole);
    
  } catch (error) {
    console.error('❌ Error al inicializar las tablas:', error);
    throw error;
  }
};

module.exports = {
  pool,
  executeQuery,
  testConnection,
  initializeTables
};