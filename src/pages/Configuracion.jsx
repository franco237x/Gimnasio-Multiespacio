import { useState } from 'react';
import './Configuracion.css';

const Configuracion = () => {
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [config, setConfig] = useState({
        nombreGimnasio: 'Fortaleza Multiespacio',
        email: 'info@fortalezagym.com',
        telefono: '+54 11 1234-5678',
        direccion: 'San Martín 2381, Posadas, Misiones',
        horarioApertura: '06:00',
        horarioCierre: '23:00',
        moneda: 'ARS',
        notificacionesEmail: true,
        notificacionesSMS: false,
        recordatorioCuotas: true,
        diasAnticipacion: 5,
        precioMensualidad: 5000,
        precioInscripcion: 2000
    });

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleSave = (seccion) => {
        showNotification(`✅ Configuración de ${seccion} guardada correctamente`, 'success');
    };

    const handleInputChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="configuracion-page">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-cog'></i> Configuración</h2>
                    <p>Personaliza la configuración del sistema</p>
                </div>
            </div>

            <div className="config-grid">
                {/* Información General */}
                <div className="config-card">
                    <div className="card-header">
                        <h3><i className='bx bx-building'></i> Información del Gimnasio</h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label>Nombre del Gimnasio</label>
                            <input
                                type="text"
                                value={config.nombreGimnasio}
                                onChange={(e) => handleInputChange('nombreGimnasio', e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email de Contacto</label>
                                <input
                                    type="email"
                                    value={config.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                    type="text"
                                    value={config.telefono}
                                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Dirección</label>
                            <input
                                type="text"
                                value={config.direccion}
                                onChange={(e) => handleInputChange('direccion', e.target.value)}
                            />
                        </div>
                        <button className="btn-save" onClick={() => handleSave('información')}>
                            <i className='bx bx-save'></i> Guardar Cambios
                        </button>
                    </div>
                </div>

                {/* Horarios */}
                <div className="config-card">
                    <div className="card-header">
                        <h3><i className='bx bx-time'></i> Horarios de Atención</h3>
                    </div>
                    <div className="card-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Hora de Apertura</label>
                                <input
                                    type="time"
                                    value={config.horarioApertura}
                                    onChange={(e) => handleInputChange('horarioApertura', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Hora de Cierre</label>
                                <input
                                    type="time"
                                    value={config.horarioCierre}
                                    onChange={(e) => handleInputChange('horarioCierre', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="schedule-preview">
                            <span className="schedule-label">Horario Actual:</span>
                            <span className="schedule-value">{config.horarioApertura} - {config.horarioCierre}</span>
                        </div>
                        <button className="btn-save" onClick={() => handleSave('horarios')}>
                            <i className='bx bx-save'></i> Guardar Cambios
                        </button>
                    </div>
                </div>

                {/* Precios */}
                <div className="config-card">
                    <div className="card-header">
                        <h3><i className='bx bx-dollar'></i> Precios y Tarifas</h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label>Moneda</label>
                            <select
                                value={config.moneda}
                                onChange={(e) => handleInputChange('moneda', e.target.value)}
                            >
                                <option value="ARS">Peso Argentino (ARS)</option>
                                <option value="USD">Dólar (USD)</option>
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Mensualidad Básica</label>
                                <div className="input-with-prefix">
                                    <span className="prefix">$</span>
                                    <input
                                        type="number"
                                        value={config.precioMensualidad}
                                        onChange={(e) => handleInputChange('precioMensualidad', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Inscripción</label>
                                <div className="input-with-prefix">
                                    <span className="prefix">$</span>
                                    <input
                                        type="number"
                                        value={config.precioInscripcion}
                                        onChange={(e) => handleInputChange('precioInscripcion', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <button className="btn-save" onClick={() => handleSave('precios')}>
                            <i className='bx bx-save'></i> Guardar Cambios
                        </button>
                    </div>
                </div>

                {/* Notificaciones */}
                <div className="config-card">
                    <div className="card-header">
                        <h3><i className='bx bx-bell'></i> Notificaciones</h3>
                    </div>
                    <div className="card-body">
                        <div className="toggle-group">
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <span className="toggle-label">Notificaciones por Email</span>
                                    <span className="toggle-desc">Enviar emails de confirmación y recordatorios</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.notificacionesEmail}
                                        onChange={(e) => handleInputChange('notificacionesEmail', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <span className="toggle-label">Notificaciones por SMS</span>
                                    <span className="toggle-desc">Enviar SMS para recordatorios urgentes</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.notificacionesSMS}
                                        onChange={(e) => handleInputChange('notificacionesSMS', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <span className="toggle-label">Recordatorio de Cuotas</span>
                                    <span className="toggle-desc">Alertar antes del vencimiento de cuotas</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.recordatorioCuotas}
                                        onChange={(e) => handleInputChange('recordatorioCuotas', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        {config.recordatorioCuotas && (
                            <div className="form-group" style={{ marginTop: '16px' }}>
                                <label>Días de anticipación</label>
                                <select
                                    value={config.diasAnticipacion}
                                    onChange={(e) => handleInputChange('diasAnticipacion', e.target.value)}
                                >
                                    <option value="3">3 días antes</option>
                                    <option value="5">5 días antes</option>
                                    <option value="7">7 días antes</option>
                                </select>
                            </div>
                        )}
                        <button className="btn-save" onClick={() => handleSave('notificaciones')}>
                            <i className='bx bx-save'></i> Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Configuracion;
