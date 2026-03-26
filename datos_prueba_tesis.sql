-- =================================================================================
-- Script de Datos Completos para Presentación de Tesis (Gimnasio Multiespacio)
-- =================================================================================
-- IMPORTANTE: Corre este script DESPUÉS de haber creado al menos un usuario
-- Administrador desde la interfaz visual. El script creará los demás roles
-- (Recepcionista, Profesor) y 12 alumnos automáticamente.
--
-- Contraseña de TODOS los usuarios creados aquí: 123456
-- Fecha de referencia: se usa CURRENT_DATE para que las fechas sean relativas.
-- =================================================================================

-- 0. IDENTIFICAR AL ADMINISTRADOR EXISTENTE
SET @admin_id = COALESCE((SELECT id FROM users WHERE role_id = 1 LIMIT 1), 1);

-- Hash bcrypt de "123456"
SET @hash_password = '$2b$10$PUfa2oz/TwolTAStjBUCkea/7UOmwXQfs..RhJ553HKA.vW3nH.pK';

-- =================================================================================
-- 1. CREAR STAFF: RECEPCIONISTA + 2 PROFESORES
-- =================================================================================
INSERT INTO users (name, email, password, phone, role_id, is_active, is_fit, created_at, email_verified) VALUES
('Sofía Recepción', 'sofia.recepcion@fortaleza.com', @hash_password, '3764401000', 2, 1, 1, NOW() - INTERVAL 90 DAY, 1),
('Carlos Entrenador', 'carlos.profe@fortaleza.com', @hash_password, '3764402000', 3, 1, 1, NOW() - INTERVAL 90 DAY, 1),
('Laura Profesora', 'laura.profe@fortaleza.com', @hash_password, '3764403000', 3, 1, 1, NOW() - INTERVAL 60 DAY, 1);

SET @recepc_id  = (SELECT id FROM users WHERE email='sofia.recepcion@fortaleza.com');
SET @profe1_id  = (SELECT id FROM users WHERE email='carlos.profe@fortaleza.com');
SET @profe2_id  = (SELECT id FROM users WHERE email='laura.profe@fortaleza.com');

-- =================================================================================
-- 2. CREAR 12 ALUMNOS (Role = 4)
-- =================================================================================
INSERT INTO users (name, email, password, phone, role_id, is_active, is_fit, created_at, email_verified) VALUES
('Lucas Rodríguez',     'lucas.rodriguez@gmail.com',   @hash_password, '3764110001', 4, 1, 1, NOW() - INTERVAL 90 DAY, 1),
('María López',         'maria.lopez@hotmail.com',     @hash_password, '3764110002', 4, 1, 1, NOW() - INTERVAL 80 DAY, 1),
('Juan Pérez',          'juan.perez@outlook.com',      @hash_password, '3764110003', 4, 1, 1, NOW() - INTERVAL 70 DAY, 1),
('Ana Torres',          'ana.torres@gmail.com',        @hash_password, '3764110004', 4, 0, 0, NOW() - INTERVAL 65 DAY, 1),
('Pedro Ramírez',       'pedro.ramirez@yahoo.com',     @hash_password, '3764110005', 4, 1, 1, NOW() - INTERVAL 60 DAY, 1),
('Camila Fernández',    'camila.fernandez@gmail.com',  @hash_password, '3764110006', 4, 1, 1, NOW() - INTERVAL 55 DAY, 1),
('Martín García',       'martin.garcia@hotmail.com',   @hash_password, '3764110007', 4, 1, 1, NOW() - INTERVAL 50 DAY, 1),
('Valentina Díaz',      'valentina.diaz@gmail.com',    @hash_password, '3764110008', 4, 1, 1, NOW() - INTERVAL 45 DAY, 1),
('Santiago Morales',    'santiago.morales@outlook.com', @hash_password, '3764110009', 4, 1, 1, NOW() - INTERVAL 35 DAY, 1),
('Florencia Ruiz',      'florencia.ruiz@gmail.com',    @hash_password, '3764110010', 4, 1, 1, NOW() - INTERVAL 25 DAY, 1),
('Tomás Herrera',       'tomas.herrera@yahoo.com',     @hash_password, '3764110011', 4, 1, 1, NOW() - INTERVAL 15 DAY, 1),
('Luciana Castro',      'luciana.castro@gmail.com',    @hash_password, '3764110012', 4, 1, 1, NOW() - INTERVAL 7 DAY, 1);

-- Capturar IDs
SET @a1  = (SELECT id FROM users WHERE email='lucas.rodriguez@gmail.com');
SET @a2  = (SELECT id FROM users WHERE email='maria.lopez@hotmail.com');
SET @a3  = (SELECT id FROM users WHERE email='juan.perez@outlook.com');
SET @a4  = (SELECT id FROM users WHERE email='ana.torres@gmail.com');
SET @a5  = (SELECT id FROM users WHERE email='pedro.ramirez@yahoo.com');
SET @a6  = (SELECT id FROM users WHERE email='camila.fernandez@gmail.com');
SET @a7  = (SELECT id FROM users WHERE email='martin.garcia@hotmail.com');
SET @a8  = (SELECT id FROM users WHERE email='valentina.diaz@gmail.com');
SET @a9  = (SELECT id FROM users WHERE email='santiago.morales@outlook.com');
SET @a10 = (SELECT id FROM users WHERE email='florencia.ruiz@gmail.com');
SET @a11 = (SELECT id FROM users WHERE email='tomas.herrera@yahoo.com');
SET @a12 = (SELECT id FROM users WHERE email='luciana.castro@gmail.com');

