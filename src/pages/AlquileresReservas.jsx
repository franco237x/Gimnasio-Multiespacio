import { useState } from 'react';
import './AlquileresReservas.css';

const AlquileresReservas = () => {
    const [activeTab, setActiveTab] = useState('reservas');
    const [showModal, setShowModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const [reservas] = useState([
        { id: 1, cliente: 'Club de Fútbol Aurora', espacio: 'Cancha Principal', fecha: '2024-12-15', horario: '09:00 - 12:00', estado: 'confirmada', monto: 15000 },
        { id: 2, cliente: 'Escuela de Danza Sol', espacio: 'Sala Principal', fecha: '2024-12-16', horario: '18:00 - 21:00', estado: 'pendiente', monto: 8000 },
        { id: 3, cliente: 'Evento Corporativo XYZ', espacio: 'Salón de Eventos', fecha: '2024-12-20', horario: '14:00 - 20:00', estado: 'confirmada', monto: 25000 },
        { id: 4, cliente: 'Cumpleaños Juan', espacio: 'Sala B', fecha: '2024-12-22', horario: '15:00 - 19:00', estado: 'pendiente', monto: 6000 },
    ]);

    const [espacios] = useState([
        { id: 1, nombre: 'Cancha Principal', tipo: 'Deportivo', capacidad: 30, precioHora: 5000, estado: 'disponible' },
        { id: 2, nombre: 'Sala Principal', tipo: 'Multiusos', capacidad: 50, precioHora: 3000, estado: 'disponible' },
        { id: 3, nombre: 'Salón de Eventos', tipo: 'Eventos', capacidad: 100, precioHora: 4500, estado: 'ocupado' },
        { id: 4, nombre: 'Sala B', tipo: 'Clases', capacidad: 20, precioHora: 2000, estado: 'disponible' },
        { id: 5, nombre: 'Patio Exterior', tipo: 'Aire Libre', capacidad: 80, precioHora: 3500, estado: 'disponible' },
    ]);

    const [formData, setFormData] = useState({
        cliente: '',
        espacio: '',
        fecha: '',
        horaInicio: '',
        horaFin: '',
        observaciones: ''
    });

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        showNotification('✅ Reserva creada exitosamente', 'success');
        setShowModal(false);
    };

    const handleConfirm = (id) => {
        showNotification('✅ Reserva confirmada', 'success');
    };

    const handleCancel = (id) => {
        showNotification('❌ Reserva cancelada', 'success');
    };

    return (
        <div className="alquileres-reservas">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-building-house'></i> Alquileres y Reservas</h2>
                    <p>Gestiona los espacios y reservas del gimnasio</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <i className='bx bx-plus'></i> Nueva Reserva
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'reservas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reservas')}
                >
                    <i className='bx bx-calendar'></i> Reservas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'espacios' ? 'active' : ''}`}
                    onClick={() => setActiveTab('espacios')}
                >
                    <i className='bx bx-building'></i> Espacios
                </button>
            </div>

            {/* Reservas Tab */}
            {activeTab === 'reservas' && (
                <div className="reservas-section">
                    <div className="reservas-grid">
                        {reservas.map((reserva) => (
                            <div key={reserva.id} className={`reserva-card ${reserva.estado}`}>
                                <div className="reserva-header">
                                    <span className={`estado-badge ${reserva.estado}`}>
                                        {reserva.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                                    </span>
                                    <span className="reserva-id">#{reserva.id.toString().padStart(4, '0')}</span>
                                </div>
                                <div className="reserva-body">
                                    <h4>{reserva.cliente}</h4>
                                    <div className="reserva-details">
                                        <div className="detail">
                                            <i className='bx bx-map'></i>
                                            <span>{reserva.espacio}</span>
                                        </div>
                                        <div className="detail">
                                            <i className='bx bx-calendar'></i>
                                            <span>{reserva.fecha}</span>
                                        </div>
                                        <div className="detail">
                                            <i className='bx bx-time'></i>
                                            <span>{reserva.horario}</span>
                                        </div>
                                    </div>
                                    <div className="reserva-monto">
                                        <span className="monto-label">Total:</span>
                                        <span className="monto-value">${reserva.monto.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="reserva-actions">
                                    {reserva.estado === 'pendiente' && (
                                        <button className="btn-confirm" onClick={() => handleConfirm(reserva.id)}>
                                            <i className='bx bx-check'></i> Confirmar
                                        </button>
                                    )}
                                    <button className="btn-cancel" onClick={() => handleCancel(reserva.id)}>
                                        <i className='bx bx-x'></i> Cancelar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Espacios Tab */}
            {activeTab === 'espacios' && (
                <div className="espacios-section">
                    <div className="espacios-grid">
                        {espacios.map((espacio) => (
                            <div key={espacio.id} className="espacio-card">
                                <div className="espacio-icon">
                                    <i className='bx bx-building'></i>
                                </div>
                                <div className="espacio-info">
                                    <h4>{espacio.nombre}</h4>
                                    <span className="espacio-tipo">{espacio.tipo}</span>
                                    <div className="espacio-details">
                                        <span><i className='bx bx-group'></i> {espacio.capacidad} personas</span>
                                        <span><i className='bx bx-dollar'></i> ${espacio.precioHora.toLocaleString()}/hora</span>
                                    </div>
                                </div>
                                <span className={`estado-badge ${espacio.estado}`}>
                                    {espacio.estado === 'disponible' ? 'Disponible' : 'Ocupado'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><i className='bx bx-calendar-plus'></i> Nueva Reserva</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Cliente / Evento</label>
                                <input
                                    type="text"
                                    value={formData.cliente}
                                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                                    placeholder="Nombre del cliente o evento"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Espacio</label>
                                <select
                                    value={formData.espacio}
                                    onChange={(e) => setFormData({ ...formData, espacio: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar espacio</option>
                                    {espacios.filter(e => e.estado === 'disponible').map((esp) => (
                                        <option key={esp.id} value={esp.nombre}>
                                            {esp.nombre} - ${esp.precioHora}/hora
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fecha</label>
                                    <input
                                        type="date"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Hora Inicio</label>
                                    <input
                                        type="time"
                                        value={formData.horaInicio}
                                        onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Hora Fin</label>
                                    <input
                                        type="time"
                                        value={formData.horaFin}
                                        onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Observaciones</label>
                                <textarea
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    placeholder="Detalles adicionales (opcional)"
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Crear Reserva
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlquileresReservas;
