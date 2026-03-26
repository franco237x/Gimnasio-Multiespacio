const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
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

// Función para ejecutar el script de migración
const runMigration = async () => {
  try {
    const migrationPath = path.join(__dirname, 'migration.sql');

    if (!fs.existsSync(migrationPath)) {
      console.log('ℹ️ No se encontró archivo de migración');
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Remover comentarios de línea completa y comentarios inline
    const cleanSQL = migrationSQL
      .split('\n')
      .map(line => {
        // Remover comentarios que empiezan con --
        const commentIndex = line.indexOf('--');
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join('\n');

    // Separar las declaraciones SQL por punto y coma
    const statements = cleanSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📦 Ejecutando ${statements.length} sentencias de migración...`);

    let successCount = 0;
    for (const statement of statements) {
      try {
        await executeQuery(statement);
        successCount++;
      } catch (err) {
        // Ignorar errores comunes de migración idempotente
        const ignorableErrors = [
          'Duplicate', 'already exists', 'ER_DUP',
          'ER_TABLE_EXISTS_ERROR', 'ER_DUP_KEYNAME'
        ];
        const isIgnorable = ignorableErrors.some(e =>
          err.message?.includes(e) || err.code?.includes(e)
        );

        if (!isIgnorable) {
          console.log(`⚠️ SQL Error: ${err.message.substring(0, 80)}`);
        }
      }
    }

    console.log(`✅ Migración completada (${successCount}/${statements.length} sentencias)`);
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
  }
};;

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
        role_id INT DEFAULT 4,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        medical_notes TEXT,
        is_fit TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createUsersTable);
    console.log('✅ Tabla users creada/verificada correctamente');

    // Crear tabla de tokens de verificación/reset (tabla separada de users)
    const createUserTokensTable = `
      CREATE TABLE IF NOT EXISTS user_tokens (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        user_id       INT NOT NULL,
        token_type    ENUM('email_verification', 'password_reset') NOT NULL,
        token_hash    VARCHAR(64) NOT NULL,
        expires_at    TIMESTAMP NOT NULL,
        used_at       TIMESTAMP NULL DEFAULT NULL,
        is_revoked    TINYINT(1) NOT NULL DEFAULT 0,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uq_token_hash (token_hash),
        INDEX idx_user_type (user_id, token_type),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createUserTokensTable);
    console.log('✅ Tabla user_tokens creada/verificada correctamente');

    // Migración: eliminar columnas de tokens de la tabla users si aún existen
    const tokenColumnsToRemove = [
      'DROP COLUMN IF EXISTS verification_token',
      'DROP COLUMN IF EXISTS verification_token_expires',
      'DROP COLUMN IF EXISTS reset_token',
      'DROP COLUMN IF EXISTS reset_token_expires'
    ];

    for (const clause of tokenColumnsToRemove) {
      try {
        await executeQuery(`ALTER TABLE users ${clause};`);
      } catch (dropError) {
        // Ignorar si la columna ya no existe
        if (!dropError.message.includes("Can't DROP") && !dropError.message.includes('check that column/key exists')) {
          console.log('ℹ️ No se pudo eliminar columna de tokens:', clause);
        }
      }
    }

    // Nota: role_id y la FK ya están definidos en el CREATE TABLE de arriba.
    // No necesitamos ALTER TABLE adicional.

    // Agregar columnas de perfil médico y estado si faltan
    const authColumns = [
      'ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER phone',
      'ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role_id',
      'ADD COLUMN IF NOT EXISTS medical_notes TEXT AFTER is_active',
      'ADD COLUMN IF NOT EXISTS is_fit TINYINT(1) NOT NULL DEFAULT 1 AFTER medical_notes'
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

    // Asegurar que reservations tenga client_id (se ignora el error de duplicidad si ya existe)
    try {
      await executeQuery(`ALTER TABLE reservations ADD COLUMN client_id INT NULL AFTER notes, ADD FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL;`);
      console.log('✅ Columna client_id anadida a reservations');
    } catch (e) {
      if (!e.message.includes('Duplicate') && !e.message.includes('Can\'t create table') && !e.message.includes('Base table or view not found')) {
        console.log('ℹ️ Omitiendo alter table de reservations (probablemente ya existe o tabla no creada aún)');
      }
    }

    // Agregar activity_id a payments para vincular pagos con inscripciones en actividades
    try {
      await executeQuery(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS activity_id INT NULL;`);
      console.log('✅ Columna activity_id asegurada en payments');
    } catch (e) {
      if (!e.message.includes('Duplicate') && !e.message.includes("Can't create table")) {
        console.log('ℹ️ Omitiendo alter de activity_id en payments');
      }
    }

    // Crear tabla de consultas de contacto web
    const createContactInquiriesTable = `
      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await executeQuery(createContactInquiriesTable);
    console.log('✅ Tabla contact_inquiries creada/verificada correctamente');

    // Ejecutar migración para tablas adicionales
    await runMigration();

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