-- =================================================================================
-- 3. SUSCRIPCIONES (Planes: 1=Básico $5000, 2=Premium $8000, 3=VIP $12000)
-- =================================================================================
INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status, created_at) VALUES
-- Lucas: tuvo Básico, ahora Premium activo
(@a1, 1, CURRENT_DATE - INTERVAL 90 DAY, CURRENT_DATE - INTERVAL 60 DAY, 'expired',  NOW() - INTERVAL 90 DAY),
(@a1, 2, CURRENT_DATE - INTERVAL 30 DAY, CURRENT_DATE + INTERVAL 1 DAY,  'active',   NOW() - INTERVAL 30 DAY),
-- María: VIP activo
(@a2, 3, CURRENT_DATE - INTERVAL 80 DAY, CURRENT_DATE - INTERVAL 50 DAY, 'expired',  NOW() - INTERVAL 80 DAY),
(@a2, 3, CURRENT_DATE - INTERVAL 20 DAY, CURRENT_DATE + INTERVAL 10 DAY, 'active',   NOW() - INTERVAL 20 DAY),
-- Juan: Básico vencido (no renovó)
(@a3, 1, CURRENT_DATE - INTERVAL 70 DAY, CURRENT_DATE - INTERVAL 40 DAY, 'expired',  NOW() - INTERVAL 70 DAY),
-- Ana: Básico cancelado (inactiva)
(@a4, 1, CURRENT_DATE - INTERVAL 65 DAY, CURRENT_DATE - INTERVAL 35 DAY, 'cancelled', NOW() - INTERVAL 65 DAY),
-- Pedro: Premium activo
(@a5, 2, CURRENT_DATE - INTERVAL 30 DAY, CURRENT_DATE + INTERVAL 1 DAY,  'active',   NOW() - INTERVAL 30 DAY),
-- Camila: VIP activo
(@a6, 3, CURRENT_DATE - INTERVAL 25 DAY, CURRENT_DATE + INTERVAL 5 DAY,  'active',   NOW() - INTERVAL 25 DAY),
-- Martín: Premium vencido, luego renovó
(@a7, 2, CURRENT_DATE - INTERVAL 50 DAY, CURRENT_DATE - INTERVAL 20 DAY, 'expired',  NOW() - INTERVAL 50 DAY),
(@a7, 2, CURRENT_DATE - INTERVAL 20 DAY, CURRENT_DATE + INTERVAL 10 DAY, 'active',   NOW() - INTERVAL 20 DAY),
-- Valentina: Básico activo
(@a8, 1, CURRENT_DATE - INTERVAL 20 DAY, CURRENT_DATE + INTERVAL 10 DAY, 'active',   NOW() - INTERVAL 20 DAY),
-- Santiago: Premium activo
(@a9, 2, CURRENT_DATE - INTERVAL 15 DAY, CURRENT_DATE + INTERVAL 15 DAY, 'active',   NOW() - INTERVAL 15 DAY),
-- Florencia: VIP activo
(@a10, 3, CURRENT_DATE - INTERVAL 10 DAY, CURRENT_DATE + INTERVAL 20 DAY, 'active',  NOW() - INTERVAL 10 DAY),
-- Tomás: Básico activo (reciente)
(@a11, 1, CURRENT_DATE - INTERVAL 8 DAY,  CURRENT_DATE + INTERVAL 22 DAY, 'active',  NOW() - INTERVAL 8 DAY),
-- Luciana: Premium pendiente (recién inscrita)
(@a12, 2, CURRENT_DATE - INTERVAL 2 DAY,  CURRENT_DATE + INTERVAL 28 DAY, 'active',  NOW() - INTERVAL 2 DAY);

-- =================================================================================
-- 4. ACTIVIDADES / CLASES (Distribuidas entre ambos profesores)
-- Espacios: 1=Cancha, 2=Sala Principal, 3=Salón Eventos, 4=Sala A, 5=Sala B,
--           6=Sala Spinning, 7=Patio Exterior
-- =================================================================================
INSERT INTO activities (name, teacher_id, space_id, day_of_week, start_time, end_time, capacity, enrolled_count, status) VALUES
('Funcional Avanzado',    @profe1_id, 4, 'lunes',     '18:00', '19:00', 15, 7, 'active'),
('Yoga Terapéutico',      @profe2_id, 2, 'martes',    '09:00', '10:00', 12, 7, 'active'),
('Spinning Intensivo',    @profe1_id, 6, 'miercoles', '19:00', '20:00', 25, 4, 'active'),
('CrossFit Principiante', @profe1_id, 7, 'jueves',    '15:00', '16:00', 20, 5, 'active'),
('Zumba Fitness',         @profe2_id, 5, 'viernes',   '20:00', '21:00', 20, 7, 'active'),
('Pilates Matutino',      @profe2_id, 4, 'lunes',     '08:00', '09:00', 12, 3, 'active'),
('Boxeo Recreativo',      @profe1_id, 7, 'miercoles', '17:00', '18:00', 15, 5, 'active'),
('Stretching',            @profe2_id, 2, 'viernes',   '10:00', '11:00', 15, 5, 'active');

