import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RegisterPage.css';
import './AuthFlow.css';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  const [successMessage, setSuccessMessage] = useState('');

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
    // Calcular fuerza de contraseña en tiempo real
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    const strengthLevels = [
      { text: '', color: '' },
      { text: 'Muy débil', color: '#ef4444' },
      { text: 'Débil', color: '#f97316' },
      { text: 'Regular', color: '#eab308' },
      { text: 'Fuerte', color: '#22c55e' },
      { text: 'Muy fuerte', color: '#16a34a' }
    ];

    setPasswordStrength({ score, ...strengthLevels[score] });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.name)) {
      newErrors.name = 'El nombre solo puede contener letras';
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    // Validar contraseña con reglas más estrictas
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Debe incluir mayúsculas y minúsculas';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Debe incluir al menos un número';
    }

    // Validar confirmación de contraseña
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
    setSuccessMessage('');

    const result = await register({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    });

    if (result.success) {
      // Redirect to verify-email with email pre-filled
      navigate(`/verify-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`);
      return;
    } else {
      setErrors({ submit: result.error });
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
              src="/20250722_1102_Logo Fortaleza Mejorado_remix_01k0s6th6efftr2w6q7nrv4nvc-Photoroom.png"
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
              {successMessage && (
                <div className="success-message">
                  {successMessage}
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
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? 'error' : ''}
                    autoComplete="new-password"
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
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`strength-bar ${passwordStrength.score >= level ? 'active' : ''}`}
                          style={{ backgroundColor: passwordStrength.score >= level ? passwordStrength.color : '#374151' }}
                        />
                      ))}
                    </div>
                    <span className="strength-text" style={{ color: passwordStrength.color }}>
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="input-group">
                <div className="input-container">
                  <span className="input-icon"><i className='bx bx-lock-alt'></i></span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirmar contraseña"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'error' : ''}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={toggleConfirmPasswordVisibility}
                    tabIndex={-1}
                  >
                    <i className={`bx ${showConfirmPassword ? 'bx-hide' : 'bx-show'}`}></i>
                  </button>
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
