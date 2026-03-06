import { useState, useEffect } from 'react';
import { usersAPI } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import { ToastContainer, useToast } from '../components/ui/Toast';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
    const { user: currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('todos');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const { toasts, addToast, removeToast } = useToast();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, userId: null, userName: '' });

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        rol: 'alumno',
        password: ''
    });

    // Cargar usuarios al montar el componente
    useEffect(() => {
        loadUsuarios();
    }, []);

    const loadUsuarios = async () => {
        try {
            setLoading(true);
            const response = await usersAPI.getAll();
            if (response.success) {
                // Mapear datos del backend al formato del frontend
                const mappedUsers = response.data.map(user => ({
                    id: user.id,
                    nombre: user.name,
                    email: user.email,
                    telefono: user.phone || '',
                    rol: user.role_name?.toLowerCase() || 'alumno',
                    rol_id: user.role_id,
                    estado: (user.is_active === 1 || user.is_active === true) ? 'activo' : 'inactivo',
                    fechaAlta: new Date(user.created_at).toLocaleDateString('es-AR')
                }));
                setUsuarios(mappedUsers);
            }
        } catch (error) {
            showNotification('❌ Error al cargar usuarios', 'error');
            console.error('Error cargando usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        addToast(message, type);
    };

    const getRoleId = (roleName) => {
        const roles = { administrador: 1, recepcionista: 2, profesor: 3, alumno: 4 };
        return roles[roleName.toLowerCase()] || 4;
    };

    const isRestrictedForReceptionist = (targetRolName) => {
        // En algunos lugares puede venir como currentUser?.role_name o currentUser?.role?.name
        const roleName = currentUser?.role_name || currentUser?.role?.name || '';
        const currentRole = roleName.toLowerCase();
        const target = targetRolName?.toLowerCase();
        return currentRole === 'recepcionista' && (target === 'administrador' || target === 'recepcionista');
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                nombre: user.nombre,
                email: user.email,
                telefono: user.telefono || '',
                rol: user.rol,
                password: ''
            });
        } else {
            setEditingUser(null);
            setFormData({ nombre: '', email: '', telefono: '', rol: 'alumno', password: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ nombre: '', email: '', telefono: '', rol: 'alumno', password: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password.length < 6) {
            showNotification('❌ La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            const userData = {
                name: formData.nombre,
                email: formData.email,
                phone: formData.telefono,
                role_id: getRoleId(formData.rol)
            };

            if (formData.password) {
                userData.password = formData.password;
            }

            if (editingUser) {
                // Actualizar usuario
                await usersAPI.update(editingUser.id, userData);
                showNotification('✅ Usuario actualizado exitosamente', 'success');
            } else {
                // Crear usuario
                if (!formData.password) {
                    showNotification('❌ La contraseña es requerida', 'error');
                    setIsSubmitting(false);
                    return;
                }
                await usersAPI.create(userData);
                showNotification('✅ Usuario creado exitosamente', 'success');
            }

            handleCloseModal();
            loadUsuarios(); // Recargar lista
        } catch (error) {
            showNotification('❌ Error al guardar usuario: ' + error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (user) => {
        setConfirmDelete({ show: true, userId: user.id, userName: user.nombre });
    };

    const handleDeleteConfirm = async () => {
        try {
            await usersAPI.delete(confirmDelete.userId);
            showNotification('🗑️ Usuario eliminado correctamente', 'success');
            setUsuarios(prev => prev.filter(u => u.id !== confirmDelete.userId));
        } catch (error) {
            showNotification('❌ Error al eliminar usuario', 'error');
        } finally {
            setConfirmDelete({ show: false, userId: null, userName: '' });
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await usersAPI.update(user.id, {
                name: user.nombre,
                email: user.email,
                is_active: user.estado !== 'activo'
            });
            showNotification('✅ Estado del usuario actualizado', 'success');
            setUsuarios(prev => prev.map(u => u.id === user.id ? { ...u, estado: user.estado === 'activo' ? 'inactivo' : 'activo' } : u));
        } catch (error) {
            showNotification('❌ Error al actualizar estado', 'error');
        }
    };

    const getRoleBadge = (rol) => {
        const colors = {
            administrador: { bg: 'rgba(220, 38, 38, 0.2)', color: '#dc2626' },
            recepcionista: { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' },
            profesor: { bg: 'rgba(8, 145, 178, 0.2)', color: '#0891b2' },
            alumno: { bg: 'rgba(22, 163, 74, 0.2)', color: '#16a34a' }
        };
        const style = colors[rol] || colors.alumno;
        return <span className="badge" style={{ background: style.bg, color: style.color }}>{rol}</span>;
    };

    const filteredUsers = usuarios.filter(user => {
        const matchesSearch = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.telefono && user.telefono.includes(searchTerm));
        const matchesRole = filterRole === 'todos' || user.rol === filterRole;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="gestion-usuarios">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="page-header">
                <h1><i className='bx bxs-user-detail'></i> Gestión de Usuarios</h1>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <i className='bx bx-plus'></i> Nuevo Usuario
                </button>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <i className='bx bx-search'></i>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="todos">Todos los roles</option>
                    <option value="administrador">Administrador</option>
                    <option value="recepcionista">Recepcionista</option>
                    <option value="profesor">Profesor</option>
                    <option value="alumno">Alumno</option>
                </select>
            </div>

            {loading ? (
                <div className="loading-state">
                    <i className='bx bx-loader-alt bx-spin'></i>
                    <p>Cargando usuarios...</p>
                </div>
            ) : (
                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Fecha Alta</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="no-results">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td className="user-name">{user.nombre}</td>
                                        <td>{user.email}</td>
                                        <td>{user.telefono || '-'}</td>
                                        <td>{getRoleBadge(user.rol)}</td>
                                        <td>
                                            <span className={`status-badge status-${user.estado}`}>
                                                {user.estado}
                                            </span>
                                        </td>
                                        <td>{user.fechaAlta}</td>
                                        <td className="actions">
                                            <button
                                                className="action-btn edit"
                                                title={isRestrictedForReceptionist(user.rol) ? "No tienes permisos" : "Editar"}
                                                onClick={() => handleOpenModal(user)}
                                                disabled={isRestrictedForReceptionist(user.rol)}
                                                style={isRestrictedForReceptionist(user.rol) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                            >
                                                <i className='bx bx-edit'></i>
                                            </button>
                                            <button
                                                className={`action-btn ${user.estado === 'activo' ? 'deactivate' : 'activate'}`}
                                                title={user.id === currentUser?.id ? "No puedes desactivar tu cuenta actual" : isRestrictedForReceptionist(user.rol) ? "No tienes permisos" : (user.estado === 'activo' ? 'Desactivar' : 'Activar')}
                                                onClick={() => handleToggleStatus(user)}
                                                disabled={user.id === currentUser?.id || isRestrictedForReceptionist(user.rol)}
                                                style={user.id === currentUser?.id || isRestrictedForReceptionist(user.rol) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                            >
                                                <i className={`bx ${user.estado === 'activo' ? 'bx-pause' : 'bx-play'}`}></i>
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                title={user.id === currentUser?.id ? "No puedes eliminar tu cuenta actual" : isRestrictedForReceptionist(user.rol) ? "No tienes permisos" : "Eliminar"}
                                                onClick={() => handleDeleteClick(user)}
                                                disabled={user.id === currentUser?.id || isRestrictedForReceptionist(user.rol)}
                                                style={user.id === currentUser?.id || isRestrictedForReceptionist(user.rol) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                            >
                                                <i className='bx bx-trash'></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal para crear/editar usuario */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                size="md"
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre Completo</label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Teléfono</label>
                        <input
                            type="text"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Rol</label>
                        <select
                            value={formData.rol}
                            onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                        >
                            <option value="alumno">Alumno</option>
                            <option value="profesor">Profesor</option>
                            {((currentUser?.role_name || currentUser?.role?.name || '').toLowerCase() !== 'recepcionista') && (
                                <>
                                    <option value="recepcionista">Recepcionista</option>
                                    <option value="administrador">Administrador</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Contraseña {editingUser && <span style={{ fontSize: '0.8rem', color: '#666' }}>(Opcional. Dejar en blanco para no modificar)</span>}</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!editingUser}
                            minLength="6"
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDelete.show}
                title="Eliminar Usuario"
                message={`¿Estás seguro de eliminar a "${confirmDelete.userName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmDelete({ show: false, userId: null, userName: '' })}
            />
        </div>
    );
};

export default GestionUsuarios;
