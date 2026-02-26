import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthFlow.css';

const VerifyEmail = () => {
  const { verifyEmail, resendVerification, error: authError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success' | 'error' | ''
  const [resendStatus, setResendStatus] = useState('');
  const [resendType, setResendType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // If arriving from registration (has email but no token), show welcome state
  const justRegistered = !initialToken && !!initialEmail;

  useEffect(() => {
    if (initialToken) {
      handleVerify(initialToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  const handleVerify = async (tokenToUse) => {
    const cleanedToken = (tokenToUse || token || '').trim();
    if (!cleanedToken) {
      setStatus('Ingresa el token de verificación.');
      setStatusType('error');
      return;
    }
    setIsLoading(true);
    setStatus('');

    const result = await verifyEmail(cleanedToken);

    if (result.success) {
      setIsVerified(true);
      setStatus('¡Cuenta verificada correctamente! Redirigiendo al panel...');
      setStatusType('success');
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      setStatus(result.error || authError || 'No se pudo verificar el email.');
      setStatusType('error');
    }

    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleVerify(token);
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setResendStatus('');
    if (!email.trim()) {
      setResendStatus('Ingresa el correo para reenviar el enlace.');
      setResendType('error');
      return;
    }

    const response = await resendVerification(email.trim().toLowerCase());
    if (response.success) {
      setResendStatus(response.message || '✅ Enlace reenviado. Revisa tu bandeja de entrada.');
      setResendType('success');
    } else {
      setResendStatus(response.error || 'No se pudo reenviar el correo.');
      setResendType('error');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {isVerified ? (
          <>
            <div className="auth-success-icon">
              <i className='bx bx-check-circle'></i>
            </div>
            <h1 className="auth-title" style={{ textAlign: 'center' }}>¡Cuenta Verificada!</h1>
            <p className="auth-subtitle" style={{ textAlign: 'center' }}>
              Tu correo ha sido verificado exitosamente. Serás redirigido al panel en unos segundos.
            </p>
          </>
        ) : (
          <>
            <h1 className="auth-title">
              {justRegistered ? '¡Cuenta Creada!' : 'Verificar Email'}
            </h1>
            <p className="auth-subtitle">
              {justRegistered
                ? 'Te enviamos un enlace de verificación a tu correo electrónico. Revisá tu bandeja de entrada para activar tu cuenta.'
                : 'Ingresa el código de verificación que enviamos a tu correo para activar tu cuenta.'}
            </p>

            {status && (
              <div className={`auth-status ${statusType === 'success' ? 'success' : 'error'}`}>
                {status}
              </div>
            )}

            {justRegistered && (
              <div className="auth-tips">
                <div className="auth-tip">
                  <i className='bx bx-envelope'></i>
                  <span>Revisa tu <strong>bandeja de entrada</strong> y también la carpeta de <strong>spam</strong></span>
                </div>
                <div className="auth-tip">
                  <i className='bx bx-time-five'></i>
                  <span>El enlace puede tardar unos minutos en llegar</span>
                </div>
                <div className="auth-tip">
                  <i className='bx bx-link'></i>
                  <span>Haz click en el enlace del correo o pega el token aquí abajo</span>
                </div>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-label">Token de verificación</label>
              <input
                className="auth-input"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Pega tu token aquí"
              />
              <button className="auth-button" type="submit" disabled={isLoading}>
                {isLoading ? 'Validando...' : 'Validar email'}
              </button>
            </form>

            <div className="auth-divider">¿No recibiste el correo?</div>

            <form className="auth-form" onSubmit={handleResend}>
              <label className="auth-label">Correo registrado</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
              />
              <button className="auth-button secondary" type="submit">
                Reenviar enlace de verificación
              </button>
            </form>
            {resendStatus && (
              <div className={`auth-status ${resendType === 'success' ? 'success' : 'error'}`}>
                {resendStatus}
              </div>
            )}

            <div className="auth-help">
              <button className="link-button" onClick={() => navigate('/login')}>
                <i className='bx bx-arrow-back'></i> Volver al inicio de sesión
              </button>
              <a href="mailto:soporte@fortalezagym.com" className="auth-help-link">
                <i className='bx bx-help-circle'></i> ¿Necesitas ayuda?
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
