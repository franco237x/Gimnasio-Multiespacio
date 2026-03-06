import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI } from '../services/apiService';
import { differenceInDays } from 'date-fns';
import Modal from '../components/ui/Modal';
import { ToastContainer, useToast } from '../components/ui/Toast';
import './MisCuotas.css';

const MisCuotas = () => {
    const { user } = useAuth();
    const { toasts, addToast, removeToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [selectedPago, setSelectedPago] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [subRes, histRes] = await Promise.all([
                paymentsAPI.getSubscription(user.id),
                paymentsAPI.getByUser(user.id)
            ]);

            if (subRes.success) {
                setSubscription(subRes.data);
            }
            if (histRes.success) {
                setHistorial(histRes.data || []);
            }
        } catch (error) {
            console.error('Error al cargar datos', error);
            addToast('Error al cargar tu suscripción', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDescargarComprobante = (pago) => {
        setSelectedPago(pago);
        setShowModal(true);
    };

    const printTicketWindow = () => {
        const printableElements = document.getElementById('ticket-print-area').innerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = printableElements;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    const getConceptoLabel = (concept) => {
        const labels = {
            mensualidad: 'Mensualidad', inscripcion: 'Inscripción',
            clase_especial: 'Clase Especial', alquiler: 'Alquiler', otro: 'Otro'
        };
        return labels[concept] || concept;
    };

    const getMetodoPagoLabel = (method) => {
        const labels = {
            efectivo: 'Efectivo', tarjeta: 'Tarjeta',
            transferencia: 'Transferencia', mercadopago: 'MercadoPago'
        };
        return labels[method] || method;
    };

    const handlePagarOnline = () => {
        addToast('💳 La integración de pago online en MercadoPago está en desarrollo', 'info');
    };

    // Calcular días restantes
    let diasRestantes = 0;
    let cuotaEstado = 'inactiva';

    if (subscription && subscription.end_date) {
        const endDate = new Date(subscription.end_date);
        diasRestantes = differenceInDays(endDate, new Date());

        if (diasRestantes > 5) cuotaEstado = 'al_dia';
        else if (diasRestantes >= 0) cuotaEstado = 'proximo_vencimiento';
        else cuotaEstado = 'vencida';
    }

    return (
        <div className="mis-cuotas">
            <div className="page-header">
                <h2><i className='bx bx-credit-card'></i> Mis Cuotas</h2>
                <p>Estado de tus pagos y membresía</p>
            </div>

            {loading ? (
                <div className="loading-state">
                    <i className='bx bx-loader-alt bx-spin'></i>
                    <p>Cargando información...</p>
                </div>
            ) : (
                <>
                    {/* Estado Actual */}
                    <div className="cuota-actual-card">
                        {subscription ? (
                            <>
                                <div className="cuota-estado">
                                    <div className={`estado-badge ${cuotaEstado}`}>
                                        {cuotaEstado === 'al_dia' && <><i className='bx bx-check-circle'></i> Al día</>}
                                        {cuotaEstado === 'proximo_vencimiento' && <><i className='bx bx-error-circle'></i> Próximo a Vencer</>}
                                        {cuotaEstado === 'vencida' && <><i className='bx bx-x-circle'></i> Vencida</>}
                                    </div>
                                    <div className="plan-info">
                                        <h3>{subscription.plan_name}</h3>
                                        <span className="plan-precio">${Number(subscription.plan_price).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="cuota-detalles">
                                    <div className="detalle-item">
                                        <span className="detalle-label">Inicio</span>
                                        <span className="detalle-value">{new Date(subscription.start_date).toLocaleDateString('es-AR')}</span>
                                    </div>
                                    <div className="detalle-item">
                                        <span className="detalle-label">Vencimiento</span>
                                        <span className="detalle-value">{new Date(subscription.end_date).toLocaleDateString('es-AR')}</span>
                                    </div>
                                    <div className="detalle-item">
                                        <span className="detalle-label">Días restantes</span>
                                        <span className={`detalle-value dias ${cuotaEstado}`}>
                                            {diasRestantes >= 0 ? `${diasRestantes} días` : <span style={{ color: '#ef4444' }}>Expirada</span>}
                                        </span>
                                    </div>
                                </div>

                                <div className="progress-container">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${Math.max(0, Math.min(100, (1 - (Math.max(0, diasRestantes) / 30)) * 100))}%`,
                                                backgroundColor: cuotaEstado === 'al_dia' ? '#10b981' : cuotaEstado === 'proximo_vencimiento' ? '#f59e0b' : '#ef4444'
                                            }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">Progreso del mes en curso</span>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state" style={{ padding: '20px', textAlign: 'center' }}>
                                <i className='bx bx-sad' style={{ fontSize: '3rem', color: '#9ca3af', marginBottom: '10px' }}></i>
                                <p style={{ color: '#e5e7eb' }}>No tienes una suscripción activa.</p>
                                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Contacta con recepción para adquirir un plan.</p>
                            </div>
                        )}
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="acciones-rapidas">
                        <button className="accion-btn" onClick={handlePagarOnline}>
                            <i className='bx bx-credit-card'></i>
                            Pagar Online
                        </button>
                    </div>

                    {/* Historial */}
                    <div className="historial-section">
                        <h3><i className='bx bx-history'></i> Historial de Pagos</h3>
                        <div className="historial-list">
                            {historial.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#9ca3af', margin: '20px 0' }}>Aún no tienes pagos registrados.</p>
                            ) : (
                                historial.map((pago) => (
                                    <div key={pago.id} className="historial-item">
                                        <div className="historial-info">
                                            <span className="historial-periodo" style={{ textTransform: 'capitalize' }}>{pago.concept}</span>
                                            <span className="historial-metodo" style={{ textTransform: 'capitalize' }}>
                                                <i className='bx bx-wallet'></i> {pago.payment_method}
                                            </span>
                                        </div>
                                        <div className="historial-fecha">
                                            <i className='bx bx-calendar'></i> {new Date(pago.payment_date).toLocaleDateString('es-AR')}
                                        </div>
                                        <div className="historial-monto">
                                            ${Number(pago.amount).toLocaleString()}
                                        </div>
                                        <span className={`estado-badge ${pago.status === 'completed' ? 'pagada' : 'vencida'}`}>
                                            {pago.status === 'completed' ? 'Pagada' : pago.status === 'refunded' ? 'Anulada' : pago.status}
                                        </span>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleDescargarComprobante(pago)}
                                            title="Imprimir Ticket"
                                        >
                                            <i className='bx bx-printer'></i>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Modal de Comprobante */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Comprobante de Pago"
                size="sm"
            >
                {selectedPago && (
                    <>
                        <div className="ticket-container" id="ticket-print-area">
                            <div className="ticket-header" style={{ textAlign: 'center', marginBottom: '15px' }}>
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>GIMNASIO MULTIESPACIO</h2>
                                <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>CUIT: 30-00000000-0</p>
                                <p style={{ fontSize: '0.9rem', margin: '5px 0' }}>Comprobante de Pago</p>
                                <hr style={{ borderTop: '1px dashed #ccc', margin: '15px 0' }} />
                            </div>
                            <div className="ticket-body" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                <p><strong>Fecha:</strong> {new Date(selectedPago.payment_date).toLocaleString('es-AR')}</p>
                                <p><strong>Trámite:</strong> #{selectedPago.id}</p>
                                <p><strong>Cliente:</strong> {selectedPago.user_name || user.name}</p>
                                <p><strong>Concepto:</strong> {getConceptoLabel(selectedPago.concept)}</p>
                                <p><strong>Medio de Pago:</strong> {getMetodoPagoLabel(selectedPago.payment_method)}</p>
                                <p><strong>Estado:</strong> {selectedPago.status}</p>
                            </div>
                            <div className="ticket-footer" style={{ marginTop: '20px' }}>
                                <hr style={{ borderTop: '1px dashed #ccc', margin: '15px 0' }} />
                                <h3 style={{ fontSize: '1.2rem', textAlign: 'right' }}>TOTAL: ${Number(selectedPago.amount).toLocaleString('es-AR')}</h3>
                                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', fontStyle: 'italic' }}>¡Gracias por entrenar con nosotros!</p>
                            </div>
                        </div>
                        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                            <button type="button" className="btn-primary" onClick={printTicketWindow}>
                                <i className='bx bx-printer'></i> Imprimir Comprobante
                            </button>
                        </div>
                    </>
                )}
            </Modal>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default MisCuotas;
