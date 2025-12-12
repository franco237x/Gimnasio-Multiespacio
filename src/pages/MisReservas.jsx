import { useState } from 'react';
import './MisReservas.css';

const MisReservas = () => {
    const [showModal, setShowModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const [reservas] = useState([
        { id: 1, clase: 'Yoga', profesor: 'Laura Fernández', fecha: '2024-12-12', hora: '08:00', estado: 'confirmada' },
        { id: 2, clase: 'CrossFit', profesor: 'Carlos López', fecha: '2024-12-13', hora: '10:00', estado: 'confirmada' },
        { id: 3, clase: 'Spinning', profesor: 'Carlos López', fecha: '2024-12-14', hora: '18:00', estado: 'pendiente' },
    ]);

    const clasesDisponibles = [
        { id: 1, nombre: 'Yoga', profesor: 'Laura Fernández', dia: 'Lunes', hora: '08:00', cuposDisponibles: 5 },
        { id: 2, nombre: 'CrossFit', profesor: 'Carlos López', dia: 'Lunes', hora: '10:00', cuposDisponibles: 0 },
        { id: 3, nombre: 'Pilates', profesor: 'Laura Fernández', dia: 'Miércoles', hora: '09:00', cuposDisponibles: 8 },
        { id: 4, nombre: 'Spinning', profesor: 'Carlos López', dia: 'Martes', hora: '18:00', cuposDisponibles: 5 },
        { id: 5, nombre: 'Zumba', profesor: 'Ana Martínez', dia: 'Viernes', hora: '17:00', cuposDisponibles: 10 },
        { id: 6, nombre: 'Funcional', profesor: 'Carlos López', dia: 'Jueves', hora: '19:00', cuposDisponibles: 2 },
    ];

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleReservar = (clase) => {
        showNotification(`✅ Reserva confirmada para ${clase.nombre}`, 'success');
        setShowModal(false);
    };

    const handleCancelar = (id) => {
        showNotification('❌ Reserva cancelada', 'success');
    };

    return (
        <div className="mis-reservas">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-calendar-check'></i> Mis Reservas</h2>
                    <p>Gestiona tus clases y actividades</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <i className='bx bx-plus'></i> Nueva Reserva
                </button>
            </div>

            {/* Próximas Reservas */}
            <div className="seccion">
                <h3><i className='bx bx-calendar'></i> Próximas Clases</h3>
                <div className="reservas-grid">
                    {reservas.map((reserva) => (
                        <div key={reserva.id} className={`reserva-card ${reserva.estado}`}>
                            <div className="reserva-icon">
                                <i className='bx bx-dumbbell'></i>
                            </div>
                            <div className="reserva-content">
                                <h4>{reserva.clase}</h4>
                                <p className="profesor">
                                    <i className='bx bx-user'></i> {reserva.profesor}
                                </p>
                                <div className="reserva-datetime">
                                    <span><i className='bx bx-calendar'></i> {reserva.fecha}</span>
                                    <span><i className='bx bx-time'></i> {reserva.hora}</span>
                                </div>
                            </div>
                            <div className="reserva-actions">
                                <span className={`estado-badge ${reserva.estado}`}>
                                    {reserva.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                                </span>
                                <button
                                    className="btn-cancelar"
                                    onClick={() => handleCancelar(reserva.id)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Estadísticas */}
            <div className="stats-row">
                <div className="stat-item">
                    <div className="stat-value">12</div>
                    <div className="stat-label">Clases este mes</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">3</div>
                    <div className="stat-label">Próximas reservas</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">48</div>
                    <div className="stat-label">Clases totales</div>
                </div>
            </div>

            {/* Modal Nueva Reserva */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><i className='bx bx-calendar-plus'></i> Reservar Clase</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-subtitle">Selecciona una clase para reservar:</p>
                            <div className="clases-lista">
                                {clasesDisponibles.map((clase) => (
                                    <div
                                        key={clase.id}
                                        className={`clase-item ${clase.cuposDisponibles === 0 ? 'sin-cupos' : ''}`}
                                    >
                                        <div className="clase-info">
                                            <h4>{clase.nombre}</h4>
                                            <p><i className='bx bx-user'></i> {clase.profesor}</p>
                                            <p><i className='bx bx-calendar'></i> {clase.dia} {clase.hora}</p>
                                        </div>
                                        <div className="clase-cupos">
                                            {clase.cuposDisponibles > 0 ? (
                                                <>
                                                    <span className="cupos-count">{clase.cuposDisponibles} cupos</span>
                                                    <button
                                                        className="btn-reservar"
                                                        onClick={() => handleReservar(clase)}
                                                    >
                                                        Reservar
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="sin-cupos-badge">Sin cupos</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MisReservas;
