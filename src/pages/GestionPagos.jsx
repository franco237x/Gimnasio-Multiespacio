import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI, usersAPI, cashRegistersAPI } from '../services/apiService';
import Modal from '../components/ui/Modal';
import { ToastContainer, useToast } from '../components/ui/Toast';
import './GestionPagos.css';

const GestionPagos = () => {
    const [activeTab, setActiveTab] = useState('pago');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('pago');
    const { toasts, addToast, removeToast } = useToast();
    const { user: currentUser } = useAuth();
    const [alumnos, setAlumnos] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [historialPagos, setHistorialPagos] = useState([]);
    const [cajaActiva, setCajaActiva] = useState(null);
    const [cajaSummary, setCajaSummary] = useState([]);
    const [selectedPago, setSelectedPago] = useState(null);
    const validatePlanRef = useRef(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        user_id: '',
        plan_id: '',
        amount: '',
        concept: 'mensualidad',
        payment_method: 'efectivo',
        status: 'completed',
        notes: ''
    });

    const [planFormData, setPlanFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration_days: 30
    });

    const [cajaFormData, setCajaFormData] = useState({
        opening_balance: 0,
        counted_balance: 0,
        notes: ''
    });

    const [cancelData, setCancelData] = useState({
        id: null,
        reason: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, plansRes, paymentsRes, cajaRes] = await Promise.all([
                usersAPI.getAll({ role: 'alumno' }),
                paymentsAPI.getPlans(),
                paymentsAPI.getAll({ limit: 50 }),
                cashRegistersAPI.getCurrent().catch(() => ({ success: true, data: null }))
            ]);

            if (usersRes.success) {
                setAlumnos(usersRes.data.filter(u => u.role_name?.toLowerCase() === 'alumno'));
            }
            if (plansRes.success) setPlanes(plansRes.data);
            if (paymentsRes.success) setHistorialPagos(paymentsRes.data);
            if (cajaRes && cajaRes.success && cajaRes.data?.register) {
                setCajaActiva(cajaRes.data.register);
                setCajaSummary(cajaRes.data.summary || []);
            } else {
                setCajaActiva(null);
                setCajaSummary([]);
            }
        } catch (error) {
            showNotification('❌ Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        addToast(message, type);
    };

    const handleOpenModal = (type, data = null) => {
        setModalType(type);
        if (type === 'pago') {
            setFormData({
                user_id: '',
                plan_id: '',
                amount: '',
                concept: 'mensualidad',
                payment_method: 'efectivo',
                status: 'completed',
                notes: ''
            });
        } else if (type === 'cuota') {
            setPlanFormData({
                name: '',
                description: '',
                price: '',
                duration_days: 30
            });
        } else if (type === 'abrir_caja' || type === 'cerrar_caja') {
            setCajaFormData({ opening_balance: 0, counted_balance: 0, notes: '' });
        } else if (type === 'ticket') {
            // Se maneja aparte
        } else if (type === 'cancelar_pago') {
            setCancelData({ id: data?.id, reason: '' });
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
                    status: formData.status,
                    notes: formData.notes
                });

                // Si hay plan seleccionado, crear suscripción
                if (formData.plan_id) {
                    await paymentsAPI.createSubscription({
                        user_id: parseInt(formData.user_id),
                        plan_id: parseInt(formData.plan_id),
                        status: formData.status === 'completed' ? 'active' : 'pending'
                    });
                }

                showNotification('✅ Pago registrado exitosamente', 'success');
            } else if (modalType === 'cuota') {
                // Crear plan
                await paymentsAPI.createPlan({
                    name: planFormData.name,
                    description: planFormData.description,
                    price: parseFloat(planFormData.price),
                    duration_days: parseInt(planFormData.duration_days)
                });
                showNotification('✅ Cuota creada exitosamente', 'success');
            } else if (modalType === 'abrir_caja') {
                await cashRegistersAPI.open(parseFloat(cajaFormData.opening_balance));
                showNotification('✅ Caja Abierta', 'success');
            } else if (modalType === 'cerrar_caja') {
                await cashRegistersAPI.close(cajaActiva.id, parseFloat(cajaFormData.counted_balance), cajaFormData.notes);
                showNotification('✅ Caja Cerrada Exitosamente', 'success');
            } else if (modalType === 'cancelar_pago') {
                if (!cancelData.reason) throw new Error("Debes indicar un motivo de anulación");
                await paymentsAPI.cancel(cancelData.id, cancelData.reason);
                showNotification('✅ Pago Anulado contablemente', 'success');
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

    const handlePrintTicket = (pago) => {
        setSelectedPago(pago);
        setModalType('ticket');
        setShowModal(true);
    };

    const printTicketWindow = () => {
        const printableElements = document.getElementById('ticket-print-area').innerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = printableElements;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Recargar para restaurar eventos React
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
                        className={`tab ${activeTab === 'caja' ? 'active' : ''}`}
                        onClick={() => setActiveTab('caja')}
                    >
                        <i className='bx bx-store-alt'></i> Caja
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
                                {currentUser?.role_id === 1 && (
                                    <button className="btn-primary" onClick={() => handleOpenModal('cuota')}>
                                        <i className='bx bx-plus'></i> Nuevo Plan
                                    </button>
                                )}
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

                    {activeTab === 'caja' && (
                        <div className="caja-section">
                            <h3>Apertura y Cierre de Caja</h3>
                            {cajaActiva ? (
                                <div className="caja-activa-card">
                                    <div className="status-indicator_open"><i className='bx bx-lock-open-alt'></i> CAJA ABIERTA</div>
                                    <p>Abierta por: <strong>{cajaActiva.opened_by_name}</strong></p>
                                    <p>Fecha/Hora de Apertura: <strong>{new Date(cajaActiva.opening_time).toLocaleString('es-AR')}</strong></p>
                                    <p>Saldo Inicial: <strong>${parseFloat(cajaActiva.opening_balance).toLocaleString('es-AR')}</strong></p>

                                    <h4 style={{ marginTop: '1.5rem' }}>Resumen de Ingresos Contabilizados</h4>
                                    <ul>
                                        {cajaSummary.length === 0 && <li>Sin movimientos aún.</li>}
                                        {cajaSummary.map((s, idx) => (
                                            <li key={idx}>
                                                {getMetodoPagoLabel(s.payment_method)}: <strong>${parseFloat(s.total).toLocaleString('es-AR')}</strong> ({s.tx_count} transacciones)
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="quick-actions" style={{ marginTop: '1.5rem' }}>
                                        <button className="btn-danger" onClick={() => handleOpenModal('cerrar_caja')}>
                                            <i className='bx bx-lock-alt'></i> Realizar Cierre de Caja
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="caja-activa-card cerrado">
                                    <div className="status-indicator_closed"><i className='bx bx-lock-alt'></i> CAJA CERRADA</div>
                                    <p>No hay ninguna caja abierta en este momento.</p>
                                    <div className="quick-actions" style={{ marginTop: '1.5rem' }}>
                                        <button className="btn-primary" onClick={() => handleOpenModal('abrir_caja')}>
                                            <i className='bx bx-lock-open-alt'></i> Abrir Caja Nueva
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'historial' && (
                        <div className="historial-section">
                            <h3>Historial de Pagos</h3>
                            <table className="payments-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Cliente / Alumno</th>
                                        <th>Concepto</th>
                                        <th>Método</th>
                                        <th>Monto</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historialPagos.map(pago => (
                                        <tr key={pago.id}>
                                            <td>{new Date(pago.payment_date).toLocaleDateString('es-AR')}</td>
                                            <td>{pago.concept === 'alquiler' && pago.notes?.includes(' - ') ? pago.notes.split(' - ')[1] : pago.user_name}</td>
                                            <td>{getConceptoLabel(pago.concept)}</td>
                                            <td>{getMetodoPagoLabel(pago.payment_method)}</td>
                                            <td className="amount">${pago.amount?.toLocaleString('es-AR')}</td>
                                            <td>
                                                <span className={`status-badge status-${pago.status}`}>
                                                    {pago.status === 'completed' ? 'Completado' : pago.status === 'refunded' ? 'Anulado' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn-icon" title="Imprimir Ticket" onClick={() => handlePrintTicket(pago)}>
                                                    <i className='bx bx-printer'></i>
                                                </button>
                                                {pago.status === 'completed' && (
                                                    <button className="btn-icon" style={{ color: '#dc2626' }} title="Anular Pago" onClick={() => handleOpenModal('cancelar_pago', pago)}>
                                                        <i className='bx bx-x-circle'></i>
                                                    </button>
                                                )}
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
                title={modalType === 'pago' ? 'Registrar Pago' : modalType === 'cuota' ? 'Nuevo Plan/Cuota' : modalType === 'abrir_caja' ? 'Abrir Caja' : modalType === 'cerrar_caja' ? 'Cerrar Caja' : modalType === 'cancelar_pago' ? 'Anular Pago Contablemente' : 'Ticket de Pago'}
                size={modalType === 'ticket' ? "sm" : "md"}
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
                            <div className="form-row">
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
                                    <label>Estado de Transacción</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="completed">Aprobado / Pagado</option>
                                        <option value="pending">Pendiente de Verificación (Transferencia/Débito)</option>
                                    </select>
                                </div>
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
                    ) : modalType === 'cuota' ? (
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
                    ) : modalType === 'abrir_caja' ? (
                        <>
                            <div className="form-group">
                                <label>Saldo Inicial (Efectivo en Caja)</label>
                                <input
                                    type="number"
                                    value={cajaFormData.opening_balance}
                                    onChange={(e) => setCajaFormData({ ...cajaFormData, opening_balance: e.target.value })}
                                    required
                                />
                            </div>
                        </>
                    ) : modalType === 'cerrar_caja' ? (
                        <>
                            <div className="form-group">
                                <label>Saldo Arrojado (Contado en Efectivo)</label>
                                <input
                                    type="number"
                                    value={cajaFormData.counted_balance}
                                    onChange={(e) => setCajaFormData({ ...cajaFormData, counted_balance: e.target.value })}
                                    required
                                    autoFocus
                                />
                                <small>Cuenta los billetes y monedas físicos en la caja e ingresa el total.</small>
                            </div>
                            <div className="form-group">
                                <label>Observaciones o Novedades (opcional)</label>
                                <textarea
                                    value={cajaFormData.notes}
                                    onChange={(e) => setCajaFormData({ ...cajaFormData, notes: e.target.value })}
                                    rows="3"
                                />
                            </div>
                        </>
                    ) : modalType === 'ticket' && selectedPago ? (
                        <div className="ticket-container" id="ticket-print-area">
                            <div className="ticket-header">
                                <h2>GIMNASIO MULTIESPACIO</h2>
                                <p>CUIT: 30-00000000-0</p>
                                <p>Comprobante de Pago</p>
                                <hr />
                            </div>
                            <div className="ticket-body">
                                <p><strong>Fecha:</strong> {new Date(selectedPago.payment_date).toLocaleString('es-AR')}</p>
                                <p><strong>Trámite:</strong> #{selectedPago.id}</p>
                                <p><strong>Cliente:</strong> {selectedPago.concept === 'alquiler' && selectedPago.notes?.includes(' - ') ? selectedPago.notes.split(' - ')[1] : selectedPago.user_name}</p>
                                <p><strong>Concepto:</strong> {getConceptoLabel(selectedPago.concept)}</p>
                                <p><strong>Medio de Pago:</strong> {getMetodoPagoLabel(selectedPago.payment_method)}</p>
                                <p><strong>Estado:</strong> {selectedPago.status}</p>
                            </div>
                            <div className="ticket-footer">
                                <hr />
                                <h3>TOTAL: ${selectedPago.amount?.toLocaleString('es-AR')}</h3>
                                <p>¡Gracias por elegirnos!</p>
                            </div>
                        </div>
                    ) : modalType === 'cancelar_pago' ? (
                        <>
                            <div className="form-group">
                                <label>Motivo de la Anulación</label>
                                <textarea
                                    value={cancelData.reason}
                                    onChange={(e) => setCancelData({ ...cancelData, reason: e.target.value })}
                                    rows="3"
                                    required
                                    placeholder="Ej: Error de tipeo, devolución, etc."
                                />
                                <small style={{ color: '#dc2626', marginTop: '0.5rem', display: 'block' }}>
                                    <i className='bx bx-error-circle'></i> Atención: Esta acción no borra el pago, pero lo marca como ANULADO y resta su valor del flujo de caja. Esta acción es irreversible.
                                </small>
                            </div>
                        </>
                    ) : null}

                    {modalType !== 'ticket' && (
                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                            <button type="submit" className={modalType === 'cancelar_pago' ? "btn-danger" : "btn-primary"}>
                                {modalType === 'pago' ? 'Registrar Pago' : modalType === 'cuota' ? 'Crear Plan' : modalType === 'abrir_caja' ? 'Abrir Caja' : modalType === 'cancelar_pago' ? 'Confirmar Anulación' : 'Ejecutar Cierre'}
                            </button>
                        </div>
                    )}
                    {modalType === 'ticket' && (
                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cerrar</button>
                            <button type="button" className="btn-primary" onClick={printTicketWindow}>
                                <i className='bx bx-printer'></i> Imprimir Comprobante
                            </button>
                        </div>
                    )}
                </form>
            </Modal>
        </div>
    );
};

export default GestionPagos;
