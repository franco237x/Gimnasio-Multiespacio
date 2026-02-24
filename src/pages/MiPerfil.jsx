import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/apiService';
import './MiPerfil.css';

const MiPerfil = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('datos');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: ''
    });

    const [passwordData, setPasswordData] = useState({
        actual: '',
        nueva: '',
        confirmar: ''
    });

    // Cargar datos del usuario autenticado
    useEffect(() => {
        if (user) {
            setFormData({
                nombre: user.name || '',
                email: user.email || '',
                telefono: user.phone || ''
            });
        }
    }, [user]);

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!formData.nombre.trim()) {
            showNotification('❌ El nombre es requerido', 'error');
            return;
        }

        try {
            setSaving(true);
            const response = await authAPI.updateProfile({
                name: formData.nombre,
                phone: formData.telefono
            });

            if (response.user && updateUser) {
                updateUser(response.user);
            }
            showNotification('✅ Perfil actualizado correctamente', 'success');
        } catch (error) {
            showNotification('❌ ' + (error.message || 'Error al guardar'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (!passwordData.actual || !passwordData.nueva || !passwordData.confirmar) {
            showNotification('❌ Todos los campos son requeridos', 'error');
            return;
        }

        if (passwordData.nueva.length < 6) {
            showNotification('❌ La nueva contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        if (passwordData.nueva !== passwordData.confirmar) {
            showNotification('❌ Las contraseñas no coinciden', 'error');
            return;
        }

        try {
            setSaving(true);
            await authAPI.changePassword({
                currentPassword: passwordData.actual,
                newPassword: passwordData.nueva
            });
            showNotification('✅ Contraseña cambiada correctamente', 'success');
            setPasswordData({ actual: '', nueva: '', confirmar: '' });
        } catch (error) {
            showNotification('❌ ' + (error.message || 'Error al cambiar contraseña'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const getRoleName = () => {
        const roles = { 1: 'Administrador', 2: 'Recepcionista', 3: 'Profesor', 4: 'Alumno' };
        return roles[user?.role_id] || 'Usuario';
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
                        {formData.nombre?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="profile-info">
                        <h3>{formData.nombre || 'Usuario'}</h3>
                        <p>{formData.email}</p>
                        <span className="member-badge">
                            <i className='bx bx-shield-quarter'></i> {getRoleName()}
                        </span>
                    </div>
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
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="input-disabled"
                                />
                                <small className="field-hint">El email no se puede cambiar</small>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                    type="text"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    placeholder="Ej: +54 11 1234-5678"
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? (
                                <><i className='bx bx-loader-alt bx-spin'></i> Guardando...</>
                            ) : (
                                <><i className='bx bx-save'></i> Guardar Cambios</>
                            )}
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
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={passwordData.nueva}
                                    onChange={(e) => setPasswordData({ ...passwordData, nueva: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmar}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmar: e.target.value })}
                                    placeholder="Repetir nueva contraseña"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? (
                                <><i className='bx bx-loader-alt bx-spin'></i> Cambiando...</>
                            ) : (
                                <><i className='bx bx-lock'></i> Cambiar Contraseña</>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MiPerfil;
