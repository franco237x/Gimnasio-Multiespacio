import { useState } from 'react';
import './GestionActividades.css';

const GestionActividades = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const [actividades] = useState([
        { id: 1, nombre: 'Yoga', profesor: 'Laura Fernández', dia: 'Lunes', horario: '08:00 - 09:00', salon: 'Sala A', cupos: 20, inscritos: 15, estado: 'activa' },
        { id: 2, nombre: 'CrossFit', profesor: 'Carlos López', dia: 'Lunes', horario: '10:00 - 11:00', salon: 'Sala B', cupos: 15, inscritos: 15, estado: 'completa' },
        { id: 3, nombre: 'Spinning', profesor: 'Carlos López', dia: 'Martes', horario: '18:00 - 19:00', salon: 'Sala Spinning', cupos: 25, inscritos: 20, estado: 'activa' },
        { id: 4, nombre: 'Pilates', profesor: 'Laura Fernández', dia: 'Miércoles', horario: '09:00 - 10:00', salon: 'Sala A', cupos: 18, inscritos: 10, estado: 'activa' },
        { id: 5, nombre: 'Funcional', profesor: 'Carlos López', dia: 'Jueves', horario: '19:00 - 20:00', salon: 'Sala B', cupos: 20, inscritos: 18, estado: 'activa' },
        { id: 6, nombre: 'Zumba', profesor: 'Ana Martínez', dia: 'Viernes', horario: '17:00 - 18:00', salon: 'Sala Principal', cupos: 30, inscritos: 25, estado: 'activa' },
    ]);

    const [formData, setFormData] = useState({
        nombre: '',
        profesor: '',
        dia: 'Lunes',
        horarioInicio: '',
        horarioFin: '',
        salon: '',
        cupos: ''
    });

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleOpenModal = (activity = null) => {
        if (activity) {
            setSelectedActivity(activity);
            const [inicio, fin] = activity.horario.split(' - ');
            setFormData({
                nombre: activity.nombre,
                profesor: activity.profesor,
                dia: activity.dia,
                horarioInicio: inicio,
                horarioFin: fin,
                salon: activity.salon,
                cupos: activity.cupos.toString()
            });
        } else {
            setSelectedActivity(null);
            setFormData({ nombre: '', profesor: '', dia: 'Lunes', horarioInicio: '', horarioFin: '', salon: '', cupos: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedActivity) {
            showNotification('✅ Actividad actualizada exitosamente', 'success');
        } else {
            showNotification('✅ Actividad creada exitosamente', 'success');
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        showNotification('🗑️ Actividad eliminada correctamente', 'success');
    };

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return (
        <div className="gestion-actividades">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-calendar-event'></i> Gestionar Actividades</h2>
                    <p>Organiza las clases y actividades del gimnasio</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <i className='bx bx-plus'></i> Nueva Actividad
                </button>
            </div>

            {/* Calendar View */}
            <div className="schedule-container">
                <h3>Horario Semanal</h3>
                <div className="schedule-grid">
                    {diasSemana.map((dia) => (
                        <div key={dia} className="day-column">
                            <div className="day-header">{dia}</div>
                            <div className="day-activities">
                                {actividades.filter(a => a.dia === dia).map((act) => (
                                    <div
                                        key={act.id}
                                        className={`activity-card ${act.estado}`}
                                        onClick={() => handleOpenModal(act)}
                                    >
                                        <div className="activity-time">{act.horario}</div>
                                        <div className="activity-name">{act.nombre}</div>
                                        <div className="activity-info">
                                            <span><i className='bx bx-user'></i> {act.profesor.split(' ')[0]}</span>
                                            <span><i className='bx bx-group'></i> {act.inscritos}/{act.cupos}</span>
                                        </div>
                                        <div className="activity-location">
                                            <i className='bx bx-map'></i> {act.salon}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* List View */}
            <div className="activities-list-container">
                <h3>Lista de Actividades</h3>
                <div className="activities-list">
                    {actividades.map((act) => (
                        <div key={act.id} className="activity-list-item">
                            <div className="activity-main-info">
                                <div className="activity-icon">
                                    <i className='bx bx-dumbbell'></i>
                                </div>
                                <div className="activity-details">
                                    <h4>{act.nombre}</h4>
                                    <p>{act.dia} - {act.horario}</p>
                                </div>
                            </div>
                            <div className="activity-meta">
                                <span className="meta-item">
                                    <i className='bx bx-user'></i> {act.profesor}
                                </span>
                                <span className="meta-item">
                                    <i className='bx bx-map'></i> {act.salon}
                                </span>
                                <span className={`status-badge ${act.estado}`}>
                                    {act.estado === 'completa' ? 'Completa' : `${act.inscritos}/${act.cupos}`}
                                </span>
                            </div>
                            <div className="activity-actions">
                                <button className="btn-action btn-edit" onClick={() => handleOpenModal(act)}>
                                    <i className='bx bx-edit'></i>
                                </button>
                                <button className="btn-action btn-delete" onClick={() => handleDelete(act.id)}>
                                    <i className='bx bx-trash'></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <i className='bx bx-calendar-event'></i>
                                {selectedActivity ? 'Editar Actividad' : 'Nueva Actividad'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombre de la Actividad</label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Ej: Yoga, CrossFit..."
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Profesor</label>
                                    <select
                                        value={formData.profesor}
                                        onChange={(e) => setFormData({ ...formData, profesor: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar profesor</option>
                                        <option value="Carlos López">Carlos López</option>
                                        <option value="Laura Fernández">Laura Fernández</option>
                                        <option value="Ana Martínez">Ana Martínez</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Día</label>
                                    <select
                                        value={formData.dia}
                                        onChange={(e) => setFormData({ ...formData, dia: e.target.value })}
                                    >
                                        {diasSemana.map((dia) => (
                                            <option key={dia} value={dia}>{dia}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Salón</label>
                                    <select
                                        value={formData.salon}
                                        onChange={(e) => setFormData({ ...formData, salon: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar salón</option>
                                        <option value="Sala A">Sala A</option>
                                        <option value="Sala B">Sala B</option>
                                        <option value="Sala Principal">Sala Principal</option>
                                        <option value="Sala Spinning">Sala Spinning</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Hora Inicio</label>
                                    <input
                                        type="time"
                                        value={formData.horarioInicio}
                                        onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Hora Fin</label>
                                    <input
                                        type="time"
                                        value={formData.horarioFin}
                                        onChange={(e) => setFormData({ ...formData, horarioFin: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Cupos</label>
                                    <input
                                        type="number"
                                        value={formData.cupos}
                                        onChange={(e) => setFormData({ ...formData, cupos: e.target.value })}
                                        placeholder="20"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    {selectedActivity ? 'Guardar Cambios' : 'Crear Actividad'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionActividades;
