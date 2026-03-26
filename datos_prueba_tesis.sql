-- =================================================================================
-- Script de Datos Semilla para Presentación de Tesis (Gimnasio Multiespacio)
-- =================================================================================
-- IMPORTANTE: Corre este script DESPUÉS de haber creado usuarios reales en el 
-- sistema (Administrador, Recepcionista y Profesor) desde la interfaz visual 
-- o por otro medio. 
-- El script buscará sus IDs dinámicamente para asociarles las reservas, clases, 
-- asistencias y progresos.

-- 0. IDENTIFICAR LOS USUARIOS REALES DEL STAFF
-- Asignamos variables buscando el primer usuario que coincida con cada rol.
-- (Roles: 1=Admin, 2=Recepcionista, 3=Profesor, 4=Alumno)
SET @admin_id = COALESCE((SELECT id FROM users WHERE role_id = 1 LIMIT 1), 1);
SET @recepc_id = COALESCE((SELECT id FROM users WHERE role_id = 2 LIMIT 1), 2);
SET @profe_id = COALESCE((SELECT id FROM users WHERE role_id = 3 LIMIT 1), 3);

-- La clave para los alumnos es: "123456"
SET @hash_password = '$2b$10$wO3g4v4G3K/Z7zV/3M2kM.i9P.C5x6Q/LzZ1A2q/fB0C2D3E4F5G6'; 

-- =================================================================================
-- 1. CREAR ALUMNOS DE MUESTRA (Role = 4)
-- =================================================================================
INSERT INTO users (name, email, password, phone, role_id, is_active, is_fit, created_at, email_verified) VALUES 
('Lucas Alumno', 'lucas@gmail.com', @hash_password, '1122334455', 4, 1, 1, NOW() - INTERVAL 60 DAY, 1),
('María Alumna', 'maria@hotmail.com', @hash_password, '1122334456', 4, 1, 1, NOW() - INTERVAL 45 DAY, 1),
('Juan Alumno', 'juan@outlook.com', @hash_password, '1122334457', 4, 1, 1, NOW() - INTERVAL 30 DAY, 1),
('Ana Inactiva', 'ana@gmail.com', @hash_password, '1122334458', 4, 0, 0, NOW() - INTERVAL 15 DAY, 1), -- Alumna inactiva / no apta
('Pedro Nuevo', 'pedro@yahoo.com', @hash_password, '1122334459', 4, 1, 1, NOW() - INTERVAL 5 DAY, 1);

-- Capturar los IDs de los alumnos generados
SET @alumno1 = (SELECT id FROM users WHERE email='lucas@gmail.com');
SET @alumno2 = (SELECT id FROM users WHERE email='maria@hotmail.com');
SET @alumno3 = (SELECT id FROM users WHERE email='juan@outlook.com');
SET @alumno4 = (SELECT id FROM users WHERE email='ana@gmail.com');
SET @alumno5 = (SELECT id FROM users WHERE email='pedro@yahoo.com');

-- =================================================================================
-- 2. GENERAR VÍNCULOS DE SUSCRIPCIONES (Planes base: 1=Básico, 2=Premium, 3=VIP)
-- =================================================================================
INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status, created_at) VALUES
(@alumno1, 2, CURRENT_DATE - INTERVAL 60 DAY, CURRENT_DATE - INTERVAL 30 DAY, 'expired', NOW() - INTERVAL 60 DAY),
(@alumno1, 2, CURRENT_DATE - INTERVAL 30 DAY, CURRENT_DATE + INTERVAL 10 DAY, 'active', NOW() - INTERVAL 30 DAY),
(@alumno2, 3, CURRENT_DATE - INTERVAL 45 DAY, CURRENT_DATE - INTERVAL 15 DAY, 'expired', NOW() - INTERVAL 45 DAY),
(@alumno2, 3, CURRENT_DATE - INTERVAL 15 DAY, CURRENT_DATE + INTERVAL 15 DAY, 'active', NOW() - INTERVAL 15 DAY),
(@alumno3, 1, CURRENT_DATE - INTERVAL 30 DAY, CURRENT_DATE - INTERVAL 1 DAY, 'expired', NOW() - INTERVAL 30 DAY), -- Recién vencido
(@alumno4, 1, CURRENT_DATE - INTERVAL 50 DAY, CURRENT_DATE - INTERVAL 20 DAY, 'expired', NOW() - INTERVAL 50 DAY), -- Caso deudora/inactiva
(@alumno5, 2, CURRENT_DATE - INTERVAL 5 DAY, CURRENT_DATE + INTERVAL 25 DAY, 'active', NOW() - INTERVAL 5 DAY);

-- =================================================================================
-- 3. CREAR ACTIVIDADES/CLASES Y ASIGNARLAS AL PROFESOR REAL
-- Espacios base: 1=Cancha, 2=Sala, 3=Eventos, 4/5=A/B, 6=Spinning, 7=Patio
-- =================================================================================
INSERT INTO activities (name, teacher_id, space_id, day_of_week, start_time, end_time, capacity, enrolled_count, status) VALUES
('Funcional Avanzado', @profe_id, 4, 'lunes', '18:00', '19:00', 15, 3, 'active'),
('Yoga Terapéutico', @profe_id, 2, 'martes', '09:00', '10:00', 10, 2, 'active'),
('Spinning Intensivo', @profe_id, 6, 'miercoles', '19:00', '20:00', 25, 2, 'active'),
('CrossFit Init', @profe_id, 7, 'jueves', '15:00', '16:00', 20, 1, 'active'),
('Zumba', @profe_id, 5, 'viernes', '20:00', '21:00', 20, 0, 'cancelled'); -- Una cancelada

