import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthFlow.css';

const ForgotPassword = () => {
  const { requestPasswordReset, error: authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    if (!email.trim()) {
      setStatus('Ingresa tu correo registrado.');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    const response = await requestPasswordReset(email.trim().toLowerCase());

    if (response.success) {
      setSent(true);
      setStatus(response.message || 'Si el correo existe, enviamos un enlace de recuperación.');
      setStatusType('success');
    } else {
      setStatus(response.error || authError || 'No pudimos procesar la solicitud.');
      setStatusType('error');
    }

    setIsLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Recuperar Contraseña</h1>
        <p className="auth-subtitle">
          {sent
            ? 'Te enviamos un enlace de recuperación a tu correo.'
            : 'Ingresa tu correo para enviarte un enlace seguro de recuperación.'}
        </p>

        {status && (
          <div className={`auth-status ${statusType === 'success' ? 'success' : 'error'}`}>
            {status}
          </div>
        )}

        {sent ? (
          <>
            <div className="auth-tips">
              <div className="auth-tip">
                <i className='bx bx-envelope'></i>
                <span>Revisa tu <strong>bandeja de entrada</strong> y la carpeta de <strong>spam</strong></span>
              </div>
              <div className="auth-tip">
                <i className='bx bx-time-five'></i>
                <span>El enlace expira en <strong>1 hora</strong></span>
              </div>
              <div className="auth-tip">
                <i className='bx bx-link'></i>
                <span>Haz click en el enlace o pega el token en la página de restablecimiento</span>
              </div>
            </div>

            <button
              className="auth-button"
              onClick={() => navigate('/reset-password')}
            >
              Ya tengo el token
            </button>

            <button
              className="auth-button secondary"
              onClick={() => { setSent(false); setStatus(''); }}
            >
              Reenviar enlace
            </button>
          </>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-label">Correo electrónico</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
            <button className="auth-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}

        <div className="auth-help">
          <button className="link-button" onClick={() => navigate('/login')}>
            <i className='bx bx-arrow-back'></i> Volver al inicio de sesión
          </button>
          <div className="auth-help-row">
            <button className="auth-help-link" onClick={() => navigate('/register')}>
              <i className='bx bx-user-plus'></i> Crear una cuenta
            </button>
            <a href="mailto:soporte@fortalezagym.com" className="auth-help-link">
              <i className='bx bx-help-circle'></i> ¿Necesitas ayuda?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
