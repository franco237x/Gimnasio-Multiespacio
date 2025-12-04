import { useState } from 'react';
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
    setSidebarOpen(!sidebarOpen);
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
        { icon: 'bx-user-voice', label: 'Gestionar Profesores', path: '/dashboard/profesores' },
        { icon: 'bx-calendar-event', label: 'Gestionar Actividades', path: '/dashboard/actividades' },
        { icon: 'bx-building-house', label: 'Alquileres y Reservas', path: '/dashboard/alquileres' },
        { icon: 'bx-money', label: 'Gestión de Cuotas', path: '/dashboard/cuotas' },
        { icon: 'bx-file', label: 'Generar Comprobante', path: '/dashboard/comprobantes' },
        { icon: 'bx-bar-chart-alt-2', label: 'Reportes', path: '/dashboard/reportes' },
        { icon: 'bx-cog', label: 'Configuración', path: '/dashboard/configuracion' }
      ];
    }

    if (isRecepcionista()) {
      return [
        ...commonItems,
        { icon: 'bx-building-house', label: 'Alquileres y Reservas', path: '/dashboard/alquileres' },
        { icon: 'bx-money', label: 'Pago de Cuota', path: '/dashboard/cuotas' },
        { icon: 'bx-plus-circle', label: 'Alta de Cuotas', path: '/dashboard/alta-cuotas' },
        { icon: 'bx-file', label: 'Generar Comprobante', path: '/dashboard/comprobantes' },
        { icon: 'bx-search', label: 'Consultas', path: '/dashboard/consultas' }
      ];
    }

    if (isProfesor()) {
      return [
        ...commonItems,
        { icon: 'bx-calendar-event', label: 'Gestionar Actividades', path: '/dashboard/actividades' },
        { icon: 'bx-chalkboard', label: 'Mis Clases', path: '/dashboard/mis-clases' },
        { icon: 'bx-group', label: 'Mis Alumnos', path: '/dashboard/alumnos' },
        { icon: 'bx-building-house', label: 'Alquileres y Reservas', path: '/dashboard/alquileres' }
      ];
    }

    // Alumno (default)
    return [
      ...commonItems,
      { icon: 'bx-credit-card', label: 'Mis Cuotas', path: '/dashboard/mis-cuotas' },
      { icon: 'bx-calendar-check', label: 'Mis Reservas', path: '/dashboard/mis-reservas' },
      { icon: 'bx-info-circle', label: 'Ver Información', path: '/dashboard/informacion' },
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
      
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img 
              src="/20250722_1102_Logo Fortaleza Mejorado_remix_01k0s6th6efftr2w6q7nrv4nvc-Photoroom.png" 
              alt="Fortaleza Logo" 
            />
            {sidebarOpen && <span>FORTALEZA</span>}
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
              onClick={() => navigate(item.path)}
              title={!sidebarOpen ? item.label : ''}
            >
              <i className={`bx ${item.icon}`}></i>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={goHome} title={!sidebarOpen ? 'Volver al Inicio' : ''}>
            <i className='bx bx-arrow-back'></i>
            {sidebarOpen && <span>Volver al Inicio</span>}
          </button>
          <button className="nav-item logout" onClick={handleLogout} title={!sidebarOpen ? 'Cerrar Sesión' : ''}>
            <i className='bx bx-log-out'></i>
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

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
  const { isAdmin, isRecepcionista, isProfesor, isAlumno } = usePermissions();

  const getWelcomeMessage = () => {
    if (isAdmin()) return '¡Bienvenido, Administrador!';
    if (isRecepcionista()) return '¡Bienvenido, Recepcionista!';
    if (isProfesor()) return '¡Bienvenido, Profesor!';
    return '¡Bienvenido a Fortaleza!';
  };

  const getQuickStats = () => {
    if (isAdmin()) {
      return [
        { icon: 'bx-group', value: '156', label: 'Usuarios Activos', color: '#dc2626' },
        { icon: 'bx-user-voice', value: '12', label: 'Profesores', color: '#7c3aed' },
        { icon: 'bx-calendar-event', value: '24', label: 'Clases Hoy', color: '#0891b2' },
        { icon: 'bx-dollar', value: '$45,230', label: 'Ingresos Mes', color: '#16a34a' }
      ];
    }
    if (isRecepcionista()) {
      return [
        { icon: 'bx-user-check', value: '23', label: 'Check-ins Hoy', color: '#7c3aed' },
        { icon: 'bx-money', value: '15', label: 'Pagos Hoy', color: '#16a34a' },
        { icon: 'bx-calendar', value: '8', label: 'Reservas Pendientes', color: '#0891b2' },
        { icon: 'bx-bell', value: '5', label: 'Cuotas Vencidas', color: '#dc2626' }
      ];
    }
    if (isProfesor()) {
      return [
        { icon: 'bx-chalkboard', value: '3', label: 'Clases Hoy', color: '#0891b2' },
        { icon: 'bx-group', value: '45', label: 'Mis Alumnos', color: '#7c3aed' },
        { icon: 'bx-calendar-check', value: '18', label: 'Clases Semana', color: '#16a34a' },
        { icon: 'bx-star', value: '4.8', label: 'Valoración', color: '#f59e0b' }
      ];
    }
    // Alumno
    return [
      { icon: 'bx-calendar-check', value: '3', label: 'Reservas Activas', color: '#16a34a' },
      { icon: 'bx-credit-card', value: 'Al día', label: 'Estado Cuota', color: '#0891b2' },
      { icon: 'bx-run', value: '12', label: 'Clases Asistidas', color: '#7c3aed' },
      { icon: 'bx-trophy', value: '2', label: 'Logros', color: '#f59e0b' }
    ];
  };

  const getQuickActions = () => {
    if (isAdmin()) {
      return [
        { icon: 'bx-user-plus', label: 'Nuevo Usuario', path: '/dashboard/usuarios/nuevo', color: '#dc2626' },
        { icon: 'bx-calendar-plus', label: 'Nueva Actividad', path: '/dashboard/actividades/nueva', color: '#7c3aed' },
        { icon: 'bx-bar-chart', label: 'Ver Reportes', path: '/dashboard/reportes', color: '#0891b2' },
        { icon: 'bx-cog', label: 'Configuración', path: '/dashboard/configuracion', color: '#6b7280' }
      ];
    }
    if (isRecepcionista()) {
      return [
        { icon: 'bx-money', label: 'Registrar Pago', path: '/dashboard/cuotas/nuevo', color: '#16a34a' },
        { icon: 'bx-calendar-plus', label: 'Nueva Reserva', path: '/dashboard/alquileres/nuevo', color: '#7c3aed' },
        { icon: 'bx-search', label: 'Buscar Cliente', path: '/dashboard/consultas', color: '#0891b2' },
        { icon: 'bx-file', label: 'Comprobante', path: '/dashboard/comprobantes', color: '#f59e0b' }
      ];
    }
    if (isProfesor()) {
      return [
        { icon: 'bx-list-check', label: 'Pasar Lista', path: '/dashboard/mis-clases/asistencia', color: '#16a34a' },
        { icon: 'bx-calendar', label: 'Mi Horario', path: '/dashboard/mis-clases', color: '#0891b2' },
        { icon: 'bx-group', label: 'Ver Alumnos', path: '/dashboard/alumnos', color: '#7c3aed' },
        { icon: 'bx-plus-circle', label: 'Nueva Clase', path: '/dashboard/actividades/nueva', color: '#dc2626' }
      ];
    }
    // Alumno
    return [
      { icon: 'bx-calendar-plus', label: 'Reservar Clase', path: '/dashboard/mis-reservas/nueva', color: '#16a34a' },
      { icon: 'bx-credit-card', label: 'Ver Cuotas', path: '/dashboard/mis-cuotas', color: '#0891b2' },
      { icon: 'bx-calendar', label: 'Mis Reservas', path: '/dashboard/mis-reservas', color: '#7c3aed' },
      { icon: 'bx-user', label: 'Mi Perfil', path: '/dashboard/perfil', color: '#6b7280' }
    ];
  };

  const stats = getQuickStats();
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
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <i className={`bx ${stat.icon}`}></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
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
            onClick={() => {}}
            style={{ '--action-color': action.color }}
          >
            <div className="action-icon">
              <i className={`bx ${action.icon}`}></i>
            </div>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="section-header">
        <h3>Actividad Reciente</h3>
      </div>
      <div className="activity-list">
        <div className="activity-item">
          <div className="activity-icon success">
            <i className='bx bx-check'></i>
          </div>
          <div className="activity-info">
            <span className="activity-text">Sistema de roles implementado correctamente</span>
            <span className="activity-time">Hace 5 minutos</span>
          </div>
        </div>
        <div className="activity-item">
          <div className="activity-icon info">
            <i className='bx bx-info-circle'></i>
          </div>
          <div className="activity-info">
            <span className="activity-text">Dashboard actualizado con nuevas funcionalidades</span>
            <span className="activity-time">Hace 10 minutos</span>
          </div>
        </div>
        <div className="activity-item">
          <div className="activity-icon warning">
            <i className='bx bx-time'></i>
          </div>
          <div className="activity-info">
            <span className="activity-text">Próximas funcionalidades en desarrollo</span>
            <span className="activity-time">En progreso</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
