import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { activitiesAPI } from '../services/apiService';
import { ToastContainer, useToast } from '../components/ui/Toast';
import './MisReservas.css';

const MisReservas = () => {
    const { user } = useAuth();
    const { toasts, addToast, removeToast } = useToast();
    const [actividades, setActividades] = useState([]);
    const [misInscripciones, setMisInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('mis-inscripciones');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [actRes, insRes] = await Promise.all([
                activitiesAPI.getAll(),
                activitiesAPI.getStudentEnrollments(user.id)
            ]);

            if (actRes.success) {
                setActividades(actRes.data || []);
            }
            if (insRes.success) {
                setMisInscripciones(insRes.data || []);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
            addToast('❌ Error al cargar actividades', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInscribirse = async (actividad) => {
        if (misInscripciones.find(ins => ins.id === actividad.id)) {
            addToast('ℹ️ Ya estás inscripto en esta clase', 'info');
            return;
        }

        try {
            await activitiesAPI.enrollStudent(actividad.id, user.id);
            addToast(`✅ Te inscribiste en ${actividad.name}`, 'success');
            loadData();
            setActiveTab('mis-inscripciones');
        } catch (error) {
            addToast('❌ ' + (error.message || 'Error al inscribirse'), 'error');
        }
    };

    const handleDesinscribirse = async (actividad) => {
        try {
            await activitiesAPI.unenrollStudent(actividad.id, user.id);
            addToast(`🗑️ Te desinscribiste de ${actividad.name}`, 'success');
            loadData();
        } catch (error) {
            addToast('❌ ' + (error.message || 'Error al cancelar inscripción'), 'error');
        }
    };

    const getDayLabel = (day) => {
        const days = {
            lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
            jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo'
        };
        return days[day] || day;
    };

    const actividadesDisponibles = actividades.filter(a =>
        a.status === 'active' && (a.enrolled_count ?? 0) < (a.capacity ?? 999)
    );

    return (
        <div className="mis-reservas">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-calendar-check'></i> Mis Clases y Actividades</h2>
                    <p>Explorá y gestioná tus clases en el gimnasio</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-item">
                    <div className="stat-value">{misInscripciones.length}</div>
                    <div className="stat-label">Inscripciones actuales</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{actividadesDisponibles.length}</div>
                    <div className="stat-label">Clases con cupos libres</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{[...new Set(actividades.map(a => a.teacher_name))].filter(Boolean).length}</div>
                    <div className="stat-label">Profesores activos</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'mis-inscripciones' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mis-inscripciones')}
                    >
                        <i className='bx bx-bookmark-heart'></i> Mis Inscripciones
                    </button>
                    <button
                        className={`tab ${activeTab === 'explorar' ? 'active' : ''}`}
                        onClick={() => setActiveTab('explorar')}
                    >
                        <i className='bx bx-search'></i> Explorar Clases
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state" style={{ textAlign: 'center', padding: '50px 0', color: '#0891b2' }}>
                    <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '3rem' }}></i>
                    <p>Cargando información...</p>
                </div>
            ) : (
                <div className="reservas-grid">
                    {activeTab === 'mis-inscripciones' && (
                        misInscripciones.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', gridColumn: '1 / -1' }}>
                                <i className='bx bx-bookmark' style={{ fontSize: '4rem', display: 'block', marginBottom: '10px' }}></i>
                                Aún no estás inscripto en ninguna clase.
                                <br />
                                <button className="btn-primary" style={{ marginTop: '15px' }} onClick={() => setActiveTab('explorar')}>Explorar Clases</button>
                            </div>
                        ) : (
                            misInscripciones.map((actividad) => (
                                <div key={actividad.id} className="reserva-card confirmada">
                                    <div className="reserva-icon">
                                        <i className='bx bx-check-circle' style={{ color: '#10b981' }}></i>
                                    </div>
                                    <div className="reserva-content">
                                        <h4>{actividad.name}</h4>
                                        <p className="profesor">
                                            <i className='bx bx-user'></i> {actividad.teacher_name || 'Sin asignar'}
                                        </p>
                                        <div className="reserva-datetime">
                                            {actividad.day_of_week?.split(',').map((d, i) => (
                                                <span key={i}><i className='bx bx-calendar'></i> {getDayLabel(d.trim())}</span>
                                            ))}
                                            <span><i className='bx bx-time'></i> {actividad.start_time?.slice(0, 5)} - {actividad.end_time?.slice(0, 5)}</span>
                                        </div>
                                        {actividad.space_name && (
                                            <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '4px' }}>
                                                <i className='bx bx-building-house'></i> {actividad.space_name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="reserva-actions">
                                        <span className="estado-badge confirmada">Inscripto</span>
                                        <button
                                            className="btn-accion-peligro"
                                            onClick={() => handleDesinscribirse(actividad)}
                                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            <i className='bx bx-trash'></i> Dar de Baja
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {activeTab === 'explorar' && (
                        actividades.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', gridColumn: '1 / -1' }}>
                                <i className='bx bx-calendar-x' style={{ fontSize: '4rem', display: 'block', marginBottom: '10px' }}></i>
                                No hay actividades disponibles por el momento.
                            </div>
                        ) : (
                            actividades.map((actividad) => {
                                const cuposLibres = (actividad.capacity ?? 0) - (actividad.enrolled_count ?? 0);
                                const sinCupos = cuposLibres <= 0;
                                const yaInscripto = misInscripciones.some(ins => ins.id === actividad.id);

                                return (
                                    <div key={actividad.id} className={`reserva-card ${sinCupos ? 'sin-cupos' : 'disponible'}`}>
                                        <div className="reserva-icon">
                                            <i className='bx bx-dumbbell'></i>
                                        </div>
                                        <div className="reserva-content">
                                            <h4>{actividad.name}</h4>
                                            <p className="profesor">
                                                <i className='bx bx-user'></i> {actividad.teacher_name || 'Sin asignar'}
                                            </p>
                                            <div className="reserva-datetime">
                                                {actividad.day_of_week?.split(',').map((d, i) => (
                                                    <span key={i}><i className='bx bx-calendar'></i> {getDayLabel(d.trim())}</span>
                                                ))}
                                                <span><i className='bx bx-time'></i> {actividad.start_time?.slice(0, 5)} - {actividad.end_time?.slice(0, 5)}</span>
                                            </div>
                                            {actividad.space_name && (
                                                <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '4px' }}>
                                                    <i className='bx bx-building-house'></i> {actividad.space_name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="reserva-actions">
                                            <span className={`estado-badge ${sinCupos ? 'sin-cupos' : 'disponible'}`}>
                                                {sinCupos ? 'Sin cupos' : `${cuposLibres} cupo${cuposLibres !== 1 ? 's' : ''}`}
                                            </span>
                                            {yaInscripto ? (
                                                <button
                                                    className="btn-reservar"
                                                    disabled
                                                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: 'none' }}
                                                >
                                                    <i className='bx bx-check'></i> Inscripto
                                                </button>
                                            ) : (
                                                !sinCupos && (
                                                    <button
                                                        className="btn-reservar"
                                                        onClick={() => handleInscribirse(actividad)}
                                                    >
                                                        <i className='bx bx-plus'></i> Inscribirse
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default MisReservas;
