import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions, ROLES, ROLE_NAMES } from '../components/auth/RoleProtectedRoute';
import { ToastContainer, useToast } from '../components/ui/Toast';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const { isAdmin, isRecepcionista, isProfesor, isAlumno, userRoleId } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    addToast('Sesión cerrada exitosamente', 'success');
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const goHome = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const toggleSidebar = () => {
    // En móvil (≤768px) usar el estado de mobile
    if (window.innerWidth <= 768) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  // Menú según el rol del usuario
  const getMenuItems = () => {
    const commonItems = [
      { icon: 'bx-home-alt', label: 'Inicio', path: '/dashboard', exact: true }
    ];

    if (isAdmin()) {
      return [
        ...commonItems,
        { icon: 'bx-group', label: 'Gestionar Usuarios', path: '/dashboard/usuarios' },
        { icon: 'bx-calendar-event', label: 'Gestionar Actividades', path: '/dashboard/actividades' },
        { icon: 'bx-building-house', label: 'Alquileres y Reservas', path: '/dashboard/alquileres' },
        { icon: 'bx-money', label: 'Gestión de Pagos', path: '/dashboard/pagos' },
        { icon: 'bx-bar-chart-alt-2', label: 'Reportes', path: '/dashboard/reportes' },
        { icon: 'bx-cog', label: 'Configuración', path: '/dashboard/configuracion' }
      ];
    }

    if (isRecepcionista()) {
      return [
        ...commonItems,
        { icon: 'bx-group', label: 'Gestionar Usuarios', path: '/dashboard/usuarios' },
        { icon: 'bx-calendar-event', label: 'Gestionar Actividades', path: '/dashboard/actividades' },
        { icon: 'bx-building-house', label: 'Alquileres y Reservas', path: '/dashboard/alquileres' },
        { icon: 'bx-money', label: 'Gestión de Pagos', path: '/dashboard/pagos' },
        { icon: 'bx-search', label: 'Consultas', path: '/dashboard/consultas' }
      ];
    }

    if (isProfesor()) {
      return [
        ...commonItems,
        { icon: 'bx-chalkboard', label: 'Mis Clases', path: '/dashboard/mis-clases' },
        { icon: 'bx-group', label: 'Mis Alumnos', path: '/dashboard/alumnos' },
        { icon: 'bx-building-house', label: 'Alquileres y Reservas', path: '/dashboard/alquileres' },
        { icon: 'bx-user', label: 'Mi Perfil', path: '/dashboard/perfil' }
      ];
    }

    // Alumno (default)
    return [
      ...commonItems,
      { icon: 'bx-credit-card', label: 'Mis Cuotas', path: '/dashboard/mis-cuotas' },
      { icon: 'bx-line-chart', label: 'Mi Progreso', path: '/dashboard/mi-progreso' },
      { icon: 'bx-calendar-check', label: 'Mis Reservas', path: '/dashboard/mis-reservas' },
      { icon: 'bx-user', label: 'Mi Perfil', path: '/dashboard/perfil' }
    ];
  };

  const menuItems = getMenuItems();

  const isActiveRoute = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Colores por rol
  const getRoleColor = () => {
    switch (userRoleId) {
      case ROLES.ADMINISTRADOR: return '#dc2626';
      case ROLES.RECEPCIONISTA: return '#7c3aed';
      case ROLES.PROFESOR: return '#0891b2';
      case ROLES.ALUMNO: return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getRoleBadgeClass = () => {
    switch (userRoleId) {
      case ROLES.ADMINISTRADOR: return 'role-admin';
      case ROLES.RECEPCIONISTA: return 'role-recepcionista';
      case ROLES.PROFESOR: return 'role-profesor';
      case ROLES.ALUMNO: return 'role-alumno';
      default: return '';
    }
  };

  return (
    <div className="dashboard-layout">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Sidebar: en desktop controla 'open'/'closed'; en móvil usa 'mobile-open' */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img
              src="/20250722_1102_Logo Fortaleza Mejorado_remix_01k0s6th6efftr2w6q7nrv4nvc-Photoroom.png"
              alt="Fortaleza Logo"
            />
            {(sidebarOpen || mobileSidebarOpen) && <span>FORTALEZA</span>}
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <i className={`bx ${sidebarOpen ? 'bx-chevron-left' : 'bx-chevron-right'}`}></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`nav-item ${isActiveRoute(item.path, item.exact) ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                closeMobileSidebar();
              }}
              title={(!sidebarOpen && !mobileSidebarOpen) ? item.label : ''}
            >
              <i className={`bx ${item.icon}`}></i>
              {(sidebarOpen || mobileSidebarOpen) && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item"
            onClick={() => { goHome(); closeMobileSidebar(); }}
            title={(!sidebarOpen && !mobileSidebarOpen) ? 'Volver al Inicio' : ''}
          >
            <i className='bx bx-arrow-back'></i>
            {(sidebarOpen || mobileSidebarOpen) && <span>Volver al Inicio</span>}
          </button>
          <button
            className="nav-item logout"
            onClick={() => { handleLogout(); closeMobileSidebar(); }}
            title={(!sidebarOpen && !mobileSidebarOpen) ? 'Cerrar Sesión' : ''}
          >
            <i className='bx bx-log-out'></i>
            {(sidebarOpen || mobileSidebarOpen) && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-overlay active"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className={`dashboard-main ${sidebarOpen ? '' : 'expanded'}`}>
        {/* Top Header */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
              <i className='bx bx-menu'></i>
            </button>
            <h1 className="page-title">Panel de Control</h1>
          </div>
          <div className="topbar-right">
            <div className="user-info">
              <div className="user-avatar" style={{ backgroundColor: getRoleColor() }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.name || 'Usuario'}</span>
                <span className={`user-role ${getRoleBadgeClass()}`}>
                  {ROLE_NAMES[userRoleId]}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="dashboard-content">
          {location.pathname === '/dashboard' ? (
            <DashboardHome user={user} roleId={userRoleId} />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};

// Componente de inicio del Dashboard
const DashboardHome = ({ user, roleId }) => {
  const navigate = useNavigate();
  const { isAdmin, isRecepcionista, isProfesor, isAlumno } = usePermissions();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/reports/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) setStats(data.data);
        }
      } catch (error) {
        console.error('Error cargando stats del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const getWelcomeMessage = () => {
    if (isAdmin()) return '¡Bienvenido, Administrador!';
    if (isRecepcionista()) return '¡Bienvenido, Recepcionista!';
    if (isProfesor()) return '¡Bienvenido, Profesor!';
    return '¡Bienvenido a Fortaleza!';
  };

  const getQuickStats = () => {
    if (isAdmin()) {
      return [
        { icon: 'bx-group', value: stats?.activeStudents ?? '—', label: 'Alumnos Activos', color: '#dc2626' },
        { icon: 'bx-calendar-event', value: stats?.totalClasses ?? '—', label: 'Clases Activas', color: '#0891b2' },
        { icon: 'bx-dollar', value: stats?.income !== undefined && stats?.income !== null ? `$${Number(stats.income).toLocaleString('es-AR')}` : '—', label: 'Ingresos Mes', color: '#16a34a' },
        { icon: 'bx-calendar', value: stats?.pendingReservations ?? '—', label: 'Reservas Pendientes', color: '#7c3aed' }
      ];
    }
    if (isRecepcionista()) {
      return [
        { icon: 'bx-money', value: stats?.totalPayments ?? '—', label: 'Pagos Mes', color: '#16a34a' },
        { icon: 'bx-calendar', value: stats?.pendingReservations ?? '—', label: 'Reservas Pendientes', color: '#0891b2' },
        { icon: 'bx-group', value: stats?.activeStudents ?? '—', label: 'Alumnos Activos', color: '#7c3aed' },
        { icon: 'bx-calendar-event', value: stats?.totalClasses ?? '—', label: 'Clases Activas', color: '#dc2626' }
      ];
    }
    if (isProfesor()) {
      return [
        { icon: 'bx-chalkboard', value: stats?.totalClasses ?? '—', label: 'Mis Clases', color: '#0891b2' },
        { icon: 'bx-group', value: stats?.activeStudents ?? '—', label: 'Alumnos Totales', color: '#7c3aed' },
        { icon: 'bx-calendar', value: stats?.pendingReservations ?? '—', label: 'Reservas', color: '#16a34a' },
        { icon: 'bx-star', value: '—', label: 'Valoración', color: '#f59e0b' }
      ];
    }
    // Alumno
    return [
      { icon: 'bx-calendar-check', value: stats?.pendingReservations ?? '—', label: 'Mis Reservas', color: '#16a34a' },
      { icon: 'bx-credit-card', value: stats?.subscriptions?.active_count ? 'Al día' : 'Pendiente', label: 'Estado Cuota', color: '#0891b2' },
      { icon: 'bx-run', value: stats?.totalClasses ?? '—', label: 'Clases Disponibles', color: '#7c3aed' },
      { icon: 'bx-trophy', value: '—', label: 'Logros', color: '#f59e0b' }
    ];
  };

  const getQuickActions = () => {
    if (isAdmin()) {
      return [
        { icon: 'bx-group', label: 'Gestionar Usuarios', path: '/dashboard/usuarios', color: '#dc2626' },
        { icon: 'bx-calendar-event', label: 'Actividades', path: '/dashboard/actividades', color: '#7c3aed' },
        { icon: 'bx-bar-chart', label: 'Ver Reportes', path: '/dashboard/reportes', color: '#0891b2' },
        { icon: 'bx-cog', label: 'Configuración', path: '/dashboard/configuracion', color: '#6b7280' }
      ];
    }
    if (isRecepcionista()) {
      return [
        { icon: 'bx-group', label: 'Gestionar Usuarios', path: '/dashboard/usuarios', color: '#dc2626' },
        { icon: 'bx-calendar-event', label: 'Actividades', path: '/dashboard/actividades', color: '#f59e0b' },
        { icon: 'bx-money', label: 'Gestionar Pagos', path: '/dashboard/pagos', color: '#16a34a' },
        { icon: 'bx-building-house', label: 'Reservas', path: '/dashboard/alquileres', color: '#7c3aed' },
        { icon: 'bx-search', label: 'Consultas', path: '/dashboard/consultas', color: '#0891b2' },
        { icon: 'bx-user', label: 'Mi Perfil', path: '/dashboard/perfil', color: '#6b7280' }
      ];
    }
    if (isProfesor()) {
      return [
        { icon: 'bx-chalkboard', label: 'Mis Clases', path: '/dashboard/mis-clases', color: '#0891b2' },
        { icon: 'bx-group', label: 'Mis Alumnos', path: '/dashboard/alumnos', color: '#7c3aed' },
        { icon: 'bx-building-house', label: 'Reservas', path: '/dashboard/alquileres', color: '#dc2626' }
      ];
    }
    // Alumno
    return [
      { icon: 'bx-calendar-plus', label: 'Mis Reservas', path: '/dashboard/mis-reservas', color: '#16a34a' },
      { icon: 'bx-credit-card', label: 'Mis Cuotas', path: '/dashboard/mis-cuotas', color: '#0891b2' },
      { icon: 'bx-user', label: 'Mi Perfil', path: '/dashboard/perfil', color: '#6b7280' }
    ];
  };

  const quickStats = getQuickStats();
  const actions = getQuickActions();

  return (
    <div className="dashboard-home">
      {/* Welcome Section */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2>{getWelcomeMessage()}</h2>
          <p>Hola <strong>{user?.name}</strong>, aquí tienes un resumen de tu actividad.</p>
        </div>
        <div className="welcome-illustration">
          <i className='bx bx-dumbbell'></i>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {quickStats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              {loading ? (
                <i className='bx bx-loader-alt bx-spin'></i>
              ) : (
                <i className={`bx ${stat.icon}`}></i>
              )}
            </div>
            <div className="stat-info">
              <span className="stat-value">{loading ? '...' : stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section-header">
        <h3>Acciones Rápidas</h3>
      </div>
      <div className="quick-actions">
        {actions.map((action, index) => (
          <button
            key={index}
            className="action-card"
            onClick={() => navigate(action.path)}
            style={{ '--action-color': action.color }}
          >
            <div className="action-icon">
              <i className={`bx ${action.icon}`}></i>
            </div>
            <span>{action.label}</span>
          </button>
        ))}
      </div>


    </div>
  );
};

export default DashboardPage;
