const axios = require('axios');

const PHP_MAILER_URL = process.env.PHP_MAILER_URL; // e.g. https://tu-dominio.com/send-token.php

// Envía token al endpoint PHP para correo de verificación o recuperación.
// type: 'verification' | 'reset'
async function sendTokenEmail({ email, token, expiresAt, type }) {
  if (!PHP_MAILER_URL) {
    console.warn('PHP_MAILER_URL no está configurado; se omite el envío al endpoint PHP.');
    return { skipped: true };
  }

  try {
    const payload = {
      email,
      token,
      type,
      expiresAt: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt
    };

    const response = await axios.post(PHP_MAILER_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error enviando token al PHP:', error?.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendTokenEmail
};