SET @act1 = (SELECT MAX(id)-4 FROM activities);
SET @act2 = (SELECT MAX(id)-3 FROM activities);
SET @act3 = (SELECT MAX(id)-2 FROM activities);
SET @act4 = (SELECT MAX(id)-1 FROM activities);

-- =================================================================================
-- 4. INSCRIBIR ALUMNOS A LAS CLASES
-- =================================================================================
INSERT INTO activity_enrollments (activity_id, user_id, status) VALUES
(@act1, @alumno1, 'confirmed'),
(@act1, @alumno2, 'confirmed'),
(@act1, @alumno5, 'confirmed'),
(@act2, @alumno2, 'confirmed'),
(@act2, @alumno3, 'confirmed'),
(@act3, @alumno1, 'confirmed'),
(@act3, @alumno3, 'confirmed'),
(@act4, @alumno5, 'confirmed');

-- =================================================================================
-- 5. HISTORIAL DE PAGOS
-- Recordatorio Conceptos (billing_concepts): 2=Básico, 3=Premium, 4=VIP, 6=Especial
-- =================================================================================
INSERT INTO payments (user_id, amount, concept, billing_concept_id, payment_method, status, payment_date, notes, cash_register_id) VALUES
(@alumno1, 8000, 'mensualidad', 3, 'efectivo', 'completed', NOW() - INTERVAL 60 DAY, '', 1),
(@alumno1, 8000, 'mensualidad', 3, 'transferencia', 'completed', NOW() - INTERVAL 30 DAY, 'Comprobante #1234', 2),
(@alumno2, 12000, 'mensualidad', 4, 'mercadopago', 'completed', NOW() - INTERVAL 45 DAY, '', 3),
(@alumno2, 12000, 'mensualidad', 4, 'tarjeta', 'completed', NOW() - INTERVAL 15 DAY, '', 4),
(@alumno3, 5000, 'mensualidad', 2, 'efectivo', 'completed', NOW() - INTERVAL 30 DAY, '', 5),
(@alumno4, 5000, 'mensualidad', 2, 'transferencia', 'completed', NOW() - INTERVAL 50 DAY, 'No renovó', 6),
(@alumno5, 8000, 'mensualidad', 3, 'efectivo', 'completed', NOW() - INTERVAL 5 DAY, '', 7),
(@alumno2, 2500, 'clase_especial', 6, 'efectivo', 'completed', NOW() - INTERVAL 2 DAY, 'Seminario nutrición', 8);

-- =================================================================================
-- 6. RESERVAS DE ESPACIOS
-- =================================================================================
INSERT INTO reservations (space_id, client_name, client_phone, reservation_date, start_time, end_time, total_amount, status, client_id, created_by) VALUES
(3, 'Club Social Misiones', '1133557799', CURRENT_DATE + INTERVAL 5 DAY, '14:00', '18:00', 18000, 'confirmed', NULL, @recepc_id),
(1, 'Torneo Futsal', '1144668800', CURRENT_DATE + INTERVAL 10 DAY, '09:00', '13:00', 20000, 'pending', NULL, @admin_id),
(2, 'Juan Alumno', '1122334457', CURRENT_DATE + INTERVAL 2 DAY, '18:00', '20:00', 6000, 'confirmed', @alumno3, @recepc_id),
(1, 'Lucas Alumno', '1122334455', CURRENT_DATE - INTERVAL 3 DAY, '15:00', '16:00', 5000, 'confirmed', @alumno1, @recepc_id);

-- =================================================================================
-- 7. ASISTENCIAS A CLASES
-- Simula la acción del profesor tomando lista
-- =================================================================================
INSERT INTO attendance (activity_id, user_id, attendance_date, status, marked_by) VALUES
(@act1, @alumno1, CURRENT_DATE - INTERVAL 7 DAY, 'present', @profe_id),
(@act1, @alumno2, CURRENT_DATE - INTERVAL 7 DAY, 'present', @profe_id),
(@act2, @alumno2, CURRENT_DATE - INTERVAL 6 DAY, 'absent', @profe_id),
(@act3, @alumno1, CURRENT_DATE - INTERVAL 5 DAY, 'present', @profe_id),
(@act4, @alumno5, CURRENT_DATE - INTERVAL 4 DAY, 'present', @profe_id);

-- =================================================================================
-- 8. PROGRESO Y SEGUIMIENTO FÍSICO (Mediciones del Profe)
-- =================================================================================
INSERT INTO user_progress (user_id, teacher_id, date, weight, notes) VALUES
(@alumno1, @profe_id, CURRENT_DATE - INTERVAL 60 DAY, 85.5, 'Inicio de entrenamiento, meta: ganar masa muscular.'),
(@alumno1, @profe_id, CURRENT_DATE - INTERVAL 30 DAY, 86.2, 'Leve aumento, seguir con dieta alta en proteínas.'),
(@alumno2, @profe_id, CURRENT_DATE - INTERVAL 45 DAY, 65.0, 'Evaluación inicial, buena resistencia cardiovascular.'),
(@alumno2, @profe_id, CURRENT_DATE - INTERVAL 15 DAY, 63.5, 'Perdió 1.5kg, manteniendo la masa magra.'),
(@alumno5, @profe_id, CURRENT_DATE - INTERVAL 5 DAY, 90.0, 'Primera clase de funcional, nivel principiante.');

-- =================================================================================
-- 9. CONFIGURACIONES EXTRA (Opcional, demuestra uso de gym_config si no existen)
-- =================================================================================
INSERT IGNORE INTO gym_config (config_key, config_value) VALUES 
('sistema_actividad', 'true'), 
('aforo_maximo', '150');
