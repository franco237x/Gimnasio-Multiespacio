import { useState, useEffect } from 'react';
import { activitiesAPI, reservationsAPI } from '../services/apiService';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import { ToastContainer, useToast } from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import './GestionActividades.css';

const GestionActividades = () => {
    const [activeTab, setActiveTab] = useState('horario');
    const [showModal, setShowModal] = useState(false);
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [studentsList, setStudentsList] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const { toasts, addToast, removeToast } = useToast();
    const [actividades, setActividades] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [espacios, setEspacios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: '' });
    const [actPage, setActPage] = useState(1);
    const [actPerPage, setActPerPage] = useState(10);

    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

    const [formData, setFormData] = useState({
        name: '',
        teacher_id: '',
        space_id: '',
        day_of_week: ['lunes'],
        start_time: '08:00',
        end_time: '09:00',
        capacity: 20
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [actRes, teachRes, spaceRes] = await Promise.all([
                activitiesAPI.getAll(),
                activitiesAPI.getTeachers(),
                reservationsAPI.getSpaces()
            ]);

            if (actRes.success) setActividades(actRes.data);
            if (teachRes.success) setProfesores(teachRes.data);
            if (spaceRes.success) setEspacios(spaceRes.data);
        } catch (error) {
            showNotification('❌ Error al cargar datos: ' + (error.message || ''), 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        addToast(message, type);
    };

    const handleOpenModal = (activity = null) => {
        if (activity) {
            setSelectedActivity(activity);
            setFormData({
                name: activity.name,
                teacher_id: activity.teacher_id,
                space_id: activity.space_id,
                day_of_week: activity.day_of_week ? activity.day_of_week.split(',') : [],
                start_time: activity.start_time,
                end_time: activity.end_time,
                capacity: activity.capacity
            });
        } else {
            setSelectedActivity(null);
            setFormData({
                name: '',
                teacher_id: profesores[0]?.id || '',
                space_id: espacios[0]?.id || '',
                day_of_week: ['lunes'],
                start_time: '08:00',
                end_time: '09:00',
                capacity: 20
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedActivity(null);
    };

    const handleViewStudents = async (act) => {
        setSelectedActivity(act);
        try {
            const res = await activitiesAPI.getStudents(act.id);
            if (res.success) {
                setStudentsList(res.data);
                setShowStudentsModal(true);
            }
        } catch (error) {
            showNotification('❌ Error al cargar alumnos: ' + (error.message || ''), 'error');
        }
    };

    const handleActivateStudent = async (userId) => {
        try {
            const res = await activitiesAPI.activateEnrollment(selectedActivity.id, userId);
            if (res.success) {
                showNotification('✅ Alumno dado de alta exitosamente', 'success');
                setStudentsList(prev => prev.map(s => s.user_id === userId ? { ...s, enrollment_status: 'confirmed' } : s));
            } else {
                showNotification('❌ ' + (res.message || 'Error al dar de alta'), 'error');
            }
        } catch (error) {
            showNotification('❌ Error al dar de alta: ' + (error.message || ''), 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.start_time >= formData.end_time) {
            showNotification('❌ La hora de inicio debe ser anterior a la hora de fin', 'error');
            return;
        }

        if (formData.day_of_week.length === 0) {
            showNotification('❌ Debes seleccionar al menos un día', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            const submissionData = {
                ...formData,
                day_of_week: formData.day_of_week.join(',')
            };

            if (selectedActivity) {
                await activitiesAPI.update(selectedActivity.id, submissionData);
                showNotification('✅ Actividad actualizada exitosamente', 'success');
            } else {
                await activitiesAPI.create(submissionData);
                showNotification('✅ Actividad creada exitosamente', 'success');
            }
            handleCloseModal();
            const actRes = await activitiesAPI.getAll();
            if (actRes.success) setActividades(actRes.data);
        } catch (error) {
            showNotification('❌ Error al guardar actividad: ' + (error.message || ''), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (activity) => {
        setConfirmDelete({ show: true, id: activity.id, name: activity.name });
    };

    const handleDeleteConfirm = async () => {
        try {
            await activitiesAPI.delete(confirmDelete.id);
            showNotification('🗑️ Actividad eliminada', 'success');
            setActividades(prev => prev.filter(a => a.id !== confirmDelete.id));
        } catch (error) {
            showNotification('❌ Error al eliminar actividad: ' + (error.message || ''), 'error');
        } finally {
            setConfirmDelete({ show: false, id: null, name: '' });
        }
    };

    const getActividadesByDia = (dia) => {
        return actividades.filter(a => a.day_of_week && a.day_of_week.split(',').includes(dia));
    };

    const getColorByNombre = (nombre) => {
        const colors = [
            '#ef4444', '#f97316', '#eab308', '#22c55e',
            '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
        ];
        const index = nombre.length % colors.length;
        return colors[index];
    };

    return (
        <div className="gestion-actividades">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="page-header">
                <h1><i className='bx bx-calendar'></i> Gestión de Actividades</h1>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <i className='bx bx-plus'></i> Nueva Actividad
                </button>
            </div>

            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'horario' ? 'active' : ''}`}
                        onClick={() => setActiveTab('horario')}
                    >
                        <i className='bx bx-grid-alt'></i> Horario Semanal
                    </button>
                    <button
                        className={`tab ${activeTab === 'lista' ? 'active' : ''}`}
                        onClick={() => setActiveTab('lista')}
                    >
                        <i className='bx bx-list-ul'></i> Lista de Actividades
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <i className='bx bx-loader-alt bx-spin'></i>
                    <p>Cargando actividades...</p>
                </div>
            ) : activeTab === 'horario' ? (
                <div className="schedule-grid">
                    {diasSemana.map(dia => (
                        <div key={dia} className="day-column">
                            <div className="day-header">{dia.charAt(0).toUpperCase() + dia.slice(1)}</div>
                            <div className="day-activities">
                                {getActividadesByDia(dia).map(act => (
                                    <div
                                        key={act.id}
                                        className="activity-card"
                                        style={{ borderLeftColor: getColorByNombre(act.name) }}
                                        onClick={() => handleOpenModal(act)}
                                    >
                                        <div className="activity-name">{act.name}</div>
                                        <div className="activity-time">
                                            <i className='bx bx-time'></i>
                                            {act.start_time?.slice(0, 5)} - {act.end_time?.slice(0, 5)}
                                        </div>
                                        <div className="activity-teacher">
                                            <i className='bx bx-user'></i> {act.teacher_name || 'Sin profesor'}
                                        </div>
                                        <div className="activity-location">
                                            <i className='bx bx-map'></i> {act.space_name || 'Sin sala'}
                                        </div>
                                        <div className="activity-capacity">
                                            <i className='bx bx-group'></i> {act.enrolled_count || 0}/{act.capacity}
                                        </div>
                                        <div style={{ marginTop: '10px' }}>
                                            <button className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '6px' }} onClick={(e) => { e.stopPropagation(); handleViewStudents(act); }}>
                                                <i className='bx bx-group'></i> Ver Alumnos
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="activities-list">
                    <table className="activities-table">
                        <thead>
                            <tr>
                                <th>Actividad</th>
                                <th>Día</th>
                                <th>Horario</th>
                                <th>Profesor</th>
                                <th>Sala</th>
                                <th>Inscritos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {actividades.slice((actPage - 1) * actPerPage, actPage * actPerPage).map(act => (
                                <tr key={act.id}>
                                    <td><strong>{act.name}</strong></td>
                                    <td style={{ textTransform: 'capitalize' }}>{act.day_of_week ? act.day_of_week.replace(/,/g, ', ') : ''}</td>
                                    <td>{act.start_time?.slice(0, 5)} - {act.end_time?.slice(0, 5)}</td>
                                    <td>{act.teacher_name}</td>
                                    <td>{act.space_name}</td>
                                    <td>{act.enrolled_count}/{act.capacity}</td>
                                    <td className="actions">
                                        <button className="action-btn view" title="Ver Alumnos" onClick={() => handleViewStudents(act)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <i className='bx bx-group'></i>
                                        </button>
                                        <button className="action-btn edit" onClick={() => handleOpenModal(act)}>
                                            <i className='bx bx-edit'></i>
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDeleteClick(act)}>
                                            <i className='bx bx-trash'></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={actPage}
                        totalPages={Math.ceil(actividades.length / actPerPage)}
                        onPageChange={setActPage}
                        totalItems={actividades.length}
                        itemsPerPage={actPerPage}
                        onItemsPerPageChange={(val) => { setActPerPage(val); setActPage(1); }}
                    />
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={selectedActivity ? 'Editar Actividad' : 'Nueva Actividad'}
                size="lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre de la Actividad</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Profesor</label>
                            <select
                                value={formData.teacher_id}
                                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {profesores.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Sala</label>
                            <select
                                value={formData.space_id}
                                onChange={(e) => setFormData({ ...formData, space_id: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {espacios.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>Días de la semana</label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                                {diasSemana.map(d => (
                                    <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.day_of_week.includes(d)}
                                            onChange={(e) => {
                                                const newDays = e.target.checked
                                                    ? [...formData.day_of_week, d]
                                                    : formData.day_of_week.filter(day => day !== d);
                                                setFormData({ ...formData, day_of_week: newDays });
                                            }}
                                        />
                                        {d.charAt(0).toUpperCase() + d.slice(1)}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Capacidad</label>
                            <input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                min="1"
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Hora Inicio</label>
                            <input
                                type="time"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Hora Fin</label>
                            <input
                                type="time"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : (selectedActivity ? 'Guardar Cambios' : 'Crear Actividad')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDelete.show}
                title="Eliminar Actividad"
                message={`¿Estás seguro de eliminar "${confirmDelete.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmDelete({ show: false, id: null, name: '' })}
            />

            {/* Modal Alumnos Inscriptos */}
            <Modal
                isOpen={showStudentsModal}
                onClose={() => setShowStudentsModal(false)}
                title={`Alumnos Inscriptos: ${selectedActivity?.name || ''}`}
            >
                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                    {studentsList.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>No hay alumnos inscriptos en esta actividad.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {studentsList.map(alumno => (
                                <li key={alumno.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: alumno.enrollment_status === 'pending' ? 'rgba(245, 158, 11, 0.05)' : 'transparent', borderRadius: alumno.enrollment_status === 'pending' ? '8px' : '0' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{alumno.user_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{alumno.email}</div>
                                        {alumno.enrollment_status === 'pending' && (
                                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px', fontWeight: 'bold' }}>
                                                <i className='bx bx-error-circle'></i> Pendiente de Pago
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        {alumno.enrollment_status === 'pending' ? (
                                            <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => handleActivateStudent(alumno.user_id)}>
                                                Aprobar Alta
                                            </button>
                                        ) : (
                                            <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 500 }}><i className='bx bx-check-circle'></i> Alta Confirmada</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="form-actions" style={{ marginTop: '20px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setShowStudentsModal(false)}>Cerrar</button>
                </div>
            </Modal>
        </div>
    );
};

export default GestionActividades;
