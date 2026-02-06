import { useState, useEffect } from 'react';
import { configAPI } from '../services/apiService';
import './Configuracion.css';

const Configuracion = () => {
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [config, setConfig] = useState({
        gym_name: '',
        email: '',
        phone: '',
        address: '',
        opening_time: '06:00',
        closing_time: '23:00',
        currency: 'ARS',
        notifications_email: 'true',
        notifications_sms: 'false',
        payment_reminder: 'true',
        reminder_days: '5'
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await configAPI.getAll();
            if (response.success) {
                setConfig(prev => ({ ...prev, ...response.data }));
            }
        } catch (error) {
            showNotification('❌ Error al cargar configuración', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await configAPI.update(config);
            showNotification('✅ Configuración guardada exitosamente', 'success');
        } catch (error) {
            showNotification('❌ Error al guardar configuración', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="configuracion loading-state">
                <i className='bx bx-loader-alt bx-spin'></i>
                <p>Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div className="configuracion">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <h1><i className='bx bx-cog'></i> Configuración</h1>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Información General */}
                <div className="config-section">
                    <h2><i className='bx bx-building'></i> Información del Gimnasio</h2>
                    <div className="config-grid">
                        <div className="form-group">
                            <label>Nombre del Gimnasio</label>
                            <input
                                type="text"
                                value={config.gym_name}
                                onChange={(e) => handleChange('gym_name', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email de Contacto</label>
                            <input
                                type="email"
                                value={config.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="text"
                                value={config.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Dirección</label>
                            <input
                                type="text"
                                value={config.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Horarios */}
                <div className="config-section">
                    <h2><i className='bx bx-time'></i> Horarios de Atención</h2>
                    <div className="config-grid">
                        <div className="form-group">
                            <label>Hora de Apertura</label>
                            <input
                                type="time"
                                value={config.opening_time}
                                onChange={(e) => handleChange('opening_time', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Hora de Cierre</label>
                            <input
                                type="time"
                                value={config.closing_time}
                                onChange={(e) => handleChange('closing_time', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Moneda */}
                <div className="config-section">
                    <h2><i className='bx bx-money'></i> Configuración de Pagos</h2>
                    <div className="config-grid">
                        <div className="form-group">
                            <label>Moneda</label>
                            <select
                                value={config.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                            >
                                <option value="ARS">Peso Argentino (ARS)</option>
                                <option value="USD">Dólar (USD)</option>
                                <option value="EUR">Euro (EUR)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Días antes del vencimiento para recordar</label>
                            <input
                                type="number"
                                value={config.reminder_days}
                                onChange={(e) => handleChange('reminder_days', e.target.value)}
                                min="1"
                                max="30"
                            />
                        </div>
                    </div>
                </div>

                {/* Notificaciones */}
                <div className="config-section">
                    <h2><i className='bx bx-bell'></i> Notificaciones</h2>
                    <div className="config-grid">
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={config.notifications_email === 'true'}
                                    onChange={(e) => handleChange('notifications_email', e.target.checked ? 'true' : 'false')}
                                />
                                <span>Notificaciones por Email</span>
                            </label>
                        </div>
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={config.notifications_sms === 'true'}
                                    onChange={(e) => handleChange('notifications_sms', e.target.checked ? 'true' : 'false')}
                                />
                                <span>Notificaciones por SMS</span>
                            </label>
                        </div>
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={config.payment_reminder === 'true'}
                                    onChange={(e) => handleChange('payment_reminder', e.target.checked ? 'true' : 'false')}
                                />
                                <span>Recordatorios de Pago</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={loadConfig}>
                        <i className='bx bx-reset'></i> Restablecer
                    </button>
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? (
                            <>
                                <i className='bx bx-loader-alt bx-spin'></i> Guardando...
                            </>
                        ) : (
                            <>
                                <i className='bx bx-save'></i> Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Configuracion;
