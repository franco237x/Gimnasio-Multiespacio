import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const goHome = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-left">
            <img 
              src="/public/20250722_1102_Logo Fortaleza Mejorado_remix_01k0s6th6efftr2w6q7nrv4nvc-Photoroom.png" 
              alt="Fortaleza Logo" 
              className="dashboard-logo"
            />
            <h1>FORTALEZA</h1>
          </div>
          <div className="header-right">
            <span className="user-greeting">
              <i className='bx bx-user-circle'></i>
              Hola, {user?.name || 'Usuario'}
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              <i className='bx bx-log-out'></i>
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="welcome-section">
            <div className="welcome-icon">
              <i className='bx bx-dumbbell'></i>
            </div>
            <h2>¡Bienvenido a tu Dashboard!</h2>
            <p>Esta sección está en construcción. Próximamente podrás:</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className='bx bx-calendar-check'></i>
              </div>
              <h3>Reservar Clases</h3>
              <p>Agenda tus entrenamientos y clases grupales</p>
              <span className="coming-soon">Próximamente</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className='bx bx-line-chart'></i>
              </div>
              <h3>Ver tu Progreso</h3>
              <p>Seguimiento de tu evolución física</p>
              <span className="coming-soon">Próximamente</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className='bx bx-food-menu'></i>
              </div>
              <h3>Plan Nutricional</h3>
              <p>Dietas personalizadas para tus objetivos</p>
              <span className="coming-soon">Próximamente</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className='bx bx-credit-card'></i>
              </div>
              <h3>Gestionar Membresía</h3>
              <p>Pagos y renovación de tu plan</p>
              <span className="coming-soon">Próximamente</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className='bx bx-user-pin'></i>
              </div>
              <h3>Mi Perfil</h3>
              <p>Actualiza tu información personal</p>
              <span className="coming-soon">Próximamente</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className='bx bx-support'></i>
              </div>
              <h3>Soporte</h3>
              <p>Contacta con nuestro equipo</p>
              <span className="coming-soon">Próximamente</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="home-btn" onClick={goHome}>
              <i className='bx bx-home'></i>
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
