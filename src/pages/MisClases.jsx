import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { activitiesAPI } from '../services/apiService';
import Modal from '../components/ui/Modal';
import { ToastContainer, useToast } from '../components/ui/Toast';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import './MisClases.css';

const MisClases = () => {
    const { user } = useAuth();
    const { toasts, addToast, removeToast } = useToast();
    const [viewMode, setViewMode] = useState('hoy');
    const [loading, setLoading] = useState(true);

    const [clases, setClases] = useState([]);

    // Asistencia Modal
    const [showListaModal, setShowListaModal] = useState(false);
    const [claseSeleccionada, setClaseSeleccionada] = useState(null);
    const [alumnosList, setAlumnosList] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [savingAttendance, setSavingAttendance] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadClases();
        }
    }, [user]);

    const loadClases = async () => {
        try {
            setLoading(true);
            const res = await activitiesAPI.getByTeacher(user.id);
            if (res.success) {
                setClases(res.data || []);
            }
        } catch (error) {
            console.error('Error al cargar clases', error);
            addToast('Error al cargar tus clases: ' + (error.message || ''), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePasarLista = async (clase) => {
        try {
            setClaseSeleccionada(clase);
            setAttendanceDate(format(new Date(), 'yyyy-MM-dd'));
            setShowListaModal(true);

            // Buscar alumnos inscritos
            const resStudents = await activitiesAPI.getStudents(clase.id);
            let enrollments = [];
            if (resStudents.success) {
                enrollments = resStudents.data;
            }

            // Buscar si ya hay asistencia tomada para hoy
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const resAtt = await activitiesAPI.getAttendance(clase.id, todayStr);

            let pastAttendance = [];
            if (resAtt.success) {
                pastAttendance = resAtt.data;
            }

            // Combinar
            const listaCombinada = enrollments.map(estudiante => {
                const previo = pastAttendance.find(pa => pa.user_id === estudiante.user_id);
                return {
                    user_id: estudiante.user_id,
                    user_name: estudiante.user_name,
                    enrollment_status: estudiante.enrollment_status,
                    status: previo ? previo.status : (estudiante.enrollment_status === 'pending' ? 'absent' : 'present')
                };
            });

            setAlumnosList(listaCombinada);
        } catch (error) {
            console.error('Error al cargar alumnos', error);
            addToast('No se pudieron cargar los alumnos de la clase', 'error');
        }
    };

    const handleToggleAttendance = (userId, newStatus) => {
        setAlumnosList(prev => prev.map(alumno => {
            if (alumno.user_id === userId) {
                return { ...alumno, status: newStatus };
            }
            return alumno;
        }));
    };

    const handleSaveAttendance = async () => {
        try {
            setSavingAttendance(true);
            const res = await activitiesAPI.markAttendance(claseSeleccionada.id, alumnosList);
            if (res.success) {
                addToast('✅ Asistencia guardada correctamente', 'success');
                setShowListaModal(false);
            } else {
                addToast(res.message || 'Error al guardar', 'error');
            }
        } catch (error) {
            console.error(error);
            addToast('Error al guardar asistencia: ' + (error.message || ''), 'error');
        } finally {
            setSavingAttendance(false);
        }
    };

    // Funciones de parseo de fechas
    const obtenerClasesHoy = () => {
        const dNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const hoyStr = dNames[new Date().getDay()];
        return clases.filter(c => c.day_of_week.includes(hoyStr));
    };

    const clasesHoyList = obtenerClasesHoy();

    const renderDiaColumna = (diaEsp, diaIngIndex) => {
        const cs = clases.filter(c => c.day_of_week.includes(diaEsp.toLowerCase()));
        return (
            <div key={diaEsp} className="dia-column">
                <div className="dia-header">{diaEsp}</div>
                <div className="dia-clases">
                    {cs.length > 0 ? cs.map((clase, idx) => (
                        <div key={idx} className="clase-mini">
                            <span className="mini-hora">{clase.start_time.slice(0, 5)}</span>
                            <span className="mini-nombre">{clase.name}</span>
                            <span className="mini-sala">{clase.space_name}</span>
                        </div>
                    )) : <div className="no-clases-mini">-</div>}
                </div>
            </div>
        );
    };

    return (
        <div className="mis-clases">
            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-chalkboard'></i> Mis Clases</h2>
                    <p>Gestiona tu cronograma y toma asistencia</p>
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

            {loading ? (
                <div className="loading-state">
                    <i className='bx bx-loader-alt bx-spin'></i>
                    <p>Cargando cronograma...</p>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className='bx bx-calendar'></i>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{clasesHoyList.length}</span>
                                <span className="stat-label">Clases hoy</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon cyan">
                                <i className='bx bx-calendar-event'></i>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{clases.length}</span>
                                <span className="stat-label">Clases semanales</span>
                            </div>
                        </div>
                    </div>

                    {/* Vista Hoy */}
                    {viewMode === 'hoy' && (
                        <div className="clases-hoy">
                            <h3><i className='bx bx-sun'></i> Tus clases de Hoy</h3>
                            {clasesHoyList.length === 0 ? (
                                <div className="empty-state">
                                    <i className='bx bx-coffee'></i>
                                    <p>No tienes clases asignadas para el día de hoy.</p>
                                </div>
                            ) : (
                                <div className="clases-lista">
                                    {clasesHoyList.map((clase) => (
                                        <div key={clase.id} className="clase-card">
                                            <div className="clase-hora">
                                                <span className="hora">{clase.start_time.slice(0, 5)}</span>
                                                <span className="duracion">({clase.end_time.slice(0, 5)})</span>
                                            </div>
                                            <div className="clase-info">
                                                <h4>{clase.name}</h4>
                                                <p><i className='bx bx-map'></i> {clase.space_name}</p>
                                            </div>
                                            <div className="clase-alumnos">
                                                <div className="alumnos-count">
                                                    <i className='bx bx-group'></i>
                                                    <span>{clase.enrolled_count}/{clase.capacity}</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${(clase.enrolled_count / clase.capacity) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <button
                                                className="btn-asistencia"
                                                onClick={() => handlePasarLista(clase)}
                                            >
                                                <i className='bx bx-check-square'></i>
                                                Pasar Lista / Ver Alumnos
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vista Semana */}
                    {viewMode === 'semana' && (
                        <div className="horario-semanal">
                            <h3><i className='bx bx-calendar'></i> Tu Horario Semanal</h3>
                            <div className="semana-grid">
                                {renderDiaColumna('Lunes')}
                                {renderDiaColumna('Martes')}
                                {renderDiaColumna('Miércoles')}
                                {renderDiaColumna('Jueves')}
                                {renderDiaColumna('Viernes')}
                                {renderDiaColumna('Sábado')}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de Asistencia */}
            <Modal
                isOpen={showListaModal}
                onClose={() => setShowListaModal(false)}
                title={`Asistencia: ${claseSeleccionada?.name}`}
            >
                <div className="asistencia-modal-body">
                    <p style={{ marginBottom: '15px', color: '#9ca3af', fontSize: '0.9rem' }}>
                        <i className='bx bx-calendar'></i> Fecha: {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}
                    </p>

                    {alumnosList.length === 0 ? (
                        <div className="empty-state" style={{ padding: '20px 0' }}>
                            <p>No hay alumnos inscritos en esta clase todavía.</p>
                        </div>
                    ) : (
                        <div className="asistencia-list">
                            {alumnosList.map(alumno => (
                                <div key={alumno.user_id} className={`alumno-asistencia-row ${alumno.enrollment_status === 'pending' ? 'pending-row' : ''}`} style={alumno.enrollment_status === 'pending' ? { background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245,158,11,0.2)' } : {}}>
                                    <div className="alumno-name">
                                        {alumno.user_name}
                                        {alumno.enrollment_status === 'pending' && (
                                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px', fontWeight: 'bold' }}>
                                                <i className='bx bx-error-circle'></i> Alumno Nuevo - Pendiente de Pago
                                            </span>
                                        )}
                                    </div>
                                    <div className="attendance-toggles">
                                        <button
                                            className={`toggle-btn present ${alumno.status === 'present' ? 'active' : ''}`}
                                            onClick={() => handleToggleAttendance(alumno.user_id, 'present')}
                                            disabled={alumno.enrollment_status === 'pending'}
                                            style={alumno.enrollment_status === 'pending' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                        >
                                            <i className='bx bx-check'></i> Presente
                                        </button>
                                        <button
                                            className={`toggle-btn absent ${alumno.status === 'absent' ? 'active' : ''}`}
                                            onClick={() => handleToggleAttendance(alumno.user_id, 'absent')}
                                        >
                                            <i className='bx bx-x'></i> Ausente
                                        </button>

                                        {/* Optional: button to activate if user is Admin, but Prof can't */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="form-actions" style={{ marginTop: '20px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowListaModal(false)}>
                            Cerrar
                        </button>
                        {alumnosList.length > 0 && (
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleSaveAttendance}
                                disabled={savingAttendance}
                            >
                                {savingAttendance ? 'Guardando...' : 'Guardar Asistencia'}
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default MisClases;