SET @act1 = (SELECT id FROM activities WHERE name='Funcional Avanzado'    AND teacher_id=@profe1_id LIMIT 1);
SET @act2 = (SELECT id FROM activities WHERE name='Yoga Terapéutico'      AND teacher_id=@profe2_id LIMIT 1);
SET @act3 = (SELECT id FROM activities WHERE name='Spinning Intensivo'    AND teacher_id=@profe1_id LIMIT 1);
SET @act4 = (SELECT id FROM activities WHERE name='CrossFit Principiante' AND teacher_id=@profe1_id LIMIT 1);
SET @act5 = (SELECT id FROM activities WHERE name='Zumba Fitness'         AND teacher_id=@profe2_id LIMIT 1);
SET @act6 = (SELECT id FROM activities WHERE name='Pilates Matutino'      AND teacher_id=@profe2_id LIMIT 1);
SET @act7 = (SELECT id FROM activities WHERE name='Boxeo Recreativo'      AND teacher_id=@profe1_id LIMIT 1);
SET @act8 = (SELECT id FROM activities WHERE name='Stretching'            AND teacher_id=@profe2_id LIMIT 1);

-- =================================================================================
-- 5. INSCRIPCIONES A CLASES (enrolled_count debe coincidir con los INSERT)
-- =================================================================================
INSERT INTO activity_enrollments (activity_id, user_id, status) VALUES
-- Funcional Avanzado - Profe1 (7 inscriptos)
(@act1, @a1,  'confirmed'),
(@act1, @a2,  'confirmed'),
(@act1, @a5,  'confirmed'),
(@act1, @a7,  'confirmed'),
(@act1, @a9,  'confirmed'),
(@act1, @a8,  'confirmed'),   -- Valentina (antes solo Profe2)
(@act1, @a10, 'confirmed'),  -- Florencia (antes solo Profe2)
-- Yoga Terapéutico - Profe2 (7 inscriptos)
(@act2, @a2,  'confirmed'),
(@act2, @a6,  'confirmed'),
(@act2, @a8,  'confirmed'),
(@act2, @a10, 'confirmed'),
(@act2, @a1,  'confirmed'),   -- Lucas (antes solo Profe1)
(@act2, @a5,  'confirmed'),   -- Pedro (antes solo Profe1)
(@act2, @a3,  'confirmed'),   -- Juan (antes solo Profe1)
-- Spinning Intensivo - Profe1 (4 inscriptos)
(@act3, @a1,  'confirmed'),
(@act3, @a3,  'confirmed'),
(@act3, @a5,  'confirmed'),
(@act3, @a7,  'confirmed'),
-- CrossFit Principiante - Profe1 (5 inscriptos)
(@act4, @a9,  'confirmed'),
(@act4, @a11, 'confirmed'),
(@act4, @a12, 'confirmed'),
(@act4, @a8,  'confirmed'),   -- Valentina (antes solo Profe2)
(@act4, @a10, 'confirmed'),  -- Florencia (antes solo Profe2)
-- Zumba Fitness - Profe2 (7 inscriptos)
(@act5, @a6,  'confirmed'),
(@act5, @a8,  'confirmed'),
(@act5, @a10, 'confirmed'),
(@act5, @a12, 'confirmed'),
(@act5, @a7,  'confirmed'),   -- Martín (antes solo Profe1)
(@act5, @a9,  'confirmed'),   -- Santiago (antes solo Profe1)
(@act5, @a11, 'confirmed'),  -- Tomás (antes solo Profe1)
-- Pilates Matutino - Profe2 (3 inscriptos)
(@act6, @a2,  'confirmed'),
(@act6, @a6,  'confirmed'),
(@act6, @a10, 'confirmed'),
-- Boxeo Recreativo - Profe1 (5 inscriptos)
(@act7, @a1,  'confirmed'),
(@act7, @a7,  'confirmed'),
(@act7, @a11, 'confirmed'),
(@act7, @a8,  'confirmed'),   -- Valentina (antes solo Profe2)
(@act7, @a10, 'confirmed'),  -- Florencia (antes solo Profe2)
-- Stretching - Profe2 (5 inscriptos)
(@act8, @a8,  'confirmed'),
(@act8, @a10, 'confirmed'),
(@act8, @a1,  'confirmed'),   -- Lucas (antes solo Profe1)
(@act8, @a7,  'confirmed'),   -- Martín (antes solo Profe1)
(@act8, @a11, 'confirmed');   -- Tomás (antes solo Profe1)

