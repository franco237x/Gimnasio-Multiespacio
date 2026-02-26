import { useState, useEffect } from 'react';
import { paymentsAPI, usersAPI } from '../services/apiService';
import Modal from '../components/ui/Modal';
import { ToastContainer, useToast } from '../components/ui/Toast';
import './GestionPagos.css';

const GestionPagos = () => {
    const [activeTab, setActiveTab] = useState('pago');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('pago');
    const { toasts, addToast, removeToast } = useToast();
    const [alumnos, setAlumnos] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [historialPagos, setHistorialPagos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        user_id: '',
        plan_id: '',
        amount: '',
        concept: 'mensualidad',
        payment_method: 'efectivo',
        notes: ''
    });

    const [planFormData, setPlanFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration_days: 30
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, plansRes, paymentsRes] = await Promise.all([
                usersAPI.getAll({ role: 'alumno' }),
                paymentsAPI.getPlans(),
                paymentsAPI.getAll({ limit: 50 })
            ]);

            if (usersRes.success) {
                setAlumnos(usersRes.data.filter(u => u.role_name?.toLowerCase() === 'alumno'));
            }
            if (plansRes.success) setPlanes(plansRes.data);
            if (paymentsRes.success) setHistorialPagos(paymentsRes.data);
        } catch (error) {
            showNotification('❌ Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        addToast(message, type);
    };

    const handleOpenModal = (type) => {
        setModalType(type);
        if (type === 'pago') {
            setFormData({
                user_id: '',
                plan_id: '',
                amount: '',
                concept: 'mensualidad',
                payment_method: 'efectivo',
                notes: ''
            });
        } else {
            setPlanFormData({
                name: '',
                description: '',
                price: '',
                duration_days: 30
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handlePlanSelect = (planId) => {
        const plan = planes.find(p => p.id === parseInt(planId));
        if (plan) {
            setFormData({
                ...formData,
                plan_id: planId,
                amount: plan.price
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'pago') {
                // Registrar pago
                await paymentsAPI.create({
                    user_id: parseInt(formData.user_id),
                    amount: parseFloat(formData.amount),
                    concept: formData.concept,
                    payment_method: formData.payment_method,
                    notes: formData.notes
                });

                // Si hay plan seleccionado, crear suscripción
                if (formData.plan_id) {
                    await paymentsAPI.createSubscription({
                        user_id: parseInt(formData.user_id),
                        plan_id: parseInt(formData.plan_id)
                    });
                }

                showNotification('✅ Pago registrado exitosamente', 'success');
            } else {
                // Crear plan
                await paymentsAPI.createPlan({
                    name: planFormData.name,
                    description: planFormData.description,
                    price: parseFloat(planFormData.price),
                    duration_days: parseInt(planFormData.duration_days)
                });
                showNotification('✅ Cuota creada exitosamente', 'success');
            }

            handleCloseModal();
            loadData();
        } catch (error) {
            showNotification('❌ Error: ' + error.message, 'error');
        }
    };

    const getConceptoLabel = (concept) => {
        const labels = {
            mensualidad: 'Mensualidad',
            inscripcion: 'Inscripción',
            clase_especial: 'Clase Especial',
            alquiler: 'Alquiler',
            otro: 'Otro'
        };
        return labels[concept] || concept;
    };

    const getMetodoPagoLabel = (method) => {
        const labels = {
            efectivo: 'Efectivo',
            tarjeta: 'Tarjeta',
            transferencia: 'Transferencia',
            mercadopago: 'MercadoPago'
        };
        return labels[method] || method;
    };

    return (
        <div className="gestion-pagos">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="page-header">
                <h1><i className='bx bx-money'></i> Gestión de Pagos</h1>
            </div>

            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'pago' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pago')}
                    >
                        <i className='bx bx-credit-card'></i> Registrar Pago
                    </button>
                    <button
                        className={`tab ${activeTab === 'cuota' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cuota')}
                    >
                        <i className='bx bx-receipt'></i> Planes/Cuotas
                    </button>
                    <button
                        className={`tab ${activeTab === 'historial' ? 'active' : ''}`}
                        onClick={() => setActiveTab('historial')}
                    >
                        <i className='bx bx-history'></i> Historial
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <i className='bx bx-loader-alt bx-spin'></i>
                    <p>Cargando datos...</p>
                </div>
            ) : (
                <div className="tab-content">
                    {activeTab === 'pago' && (
                        <div className="registro-pago-section">
                            <div className="quick-actions">
                                <button className="btn-primary" onClick={() => handleOpenModal('pago')}>
                                    <i className='bx bx-plus'></i> Registrar Nuevo Pago
                                </button>
                            </div>

                            <div className="plans-grid">
                                <h3>Planes Disponibles</h3>
                                <div className="plans-list">
                                    {planes.map(plan => (
                                        <div key={plan.id} className="plan-card">
                                            <h4>{plan.name}</h4>
                                            <p className="plan-price">${plan.price?.toLocaleString('es-AR')}</p>
                                            <p className="plan-duration">{plan.duration_days} días</p>
                                            <p className="plan-description">{plan.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cuota' && (
                        <div className="cuotas-section">
                            <div className="section-header">
                                <h3>Planes de Membresía</h3>
                                <button className="btn-primary" onClick={() => handleOpenModal('cuota')}>
                                    <i className='bx bx-plus'></i> Nuevo Plan
                                </button>
                            </div>
                            <div className="plans-table-container">
                                <table className="payments-table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Descripción</th>
                                            <th>Precio</th>
                                            <th>Duración</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {planes.map(plan => (
                                            <tr key={plan.id}>
                                                <td><strong>{plan.name}</strong></td>
                                                <td>{plan.description || '-'}</td>
                                                <td className="amount">${plan.price?.toLocaleString('es-AR')}</td>
                                                <td>{plan.duration_days} días</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'historial' && (
                        <div className="historial-section">
                            <h3>Historial de Pagos</h3>
                            <table className="payments-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Alumno</th>
                                        <th>Concepto</th>
                                        <th>Método</th>
                                        <th>Monto</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historialPagos.map(pago => (
                                        <tr key={pago.id}>
                                            <td>{new Date(pago.payment_date).toLocaleDateString('es-AR')}</td>
                                            <td>{pago.user_name}</td>
                                            <td>{getConceptoLabel(pago.concept)}</td>
                                            <td>{getMetodoPagoLabel(pago.payment_method)}</td>
                                            <td className="amount">${pago.amount?.toLocaleString('es-AR')}</td>
                                            <td>
                                                <span className={`status-badge status-${pago.status}`}>
                                                    {pago.status === 'completed' ? 'Completado' : pago.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={modalType === 'pago' ? 'Registrar Pago' : 'Nuevo Plan/Cuota'}
                size="md"
            >
                <form onSubmit={handleSubmit}>
                    {modalType === 'pago' ? (
                        <>
                            <div className="form-group">
                                <label>Alumno</label>
                                <select
                                    value={formData.user_id}
                                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar alumno...</option>
                                    {alumnos.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Plan (opcional)</label>
                                <select
                                    value={formData.plan_id}
                                    onChange={(e) => handlePlanSelect(e.target.value)}
                                >
                                    <option value="">Sin plan específico</option>
                                    {planes.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Monto</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Concepto</label>
                                    <select
                                        value={formData.concept}
                                        onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                                    >
                                        <option value="mensualidad">Mensualidad</option>
                                        <option value="inscripcion">Inscripción</option>
                                        <option value="clase_especial">Clase Especial</option>
                                        <option value="alquiler">Alquiler</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Método de Pago</label>
                                <select
                                    value={formData.payment_method}
                                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="mercadopago">MercadoPago</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Notas</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="2"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Nombre del Plan</label>
                                <input
                                    type="text"
                                    value={planFormData.name}
                                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    value={planFormData.description}
                                    onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                                    rows="2"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Precio</label>
                                    <input
                                        type="number"
                                        value={planFormData.price}
                                        onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Duración (días)</label>
                                    <input
                                        type="number"
                                        value={planFormData.duration_days}
                                        onChange={(e) => setPlanFormData({ ...planFormData, duration_days: e.target.value })}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                        <button type="submit" className="btn-primary">
                            {modalType === 'pago' ? 'Registrar Pago' : 'Crear Plan'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GestionPagos;
