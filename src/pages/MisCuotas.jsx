import { useState } from 'react';
import './MisCuotas.css';

const MisCuotas = () => {
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const cuotaActual = {
        estado: 'al_dia',
        plan: 'Mensualidad Premium',
        precio: 8000,
        fechaPago: '2024-12-05',
        proximoVencimiento: '2025-01-05',
        diasRestantes: 25
    };

    const historial = [
        { id: 1, periodo: 'Diciembre 2024', monto: 8000, fechaPago: '2024-12-05', estado: 'pagada', metodo: 'Efectivo' },
        { id: 2, periodo: 'Noviembre 2024', monto: 8000, fechaPago: '2024-11-03', estado: 'pagada', metodo: 'Transferencia' },
        { id: 3, periodo: 'Octubre 2024', monto: 8000, fechaPago: '2024-10-02', estado: 'pagada', metodo: 'MercadoPago' },
        { id: 4, periodo: 'Septiembre 2024', monto: 7500, fechaPago: '2024-09-05', estado: 'pagada', metodo: 'Efectivo' },
        { id: 5, periodo: 'Agosto 2024', monto: 7500, fechaPago: '2024-08-01', estado: 'pagada', metodo: 'Tarjeta' },
    ];

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleDescargarComprobante = (id) => {
        showNotification('📄 Comprobante descargado correctamente', 'success');
    };

    return (
        <div className="mis-cuotas">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <h2><i className='bx bx-credit-card'></i> Mis Cuotas</h2>
                <p>Estado de tus pagos y membresía</p>
            </div>

            {/* Estado Actual */}
            <div className="cuota-actual-card">
                <div className="cuota-estado">
                    <div className={`estado-badge ${cuotaActual.estado}`}>
                        <i className='bx bx-check-circle'></i>
                        Al día
                    </div>
                    <div className="plan-info">
                        <h3>{cuotaActual.plan}</h3>
                        <span className="plan-precio">${cuotaActual.precio.toLocaleString()}/mes</span>
                    </div>
                </div>

                <div className="cuota-detalles">
                    <div className="detalle-item">
                        <span className="detalle-label">Último pago</span>
                        <span className="detalle-value">{cuotaActual.fechaPago}</span>
                    </div>
                    <div className="detalle-item">
                        <span className="detalle-label">Próximo vencimiento</span>
                        <span className="detalle-value">{cuotaActual.proximoVencimiento}</span>
                    </div>
                    <div className="detalle-item">
                        <span className="detalle-label">Días restantes</span>
                        <span className="detalle-value dias">{cuotaActual.diasRestantes} días</span>
                    </div>
                </div>

                <div className="progress-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(1 - cuotaActual.diasRestantes / 30) * 100}%` }}
                        ></div>
                    </div>
                    <span className="progress-text">Período en curso</span>
                </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="acciones-rapidas">
                <button className="accion-btn" onClick={() => showNotification('💳 Redirigiendo a MercadoPago...', 'success')}>
                    <i className='bx bx-credit-card'></i>
                    Pagar Online
                </button>
                <button className="accion-btn secondary" onClick={() => showNotification('📋 Detalle de tu plan descargado', 'success')}>
                    <i className='bx bx-file'></i>
                    Ver Plan
                </button>
            </div>

            {/* Historial */}
            <div className="historial-section">
                <h3><i className='bx bx-history'></i> Historial de Pagos</h3>
                <div className="historial-list">
                    {historial.map((pago) => (
                        <div key={pago.id} className="historial-item">
                            <div className="historial-info">
                                <span className="historial-periodo">{pago.periodo}</span>
                                <span className="historial-metodo">
                                    <i className='bx bx-wallet'></i> {pago.metodo}
                                </span>
                            </div>
                            <div className="historial-fecha">
                                <i className='bx bx-calendar'></i> {pago.fechaPago}
                            </div>
                            <div className="historial-monto">
                                ${pago.monto.toLocaleString()}
                            </div>
                            <span className={`estado-badge ${pago.estado}`}>Pagada</span>
                            <button
                                className="btn-comprobante"
                                onClick={() => handleDescargarComprobante(pago.id)}
                                title="Descargar comprobante"
                            >
                                <i className='bx bx-download'></i>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MisCuotas;