-- =================================================================================
-- 6. CAJAS REGISTRADORAS (cash_registers)
-- Simulamos cajas abiertas y cerradas en los últimos días
-- =================================================================================
INSERT INTO cash_registers (opened_by, opening_time, opening_balance, closed_by, closing_time, closing_balance, counted_balance, discrepancy, notes, status) VALUES
(@recepc_id, NOW() - INTERVAL 30 DAY + INTERVAL 8 HOUR, 5000.00, @recepc_id, NOW() - INTERVAL 30 DAY + INTERVAL 14 HOUR, 46000.00, 46000.00, 0.00, 'Turno mañana - día de cobro mensualidades', 'closed'),
(@admin_id,  NOW() - INTERVAL 22 DAY + INTERVAL 8 HOUR, 3000.00, @admin_id,  NOW() - INTERVAL 22 DAY + INTERVAL 14 HOUR, 27000.00, 26800.00, -200.00, 'Diferencia menor en monedas', 'closed'),
(@recepc_id, NOW() - INTERVAL 15 DAY + INTERVAL 8 HOUR, 5000.00, @recepc_id, NOW() - INTERVAL 15 DAY + INTERVAL 14 HOUR, 30000.00, 30000.00, 0.00, 'Turno completo sin diferencias', 'closed'),
(@recepc_id, NOW() - INTERVAL 8 DAY  + INTERVAL 8 HOUR, 4000.00, @recepc_id, NOW() - INTERVAL 8 DAY  + INTERVAL 14 HOUR, 21000.00, 21000.00, 0.00, 'Turno normal', 'closed'),
(@recepc_id, NOW() - INTERVAL 5 DAY  + INTERVAL 8 HOUR, 5000.00, @recepc_id, NOW() - INTERVAL 5 DAY  + INTERVAL 14 HOUR, 25000.00, 25200.00, 200.00, 'Sobrante a favor', 'closed'),
(@recepc_id, NOW() - INTERVAL 2 DAY  + INTERVAL 8 HOUR, 5000.00, @recepc_id, NOW() - INTERVAL 2 DAY  + INTERVAL 14 HOUR, 13000.00, 13000.00, 0.00, 'Día tranquilo', 'closed');

-- Obtener IDs de las cajas para asociarlas a los pagos
SET @caja1 = (SELECT MIN(id) FROM cash_registers WHERE opened_by = @recepc_id OR opened_by = @admin_id ORDER BY opening_time ASC);
SET @caja2 = @caja1 + 1;
SET @caja3 = @caja1 + 2;
SET @caja4 = @caja1 + 3;
SET @caja5 = @caja1 + 4;
SET @caja6 = @caja1 + 5;

-- =================================================================================
-- 7. PAGOS COMPLETOS
-- billing_concept_id: 1=Mens.General, 2=Básico, 3=Premium, 4=VIP,
--                     5=Inscripción, 6=Clase Especial, 7=Alquiler, 8=Otro
-- =================================================================================
INSERT INTO payments (user_id, amount, concept, billing_concept_id, payment_method, status, payment_date, notes, cash_register_id, activity_id) VALUES
-- === MENSUALIDADES (diferentes planes y métodos) ===
-- Lucas: pagó Básico hace 90 días, luego Premium hace 30 días
(@a1, 5000.00,  'mensualidad', 2, 'efectivo',      'completed', NOW() - INTERVAL 90 DAY, '',                          @caja1, NULL),
(@a1, 8000.00,  'mensualidad', 3, 'transferencia', 'completed', NOW() - INTERVAL 30 DAY, 'Comprobante #TRF-1234',     @caja1, NULL),
-- María: VIP 2 veces
(@a2, 12000.00, 'mensualidad', 4, 'mercadopago',   'completed', NOW() - INTERVAL 80 DAY, '',                          @caja1, NULL),
(@a2, 12000.00, 'mensualidad', 4, 'tarjeta',       'completed', NOW() - INTERVAL 20 DAY, 'Visa débito',               @caja3, NULL),
-- Juan: Básico (ya venció)
(@a3, 5000.00,  'mensualidad', 2, 'efectivo',      'completed', NOW() - INTERVAL 70 DAY, '',                          @caja1, NULL),
-- Ana: Básico (canceló)
(@a4, 5000.00,  'mensualidad', 2, 'transferencia', 'completed', NOW() - INTERVAL 65 DAY, 'No renovará',               @caja1, NULL),
-- Pedro: Premium
(@a5, 8000.00,  'mensualidad', 3, 'efectivo',      'completed', NOW() - INTERVAL 30 DAY, '',                          @caja1, NULL),
-- Camila: VIP
(@a6, 12000.00, 'mensualidad', 4, 'mercadopago',   'completed', NOW() - INTERVAL 25 DAY, 'MP Link de pago',           @caja2, NULL),
-- Martín: Premium 2 veces
(@a7, 8000.00,  'mensualidad', 3, 'efectivo',      'completed', NOW() - INTERVAL 50 DAY, '',                          @caja1, NULL),
(@a7, 8000.00,  'mensualidad', 3, 'transferencia', 'completed', NOW() - INTERVAL 20 DAY, 'Renovación',                @caja3, NULL),
-- Valentina: Básico
(@a8, 5000.00,  'mensualidad', 2, 'efectivo',      'completed', NOW() - INTERVAL 20 DAY, '',                          @caja3, NULL),
-- Santiago: Premium
(@a9, 8000.00,  'mensualidad', 3, 'tarjeta',       'completed', NOW() - INTERVAL 15 DAY, 'Mastercard crédito',        @caja3, NULL),
-- Florencia: VIP
(@a10, 12000.00,'mensualidad', 4, 'efectivo',      'completed', NOW() - INTERVAL 10 DAY, '',                          @caja4, NULL),
-- Tomás: Básico
(@a11, 5000.00, 'mensualidad', 2, 'efectivo',      'completed', NOW() - INTERVAL 8 DAY,  '',                          @caja4, NULL),
-- Luciana: Premium
(@a12, 8000.00, 'mensualidad', 3, 'mercadopago',   'completed', NOW() - INTERVAL 2 DAY,  'Pago desde app MP',         @caja6, NULL),

