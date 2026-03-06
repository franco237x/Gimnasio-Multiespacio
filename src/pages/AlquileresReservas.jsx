import { useState, useEffect } from 'react';
import { reservationsAPI, configAPI, usersAPI } from '../services/apiService';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import { ToastContainer, useToast } from '../components/ui/Toast';
import { usePermissions } from '../components/auth/RoleProtectedRoute';
import './AlquileresReservas.css';

const AlquileresReservas = () => {
    const [activeTab, setActiveTab] = useState('reservas');
    const [showModal, setShowModal] = useState(false);
    const { toasts, addToast, removeToast } = useToast();
    const { isProfesor, isAdmin, isRecepcionista } = usePermissions();
    const [reservas, setReservas] = useState([]);
    const [espacios, setEspacios] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gymHours, setGymHours] = useState({ opening_time: '06:00', closing_time: '23:00' });
    const [confirmCancel, setConfirmCancel] = useState({ show: false, id: null });
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [showSpaceModal, setShowSpaceModal] = useState(false);
    const [editingSpace, setEditingSpace] = useState(null);
    const [confirmDeleteSpace, setConfirmDeleteSpace] = useState({ show: false, id: null, name: '' });

    const [formData, setFormData] = useState({
        space_id: '',
        client_id: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        reservation_date: '',
        start_time: '08:00',
        end_time: '10:00',
        payment_status: 'pending',
        payment_amount: 0,
        payment_method: 'efectivo',
        notes: ''
    });

    const [spaceFormData, setSpaceFormData] = useState({
        name: '',
        type: 'multiusos',
        capacity: 10,
        price_per_hour: 0,
        status: 'available',
        description: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const showNotification = (message, type) => {
        addToast(message, type);
    };

    const loadData = async () => {
        try {
            setLoading(true);

            const promises = [
                reservationsAPI.getUpcoming(30),
                reservationsAPI.getSpaces(),
                configAPI.getAll(),
                isProfesor() ? Promise.resolve({ success: true, data: [] }) : usersAPI.getAll()
            ];

            const results = await Promise.allSettled(promises);

            const [resResult, spacesResult, configResult, usersResult] = results;

            if (resResult.status === 'fulfilled' && resResult.value?.success) {
                setReservas(resResult.value.data || []);
            }
            if (spacesResult.status === 'fulfilled' && spacesResult.value?.success) {
                setEspacios(spacesResult.value.data || []);
            }
            if (configResult.status === 'fulfilled' && configResult.value?.success && configResult.value?.data) {
                setGymHours({
                    opening_time: configResult.value.data.opening_time || '06:00',
                    closing_time: configResult.value.data.closing_time || '23:00'
                });
            }
            if (usersResult.status === 'fulfilled' && usersResult.value?.success) {
                setUsers(usersResult.value.data || []);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
            addToast('❌ Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };


    const handleOpenModal = (reserva = null) => {
        if (reserva) {
            setSelectedReservation(reserva);
            setFormData({
                space_id: reserva.space_id,
                client_id: reserva.client_id || '',
                client_name: reserva.client_name,
                client_phone: reserva.client_phone || '',
                client_email: reserva.client_email || '',
                reservation_date: reserva.reservation_date.split('T')[0],
                start_time: reserva.start_time.slice(0, 5),
                end_time: reserva.end_time.slice(0, 5),
                payment_status: reserva.payment_status || 'pending',
                payment_amount: reserva.payment_amount || 0,
                payment_method: reserva.payment_method || 'efectivo',
                notes: reserva.notes || ''
            });
        } else {
            setSelectedReservation(null);
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                space_id: espacios[0]?.id || '',
                client_id: '',
                client_name: '',
                client_phone: '',
                client_email: '',
                reservation_date: today,
                start_time: '08:00',
                end_time: '10:00',
                payment_status: 'pending',
                payment_amount: 0,
                payment_method: 'efectivo',
                notes: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedReservation(null);
    };

    const handleOpenSpaceModal = (space = null) => {
        if (space) {
            setEditingSpace(space);
            setSpaceFormData({
                name: space.name,
                type: space.type,
                capacity: space.capacity,
                price_per_hour: space.price_per_hour,
                status: space.status,
                description: space.description || ''
            });
        } else {
            setEditingSpace(null);
            setSpaceFormData({
                name: '',
                type: 'multiusos',
                capacity: 10,
                price_per_hour: 0,
                status: 'available',
                description: ''
            });
        }
        setShowSpaceModal(true);
    };

    const handleCloseSpaceModal = () => {
        setShowSpaceModal(false);
        setEditingSpace(null);
    };

    const calculateTotalSpace = () => {
        const space = espacios.find((s) => s.id === parseInt(formData.space_id));
        if (!space || !formData.start_time || !formData.end_time) {
            return 0; // Missing data means no charge
        }

        try {
            const startH = parseInt(formData.start_time.split(':')[0], 10);
            const startM = parseInt(formData.start_time.split(':')[1], 10);
            const endH = parseInt(formData.end_time.split(':')[0], 10);
            const endM = parseInt(formData.end_time.split(':')[1], 10);

            let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);

            const hours = Math.max(0, parseFloat(totalMinutes / 60));
            return Math.abs(Number(hours * (space.price_per_hour || 0)));
        } catch (e) {
            return 0;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate business hours from gym settings
        if (formData.start_time < gymHours.opening_time || formData.start_time > gymHours.closing_time ||
            formData.end_time < gymHours.opening_time || formData.end_time > gymHours.closing_time) {
            showNotification(`❌ El horario debe estar entre las ${gymHours.opening_time} y las ${gymHours.closing_time}`, 'error');
            return;
        }

        // Validate end > start
        if (formData.end_time <= formData.start_time) {
            showNotification('❌ La hora de fin debe ser posterior a la hora de inicio', 'error');
            return;
        }

        try {
            const total = Math.round(calculateTotalSpace());
            const payload = {
                ...formData,
                space_id: parseInt(formData.space_id),
                total_amount: total,
                payment_method: formData.payment_method
            };

            if (selectedReservation) {
                await reservationsAPI.update(selectedReservation.id, payload);
                showNotification('✅ Reserva actualizada exitosamente', 'success');
            } else {
                await reservationsAPI.create(payload);
                showNotification('✅ Reserva creada exitosamente', 'success');
            }
            handleCloseModal();
            loadData();
        } catch (error) {
            showNotification('❌ ' + error.message, 'error');
        }
    };

    const handleConfirm = async (reservaId) => {
        try {
            await reservationsAPI.confirm(reservaId);
            showNotification('✅ Reserva confirmada', 'success');
            loadData();
        } catch (error) {
            showNotification('❌ Error al confirmar', 'error');
        }
    };

    const handleCancelClick = (reservaId) => {
        setConfirmCancel({ show: true, id: reservaId });
    };

    const handleCancelConfirm = async () => {
        try {
            await reservationsAPI.cancel(confirmCancel.id);
            showNotification('🗑️ Reserva cancelada', 'success');
            loadData();
        } catch (error) {
            showNotification('❌ Error al cancelar', 'error');
        } finally {
            setConfirmCancel({ show: false, id: null });
        }
    };

    const handleDeleteClick = (reservaId) => {
        setConfirmDelete({ show: true, id: reservaId });
    };

    const handleDeleteConfirm = async () => {
        try {
            await reservationsAPI.delete(confirmDelete.id);
            showNotification('🗑️ Reserva eliminada permanentemente', 'success');
            loadData();
        } catch (error) {
            showNotification('❌ Error al eliminar reserva', 'error');
        } finally {
            setConfirmDelete({ show: false, id: null });
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: 'rgba(234, 179, 8, 0.2)', color: '#eab308', label: 'Pendiente' },
            confirmed: { bg: 'rgba(22, 163, 74, 0.2)', color: '#16a34a', label: 'Confirmada' },
            cancelled: { bg: 'rgba(220, 38, 38, 0.2)', color: '#dc2626', label: 'Cancelada' }
        };
        const style = styles[status] || styles.pending;
        return <span className="badge" style={{ background: style.bg, color: style.color }}>{style.label}</span>;
    };

    const getPaymentBadge = (status) => {
        const styles = {
            pending: { bg: 'rgba(234, 179, 8, 0.2)', color: '#eab308', label: 'Sin Pagar' },
            partial: { bg: 'rgba(56, 188, 248, 0.2)', color: '#38bdf8', label: 'Seña' },
            paid: { bg: 'rgba(22, 163, 74, 0.2)', color: '#16a34a', label: 'Pagado' }
        };
        const style = styles[status] || styles.pending;
        return <span className="badge" style={{ background: style.bg, color: style.color, marginLeft: '8px' }}>{style.label}</span>;
    };

    const getSpaceTypeBadge = (type) => {
        const labels = {
            deportivo: 'Deportivo',
            multiusos: 'Multiusos',
            eventos: 'Eventos',
            clases: 'Clases',
            aire_libre: 'Aire Libre'
        };
        return labels[type] || type;
    };

    const handleSpaceSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSpace) {
                await reservationsAPI.updateSpace(editingSpace.id, spaceFormData);
                showNotification('✅ Espacio actualizado exitosamente', 'success');
            } else {
                await reservationsAPI.createSpace(spaceFormData);
                showNotification('✅ Espacio creado exitosamente', 'success');
            }
            handleCloseSpaceModal();
            loadData();
        } catch (error) {
            showNotification('❌ Error al guardar espacio', 'error');
        }
    };

    const handleDeleteSpaceConfirm = async () => {
        try {
            await reservationsAPI.deleteSpace(confirmDeleteSpace.id);
            showNotification('🗑️ Espacio eliminado correctamente', 'success');
            loadData();
        } catch (error) {
            showNotification('❌ ' + error.message, 'error');
        } finally {
            setConfirmDeleteSpace({ show: false, id: null, name: '' });
        }
    };

    return (
        <div className="alquileres-reservas">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="page-header">
                <h1><i className='bx bx-calendar-check'></i> Alquileres y Reservas</h1>
                {activeTab === 'reservas' ? (
                    (!isProfesor()) && (
                        <button className="btn-primary" onClick={() => handleOpenModal()}>
                            <i className='bx bx-plus'></i> Nueva Reserva
                        </button>
                    )
                ) : (
                    (!isProfesor()) && (
                        <button className="btn-primary" onClick={() => handleOpenSpaceModal()}>
                            <i className='bx bx-plus'></i> Nuevo Espacio
                        </button>
                    )
                )}
            </div>

            <div className="tabs-container">
                <div className="tabs">
                    <button className={`tab ${activeTab === 'reservas' ? 'active' : ''}`} onClick={() => setActiveTab('reservas')}>
                        <i className='bx bx-calendar'></i> Reservas
                    </button>
                    {!isProfesor() && (
                        <button className={`tab ${activeTab === 'espacios' ? 'active' : ''}`} onClick={() => setActiveTab('espacios')}>
                            <i className='bx bx-building-house'></i> Espacios
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <i className='bx bx-loader-alt bx-spin'></i>
                    <p>Cargando datos...</p>
                </div>
            ) : (
                <div className="tab-content">
                    {/* Banner informativo solo para Profesores */}
                    {isProfesor() && (
                        <div style={{
                            background: 'rgba(8, 145, 178, 0.08)',
                            border: '1px solid rgba(8, 145, 178, 0.25)',
                            borderRadius: '10px',
                            padding: '12px 18px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#0891b2',
                            fontSize: '0.9rem'
                        }}>
                            <i className='bx bx-info-circle' style={{ fontSize: '1.2rem', flexShrink: 0 }}></i>
                            <span>
                                <strong>Vista de solo lectura.</strong> Aquí ves únicamente las reservas vinculadas a tu cuenta.
                                Para crear o administrar reservas, contactá con un Administrador o Recepcionista.
                            </span>
                        </div>
                    )}
                    {activeTab === 'reservas' && (
                        <div className="reservas-section">
                            <table className="reservas-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Horario</th>
                                        <th>Espacio</th>
                                        <th>Cliente</th>
                                        {!isProfesor() && <th>Monto / Pago</th>}
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservas.length === 0 ? (
                                        <tr>
                                            <td colSpan={isProfesor() ? "6" : "7"} className="no-results">
                                                {isProfesor()
                                                    ? '📅 No tenés reservas próximas vinculadas a tu cuenta. Si esperabas ver una, pedile al Administrador que la vincule a tu usuario.'
                                                    : 'No hay reservas próximas'}
                                            </td>
                                        </tr>
                                    ) : (
                                        reservas.map(reserva => (
                                            <tr key={reserva.id}>
                                                <td>{new Date(reserva.reservation_date).toLocaleDateString('es-AR')}</td>
                                                <td>{reserva.start_time?.slice(0, 5)} - {reserva.end_time?.slice(0, 5)}</td>
                                                <td><strong>{reserva.space_name}</strong></td>
                                                <td>
                                                    <div>{reserva.client_name}</div>
                                                    {reserva.client_phone && <small>{reserva.client_phone}</small>}
                                                </td>
                                                {!isProfesor() && (
                                                    <td>
                                                        <div className="amount">${reserva.total_amount?.toLocaleString('es-AR')}</div>
                                                        {getPaymentBadge(reserva.payment_status)}
                                                    </td>
                                                )}
                                                <td>{getStatusBadge(reserva.status)}</td>
                                                <td className="actions">
                                                    {!isProfesor() && (
                                                        <button className="action-btn edit" title="Editar" onClick={() => handleOpenModal(reserva)}>
                                                            <i className='bx bx-edit'></i>
                                                        </button>
                                                    )}
                                                    {!isProfesor() && reserva.status === 'pending' && (
                                                        <button className="action-btn confirm" title="Confirmar" onClick={() => handleConfirm(reserva.id)}>
                                                            <i className='bx bx-check'></i>
                                                        </button>
                                                    )}
                                                    {!isProfesor() && reserva.status !== 'cancelled' && (
                                                        <button className="action-btn cancel" title="Cancelar" onClick={() => handleCancelClick(reserva.id)}>
                                                            <i className='bx bx-x'></i>
                                                        </button>
                                                    )}
                                                    {!isProfesor() && (
                                                        <button className="action-btn delete" title="Eliminar" onClick={() => handleDeleteClick(reserva.id)}>
                                                            <i className='bx bx-trash'></i>
                                                        </button>
                                                    )}
                                                    {isProfesor() && (
                                                        <span style={{ color: 'var(--text-muted, #888)', fontSize: '0.8rem' }}>Solo lectura</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'espacios' && (
                        <div className="espacios-section">
                            <div className="espacios-grid">
                                {espacios.map(espacio => (
                                    <div key={espacio.id} className="espacio-card">
                                        <div className="espacio-header">
                                            <h3>{espacio.name}</h3>
                                            <span className={`status-indicator ${espacio.status}`}></span>
                                        </div>
                                        <div className="espacio-info">
                                            <p><i className='bx bx-category'></i> {getSpaceTypeBadge(espacio.type)}</p>
                                            <p><i className='bx bx-group'></i> Capacidad: {espacio.capacity} personas</p>
                                            <p><i className='bx bx-money'></i> ${espacio.price_per_hour?.toLocaleString('es-AR')}/hora</p>
                                        </div>
                                        <div className="espacio-status">
                                            <span className={`badge badge-${espacio.status}`}>
                                                {espacio.status === 'available' ? 'Disponible' :
                                                    espacio.status === 'occupied' ? 'Ocupado' : 'Mantenimiento'}
                                            </span>
                                            {!isProfesor() && (
                                                <div className="space-actions">
                                                    <button className="action-btn edit" title="Editar" onClick={() => handleOpenSpaceModal(espacio)}>
                                                        <i className='bx bx-edit'></i>
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        title="Eliminar"
                                                        onClick={() => setConfirmDeleteSpace({ show: true, id: espacio.id, name: espacio.name })}
                                                    >
                                                        <i className='bx bx-trash'></i>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Reserva */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={selectedReservation ? "Editar Reserva" : "Nueva Reserva"}
                size="md"
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Espacio</label>
                        <select
                            value={formData.space_id}
                            onChange={(e) => setFormData({ ...formData, space_id: e.target.value })}
                            required
                        >
                            {espacios.filter(e => e.status === 'available').map(e => (
                                <option key={e.id} value={e.id}>{e.name} - ${e.price_per_hour}/hora</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Vincular a Usuario (Opcional)</label>
                        <select
                            value={formData.client_id}
                            onChange={(e) => {
                                const val = e.target.value;
                                const user = users.find(u => u.id === parseInt(val));
                                if (user) {
                                    setFormData({
                                        ...formData,
                                        client_id: val,
                                        client_name: user.name,
                                        client_phone: user.phone || '',
                                        client_email: user.email || ''
                                    });
                                } else {
                                    setFormData({ ...formData, client_id: '' });
                                }
                            }}
                        >
                            <option value="">Selecciona usuario o deja en blanco</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>({u.role_name || 'Usuario'}) {u.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Nombre del Cliente</label>
                        <input
                            type="text"
                            value={formData.client_name}
                            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="text"
                                value={formData.client_phone}
                                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.client_email}
                                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Fecha</label>
                        <input
                            type="date"
                            value={formData.reservation_date}
                            onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Hora Inicio (Abre: {gymHours.opening_time})</label>
                            <input
                                type="time"
                                min={gymHours.opening_time}
                                max={gymHours.closing_time}
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Hora Fin (Cierra: {gymHours.closing_time})</label>
                            <input
                                type="time"
                                min={gymHours.opening_time}
                                max={gymHours.closing_time}
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Notas</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="2"
                        />
                    </div>
                    {!isProfesor() && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>Estado del Pago</label>
                                <select
                                    value={formData.payment_status}
                                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                                    required
                                >
                                    <option value="pending">Pendiente (Sin Pagar)</option>
                                    <option value="partial">Seña (Pago Parcial)</option>
                                    <option value="paid">Pagado Totalmente</option>
                                </select>
                            </div>
                            {formData.payment_status !== 'pending' && (
                                <>
                                    {formData.payment_status === 'partial' && (
                                        <div className="form-group">
                                            <label>Monto de Seña Abonado ($)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.payment_amount}
                                                onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Método de Pago</label>
                                        <select
                                            value={formData.payment_method}
                                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                            required
                                        >
                                            <option value="efectivo">Efectivo</option>
                                            <option value="tarjeta">Tarjeta</option>
                                            <option value="transferencia">Transferencia</option>
                                            <option value="mercadopago">MercadoPago</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    {!isProfesor() && (
                        <div className="reservation-total">
                            <strong>Total Estimado: ${calculateTotalSpace().toLocaleString('es-AR')}</strong>
                        </div>
                    )}
                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                        <button type="submit" className="btn-primary">{selectedReservation ? 'Guardar Cambios' : 'Crear Reserva'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmCancel.show}
                title="Cancelar Reserva"
                message="¿Estás seguro de cancelar esta reserva?"
                confirmText="Sí, Cancelar"
                variant="warning"
                onConfirm={handleCancelConfirm}
                onCancel={() => setConfirmCancel({ show: false, id: null })}
            />

            <ConfirmDialog
                isOpen={confirmDelete.show}
                title="Eliminar Reserva"
                message="¿Estás seguro de eliminar permanentemente esta reserva? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmDelete({ show: false, id: null })}
            />

            <ConfirmDialog
                isOpen={confirmDeleteSpace.show}
                title="Eliminar Espacio"
                message={`¿Estás seguro de eliminar el espacio "${confirmDeleteSpace.name}"? Esta acción no se puede deshacer y fallará si hay reservas asociadas.`}
                confirmText="Eliminar"
                variant="danger"
                onConfirm={handleDeleteSpaceConfirm}
                onCancel={() => setConfirmDeleteSpace({ show: false, id: null, name: '' })}
            />

            {/* Space Modal */}
            <Modal
                isOpen={showSpaceModal}
                onClose={handleCloseSpaceModal}
                title={editingSpace ? 'Editar Espacio' : 'Nuevo Espacio'}
                size="md"
            >
                <form onSubmit={handleSpaceSubmit}>
                    <div className="form-group">
                        <label>Nombre del Espacio</label>
                        <input
                            type="text"
                            value={spaceFormData.name}
                            onChange={(e) => setSpaceFormData({ ...spaceFormData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Tipo</label>
                            <select
                                value={spaceFormData.type}
                                onChange={(e) => setSpaceFormData({ ...spaceFormData, type: e.target.value })}
                                required
                            >
                                <option value="multiusos">Multiusos</option>
                                <option value="deportivo">Deportivo</option>
                                <option value="clases">Clases</option>
                                <option value="eventos">Eventos</option>
                                <option value="aire_libre">Aire Libre</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Estado</label>
                            <select
                                value={spaceFormData.status}
                                onChange={(e) => setSpaceFormData({ ...spaceFormData, status: e.target.value })}
                                required
                            >
                                <option value="available">Disponible</option>
                                <option value="occupied">Ocupado</option>
                                <option value="maintenance">En Mantenimiento</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Capacidad (personas)</label>
                            <input
                                type="number"
                                min="1"
                                value={spaceFormData.capacity}
                                onChange={(e) => setSpaceFormData({ ...spaceFormData, capacity: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Precio por Hora ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={spaceFormData.price_per_hour}
                                onChange={(e) => setSpaceFormData({ ...spaceFormData, price_per_hour: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Descripción (Opcional)</label>
                        <textarea
                            value={spaceFormData.description}
                            onChange={(e) => setSpaceFormData({ ...spaceFormData, description: e.target.value })}
                            rows="2"
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={handleCloseSpaceModal}>Cancelar</button>
                        <button type="submit" className="btn-primary">{editingSpace ? 'Guardar Cambios' : 'Crear Espacio'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AlquileresReservas;
