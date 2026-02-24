import { useState, useEffect } from 'react';
import { activitiesAPI, reservationsAPI } from '../services/apiService';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import './GestionActividades.css';

const GestionActividades = () => {
    const [activeTab, setActiveTab] = useState('horario');
    const [showModal, setShowModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [actividades, setActividades] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [espacios, setEspacios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: '' });

    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

    const [formData, setFormData] = useState({
        name: '',
        teacher_id: '',
        space_id: '',
        day_of_week: 'lunes',
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
            showNotification('❌ Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleOpenModal = (activity = null) => {
        if (activity) {
            setSelectedActivity(activity);
            setFormData({
                name: activity.name,
                teacher_id: activity.teacher_id,
                space_id: activity.space_id,
                day_of_week: activity.day_of_week,
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
                day_of_week: 'lunes',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedActivity) {
                await activitiesAPI.update(selectedActivity.id, formData);
                showNotification('✅ Actividad actualizada exitosamente', 'success');
            } else {
                await activitiesAPI.create(formData);
                showNotification('✅ Actividad creada exitosamente', 'success');
            }
            handleCloseModal();
            loadData();
        } catch (error) {
            showNotification('❌ Error al guardar actividad', 'error');
        }
    };

    const handleDeleteClick = (activity) => {
        setConfirmDelete({ show: true, id: activity.id, name: activity.name });
    };

    const handleDeleteConfirm = async () => {
        try {
            await activitiesAPI.delete(confirmDelete.id);
            showNotification('🗑️ Actividad eliminada', 'success');
            loadData();
        } catch (error) {
            showNotification('❌ Error al eliminar actividad', 'error');
        } finally {
            setConfirmDelete({ show: false, id: null, name: '' });
        }
    };

    const getActividadesByDia = (dia) => {
        return actividades.filter(a => a.day_of_week === dia);
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
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

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
                            {actividades.map(act => (
                                <tr key={act.id}>
                                    <td><strong>{act.name}</strong></td>
                                    <td>{act.day_of_week}</td>
                                    <td>{act.start_time?.slice(0, 5)} - {act.end_time?.slice(0, 5)}</td>
                                    <td>{act.teacher_name}</td>
                                    <td>{act.space_name}</td>
                                    <td>{act.enrolled_count}/{act.capacity}</td>
                                    <td className="actions">
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
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedActivity ? 'Editar Actividad' : 'Nueva Actividad'}</h2>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
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
                                <div className="form-group">
                                    <label>Día</label>
                                    <select
                                        value={formData.day_of_week}
                                        onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                                    >
                                        {diasSemana.map(d => (
                                            <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
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
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                                <button type="submit" className="btn-primary">
                                    {selectedActivity ? 'Guardar Cambios' : 'Crear Actividad'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDelete.show}
                title="Eliminar Actividad"
                message={`¿Estás seguro de eliminar "${confirmDelete.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmDelete({ show: false, id: null, name: '' })}
            />
        </div>
    );
};

export default GestionActividades;
