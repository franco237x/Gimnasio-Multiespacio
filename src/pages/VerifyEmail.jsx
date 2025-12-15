import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthFlow.css';

const VerifyEmail = () => {
  const { verifyEmail, resendVerification, error: authError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      return;
    }
    setIsLoading(true);
    setStatus('');

    const result = await verifyEmail(cleanedToken);

    if (result.success) {
      setStatus('Cuenta verificada correctamente. Redirigiendo...');
      setTimeout(() => navigate('/dashboard'), 800);
    } else {
      setStatus(result.error || authError || 'No se pudo verificar el email.');
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
      return;
    }

    const response = await resendVerification(email.trim().toLowerCase());
    if (response.success) {
      setResendStatus(response.message || 'Enlace reenviado. Revisa tu bandeja.');
    } else {
      setResendStatus(response.error || 'No se pudo reenviar el correo.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Validar Email</h1>
        <p className="auth-subtitle">
          Ingresa el código de verificación que enviamos a tu correo para activar tu cuenta.
        </p>

        {status && <div className="auth-status">{status}</div>}
        {authError && !status && <div className="auth-status error">{authError}</div>}

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

        <div className="auth-divider">¿No tienes el token?</div>

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
        {resendStatus && <div className="auth-status">{resendStatus}</div>}

        <button className="link-button" onClick={() => navigate('/login')}>
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
