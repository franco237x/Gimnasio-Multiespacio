import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/apiService';
import Modal from '../components/ui/Modal';
import { ToastContainer, useToast } from '../components/ui/Toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './MisAlumnos.css';

const MisAlumnos = () => {
    const { user } = useAuth();
    const { toasts, addToast, removeToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showFichaModal, setShowFichaModal] = useState(false);
    const [selectedAlumno, setSelectedAlumno] = useState(null);
    const [tabFicha, setTabFicha] = useState('medica'); // 'medica', 'progreso', 'plan'

    // Ficha Medica Form
    const [medicalNotes, setMedicalNotes] = useState('');
    const [isFit, setIsFit] = useState(true);
    const [savingMedical, setSavingMedical] = useState(false);

    // Progreso Form
    const [progressLogs, setProgressLogs] = useState([]);
    const [newLogWeight, setNewLogWeight] = useState('');
    const [newLogNotes, setNewLogNotes] = useState('');
    const [savingProgress, setSavingProgress] = useState(false);

    // Asistencia State
    const [studentAttendance, setStudentAttendance] = useState({ stats: null, history: [] });
    const [loadingAttendance, setLoadingAttendance] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadAlumnos();
        }
    }, [user]);

    const loadAlumnos = async () => {
        try {
            setLoading(true);
            const res = await usersAPI.getStudentsByTeacher(user.id);
            if (res.success) {
                setAlumnos(res.data || []);
            }
        } catch (error) {
            console.error('Error al cargar alumnos', error);
            addToast('Error al cargar alumnos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadProgress = async (alumnoId) => {
        try {
            const res = await usersAPI.getProgress(alumnoId);
            if (res.success) {
                setProgressLogs(res.data || []);
            }
        } catch (error) {
            console.error('Error al cargar progreso', error);
        }
    };

    const loadStudentAttendance = async (alumnoId) => {
        try {
            setLoadingAttendance(true);
            const res = await usersAPI.getStudentAttendance(alumnoId);
            if (res.success) {
                setStudentAttendance(res.data);
            }
        } catch (error) {
            console.error('Error al cargar asistencia', error);
        } finally {
            setLoadingAttendance(false);
        }
    };

    const openFicha = (alumno) => {
        setSelectedAlumno(alumno);
        setMedicalNotes(alumno.medical_notes || '');
        setIsFit(alumno.is_fit !== false && alumno.is_fit !== 0);
        setTabFicha('medica');
        setStudentAttendance({ stats: null, history: [] }); // Reset attendance state
        setShowFichaModal(true);
        loadProgress(alumno.id);
    };

    const handleSaveMedical = async () => {
        try {
            setSavingMedical(true);
            const res = await usersAPI.updateMedical(selectedAlumno.id, {
                is_fit: isFit,
                medical_notes: medicalNotes
            });
            if (res.success) {
                addToast('Ficha médica actualizada', 'success');
                // Actualizar estado local
                setAlumnos(prev => prev.map(a => a.id === selectedAlumno.id ? { ...a, medical_notes: medicalNotes, is_fit: isFit } : a));
                setSelectedAlumno({ ...selectedAlumno, medical_notes: medicalNotes, is_fit: isFit });
            }
        } catch (error) {
            console.error(error);
            addToast('Error al guardar ficha médica', 'error');
        } finally {
            setSavingMedical(false);
        }
    };

    const handleSaveProgress = async (e) => {
        e.preventDefault();
        if (!newLogNotes.trim()) {
            addToast('Las notas del avance son obligatorias', 'warning');
            return;
        }

        try {
            setSavingProgress(true);
            const data = {
                date: format(new Date(), 'yyyy-MM-dd'),
                weight: newLogWeight ? parseFloat(newLogWeight) : null,
                notes: newLogNotes
            };

            const res = await usersAPI.addProgressLog(selectedAlumno.id, data);
            if (res.success) {
                addToast('Progreso registrado correctamente', 'success');
                setNewLogWeight('');
                setNewLogNotes('');
                loadProgress(selectedAlumno.id);
            }
        } catch (error) {
            console.error(error);
            addToast('Error al registrar progreso', 'error');
        } finally {
            setSavingProgress(false);
        }
    };

    const filteredAlumnos = alumnos.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="mis-alumnos">
            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-group'></i> Mis Alumnos</h2>
                    <p>Gestiona la salud y progreso de los alumnos que asisten a tus clases</p>
                </div>
            </div>

            {loading ? (
                <div className="loading-state" style={{ textAlign: 'center', padding: '50px 0', color: '#0891b2' }}>
                    <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '3rem' }}></i>
                    <p>Cargando información...</p>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className='bx bx-user'></i>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{alumnos.length}</span>
                                <span className="stat-label">Total Alumnos Tuyos</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green">
                                <i className='bx bx-heart'></i>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{alumnos.filter(a => a.is_fit !== false && a.is_fit !== 0).length}</span>
                                <span className="stat-label">Aptos Físicamente</span>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="search-bar">
                        <i className='bx bx-search'></i>
                        <input
                            type="text"
                            placeholder="Buscar alumno por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Lista de Alumnos */}
                    {filteredAlumnos.length === 0 ? (
                        <div className="empty-state" style={{ textAlign: 'center', margin: '40px 0', color: '#9ca3af' }}>
                            <i className='bx bx-ghost' style={{ fontSize: '4rem', marginBottom: '10px' }}></i>
                            <p>No se encontraron alumnos.</p>
                        </div>
                    ) : (
                        <div className="alumnos-grid">
                            {filteredAlumnos.map((alumno) => (
                                <div key={alumno.id} className="alumno-card">
                                    <div className="alumno-header">
                                        <div className="alumno-avatar">
                                            {alumno.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="alumno-info">
                                            <h4>{alumno.name}</h4>
                                            <p>{alumno.email}</p>
                                        </div>
                                    </div>

                                    <div className="alumno-stats">
                                        <div className="stat-mini">
                                            <span className="stat-mini-label">Teléfono</span>
                                            <span className="stat-mini-value">{alumno.phone || '-'}</span>
                                        </div>
                                        <div className="stat-mini">
                                            <span className="stat-mini-label">Salud</span>
                                            <span className="stat-mini-value">
                                                {alumno.is_fit !== false && alumno.is_fit !== 0 ?
                                                    <span style={{ color: '#10b981' }}><i className='bx bx-check-shield'></i> Apto</span> :
                                                    <span style={{ color: '#ef4444' }}><i className='bx bx-error-alt'></i> Precaución</span>
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <div className="alumno-actions">
                                        <button
                                            className="btn-action w-100"
                                            onClick={() => openFicha(alumno)}
                                            style={{ width: '100%', gap: '8px', padding: '10px' }}
                                        >
                                            <i className='bx bx-folder-open'></i>
                                            Abrir Ficha de Alumno
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modal Ficha Alumno */}
            <Modal
                isOpen={showFichaModal}
                onClose={() => setShowFichaModal(false)}
                title={`Ficha: ${selectedAlumno?.name}`}
            >
                <div>
                    <div className="ficha-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <button
                            className={`tab-btn ${tabFicha === 'medica' ? 'active' : ''}`}
                            onClick={() => setTabFicha('medica')}
                            style={{ background: 'none', border: 'none', padding: '10px 15px', color: tabFicha === 'medica' ? '#0891b2' : '#9ca3af', borderBottom: tabFicha === 'medica' ? '2px solid #0891b2' : 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                            <i className='bx bx-plus-medical'></i> Info Médica
                        </button>
                        <button
                            className={`tab-btn ${tabFicha === 'progreso' ? 'active' : ''}`}
                            onClick={() => setTabFicha('progreso')}
                            style={{ background: 'none', border: 'none', padding: '10px 15px', color: tabFicha === 'progreso' ? '#0891b2' : '#9ca3af', borderBottom: tabFicha === 'progreso' ? '2px solid #0891b2' : 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                            <i className='bx bx-line-chart'></i> Adelantos y Rutina
                        </button>
                        <button
                            className={`tab-btn ${tabFicha === 'asistencia' ? 'active' : ''}`}
                            onClick={() => {
                                setTabFicha('asistencia');
                                if (!studentAttendance.stats) loadStudentAttendance(selectedAlumno.id);
                            }}
                            style={{ background: 'none', border: 'none', padding: '10px 15px', color: tabFicha === 'asistencia' ? '#0891b2' : '#9ca3af', borderBottom: tabFicha === 'asistencia' ? '2px solid #0891b2' : 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                            <i className='bx bx-check-square'></i> Asistencia
                        </button>
                    </div>

                    {tabFicha === 'medica' && (
                        <div className="tab-content">
                            <div className="form-group">
                                <label>Aptitud Física</label>
                                <select
                                    value={isFit ? 'true' : 'false'}
                                    onChange={(e) => setIsFit(e.target.value === 'true')}
                                    style={{
                                        borderColor: isFit ? '#10b981' : '#ef4444'
                                    }}
                                >
                                    <option value="true">Sí, está apto físicamente</option>
                                    <option value="false">No, requiere precaución / observación</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Anotaciones Médicas / Precauciones / Lesiones</label>
                                <textarea
                                    rows="4"
                                    placeholder="Ej. Problemas de rodilla izquierda, no puede hacer sentadillas pesadas..."
                                    value={medicalNotes}
                                    onChange={(e) => setMedicalNotes(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-primary" onClick={handleSaveMedical} disabled={savingMedical}>
                                    {savingMedical ? 'Guardando...' : 'Guardar Ficha Médica'}
                                </button>
                            </div>
                        </div>
                    )}

                    {tabFicha === 'progreso' && (
                        <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="registro-progreso" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(8,145,178,0.3)' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#0891b2' }}><i className='bx bx-edit'></i> Registrar Nuevo Avance</h4>
                                <form onSubmit={handleSaveProgress}>
                                    <div className="form-group">
                                        <label>Peso Corporal (kg) - Opcional</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="Ej. 75.5"
                                            value={newLogWeight}
                                            onChange={(e) => setNewLogWeight(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Notas / Cambios en Rutina / Logros *</label>
                                        <textarea
                                            rows="3"
                                            placeholder="Ej. Logró aumentar 5kg en press de banca. Se le ajustará la rutina para priorizar hombros."
                                            value={newLogNotes}
                                            onChange={(e) => setNewLogNotes(e.target.value)}
                                            required
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="btn-primary" disabled={savingProgress} style={{ width: '100%' }}>
                                        {savingProgress ? 'Guardando...' : 'Añadir Registro al Historial'}
                                    </button>
                                </form>
                            </div>

                            <div className="historial-progreso">
                                <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>Historial del Alumno</h4>
                                {progressLogs.length === 0 ? (
                                    <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>Aún no se han registrado avances.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                                        {progressLogs.map(log => (
                                            <div key={log.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #0891b2' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                    <span style={{ color: '#0891b2', fontWeight: 600 }}>{format(new Date(log.date), 'dd/MM/yyyy')}</span>
                                                    <span style={{ color: '#9ca3af' }}>Por: {log.teacher_name}</span>
                                                </div>
                                                {log.weight && <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem', marginBottom: '5px' }}>Peso reportado: {log.weight} kg</div>}
                                                <p style={{ margin: 0, color: '#e5e7eb', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{log.notes}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tabFicha === 'asistencia' && (
                        <div className="tab-content">
                            {loadingAttendance ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}><i className='bx bx-loader-alt bx-spin'></i> Cargando asistencia...</div>
                            ) : (
                                <>
                                    <div className="asistencia-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                            <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>{studentAttendance.stats?.attended || 0}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Presentes</div>
                                        </div>
                                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            <div style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold' }}>{studentAttendance.stats?.absent || 0}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Ausentes</div>
                                        </div>
                                        <div style={{ background: 'rgba(8, 145, 178, 0.1)', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(8, 145, 178, 0.2)' }}>
                                            <div style={{ color: '#0891b2', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                {studentAttendance.stats?.total_classes > 0
                                                    ? Math.round((studentAttendance.stats.attended / studentAttendance.stats.total_classes) * 100)
                                                    : 0}%
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Asistencia</div>
                                        </div>
                                    </div>

                                    <h5 style={{ marginBottom: '10px', color: '#e5e7eb' }}>Últimas clases registrados</h5>
                                    {studentAttendance.history.length === 0 ? (
                                        <p style={{ color: '#9ca3af', fontStyle: 'italic', textAlign: 'center' }}>No hay registros de asistencia.</p>
                                    ) : (
                                        <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                <thead style={{ background: 'rgba(255,255,255,0.05)', position: 'sticky', top: 0 }}>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', padding: '10px' }}>Fecha</th>
                                                        <th style={{ textAlign: 'left', padding: '10px' }}>Clase</th>
                                                        <th style={{ textAlign: 'center', padding: '10px' }}>Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {studentAttendance.history.map((h, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <td style={{ padding: '10px' }}>{format(new Date(h.attendance_date), 'dd/MM/yy')}</td>
                                                            <td style={{ padding: '10px' }}>{h.activity_name}</td>
                                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                                <span style={{
                                                                    padding: '2px 8px',
                                                                    borderRadius: '10px',
                                                                    fontSize: '0.75rem',
                                                                    background: h.status === 'present' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                                    color: h.status === 'present' ? '#10b981' : '#ef4444'
                                                                }}>
                                                                    {h.status === 'present' ? 'Presente' : 'Ausente'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default MisAlumnos;
