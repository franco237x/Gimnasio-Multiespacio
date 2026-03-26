import { useState, useEffect } from 'react';
import { configAPI, paymentsAPI } from '../services/apiService';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import './Configuracion.css';

const Configuracion = () => {
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ─── Config general ───
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

    // ─── Planes de membresía ───
    const [plans, setPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [planSaving, setPlanSaving] = useState(false);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planForm, setPlanForm] = useState({
        name: '', description: '', price: '', duration_days: 30, features: ''
    });
    const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        loadConfig();
        loadPlans();
    }, []);

    // ─── Config helpers ───
    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await configAPI.getAll();
            if (response.success) {
                setConfig(prev => ({ ...prev, ...response.data }));
            }
        } catch (error) {
            showNotification('❌ Error al cargar configuración: ' + (error.message || ''), 'error');
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
            showNotification('❌ Error al guardar configuración: ' + (error.message || ''), 'error');
        } finally {
            setSaving(false);
        }
    };

    // ─── Plans CRUD ───
    const loadPlans = async () => {
        try {
            setPlansLoading(true);
            const res = await paymentsAPI.getPlans();
            if (res.success) setPlans(res.data);
        } catch (error) {
            console.error('Error al cargar planes:', error);
        } finally {
            setPlansLoading(false);
        }
    };

    const resetPlanForm = () => {
        setPlanForm({ name: '', description: '', price: '', duration_days: 30, features: '' });
        setEditingPlan(null);
        setShowPlanForm(false);
    };

    const openNewPlan = () => {
        resetPlanForm();
        setShowPlanForm(true);
    };

    const openEditPlan = (plan) => {
        let featuresStr = '';
        if (plan.features) {
            try {
                const arr = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
                featuresStr = Array.isArray(arr) ? arr.join(', ') : '';
            } catch { featuresStr = ''; }
        }
        setPlanForm({
            name: plan.name,
            description: plan.description || '',
            price: plan.price,
            duration_days: plan.duration_days,
            features: featuresStr
        });
        setEditingPlan(plan);
        setShowPlanForm(true);
    };

    const handlePlanSubmit = async (e) => {
        e.preventDefault();
        if (!planForm.name || !planForm.price) {
            showNotification('❌ Nombre y precio son obligatorios', 'error');
            return;
        }
        try {
            setPlanSaving(true);
            const payload = {
                name: planForm.name,
                description: planForm.description || null,
                price: parseFloat(planForm.price),
                duration_days: parseInt(planForm.duration_days) || 30,
                features: planForm.features
                    ? planForm.features.split(',').map(f => f.trim()).filter(Boolean)
                    : null
            };

            if (editingPlan) {
                await paymentsAPI.updatePlan(editingPlan.id, payload);
                showNotification('✅ Plan actualizado correctamente', 'success');
            } else {
                await paymentsAPI.createPlan(payload);
                showNotification('✅ Plan creado correctamente', 'success');
            }
            resetPlanForm();
            await loadPlans();
        } catch (error) {
            showNotification(`❌ ${error.message || 'Error al guardar plan'}`, 'error');
        } finally {
            setPlanSaving(false);
        }
    };

    const handleDeletePlan = (plan) => {
        setConfirmDialog({
            show: true,
            title: 'Desactivar Plan',
            message: `¿Estás seguro de desactivar el plan "${plan.name}"? Las suscripciones existentes no se verán afectadas.`,
            onConfirm: async () => {
                try {
                    await paymentsAPI.deletePlan(plan.id);
                    showNotification('✅ Plan desactivado correctamente', 'success');
                    await loadPlans();
                } catch (error) {
                    showNotification('❌ Error al desactivar plan: ' + (error.message || ''), 'error');
                }
                setConfirmDialog({ show: false });
            }
        });
    };

    const parsePlanFeatures = (features) => {
        if (!features) return [];
        try {
            const arr = typeof features === 'string' ? JSON.parse(features) : features;
            return Array.isArray(arr) ? arr : [];
        } catch { return []; }
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

            <ConfirmDialog
                isOpen={confirmDialog.show}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ show: false })}
                confirmText="Desactivar"
                variant="danger"
            />

            <div className="page-header">
                <h1><i className='bx bx-cog'></i> Configuración</h1>
            </div>

            {/* ═══════════════════════════════════════════════
                SECCIÓN: PLANES DE MEMBRESÍA
            ═══════════════════════════════════════════════ */}
            <div className="config-section plans-section">
                <div className="section-title-row">
                    <h2><i className='bx bx-id-card'></i> Planes de Membresía</h2>
                    {!showPlanForm && (
                        <button className="btn-add-plan" onClick={openNewPlan}>
                            <i className='bx bx-plus'></i> Agregar Plan
                        </button>
                    )}
                </div>

                {/* Formulario crear / editar */}
                {showPlanForm && (
                    <form className="plan-form" onSubmit={handlePlanSubmit}>
                        <h3>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</h3>
                        <div className="plan-form-grid">
                            <div className="form-group">
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Plan Premium"
                                    value={planForm.name}
                                    onChange={(e) => setPlanForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Precio (ARS) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={planForm.price}
                                    onChange={(e) => setPlanForm(p => ({ ...p, price: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Duración (días)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={planForm.duration_days}
                                    onChange={(e) => setPlanForm(p => ({ ...p, duration_days: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <input
                                    type="text"
                                    placeholder="Descripción breve del plan"
                                    value={planForm.description}
                                    onChange={(e) => setPlanForm(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Características (separadas por coma)</label>
                                <input
                                    type="text"
                                    placeholder="Musculación, Clases grupales, Vestuarios"
                                    value={planForm.features}
                                    onChange={(e) => setPlanForm(p => ({ ...p, features: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="plan-form-actions">
                            <button type="button" className="btn-secondary" onClick={resetPlanForm}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary" disabled={planSaving}>
                                {planSaving ? (
                                    <><i className='bx bx-loader-alt bx-spin'></i> Guardando...</>
                                ) : (
                                    <><i className='bx bx-save'></i> {editingPlan ? 'Actualizar' : 'Crear Plan'}</>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* Lista de planes */}
                {plansLoading ? (
                    <div className="plans-loading">
                        <i className='bx bx-loader-alt bx-spin'></i> Cargando planes...
                    </div>
                ) : plans.length === 0 ? (
                    <div className="plans-empty">
                        <i className='bx bx-info-circle'></i>
                        <p>No hay planes creados todavía.</p>
                    </div>
                ) : (
                    <div className="plans-grid">
                        {plans.map(plan => {
                            const features = parsePlanFeatures(plan.features);
                            return (
                                <div key={plan.id} className="plan-card">
                                    <div className="plan-card-header">
                                        <h3>{plan.name}</h3>
                                        <span className="plan-price">
                                            ${Number(plan.price).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                    {plan.description && (
                                        <p className="plan-description">{plan.description}</p>
                                    )}
                                    <div className="plan-meta">
                                        <span className="plan-duration">
                                            <i className='bx bx-calendar'></i> {plan.duration_days} días
                                        </span>
                                    </div>
                                    {features.length > 0 && (
                                        <ul className="plan-features">
                                            {features.map((f, i) => (
                                                <li key={i}><i className='bx bx-check'></i> {f}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="plan-card-actions">
                                        <button
                                            className="btn-edit-plan"
                                            onClick={() => openEditPlan(plan)}
                                            title="Editar"
                                        >
                                            <i className='bx bx-edit-alt'></i> Editar
                                        </button>
                                        <button
                                            className="btn-delete-plan"
                                            onClick={() => handleDeletePlan(plan)}
                                            title="Desactivar"
                                        >
                                            <i className='bx bx-trash'></i> Eliminar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════
                SECCIÓN: CONFIGURACIÓN GENERAL (existente)
            ═══════════════════════════════════════════════ */}
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
                        <div className="toggle-group">
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <span className="toggle-label">Notificaciones por Email</span>
                                    <span className="toggle-desc">Recibir alertas e informes por correo electrónico</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.notifications_email === 'true'}
                                        onChange={(e) => handleChange('notifications_email', e.target.checked ? 'true' : 'false')}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <span className="toggle-label">Notificaciones por SMS</span>
                                    <span className="toggle-desc">Enviar mensajes de texto a alumnos</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.notifications_sms === 'true'}
                                        onChange={(e) => handleChange('notifications_sms', e.target.checked ? 'true' : 'false')}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <span className="toggle-label">Recordatorios de Pago</span>
                                    <span className="toggle-desc">Avisar automáticamente sobre cuotas por vencer</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.payment_reminder === 'true'}
                                        onChange={(e) => handleChange('payment_reminder', e.target.checked ? 'true' : 'false')}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
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
