import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './MiPerfil.css';

const MiPerfil = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('datos');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [formData, setFormData] = useState({
        nombre: user?.name || 'Usuario Demo',
        email: user?.email || 'demo@fortaleza.com',
        telefono: '+54 11 5555-1234',
        dni: '12345678',
        fechaNacimiento: '1995-05-15',
        direccion: 'Av. Corrientes 1234, CABA'
    });

    const [passwordData, setPasswordData] = useState({
        actual: '',
        nueva: '',
        confirmar: ''
    });

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        showNotification('✅ Perfil actualizado correctamente', 'success');
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        if (passwordData.nueva !== passwordData.confirmar) {
            showNotification('❌ Las contraseñas no coinciden', 'error');
            return;
        }
        showNotification('✅ Contraseña cambiada correctamente', 'success');
        setPasswordData({ actual: '', nueva: '', confirmar: '' });
    };

    return (
        <div className="mi-perfil">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <h2><i className='bx bx-user'></i> Mi Perfil</h2>
                <p>Administra tu información personal</p>
            </div>

            {/* Profile Card */}
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {formData.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-info">
                        <h3>{formData.nombre}</h3>
                        <p>{formData.email}</p>
                        <span className="member-badge">
                            <i className='bx bx-star'></i> Miembro Premium
                        </span>
                    </div>
                    <button className="btn-change-photo" onClick={() => showNotification('📷 Función próximamente disponible', 'success')}>
                        <i className='bx bx-camera'></i> Cambiar Foto
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'datos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('datos')}
                >
                    <i className='bx bx-id-card'></i> Datos Personales
                </button>
                <button
                    className={`tab-btn ${activeTab === 'seguridad' ? 'active' : ''}`}
                    onClick={() => setActiveTab('seguridad')}
                >
                    <i className='bx bx-lock-alt'></i> Seguridad
                </button>
                <button
                    className={`tab-btn ${activeTab === 'notificaciones' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notificaciones')}
                >
                    <i className='bx bx-bell'></i> Notificaciones
                </button>
            </div>

            {/* Datos Personales */}
            {activeTab === 'datos' && (
                <div className="tab-content">
                    <form onSubmit={handleSaveProfile}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>DNI</label>
                                <input
                                    type="text"
                                    value={formData.dni}
                                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                    type="text"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    value={formData.fechaNacimiento}
                                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Dirección</label>
                                <input
                                    type="text"
                                    value={formData.direccion}
                                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-save">
                            <i className='bx bx-save'></i> Guardar Cambios
                        </button>
                    </form>
                </div>
            )}

            {/* Seguridad */}
            {activeTab === 'seguridad' && (
                <div className="tab-content">
                    <form onSubmit={handleChangePassword}>
                        <div className="form-group">
                            <label>Contraseña Actual</label>
                            <input
                                type="password"
                                value={passwordData.actual}
                                onChange={(e) => setPasswordData({ ...passwordData, actual: e.target.value })}
                                placeholder="Ingresa tu contraseña actual"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={passwordData.nueva}
                                    onChange={(e) => setPasswordData({ ...passwordData, nueva: e.target.value })}
                                    placeholder="Nueva contraseña"
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmar}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmar: e.target.value })}
                                    placeholder="Confirmar nueva contraseña"
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-save">
                            <i className='bx bx-lock'></i> Cambiar Contraseña
                        </button>
                    </form>
                </div>
            )}

            {/* Notificaciones */}
            {activeTab === 'notificaciones' && (
                <div className="tab-content">
                    <div className="notification-settings">
                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-title">Recordatorios de Clases</span>
                                <span className="setting-desc">Recibir notificaciones antes de tus clases</span>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" defaultChecked />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-title">Vencimiento de Cuota</span>
                                <span className="setting-desc">Alertas cuando tu cuota esté por vencer</span>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" defaultChecked />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-title">Promociones y Ofertas</span>
                                <span className="setting-desc">Información sobre descuentos y novedades</span>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-title">Nuevas Clases</span>
                                <span className="setting-desc">Notificaciones cuando haya clases nuevas</span>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" defaultChecked />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    <button className="btn-save" onClick={() => showNotification('✅ Preferencias guardadas', 'success')}>
                        <i className='bx bx-save'></i> Guardar Preferencias
                    </button>
                </div>
            )}
        </div>
    );
};

export default MiPerfil;
