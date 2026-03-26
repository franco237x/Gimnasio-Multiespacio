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
    day_of_week VARCHAR(100) NOT NULL,
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
    payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    payment_amount DECIMAL(10, 2) DEFAULT 0.00,
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

-- =====================================================
-- Tabla: billing_concepts
-- Catálogo ÚNICO de conceptos/ítems cobrables.
-- Centraliza: planes de suscripción, actividades/clases,
-- alquileres de espacios, y conceptos generales.
-- Se conecta a payments a través de billing_concept_id.
-- Cada fila puede referenciar opcionalmente su origen:
--   • subscription_plan_id → subscription_plans
--   • activity_id          → activities
--   • space_id             → spaces
-- =====================================================
CREATE TABLE IF NOT EXISTS billing_concepts (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    name                 VARCHAR(120) NOT NULL,
    category             ENUM(
                             'mensualidad',
                             'inscripcion',
                             'clase_especial',
                             'alquiler',
                             'otro'
                         ) NOT NULL DEFAULT 'otro',
    description          VARCHAR(255),
    icon                 VARCHAR(60)          DEFAULT 'bx-receipt',
    color                VARCHAR(25)          DEFAULT '#6366f1',
    default_amount       DECIMAL(10, 2)       NULL,
    is_subscription      TINYINT(1)           DEFAULT 0,
    subscription_plan_id INT                  NULL,
    activity_id          INT                  NULL,
    space_id             INT                  NULL,
    is_active            TINYINT(1)           DEFAULT 1,
    sort_order           INT                  DEFAULT 99,
    created_at           TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP            DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_plan_id)
        REFERENCES subscription_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (activity_id)
        REFERENCES activities(id)         ON DELETE SET NULL,
    FOREIGN KEY (space_id)
        REFERENCES spaces(id)             ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conceptos base que siempre deben existir
INSERT IGNORE INTO billing_concepts
    (id, name, category, description, icon, color,
     default_amount, is_subscription, subscription_plan_id,
     activity_id, space_id, sort_order)
VALUES
    (1,  'Mensualidad General',   'mensualidad',   'Cuota mensual sin plan específico',             'bx-calendar-check', '#10b981', NULL,     1, NULL, NULL, NULL, 1),
    (2,  'Mensualidad - Básico',  'mensualidad',   'Cuota mensual Plan Básico (musculación)',        'bx-calendar-check', '#10b981', 5000.00,  1, 1,    NULL, NULL, 2),
    (3,  'Mensualidad - Premium', 'mensualidad',   'Cuota mensual Plan Premium',                    'bx-star',           '#8b5cf6', 8000.00,  1, 2,    NULL, NULL, 3),
    (4,  'Mensualidad - VIP',     'mensualidad',   'Cuota mensual Plan VIP (acceso ilimitado)',      'bx-crown',          '#f59e0b', 12000.00, 1, 3,    NULL, NULL, 4),
    (5,  'Inscripción a Clase',   'inscripcion',   'Inscripción y confirmación a una actividad',    'bx-user-plus',      '#3b82f6', NULL,     0, NULL, NULL, NULL, 5),
    (6,  'Clase Especial',        'clase_especial','Clase particular o fuera de horario regular',   'bx-dumbbell',       '#ef4444', NULL,     0, NULL, NULL, NULL, 6),
    (7,  'Alquiler de Espacio',   'alquiler',      'Alquiler de cancha, sala o espacio del complejo','bx-building',      '#06b6d4', NULL,     0, NULL, NULL, NULL, 7),
    (8,  'Otro / Varios',         'otro',          'Concepto no categorizado',                      'bx-dots-horizontal','#6b7280', NULL,     0, NULL, NULL, NULL, 8);

-- =====================================================
-- Agregar billing_concept_id a payments
-- Columna opcional: mantiene compatibilidad con registros
-- anteriores (concept legacy queda intacto).
-- =====================================================
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS billing_concept_id INT NULL AFTER concept;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS batch_id VARCHAR(36) NULL AFTER id;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS client_name_guest VARCHAR(150) NULL AFTER user_id;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS cash_register_id INT NULL AFTER notes;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS activity_id INT NULL AFTER cash_register_id;

-- Índices adicionales para mejor rendimiento
-- Los errores de índices duplicados o tablas inexistentes son manejados por database.js

-- =====================================================
-- Tabla: contact_inquiries
-- Consultas recibidas desde la landing page
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
