import { useState } from 'react';
import './Consultas.css';

const Consultas = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('nombre');
    const [resultados, setResultados] = useState([]);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const usuarios = [
        { id: 1, nombre: 'Juan Pérez', dni: '12345678', email: 'juan@email.com', rol: 'alumno', estado: 'activo', cuota: 'al_dia', plan: 'Premium' },
        { id: 2, nombre: 'María García', dni: '23456789', email: 'maria@email.com', rol: 'alumno', estado: 'activo', cuota: 'pendiente', plan: 'Básico' },
        { id: 3, nombre: 'Carlos López', dni: '34567890', email: 'carlos@email.com', rol: 'profesor', estado: 'activo', cuota: null, plan: null },
        { id: 4, nombre: 'Ana Martínez', dni: '45678901', email: 'ana@email.com', rol: 'alumno', estado: 'activo', cuota: 'vencida', plan: 'Premium' },
        { id: 5, nombre: 'Pedro Sánchez', dni: '56789012', email: 'pedro@email.com', rol: 'alumno', estado: 'inactivo', cuota: 'vencida', plan: 'Básico' },
    ];

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleSearch = () => {
        if (!searchTerm.trim()) {
            showNotification('⚠️ Ingresa un término de búsqueda', 'warning');
            return;
        }

        const results = usuarios.filter(u => {
            if (searchType === 'nombre') return u.nombre.toLowerCase().includes(searchTerm.toLowerCase());
            if (searchType === 'dni') return u.dni.includes(searchTerm);
            if (searchType === 'email') return u.email.toLowerCase().includes(searchTerm.toLowerCase());
            return false;
        });

        setResultados(results);
        if (results.length === 0) {
            showNotification('🔍 No se encontraron resultados', 'info');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="consultas-page">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <h2><i className='bx bx-search'></i> Consultas</h2>
                <p>Busca información de usuarios y clientes</p>
            </div>

            {/* Search Form */}
            <div className="search-section">
                <div className="search-form">
                    <select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="search-type"
                    >
                        <option value="nombre">Nombre</option>
                        <option value="dni">DNI</option>
                        <option value="email">Email</option>
                    </select>
                    <div className="search-input-wrapper">
                        <i className='bx bx-search'></i>
                        <input
                            type="text"
                            placeholder={`Buscar por ${searchType}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </div>
                    <button className="btn-search" onClick={handleSearch}>
                        <i className='bx bx-search-alt'></i> Buscar
                    </button>
                </div>
            </div>

            {/* Resultados */}
            {resultados.length > 0 && (
                <div className="resultados-section">
                    <h3><i className='bx bx-list-ul'></i> Resultados ({resultados.length})</h3>
                    <div className="resultados-list">
                        {resultados.map((usuario) => (
                            <div key={usuario.id} className="resultado-card">
                                <div className="resultado-avatar">
                                    {usuario.nombre.charAt(0)}
                                </div>
                                <div className="resultado-info">
                                    <div className="resultado-header">
                                        <h4>{usuario.nombre}</h4>
                                        <span className={`rol-badge ${usuario.rol}`}>{usuario.rol}</span>
                                    </div>
                                    <div className="resultado-details">
                                        <span><i className='bx bx-id-card'></i> DNI: {usuario.dni}</span>
                                        <span><i className='bx bx-envelope'></i> {usuario.email}</span>
                                        {usuario.plan && <span><i className='bx bx-crown'></i> {usuario.plan}</span>}
                                    </div>
                                </div>
                                <div className="resultado-status">
                                    <span className={`estado-badge ${usuario.estado}`}>
                                        {usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                    </span>
                                    {usuario.cuota && (
                                        <span className={`cuota-badge ${usuario.cuota}`}>
                                            Cuota: {usuario.cuota === 'al_dia' ? 'Al día' : usuario.cuota === 'pendiente' ? 'Pendiente' : 'Vencida'}
                                        </span>
                                    )}
                                </div>
                                <div className="resultado-actions">
                                    <button
                                        className="btn-action"
                                        onClick={() => showNotification('📋 Ficha completa abierta', 'success')}
                                    >
                                        <i className='bx bx-show'></i>
                                    </button>
                                    <button
                                        className="btn-action"
                                        onClick={() => showNotification('📧 Email enviado', 'success')}
                                    >
                                        <i className='bx bx-mail-send'></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="quick-stats">
                <h3><i className='bx bx-bar-chart'></i> Estadísticas Rápidas</h3>
                <div className="stats-grid">
                    <div className="quick-stat-card">
                        <div className="stat-number">156</div>
                        <div className="stat-label">Alumnos Activos</div>
                    </div>
                    <div className="quick-stat-card">
                        <div className="stat-number">23</div>
                        <div className="stat-label">Cuotas Pendientes</div>
                    </div>
                    <div className="quick-stat-card">
                        <div className="stat-number">8</div>
                        <div className="stat-label">Cuotas Vencidas</div>
                    </div>
                    <div className="quick-stat-card">
                        <div className="stat-number">12</div>
                        <div className="stat-label">Nuevos este mes</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Consultas;
