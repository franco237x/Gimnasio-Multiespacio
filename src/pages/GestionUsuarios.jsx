import { useState } from 'react';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('todos');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // Datos simulados
    const [usuarios] = useState([
        { id: 1, nombre: 'Juan Pérez', email: 'juan@email.com', dni: '12345678', rol: 'alumno', estado: 'activo', fechaAlta: '2024-01-15' },
        { id: 2, nombre: 'María García', email: 'maria@email.com', dni: '23456789', rol: 'alumno', estado: 'activo', fechaAlta: '2024-02-20' },
        { id: 3, nombre: 'Carlos López', email: 'carlos@email.com', dni: '34567890', rol: 'profesor', estado: 'activo', fechaAlta: '2023-06-10' },
        { id: 4, nombre: 'Ana Martínez', email: 'ana@email.com', dni: '45678901', rol: 'recepcionista', estado: 'activo', fechaAlta: '2023-08-05' },
        { id: 5, nombre: 'Pedro Sánchez', email: 'pedro@email.com', dni: '56789012', rol: 'alumno', estado: 'inactivo', fechaAlta: '2024-03-12' },
        { id: 6, nombre: 'Laura Fernández', email: 'laura@email.com', dni: '67890123', rol: 'profesor', estado: 'activo', fechaAlta: '2023-09-18' },
    ]);

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        dni: '',
        rol: 'alumno',
        password: ''
    });

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                nombre: user.nombre,
                email: user.email,
                dni: user.dni,
                rol: user.rol,
                password: ''
            });
        } else {
            setEditingUser(null);
            setFormData({ nombre: '', email: '', dni: '', rol: 'alumno', password: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ nombre: '', email: '', dni: '', rol: 'alumno', password: '' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            showNotification('✅ Usuario actualizado exitosamente', 'success');
        } else {
            showNotification('✅ Usuario creado exitosamente', 'success');
        }
        handleCloseModal();
    };

    const handleDelete = (userId) => {
        showNotification('🗑️ Usuario eliminado correctamente', 'success');
    };

    const handleToggleStatus = (userId) => {
        showNotification('✅ Estado del usuario actualizado', 'success');
    };

    const getRoleBadge = (rol) => {
        const colors = {
            admin: { bg: 'rgba(220, 38, 38, 0.2)', color: '#dc2626' },
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
            user.dni.includes(searchTerm);
        const matchesRole = filterRole === 'todos' || user.rol === filterRole;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="gestion-usuarios">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-group'></i> Gestionar Usuarios</h2>
                    <p>Administra todos los usuarios del sistema</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <i className='bx bx-user-plus'></i> Nuevo Usuario
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                        <i className='bx bx-group'></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{usuarios.length}</span>
                        <span className="stat-label">Total Usuarios</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(22, 163, 74, 0.2)', color: '#16a34a' }}>
                        <i className='bx bx-user'></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{usuarios.filter(u => u.rol === 'alumno').length}</span>
                        <span className="stat-label">Alumnos</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(8, 145, 178, 0.2)', color: '#0891b2' }}>
                        <i className='bx bx-user-voice'></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{usuarios.filter(u => u.rol === 'profesor').length}</span>
                        <span className="stat-label">Profesores</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' }}>
                        <i className='bx bx-id-card'></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{usuarios.filter(u => u.rol === 'recepcionista').length}</span>
                        <span className="stat-label">Recepcionistas</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <i className='bx bx-search'></i>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="filter-select"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                >
                    <option value="todos">Todos los roles</option>
                    <option value="alumno">Alumnos</option>
                    <option value="profesor">Profesores</option>
                    <option value="recepcionista">Recepcionistas</option>
                </select>
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>DNI</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Fecha Alta</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-info">
                                        <div className="user-avatar">
                                            {user.nombre.charAt(0)}
                                        </div>
                                        <div className="user-details">
                                            <span className="user-name">{user.nombre}</span>
                                            <span className="user-email">{user.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{user.dni}</td>
                                <td>{getRoleBadge(user.rol)}</td>
                                <td>
                                    <span className={`status-badge ${user.estado}`}>
                                        {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>{user.fechaAlta}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn-action btn-edit"
                                            onClick={() => handleOpenModal(user)}
                                            title="Editar"
                                        >
                                            <i className='bx bx-edit'></i>
                                        </button>
                                        <button
                                            className="btn-action btn-toggle"
                                            onClick={() => handleToggleStatus(user.id)}
                                            title={user.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                        >
                                            <i className={`bx ${user.estado === 'activo' ? 'bx-pause' : 'bx-play'}`}></i>
                                        </button>
                                        <button
                                            className="btn-action btn-delete"
                                            onClick={() => handleDelete(user.id)}
                                            title="Eliminar"
                                        >
                                            <i className='bx bx-trash'></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <i className='bx bx-user'></i>
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            <button className="modal-close" onClick={handleCloseModal}>
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Nombre completo"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>DNI</label>
                                    <input
                                        type="text"
                                        value={formData.dni}
                                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                        placeholder="Número de DNI"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="correo@ejemplo.com"
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Rol</label>
                                    <select
                                        value={formData.rol}
                                        onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                    >
                                        <option value="alumno">Alumno</option>
                                        <option value="profesor">Profesor</option>
                                        <option value="recepcionista">Recepcionista</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={editingUser ? 'Dejar vacío para no cambiar' : 'Contraseña'}
                                        required={!editingUser}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionUsuarios;
