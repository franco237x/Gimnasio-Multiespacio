-- =====================================================
-- GIMNASIO MULTIESPACIO - Script de Migración
-- Ejecutar después de las tablas iniciales (users, roles)
-- =====================================================

-- -----------------------------------------------------
-- Tabla: subscription_plans (Planes de Membresía)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT NOT NULL DEFAULT 30,
    features JSON,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar planes por defecto
INSERT IGNORE INTO subscription_plans (id, name, description, price, duration_days, features) VALUES
    (1, 'Básico', 'Acceso a sala de musculación', 5000.00, 30, '["Musculación", "Vestuarios"]'),
    (2, 'Premium', 'Musculación + Clases grupales', 8000.00, 30, '["Musculación", "Clases grupales", "Vestuarios"]'),
    (3, 'VIP', 'Acceso ilimitado + Personal Trainer', 12000.00, 30, '["Musculación", "Clases grupales", "Personal Trainer", "Vestuarios", "Acceso ilimitado"]');

-- -----------------------------------------------------
-- Tabla: user_subscriptions (Suscripciones de Usuarios)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: payments (Pagos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subscription_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    concept ENUM('mensualidad', 'inscripcion', 'clase_especial', 'alquiler', 'otro') NOT NULL DEFAULT 'mensualidad',
    payment_method ENUM('efectivo', 'tarjeta', 'transferencia', 'mercadopago') NOT NULL DEFAULT 'efectivo',
    status ENUM('completed', 'partial', 'pending', 'refunded') DEFAULT 'completed',
    notes TEXT,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: spaces (Espacios/Salones)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS spaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('deportivo', 'multiusos', 'eventos', 'clases', 'aire_libre') NOT NULL,
    capacity INT NOT NULL,
    price_per_hour DECIMAL(10, 2) NOT NULL,
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar espacios por defecto
INSERT IGNORE INTO spaces (id, name, type, capacity, price_per_hour) VALUES
    (1, 'Cancha Principal', 'deportivo', 30, 5000.00),
    (2, 'Sala Principal', 'multiusos', 50, 3000.00),
    (3, 'Salón de Eventos', 'eventos', 100, 4500.00),
    (4, 'Sala A', 'clases', 20, 2000.00),
    (5, 'Sala B', 'clases', 20, 2000.00),
    (6, 'Sala Spinning', 'clases', 25, 2500.00),
    (7, 'Patio Exterior', 'aire_libre', 80, 3500.00);

-- -----------------------------------------------------
-- Tabla: activities (Actividades/Clases)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    teacher_id INT NOT NULL,
    space_id INT NOT NULL,
    day_of_week ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL DEFAULT 20,
    enrolled_count INT NOT NULL DEFAULT 0,
    status ENUM('active', 'full', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: activity_enrollments (Inscripciones a Actividades)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'confirmed',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (activity_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: reservations (Reservas de Espacios)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    space_id INT NOT NULL,
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(20),
    client_email VARCHAR(100),
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    client_id INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE RESTRICT,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: attendance (Asistencia)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') DEFAULT 'present',
    marked_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_attendance (activity_id, user_id, attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: user_progress (Avances y notas de progreso)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    teacher_id INT,
    date DATE NOT NULL,
    weight DECIMAL(5, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: gym_config (Configuración del Gimnasio)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS gym_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuración por defecto
INSERT IGNORE INTO gym_config (config_key, config_value) VALUES
    ('gym_name', 'Fortaleza Multiespacio'),
    ('email', 'info@fortalezagym.com'),
    ('phone', '+54 11 1234-5678'),
    ('address', 'San Martín 2381, Posadas, Misiones'),
    ('opening_time', '06:00'),
    ('closing_time', '23:00'),
    ('currency', 'ARS'),
    ('notifications_email', 'true'),
    ('notifications_sms', 'false'),
    ('payment_reminder', 'true'),
    ('reminder_days', '5');

-- -----------------------------------------------------
-- Índices adicionales para mejor rendimiento
-- Estos índices solo se crean si no existen
-- -----------------------------------------------------
-- Nota: MySQL ignora DROP INDEX IF NOT EXISTS por lo que usamos una estrategia alternativa
-- Los errores de índices duplicados o tablas inexistentes son manejados por database.js