-- === INSCRIPCIONES A CLASES ===
(@a1, 0.00,    'inscripcion', 5, 'efectivo',      'completed', NOW() - INTERVAL 28 DAY, 'Inscripción Funcional',      @caja1, @act1),
(@a2, 0.00,    'inscripcion', 5, 'efectivo',      'completed', NOW() - INTERVAL 18 DAY, 'Inscripción Yoga',           @caja3, @act2),
(@a5, 0.00,    'inscripcion', 5, 'efectivo',      'completed', NOW() - INTERVAL 28 DAY, 'Inscripción Spinning',       @caja1, @act3),
(@a6, 0.00,    'inscripcion', 5, 'efectivo',      'completed', NOW() - INTERVAL 22 DAY, 'Inscripción Zumba',          @caja2, @act5),
(@a9, 0.00,    'inscripcion', 5, 'efectivo',      'completed', NOW() - INTERVAL 14 DAY, 'Inscripción CrossFit',       @caja3, @act4),
(@a11, 0.00,   'inscripcion', 5, 'efectivo',      'completed', NOW() - INTERVAL 7 DAY,  'Inscripción Boxeo',          @caja4, @act7),
(@a12, 0.00,   'inscripcion', 5, 'efectivo',      'completed', NOW() - INTERVAL 2 DAY,  'Inscripción CrossFit',       @caja6, @act4),

-- === CLASES ESPECIALES ===
(@a2, 3500.00, 'clase_especial', 6, 'efectivo',    'completed', NOW() - INTERVAL 10 DAY, 'Sesión nutrición deportiva', @caja4, NULL),
(@a6, 4000.00, 'clase_especial', 6, 'transferencia','completed', NOW() - INTERVAL 5 DAY, 'Clase de defensa personal',  @caja5, NULL),
(@a10, 3500.00,'clase_especial', 6, 'mercadopago', 'completed', NOW() - INTERVAL 3 DAY,  'Taller de meditación',       @caja5, NULL),

-- === PAGOS POR ALQUILER ===
(@a3, 5000.00, 'alquiler', 7, 'efectivo',      'completed', NOW() - INTERVAL 12 DAY, 'Alquiler cancha futsal',  @caja4, NULL),
(@a1, 6000.00, 'alquiler', 7, 'transferencia', 'completed', NOW() - INTERVAL 5 DAY,  'Alquiler sala evento',    @caja5, NULL),

-- === OTROS ===
(@a7, 1500.00, 'otro', 8, 'efectivo', 'completed', NOW() - INTERVAL 3 DAY, 'Compra de suplemento proteína', @caja5, NULL);

-- =================================================================================
-- 8. RESERVAS DE ESPACIOS
-- Mezcla de clientes externos (sin user) y alumnos registrados
-- =================================================================================
INSERT INTO reservations (space_id, client_name, client_phone, reservation_date, start_time, end_time, total_amount, status, client_id, created_by) VALUES
-- Reservas FUTURAS (confirmadas y pendientes)
(3, 'Club Social Misiones',   '3764551234', CURRENT_DATE + INTERVAL 5 DAY,  '14:00', '18:00', 18000.00, 'confirmed', NULL,  @recepc_id),
(1, 'Liga Futsal Posadas',    '3764668800', CURRENT_DATE + INTERVAL 10 DAY, '09:00', '13:00', 20000.00, 'pending',   NULL,  @admin_id),
(2, 'Juan Pérez',             '3764110003', CURRENT_DATE + INTERVAL 3 DAY,  '18:00', '20:00', 6000.00,  'confirmed', @a3,   @recepc_id),
(1, 'Lucas Rodríguez',        '3764110001', CURRENT_DATE + INTERVAL 7 DAY,  '15:00', '17:00', 10000.00, 'confirmed', @a1,   @recepc_id),
(5, 'Evento Corporativo S.A.','3764777888', CURRENT_DATE + INTERVAL 12 DAY, '10:00', '14:00', 8000.00,  'pending',   NULL,  @admin_id),
(7, 'Camila Fernández',       '3764110006', CURRENT_DATE + INTERVAL 4 DAY,  '09:00', '10:00', 3500.00,  'confirmed', @a6,   @recepc_id),
-- Reservas PASADAS (completadas)
(1, 'Lucas Rodríguez',        '3764110001', CURRENT_DATE - INTERVAL 5 DAY,  '15:00', '16:00', 5000.00,  'confirmed', @a1,   @recepc_id),
(3, 'Fiesta Cumpleaños Díaz', '3764999111', CURRENT_DATE - INTERVAL 10 DAY, '16:00', '22:00', 27000.00, 'confirmed', NULL,  @recepc_id),
(2, 'Taller de Primeros Aux.','3764333444', CURRENT_DATE - INTERVAL 15 DAY, '08:00', '12:00', 12000.00, 'confirmed', NULL,  @admin_id),
-- Reserva cancelada
(1, 'Torneo Cancelado',       '3764000111', CURRENT_DATE + INTERVAL 20 DAY, '09:00', '17:00', 40000.00, 'cancelled', NULL, @admin_id);

