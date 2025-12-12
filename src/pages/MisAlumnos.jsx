import { useState } from 'react';
import './MisAlumnos.css';

const MisAlumnos = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const [alumnos] = useState([
        { id: 1, nombre: 'Juan Pérez', email: 'juan@email.com', clases: ['CrossFit', 'Funcional'], asistencia: 92, ultimaClase: '2024-12-10' },
        { id: 2, nombre: 'María García', email: 'maria@email.com', clases: ['CrossFit'], asistencia: 88, ultimaClase: '2024-12-11' },
        { id: 3, nombre: 'Pedro Sánchez', email: 'pedro@email.com', clases: ['Spinning', 'Funcional'], asistencia: 95, ultimaClase: '2024-12-11' },
        { id: 4, nombre: 'Laura Gómez', email: 'laura@email.com', clases: ['CrossFit', 'Spinning'], asistencia: 78, ultimaClase: '2024-12-09' },
        { id: 5, nombre: 'Carlos Rodríguez', email: 'carlos@email.com', clases: ['Funcional'], asistencia: 100, ultimaClase: '2024-12-11' },
        { id: 6, nombre: 'Ana Martínez', email: 'ana@email.com', clases: ['CrossFit', 'Funcional', 'Spinning'], asistencia: 85, ultimaClase: '2024-12-10' },
    ]);

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleEnviarMensaje = (alumnoId) => {
        showNotification('📧 Mensaje enviado correctamente', 'success');
    };

    const filteredAlumnos = alumnos.filter(a =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="mis-alumnos">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-group'></i> Mis Alumnos</h2>
                    <p>Gestiona tus alumnos y su progreso</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon">
                        <i className='bx bx-user'></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{alumnos.length}</span>
                        <span className="stat-label">Total Alumnos</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <i className='bx bx-check-circle'></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">89%</span>
                        <span className="stat-label">Asistencia Promedio</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <i className='bx bx-star'></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">4.8</span>
                        <span className="stat-label">Valoración</span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="search-bar">
                <i className='bx bx-search'></i>
                <input
                    type="text"
                    placeholder="Buscar alumno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Lista de Alumnos */}
            <div className="alumnos-grid">
                {filteredAlumnos.map((alumno) => (
                    <div key={alumno.id} className="alumno-card">
                        <div className="alumno-header">
                            <div className="alumno-avatar">
                                {alumno.nombre.charAt(0)}
                            </div>
                            <div className="alumno-info">
                                <h4>{alumno.nombre}</h4>
                                <p>{alumno.email}</p>
                            </div>
                        </div>
                        <div className="alumno-clases">
                            {alumno.clases.map((clase, idx) => (
                                <span key={idx} className="clase-tag">{clase}</span>
                            ))}
                        </div>
                        <div className="alumno-stats">
                            <div className="stat-mini">
                                <span className="stat-mini-label">Asistencia</span>
                                <div className="asistencia-bar">
                                    <div
                                        className="asistencia-fill"
                                        style={{ width: `${alumno.asistencia}%` }}
                                    ></div>
                                </div>
                                <span className="stat-mini-value">{alumno.asistencia}%</span>
                            </div>
                            <div className="stat-mini">
                                <span className="stat-mini-label">Última clase</span>
                                <span className="stat-mini-value">{alumno.ultimaClase}</span>
                            </div>
                        </div>
                        <div className="alumno-actions">
                            <button
                                className="btn-action"
                                onClick={() => handleEnviarMensaje(alumno.id)}
                                title="Enviar mensaje"
                            >
                                <i className='bx bx-message-detail'></i>
                            </button>
                            <button
                                className="btn-action"
                                onClick={() => showNotification('📊 Ficha del alumno abierta', 'success')}
                                title="Ver ficha"
                            >
                                <i className='bx bx-id-card'></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MisAlumnos;
