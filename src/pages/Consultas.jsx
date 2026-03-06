import { useState, useEffect } from 'react';
import { usersAPI, reportsAPI, paymentsAPI } from '../services/apiService';
import './Consultas.css';

const Consultas = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('nombre');
    const [resultados, setResultados] = useState([]);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [quickStats, setQuickStats] = useState(null);

    useEffect(() => {
        loadQuickStats();
    }, []);

    const loadQuickStats = async () => {
        try {
            const res = await reportsAPI.getDashboard();
            if (res.success) {
                setQuickStats(res.data);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    };

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            showNotification('⚠️ Ingresa un término de búsqueda', 'warning');
            return;
        }

        setLoading(true);
        try {
            const res = await usersAPI.getAll({ search: searchTerm });
            if (res.success) {
                // Filtrar por tipo de búsqueda si es necesario
                let filtered = res.data;
                if (searchType === 'email') {
                    filtered = filtered.filter(u =>
                        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                } else if (searchType === 'dni') {
                    filtered = filtered.filter(u =>
                        u.phone?.includes(searchTerm)
                    );
                }

                // NUEVO: Obtener la suscripción para que el recepcionista vea la cuota
                const usersWithSubs = await Promise.all(filtered.map(async (u) => {
                    const isAlumno = u.role_id === 4 || u.role_name?.toLowerCase() === 'alumno';
                    if (isAlumno) {
                        try {
                            const subRes = await paymentsAPI.getSubscription(u.id);
                            return { ...u, subscription: subRes.success ? subRes.data : null };
                        } catch (e) { return u; }
                    }
                    return u;
                }));

                setResultados(usersWithSubs);
                if (usersWithSubs.length === 0) {
                    showNotification('🔍 No se encontraron resultados', 'info');
                }
            }
        } catch (error) {
            showNotification('❌ Error al buscar usuarios', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const getRoleName = (roleId) => {
        const roles = { 1: 'administrador', 2: 'recepcionista', 3: 'profesor', 4: 'alumno' };
        return roles[roleId] || 'alumno';
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
                        <option value="dni">Teléfono/DNI</option>
                        <option value="email">Email</option>
                    </select>
                    <div className="search-input-wrapper">
                        <i className='bx bx-search'></i>
                        <input
                            type="text"
                            placeholder={`Buscar por ${searchType}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <button className="btn-search" onClick={handleSearch} disabled={loading}>
                        {loading ? (
                            <><i className='bx bx-loader-alt bx-spin'></i> Buscando...</>
                        ) : (
                            <><i className='bx bx-search-alt'></i> Buscar</>
                        )}
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
                                    {usuario.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="resultado-info">
                                    <div className="resultado-header">
                                        <h4>{usuario.name}</h4>
                                        <span className={`rol-badge ${getRoleName(usuario.role_id)}`}>
                                            {usuario.role_name || getRoleName(usuario.role_id)}
                                        </span>
                                    </div>
                                    <div className="resultado-details">
                                        {usuario.phone && <span><i className='bx bx-phone'></i> {usuario.phone}</span>}
                                        <span><i className='bx bx-envelope'></i> {usuario.email}</span>
                                    </div>
                                </div>
                                <div className="resultado-status" style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                                    <span className={`estado-badge ${usuario.email_verified ? 'activo' : 'inactivo'}`}>
                                        {usuario.email_verified ? 'Verificado' : 'Sin verificar'}
                                    </span>
                                    {usuario.subscription ? (
                                        <span className="estado-badge activo" style={{ background: 'var(--success-color)', color: 'white', whiteSpace: 'nowrap' }}>
                                            <i className='bx bx-check-circle'></i> {usuario.subscription.plan_name} (Vence: {new Date(usuario.subscription.end_date).toLocaleDateString('es-AR')})
                                        </span>
                                    ) : (usuario.role_id === 4 || usuario.role_name?.toLowerCase() === 'alumno') ? (
                                        <span className="estado-badge inactivo" style={{ background: 'var(--danger-color)', color: 'white', whiteSpace: 'nowrap' }}>
                                            <i className='bx bx-x-circle'></i> Sin Cuota Activa
                                        </span>
                                    ) : null}
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
                        <div className="stat-number">{quickStats?.activeStudents ?? '—'}</div>
                        <div className="stat-label">Alumnos Activos</div>
                    </div>
                    <div className="quick-stat-card">
                        <div className="stat-number">{quickStats?.subscriptions?.pending_count ?? '—'}</div>
                        <div className="stat-label">Cuotas Pendientes</div>
                    </div>
                    <div className="quick-stat-card">
                        <div className="stat-number">{quickStats?.subscriptions?.expired_count ?? '—'}</div>
                        <div className="stat-label">Cuotas Vencidas</div>
                    </div>
                    <div className="quick-stat-card">
                        <div className="stat-number">{quickStats?.totalClasses ?? '—'}</div>
                        <div className="stat-label">Clases Activas</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Consultas;