-- =================================================================================
-- 9. ASISTENCIAS (Profesor toma lista — varios días de historial)
-- =================================================================================
INSERT INTO attendance (activity_id, user_id, attendance_date, status, marked_by) VALUES
-- Funcional Avanzado - Lunes hace 3 semanas
(@act1, @a1,  CURRENT_DATE - INTERVAL 21 DAY, 'present', @profe1_id),
(@act1, @a2,  CURRENT_DATE - INTERVAL 21 DAY, 'present', @profe1_id),
(@act1, @a5,  CURRENT_DATE - INTERVAL 21 DAY, 'absent',  @profe1_id),
(@act1, @a7,  CURRENT_DATE - INTERVAL 21 DAY, 'present', @profe1_id),
(@act1, @a9,  CURRENT_DATE - INTERVAL 21 DAY, 'late',    @profe1_id),
-- Funcional Avanzado - Lunes hace 2 semanas
(@act1, @a1,  CURRENT_DATE - INTERVAL 14 DAY, 'present', @profe1_id),
(@act1, @a2,  CURRENT_DATE - INTERVAL 14 DAY, 'present', @profe1_id),
(@act1, @a5,  CURRENT_DATE - INTERVAL 14 DAY, 'present', @profe1_id),
(@act1, @a7,  CURRENT_DATE - INTERVAL 14 DAY, 'absent',  @profe1_id),
(@act1, @a9,  CURRENT_DATE - INTERVAL 14 DAY, 'present', @profe1_id),
-- Funcional Avanzado - Lunes semana pasada
(@act1, @a1,  CURRENT_DATE - INTERVAL 7 DAY,  'present', @profe1_id),
(@act1, @a2,  CURRENT_DATE - INTERVAL 7 DAY,  'late',    @profe1_id),
(@act1, @a5,  CURRENT_DATE - INTERVAL 7 DAY,  'present', @profe1_id),
(@act1, @a7,  CURRENT_DATE - INTERVAL 7 DAY,  'present', @profe1_id),
(@act1, @a9,  CURRENT_DATE - INTERVAL 7 DAY,  'present', @profe1_id),
-- Yoga Terapéutico - Martes hace 2 semanas
(@act2, @a2,  CURRENT_DATE - INTERVAL 13 DAY, 'present', @profe2_id),
(@act2, @a6,  CURRENT_DATE - INTERVAL 13 DAY, 'present', @profe2_id),
(@act2, @a8,  CURRENT_DATE - INTERVAL 13 DAY, 'absent',  @profe2_id),
(@act2, @a10, CURRENT_DATE - INTERVAL 13 DAY, 'present', @profe2_id),
(@act2, @a1,  CURRENT_DATE - INTERVAL 13 DAY, 'present', @profe2_id),
(@act2, @a5,  CURRENT_DATE - INTERVAL 13 DAY, 'late',    @profe2_id),
(@act2, @a3,  CURRENT_DATE - INTERVAL 13 DAY, 'present', @profe2_id),
-- Yoga Terapéutico - Martes semana pasada
(@act2, @a2,  CURRENT_DATE - INTERVAL 6 DAY,  'present', @profe2_id),
(@act2, @a6,  CURRENT_DATE - INTERVAL 6 DAY,  'present', @profe2_id),
(@act2, @a8,  CURRENT_DATE - INTERVAL 6 DAY,  'present', @profe2_id),
(@act2, @a10, CURRENT_DATE - INTERVAL 6 DAY,  'late',    @profe2_id),
(@act2, @a1,  CURRENT_DATE - INTERVAL 6 DAY,  'present', @profe2_id),
(@act2, @a5,  CURRENT_DATE - INTERVAL 6 DAY,  'present', @profe2_id),
(@act2, @a3,  CURRENT_DATE - INTERVAL 6 DAY,  'absent',  @profe2_id),
-- Spinning Intensivo - Miércoles hace 2 semanas
(@act3, @a1,  CURRENT_DATE - INTERVAL 12 DAY, 'present', @profe1_id),
(@act3, @a3,  CURRENT_DATE - INTERVAL 12 DAY, 'present', @profe1_id),
(@act3, @a5,  CURRENT_DATE - INTERVAL 12 DAY, 'absent',  @profe1_id),
(@act3, @a7,  CURRENT_DATE - INTERVAL 12 DAY, 'present', @profe1_id),
-- Spinning Intensivo - Miércoles semana pasada
(@act3, @a1,  CURRENT_DATE - INTERVAL 5 DAY,  'present', @profe1_id),
(@act3, @a3,  CURRENT_DATE - INTERVAL 5 DAY,  'absent',  @profe1_id),
(@act3, @a5,  CURRENT_DATE - INTERVAL 5 DAY,  'present', @profe1_id),
(@act3, @a7,  CURRENT_DATE - INTERVAL 5 DAY,  'present', @profe1_id),
-- CrossFit Principiante - Jueves semana pasada
(@act4, @a9,  CURRENT_DATE - INTERVAL 4 DAY,  'present', @profe1_id),
(@act4, @a11, CURRENT_DATE - INTERVAL 4 DAY,  'present', @profe1_id),
(@act4, @a12, CURRENT_DATE - INTERVAL 4 DAY,  'late',    @profe1_id),
(@act4, @a8,  CURRENT_DATE - INTERVAL 4 DAY,  'present', @profe1_id),
(@act4, @a10, CURRENT_DATE - INTERVAL 4 DAY,  'absent',  @profe1_id),
-- Zumba Fitness - Viernes hace 2 semanas
(@act5, @a6,  CURRENT_DATE - INTERVAL 11 DAY, 'present', @profe2_id),
(@act5, @a8,  CURRENT_DATE - INTERVAL 11 DAY, 'present', @profe2_id),
(@act5, @a10, CURRENT_DATE - INTERVAL 11 DAY, 'present', @profe2_id),
(@act5, @a12, CURRENT_DATE - INTERVAL 11 DAY, 'absent',  @profe2_id),
(@act5, @a7,  CURRENT_DATE - INTERVAL 11 DAY, 'present', @profe2_id),
(@act5, @a9,  CURRENT_DATE - INTERVAL 11 DAY, 'late',    @profe2_id),
(@act5, @a11, CURRENT_DATE - INTERVAL 11 DAY, 'present', @profe2_id),
-- Zumba Fitness - Viernes semana pasada
(@act5, @a6,  CURRENT_DATE - INTERVAL 3 DAY,  'present', @profe2_id),
(@act5, @a8,  CURRENT_DATE - INTERVAL 3 DAY,  'present', @profe2_id),
(@act5, @a10, CURRENT_DATE - INTERVAL 3 DAY,  'present', @profe2_id),
(@act5, @a12, CURRENT_DATE - INTERVAL 3 DAY,  'present', @profe2_id),
(@act5, @a7,  CURRENT_DATE - INTERVAL 3 DAY,  'present', @profe2_id),
(@act5, @a9,  CURRENT_DATE - INTERVAL 3 DAY,  'present', @profe2_id),
(@act5, @a11, CURRENT_DATE - INTERVAL 3 DAY,  'absent',  @profe2_id),
-- Pilates Matutino - Lunes semana pasada
(@act6, @a2,  CURRENT_DATE - INTERVAL 7 DAY,  'present', @profe2_id),
(@act6, @a6,  CURRENT_DATE - INTERVAL 7 DAY,  'absent',  @profe2_id),
(@act6, @a10, CURRENT_DATE - INTERVAL 7 DAY,  'present', @profe2_id),
-- Boxeo Recreativo - Miércoles semana pasada
(@act7, @a1,  CURRENT_DATE - INTERVAL 5 DAY,  'present', @profe1_id),
(@act7, @a7,  CURRENT_DATE - INTERVAL 5 DAY,  'present', @profe1_id),
(@act7, @a11, CURRENT_DATE - INTERVAL 5 DAY,  'absent',  @profe1_id),
(@act7, @a8,  CURRENT_DATE - INTERVAL 5 DAY,  'present', @profe1_id),
(@act7, @a10, CURRENT_DATE - INTERVAL 5 DAY,  'late',    @profe1_id),
-- Stretching - Viernes semana pasada
(@act8, @a8,  CURRENT_DATE - INTERVAL 3 DAY,  'present', @profe2_id),
(@act8, @a10, CURRENT_DATE - INTERVAL 3 DAY,  'present', @profe2_id),
(@act8, @a1,  CURRENT_DATE - INTERVAL 3 DAY,  'present', @profe2_id),
(@act8, @a7,  CURRENT_DATE - INTERVAL 3 DAY,  'late',    @profe2_id),
(@act8, @a11, CURRENT_DATE - INTERVAL 3 DAY,  'present', @profe2_id);

