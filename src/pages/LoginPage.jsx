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
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validar email
    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ingresa un correo electrónico válido';
    }
    
    // Validar contraseña
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario antes de enviar
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    const success = await login(formData);
    
    if (success) {
      // Redirigir al dashboard
      navigate('/dashboard');
    } else {
      setError(authError || 'Credenciales inválidas. Verifica tu correo y contraseña.');
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
                    className={validationErrors.email ? 'error' : ''}
                    autoComplete="email"
                  />
                </div>
                {validationErrors.email && <span className="error-text">{validationErrors.email}</span>}
              </div>

              <div className="input-group">
                <div className="input-container">
                  <span className="input-icon"><i className='bx bx-lock-alt'></i></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={validationErrors.password ? 'error' : ''}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                  >
                    <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'}`}></i>
                  </button>
                </div>
                {validationErrors.password && <span className="error-text">{validationErrors.password}</span>}
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
