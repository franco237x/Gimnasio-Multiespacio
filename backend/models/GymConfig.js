const { executeQuery } = require('../config/database');

class GymConfig {
    // Obtener toda la configuración
    static async getAll() {
        const query = `SELECT config_key, config_value FROM gym_config`;
        const results = await executeQuery(query);

        // Convertir array a objeto
        const config = {};
        for (const row of results) {
            config[row.config_key] = row.config_value;
        }
        return config;
    }

    // Obtener un valor de configuración
    static async get(key) {
        const query = `SELECT config_value FROM gym_config WHERE config_key = ?`;
        const results = await executeQuery(query, [key]);
        return results.length > 0 ? results[0].config_value : null;
    }

    // Establecer/actualizar configuración
    static async set(key, value) {
        const query = `
      INSERT INTO gym_config (config_key, config_value) 
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE config_value = ?, updated_at = CURRENT_TIMESTAMP
    `;
        await executeQuery(query, [key, value, value]);
    }

    // Actualizar múltiples configuraciones
    static async updateAll(configData) {
        for (const [key, value] of Object.entries(configData)) {
            await GymConfig.set(key, value);
        }
        return await GymConfig.getAll();
    }
}

module.exports = GymConfig;