-- =================================================================================
-- 10. PROGRESO FÍSICO (Mediciones registradas por profesores)
-- =================================================================================
INSERT INTO user_progress (user_id, teacher_id, date, weight, notes) VALUES
-- Lucas: 3 mediciones, ganando masa muscular
(@a1, @profe1_id, CURRENT_DATE - INTERVAL 85 DAY, 82.0, 'Evaluación inicial. Objetivo: hipertrofia. Buena base de fuerza.'),
(@a1, @profe1_id, CURRENT_DATE - INTERVAL 50 DAY, 83.5, 'Subió 1.5kg. Buena adaptación al entrenamiento funcional.'),
(@a1, @profe1_id, CURRENT_DATE - INTERVAL 14 DAY, 84.2, 'Continúa progresando. Aumentar carga en sentadilla.'),
-- María: 3 mediciones, bajando de peso
(@a2, @profe2_id, CURRENT_DATE - INTERVAL 75 DAY, 68.5, 'Inicio de plan. Meta: tonificación y pérdida de grasa.'),
(@a2, @profe2_id, CURRENT_DATE - INTERVAL 40 DAY, 66.8, 'Bajó 1.7kg. Excelente consistencia en yoga y pilates.'),
(@a2, @profe2_id, CURRENT_DATE - INTERVAL 10 DAY, 65.0, 'Muy buen progreso. Peso objetivo casi alcanzado.'),
-- Pedro: 2 mediciones
(@a5, @profe1_id, CURRENT_DATE - INTERVAL 55 DAY, 90.0, 'Entrenamiento de resistencia. Peso alto pero buena composición corporal.'),
(@a5, @profe1_id, CURRENT_DATE - INTERVAL 20 DAY, 88.5, 'Bajó 1.5kg de grasa, mantuvo masa muscular.'),
-- Camila: 2 mediciones
(@a6, @profe2_id, CURRENT_DATE - INTERVAL 50 DAY, 58.0, 'Primera evaluación. Quiere mejorar flexibilidad y resistencia.'),
(@a6, @profe2_id, CURRENT_DATE - INTERVAL 15 DAY, 57.5, 'Leve descenso. Flexibilidad mejorada notablemente.'),
-- Martín: 2 mediciones
(@a7, @profe1_id, CURRENT_DATE - INTERVAL 45 DAY, 95.0, 'Evaluación inicial. Quiere bajar a 88kg.'),
(@a7, @profe1_id, CURRENT_DATE - INTERVAL 14 DAY, 92.3, 'Bajó 2.7kg. Continuar con plan cardiovascular.'),
-- Valentina: 1 medición
(@a8, @profe2_id, CURRENT_DATE - INTERVAL 18 DAY, 62.0, 'Primera clase. Nivel principiante, buena actitud.'),
-- Santiago: 1 medición
(@a9, @profe1_id, CURRENT_DATE - INTERVAL 12 DAY, 78.0, 'Evaluación de ingreso. Experiencia previa en CrossFit.'),
-- Florencia: 1 medición
(@a10, @profe2_id, CURRENT_DATE - INTERVAL 8 DAY, 55.0, 'Alumna avanzada. Excelente condición cardiovascular.'),
-- Tomás: 1 medición (reciente)
(@a11, @profe1_id, CURRENT_DATE - INTERVAL 6 DAY, 100.0, 'Primera consulta. Sobrepeso, plan especial de reducción.'),
-- Luciana: 1 medición (muy reciente)
(@a12, @profe2_id, CURRENT_DATE - INTERVAL 2 DAY, 60.0, 'Ingreso reciente. Viene de otro gimnasio, buen estado general.');

