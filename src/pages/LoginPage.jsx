import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const success = await login(formData);
    
    if (success) {
      alert('¡Inicio de sesión exitoso!');
      navigate('/');
    } else {
      setError(authError || 'Error en el inicio de sesión');
    }
    
    setIsLoading(false);
  };

  const goHome = () => {
    navigate('/');
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="brand-section">
            <img 
              src="/public/20250722_1102_Logo Fortaleza Mejorado_remix_01k0s6th6efftr2w6q7nrv4nvc-Photoroom.png" 
              alt="Fortaleza Logo" 
              className="brand-logo"
            />
            <h1>FORTALEZA</h1>
            <p className="brand-subtitle">Tu espacio de transformación</p>
          </div>
          <div className="decorative-elements">
            <div className="floating-icon"><i className='bx bx-dumbbell'></i></div>
            <div className="floating-icon"><i className='bx bxs-hand'></i></div>
            <div className="floating-icon"><i className='bx bx-bolt'></i></div>
          </div>
        </div>
        
        <div className="login-right">
          <div className="login-form-container">
            <button className="back-button" onClick={goHome}>
              <i className='bx bx-arrow-back'></i> Volver al inicio
            </button>
            
            <div className="login-header">
              <h2>Iniciar Sesión</h2>
              <p>Bienvenido de vuelta, continuemos con tu transformación</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              <div className="input-group">
                <div className="input-container">
                  <span className="input-icon"><i className='bx bx-envelope'></i></span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Correo electrónico"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="input-container">
                  <span className="input-icon"><i className='bx bx-lock-alt'></i></span>
                  <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Recordarme
                </label>
                <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
              </div>

              <button 
                type="submit" 
                className={`login-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            <div className="signup-section">
              <p>¿No tienes una cuenta? 
                <button onClick={goToRegister} className="signup-link">
                  Regístrate aquí
                </button>
              </p>
            </div>

            <div className="social-login">
              <div className="divider">
                <span>o continúa con</span>
              </div>
              <div className="social-buttons">
                <button className="social-button google">
                  <i className='bx bxl-google'></i>
                  Google
                </button>
                <button className="social-button facebook">
                  <i className='bx bxl-facebook'></i>
                  Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
