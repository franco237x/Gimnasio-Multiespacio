import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI } from '../services/apiService';
import { differenceInDays } from 'date-fns';
import { ToastContainer, useToast } from '../components/ui/Toast';
import './MisCuotas.css';

const MisCuotas = () => {
    const { user } = useAuth();
    const { toasts, addToast, removeToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [historial, setHistorial] = useState([]);

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

    const handleDescargarComprobante = (id) => {
        addToast('📄 Función de comprobante en desarrollo', 'info');
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
                                            className="btn-comprobante"
                                            onClick={() => handleDescargarComprobante(pago.id)}
                                            title="Descargar comprobante"
                                        >
                                            <i className='bx bx-download'></i>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default MisCuotas;
