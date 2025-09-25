import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const success = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });

    if (success) {
      alert('¡Registro exitoso! Bienvenido a Fortaleza');
      navigate('/');
    } else {
      setErrors({ submit: authError || 'Error en el registro' });
    }
    
    setIsLoading(false);
  };

  const goHome = () => {
    navigate('/');
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-left">
          <div className="brand-section">
            <img 
              src="/public/20250722_1102_Logo Fortaleza Mejorado_remix_01k0s6th6efftr2w6q7nrv4nvc-Photoroom.png" 
              alt="Fortaleza Logo" 
              className="brand-logo"
            />
            <h1>FORTALEZA</h1>
            <p className="brand-subtitle">Únete a nuestra comunidad</p>
            <div className="register-benefits">
              <div className="benefit">
                <span className="benefit-icon"><i className='bx bxs-hand'></i></span>
                <span>Entrenamientos personalizados</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon"><i className='bx bxs-bolt'></i></span>
                <span>Equipamiento de última generación</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon"><i className='bx bx-trophy'></i></span>
                <span>Acompañamiento profesional</span>
              </div>
            </div>
          </div>
          <div className="decorative-elements">
            <div className="floating-icon"><i className='bx bx-dumbbell'></i></div>
            <div className="floating-icon"><i className='bx bxs-hand'></i></div>
            <div className="floating-icon"><i className='bx bx-bolt'></i></div>
          </div>
        </div>
        
        <div className="register-right">
          <div className="register-form-container">
            <button className="back-button" onClick={goHome}>
              <i className='bx bx-arrow-back'></i> Volver al inicio
            </button>
            
            <div className="register-header">
              <h2>Crear Cuenta</h2>
              <p>Completa tus datos para comenzar tu transformación</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              {errors.submit && (
                <div className="error-message global-error">
                  {errors.submit}
                </div>
              )}

              <div className="input-group">
                <div className="input-container">
                  <span className="input-icon"><i className='bx bx-user'></i></span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Nombre completo"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? 'error' : ''}
                  />
                </div>
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="input-group">
                <div className="input-container">
                  <span className="input-icon"><i className='bx bx-envelope'></i></span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Correo electrónico"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                  />
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
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
                    className={errors.password ? 'error' : ''}
                  />
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="input-group">
                <div className="input-container">
                  <span className="input-icon"><i className='bx bx-lock-alt'></i></span>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirmar contraseña"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <button 
                type="submit" 
                className={`register-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Creando cuenta...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>

            <div className="login-section">
              <p>¿Ya tienes una cuenta? 
                <button onClick={goToLogin} className="login-link">
                  Inicia sesión aquí
                </button>
              </p>
            </div>

            <div className="terms-section">
              <p>
                Al registrarte, aceptas nuestros{' '}
                <a href="#" className="terms-link">Términos y Condiciones</a>{' '}
                y{' '}
                <a href="#" className="terms-link">Política de Privacidad</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
