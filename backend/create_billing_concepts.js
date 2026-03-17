/**
 * Script para ejecutar la migración de billing_concepts
 * y agregar billing_concept_id a payments
 */
const { executeQuery, testConnection } = require('./config/database');

const runMigration = async () => {
    try {
        console.log('🔄 Conectando a la base de datos...');
        const ok = await testConnection();
        if (!ok) {
            console.error('❌ No se pudo conectar a la base de datos');
            process.exit(1);
        }

        console.log('🔄 Creando tabla billing_concepts...');
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS billing_concepts (
                id                   INT AUTO_INCREMENT PRIMARY KEY,
                name                 VARCHAR(120) NOT NULL,
                category             ENUM('mensualidad','inscripcion','clase_especial','alquiler','otro') NOT NULL DEFAULT 'otro',
                description          VARCHAR(255),
                icon                 VARCHAR(60)  DEFAULT 'bx-receipt',
                color                VARCHAR(25)  DEFAULT '#6366f1',
                default_amount       DECIMAL(10,2) NULL,
                is_subscription      TINYINT(1)   DEFAULT 0,
                subscription_plan_id INT          NULL,
                activity_id          INT          NULL,
                space_id             INT          NULL,
                is_active            TINYINT(1)   DEFAULT 1,
                sort_order           INT          DEFAULT 99,
                created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                updated_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL,
                FOREIGN KEY (activity_id)           REFERENCES activities(id)         ON DELETE SET NULL,
                FOREIGN KEY (space_id)              REFERENCES spaces(id)             ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla billing_concepts creada/verificada');

        console.log('🔄 Insertando conceptos por defecto...');
        await executeQuery(`
            INSERT IGNORE INTO billing_concepts
                (id, name, category, description, icon, color, default_amount, is_subscription, subscription_plan_id, activity_id, space_id, sort_order)
            VALUES
                (1, 'Mensualidad General',   'mensualidad',    'Cuota mensual sin plan específico',              'bx-calendar-check',  '#10b981', NULL,     1, NULL, NULL, NULL, 1),
                (2, 'Mensualidad - Básico',  'mensualidad',    'Cuota mensual Plan Básico (musculación)',         'bx-calendar-check',  '#10b981', 5000.00,  1, 1,    NULL, NULL, 2),
                (3, 'Mensualidad - Premium', 'mensualidad',    'Cuota mensual Plan Premium',                     'bx-star',            '#8b5cf6', 8000.00,  1, 2,    NULL, NULL, 3),
                (4, 'Mensualidad - VIP',     'mensualidad',    'Cuota mensual Plan VIP (acceso ilimitado)',       'bx-crown',           '#f59e0b', 12000.00, 1, 3,    NULL, NULL, 4),
                (5, 'Inscripción a Clase',   'inscripcion',    'Inscripción y confirmación a una actividad',     'bx-user-plus',       '#3b82f6', NULL,     0, NULL, NULL, NULL, 5),
                (6, 'Clase Especial',        'clase_especial', 'Clase particular o fuera de horario regular',    'bx-dumbbell',        '#ef4444', NULL,     0, NULL, NULL, NULL, 6),
                (7, 'Alquiler de Espacio',   'alquiler',       'Alquiler de cancha, sala o espacio del complejo','bx-building',        '#06b6d4', NULL,     0, NULL, NULL, NULL, 7),
                (8, 'Otro / Varios',         'otro',           'Concepto no categorizado',                       'bx-dots-horizontal', '#6b7280', NULL,     0, NULL, NULL, NULL, 8)
        `);
        console.log('✅ Conceptos base insertados');

        console.log('🔄 Agregando billing_concept_id a payments...');
        try {
            await executeQuery(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_concept_id INT NULL AFTER concept`);
            console.log('✅ Columna billing_concept_id agregada a payments');
        } catch (e) {
            if (e.message.includes('Duplicate')) {
                console.log('ℹ️  Columna billing_concept_id ya existe');
            } else {
                console.warn('⚠️  Error al agregar columna:', e.message);
            }
        }

        console.log('\n✅ Migración completada exitosamente!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        process.exit(1);
    }
};

runMigration();
