import { useState } from 'react';
import './GestionPagos.css';

const GestionPagos = () => {
    const [activeTab, setActiveTab] = useState('pagos');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [formData, setFormData] = useState({
        alumnoId: '',
        monto: '',
        concepto: 'mensualidad',
        metodoPago: 'efectivo',
        fechaVencimiento: ''
    });
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // Datos simulados de alumnos
    const alumnos = [
        { id: 1, nombre: 'Juan Pérez', dni: '12345678', cuotaEstado: 'al_dia', ultimoPago: '2024-12-01' },
        { id: 2, nombre: 'María García', dni: '23456789', cuotaEstado: 'pendiente', ultimoPago: '2024-11-15' },
        { id: 3, nombre: 'Carlos López', dni: '34567890', cuotaEstado: 'vencida', ultimoPago: '2024-10-20' },
        { id: 4, nombre: 'Ana Martínez', dni: '45678901', cuotaEstado: 'al_dia', ultimoPago: '2024-12-05' },
        { id: 5, nombre: 'Pedro Sánchez', dni: '56789012', cuotaEstado: 'pendiente', ultimoPago: '2024-11-28' },
    ];

    // Historial de pagos simulado
    const [historialPagos] = useState([
        { id: 1, alumno: 'Juan Pérez', monto: 5000, fecha: '2024-12-01', concepto: 'Mensualidad Diciembre', estado: 'completado' },
        { id: 2, alumno: 'Ana Martínez', monto: 5000, fecha: '2024-12-05', concepto: 'Mensualidad Diciembre', estado: 'completado' },
        { id: 3, alumno: 'María García', monto: 2500, fecha: '2024-11-15', concepto: 'Mensualidad Nov (parcial)', estado: 'parcial' },
    ]);

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleOpenModal = (type) => {
        setModalType(type);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            alumnoId: '',
            monto: '',
            concepto: 'mensualidad',
            metodoPago: 'efectivo',
            fechaVencimiento: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (modalType === 'pago') {
            showNotification('✅ Pago registrado exitosamente', 'success');
        } else if (modalType === 'cuota') {
            showNotification('✅ Cuota creada exitosamente', 'success');
        }
        handleCloseModal();
    };

    const handleGenerarComprobante = (pagoId) => {
        showNotification('📄 Comprobante generado y listo para imprimir', 'success');
    };

    const getEstadoBadge = (estado) => {
        switch (estado) {
            case 'al_dia':
                return <span className="badge badge-success">Al día</span>;
            case 'pendiente':
                return <span className="badge badge-warning">Pendiente</span>;
            case 'vencida':
                return <span className="badge badge-danger">Vencida</span>;
            case 'completado':
                return <span className="badge badge-success">Completado</span>;
            case 'parcial':
                return <span className="badge badge-warning">Parcial</span>;
            default:
                return <span className="badge">{estado}</span>;
        }
    };

    return (
        <div className="gestion-pagos">
            {/* Notificación */}
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="pagos-header">
                <h2><i className='bx bx-money'></i> Gestión de Pagos</h2>
                <p>Administra pagos, cuotas y comprobantes desde un solo lugar</p>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'pagos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pagos')}
                >
                    <i className='bx bx-credit-card'></i>
                    Registrar Pago
                </button>
                <button
                    className={`tab-btn ${activeTab === 'cuotas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cuotas')}
                >
                    <i className='bx bx-plus-circle'></i>
                    Alta de Cuotas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
                    onClick={() => setActiveTab('historial')}
                >
                    <i className='bx bx-history'></i>
                    Historial
                </button>
            </div>

            {/* Contenido según tab activo */}
            <div className="tab-content">
                {/* Tab Pagos */}
                {activeTab === 'pagos' && (
                    <div className="pagos-section">
                        <div className="section-actions">
                            <button className="btn-primary" onClick={() => handleOpenModal('pago')}>
                                <i className='bx bx-plus'></i> Nuevo Pago
                            </button>
                        </div>

                        <div className="alumnos-table-container">
                            <h3>Estado de Cuotas de Alumnos</h3>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Alumno</th>
                                        <th>DNI</th>
                                        <th>Estado Cuota</th>
                                        <th>Último Pago</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alumnos.map((alumno) => (
                                        <tr key={alumno.id}>
                                            <td>
                                                <div className="alumno-info">
                                                    <div className="alumno-avatar">
                                                        {alumno.nombre.charAt(0)}
                                                    </div>
                                                    {alumno.nombre}
                                                </div>
                                            </td>
                                            <td>{alumno.dni}</td>
                                            <td>{getEstadoBadge(alumno.cuotaEstado)}</td>
                                            <td>{alumno.ultimoPago}</td>
                                            <td>
                                                <button
                                                    className="btn-action btn-pay"
                                                    onClick={() => handleOpenModal('pago')}
                                                    title="Registrar Pago"
                                                >
                                                    <i className='bx bx-dollar'></i>
                                                </button>
                                                <button
                                                    className="btn-action btn-receipt"
                                                    onClick={() => handleGenerarComprobante(alumno.id)}
                                                    title="Generar Comprobante"
                                                >
                                                    <i className='bx bx-file'></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab Cuotas */}
                {activeTab === 'cuotas' && (
                    <div className="cuotas-section">
                        <div className="section-actions">
                            <button className="btn-primary" onClick={() => handleOpenModal('cuota')}>
                                <i className='bx bx-plus'></i> Nueva Cuota
                            </button>
                        </div>

                        <div className="cuotas-cards">
                            <div className="cuota-card">
                                <div className="cuota-icon">
                                    <i className='bx bx-dumbbell'></i>
                                </div>
                                <div className="cuota-details">
                                    <h4>Mensualidad Básica</h4>
                                    <p className="cuota-precio">$5,000</p>
                                    <span className="cuota-desc">Acceso a sala de musculación</span>
                                </div>
                                <span className="badge badge-success">Activa</span>
                            </div>

                            <div className="cuota-card">
                                <div className="cuota-icon premium">
                                    <i className='bx bx-star'></i>
                                </div>
                                <div className="cuota-details">
                                    <h4>Mensualidad Premium</h4>
                                    <p className="cuota-precio">$8,000</p>
                                    <span className="cuota-desc">Musculación + Clases grupales</span>
                                </div>
                                <span className="badge badge-success">Activa</span>
                            </div>

                            <div className="cuota-card">
                                <div className="cuota-icon vip">
                                    <i className='bx bx-crown'></i>
                                </div>
                                <div className="cuota-details">
                                    <h4>Pase VIP</h4>
                                    <p className="cuota-precio">$12,000</p>
                                    <span className="cuota-desc">Acceso ilimitado + Personal Trainer</span>
                                </div>
                                <span className="badge badge-success">Activa</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Historial */}
                {activeTab === 'historial' && (
                    <div className="historial-section">
                        <h3>Historial de Pagos</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Alumno</th>
                                    <th>Monto</th>
                                    <th>Fecha</th>
                                    <th>Concepto</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historialPagos.map((pago) => (
                                    <tr key={pago.id}>
                                        <td>#{pago.id.toString().padStart(4, '0')}</td>
                                        <td>{pago.alumno}</td>
                                        <td className="monto">${pago.monto.toLocaleString()}</td>
                                        <td>{pago.fecha}</td>
                                        <td>{pago.concepto}</td>
                                        <td>{getEstadoBadge(pago.estado)}</td>
                                        <td>
                                            <button
                                                className="btn-action btn-receipt"
                                                onClick={() => handleGenerarComprobante(pago.id)}
                                                title="Generar Comprobante"
                                            >
                                                <i className='bx bx-printer'></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {modalType === 'pago' ? (
                                    <><i className='bx bx-credit-card'></i> Registrar Nuevo Pago</>
                                ) : (
                                    <><i className='bx bx-plus-circle'></i> Crear Nueva Cuota</>
                                )}
                            </h3>
                            <button className="modal-close" onClick={handleCloseModal}>
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Alumno</label>
                                <select
                                    value={formData.alumnoId}
                                    onChange={(e) => setFormData({ ...formData, alumnoId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar alumno</option>
                                    {alumnos.map((alumno) => (
                                        <option key={alumno.id} value={alumno.id}>{alumno.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Monto ($)</label>
                                <input
                                    type="number"
                                    value={formData.monto}
                                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                    placeholder="Ingrese monto"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Concepto</label>
                                <select
                                    value={formData.concepto}
                                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                                >
                                    <option value="mensualidad">Mensualidad</option>
                                    <option value="inscripcion">Inscripción</option>
                                    <option value="clase_especial">Clase Especial</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            {modalType === 'pago' && (
                                <div className="form-group">
                                    <label>Método de Pago</label>
                                    <select
                                        value={formData.metodoPago}
                                        onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta de Débito/Crédito</option>
                                        <option value="transferencia">Transferencia Bancaria</option>
                                        <option value="mercadopago">MercadoPago</option>
                                    </select>
                                </div>
                            )}

                            {modalType === 'cuota' && (
                                <div className="form-group">
                                    <label>Fecha de Vencimiento</label>
                                    <input
                                        type="date"
                                        value={formData.fechaVencimiento}
                                        onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    {modalType === 'pago' ? 'Registrar Pago' : 'Crear Cuota'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionPagos;
