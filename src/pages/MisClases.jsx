import { useState } from 'react';
import './MisClases.css';

const MisClases = () => {
    const [viewMode, setViewMode] = useState('semana');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const clasesHoy = [
        { id: 1, nombre: 'CrossFit', hora: '08:00 - 09:00', sala: 'Sala B', inscritos: 15, capacidad: 15 },
        { id: 2, nombre: 'Funcional', hora: '10:00 - 11:00', sala: 'Sala B', inscritos: 12, capacidad: 20 },
        { id: 3, nombre: 'Spinning', hora: '18:00 - 19:00', sala: 'Sala Spinning', inscritos: 20, capacidad: 25 },
    ];

    const horarioSemana = [
        {
            dia: 'Lunes', clases: [
                { nombre: 'CrossFit', hora: '08:00', sala: 'Sala B' },
                { nombre: 'Funcional', hora: '10:00', sala: 'Sala B' }
            ]
        },
        {
            dia: 'Martes', clases: [
                { nombre: 'Spinning', hora: '18:00', sala: 'Sala Spinning' }
            ]
        },
        {
            dia: 'Miércoles', clases: [
                { nombre: 'CrossFit', hora: '08:00', sala: 'Sala B' },
                { nombre: 'Funcional', hora: '19:00', sala: 'Sala B' }
            ]
        },
        {
            dia: 'Jueves', clases: [
                { nombre: 'Funcional', hora: '19:00', sala: 'Sala B' }
            ]
        },
        {
            dia: 'Viernes', clases: [
                { nombre: 'CrossFit', hora: '08:00', sala: 'Sala B' },
                { nombre: 'Spinning', hora: '18:00', sala: 'Sala Spinning' }
            ]
        },
        {
            dia: 'Sábado', clases: [
                { nombre: 'CrossFit', hora: '10:00', sala: 'Sala B' }
            ]
        },
    ];

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handlePasarLista = (claseId) => {
        showNotification('📋 Lista de asistencia abierta', 'success');
    };

    return (
        <div className="mis-clases">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-chalkboard'></i> Mis Clases</h2>
                    <p>Gestiona tus clases y horarios</p>
                </div>
                <div className="view-toggle">
                    <button
                        className={viewMode === 'hoy' ? 'active' : ''}
                        onClick={() => setViewMode('hoy')}
                    >
                        <i className='bx bx-calendar-check'></i> Hoy
                    </button>
                    <button
                        className={viewMode === 'semana' ? 'active' : ''}
                        onClick={() => setViewMode('semana')}
                    >
                        <i className='bx bx-calendar-week'></i> Semana
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon">
                        <i className='bx bx-calendar'></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">3</span>
                        <span className="stat-label">Clases hoy</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <i className='bx bx-group'></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">47</span>
                        <span className="stat-label">Alumnos hoy</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon cyan">
                        <i className='bx bx-calendar-event'></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">15</span>
                        <span className="stat-label">Clases semana</span>
                    </div>
                </div>
            </div>

            {/* Vista Hoy */}
            {viewMode === 'hoy' && (
                <div className="clases-hoy">
                    <h3><i className='bx bx-sun'></i> Clases de Hoy</h3>
                    <div className="clases-lista">
                        {clasesHoy.map((clase) => (
                            <div key={clase.id} className="clase-card">
                                <div className="clase-hora">
                                    <span className="hora">{clase.hora.split(' - ')[0]}</span>
                                    <span className="duracion">1h</span>
                                </div>
                                <div className="clase-info">
                                    <h4>{clase.nombre}</h4>
                                    <p><i className='bx bx-map'></i> {clase.sala}</p>
                                </div>
                                <div className="clase-alumnos">
                                    <div className="alumnos-count">
                                        <i className='bx bx-group'></i>
                                        <span>{clase.inscritos}/{clase.capacidad}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${(clase.inscritos / clase.capacidad) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <button
                                    className="btn-asistencia"
                                    onClick={() => handlePasarLista(clase.id)}
                                >
                                    <i className='bx bx-check-square'></i>
                                    Pasar Lista
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vista Semana */}
            {viewMode === 'semana' && (
                <div className="horario-semanal">
                    <h3><i className='bx bx-calendar'></i> Horario Semanal</h3>
                    <div className="semana-grid">
                        {horarioSemana.map((dia) => (
                            <div key={dia.dia} className="dia-column">
                                <div className="dia-header">{dia.dia}</div>
                                <div className="dia-clases">
                                    {dia.clases.map((clase, idx) => (
                                        <div key={idx} className="clase-mini">
                                            <span className="mini-hora">{clase.hora}</span>
                                            <span className="mini-nombre">{clase.nombre}</span>
                                            <span className="mini-sala">{clase.sala}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MisClases;