-- =================================================================================
-- 11. CONSULTAS DE CONTACTO WEB (Landing page)
-- =================================================================================
INSERT INTO contact_inquiries (name, email, message, status, created_at) VALUES
('Roberto Sánchez',  'roberto.sanchez@gmail.com',  '¡Hola! Quiero saber los horarios de las clases de spinning y el precio de la membresía mensual. Gracias.', 'resolved',    NOW() - INTERVAL 20 DAY),
('Daniela Vega',     'daniela.vega@hotmail.com',   'Buenas tardes, quisiera consultar si tienen clases para niños o adolescentes. Mi hijo tiene 14 años.',       'in_progress', NOW() - INTERVAL 10 DAY),
('Marcos Villalba',  'marcos.villalba@outlook.com', 'Hola, me gustaría alquilar el salón de eventos para un cumpleaños de 15. ¿Cuál es la disponibilidad?',     'pending',     NOW() - INTERVAL 5 DAY),
('Carolina Méndez',  'carolina.mendez@gmail.com',   'Buenos días. Quiero inscribirme y necesito saber qué documentación necesito llevar. Saludos.',              'pending',     NOW() - INTERVAL 2 DAY);

-- =================================================================================
-- 12. CONFIGURACIONES EXTRA
-- =================================================================================
INSERT IGNORE INTO gym_config (config_key, config_value) VALUES
('sistema_actividad', 'true'),
('aforo_maximo', '150');

-- =================================================================================
-- ✅ RESUMEN DE DATOS INSERTADOS
-- =================================================================================
-- Staff:     1 Recepcionista + 2 Profesores (+ Admin existente)
-- Alumnos:   12 (10 activos, 1 inactiva, 1 recién inscrita)
-- Suscripc.: 15 registros (activas, expiradas, cancelada)
-- Actividad: 8 clases distintas (lun a vie, 2 profesores)
-- Inscripc.: 28 inscripciones a clases
-- Cajas:     6 cajas cerradas con historial
-- Pagos:     28 pagos (mensualidades, inscripciones, especiales, alquileres, otros)
-- Reservas:  10 reservas (futuras, pasadas, cancelada, externos y registrados)
-- Asistenc.: 51 registros de asistencia (present/absent/late)
-- Progreso:  19 mediciones de seguimiento físico
-- Contacto:  4 consultas web (pending, in_progress, resolved)
-- =================================================================================
