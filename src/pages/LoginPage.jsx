import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulamos una llamada a API
    setTimeout(() => {
      setIsLoading(false);
      // Por ahora solo mostramos un alert ya que el backend no está configurado
      alert('Login funcionará cuando el backend esté configurado');
    }, 1500);
  };

  const goHome = () => {
    navigate('/');
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
            <div className="floating-icon">🏋️</div>
            <div className="floating-icon">💪</div>
            <div className="floating-icon">⚡</div>
          </div>
        </div>
        
        <div className="login-right">
          <div className="login-form-container">
            <button className="back-button" onClick={goHome}>
              ← Volver al inicio
            </button>
            
            <div className="login-header">
              <h2>Iniciar Sesión</h2>
              <p>Bienvenido de vuelta, continuemos con tu transformación</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <div className="input-container">
                  <span className="input-icon">📧</span>
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
                  <span className="input-icon">🔒</span>
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
              <p>¿No tienes una cuenta? <a href="#" className="signup-link">Regístrate aquí</a></p>
            </div>

            <div className="social-login">
              <div className="divider">
                <span>o continúa con</span>
              </div>
              <div className="social-buttons">
                <button className="social-button google">
                  <span>G</span>
                  Google
                </button>
                <button className="social-button facebook">
                  <span>f</span>
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
