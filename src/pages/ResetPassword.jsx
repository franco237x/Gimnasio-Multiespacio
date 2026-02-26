import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthFlow.css';

const ResetPassword = () => {
  const { resetPassword, error: authError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const validate = () => {
    if (!token.trim()) {
      setStatus('Falta el token de recuperación.');
      setStatusType('error');
      return false;
    }
    if (password.length < 6) {
      setStatus('La contraseña debe tener al menos 6 caracteres.');
      setStatusType('error');
      return false;
    }
    if (password !== confirmPassword) {
      setStatus('Las contraseñas deben coincidir.');
      setStatusType('error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    if (!validate()) return;

    setIsLoading(true);
    const response = await resetPassword({ token: token.trim(), password });

    if (response.success) {
      setIsReset(true);
      setStatus('¡Contraseña restablecida exitosamente!');
      setStatusType('success');
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      setStatus(response.error || authError || 'No se pudo restablecer la contraseña.');
      setStatusType('error');
    }

    setIsLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {isReset ? (
          <>
            <div className="auth-success-icon">
              <i className='bx bx-check-circle'></i>
            </div>
            <h1 className="auth-title" style={{ textAlign: 'center' }}>¡Contraseña Actualizada!</h1>
            <p className="auth-subtitle" style={{ textAlign: 'center' }}>
              Tu contraseña ha sido restablecida. Serás redirigido al panel en unos segundos.
            </p>
          </>
        ) : (
          <>
            <h1 className="auth-title">Restablecer Contraseña</h1>
            <p className="auth-subtitle">Crea una nueva contraseña segura para tu cuenta.</p>

            {status && (
              <div className={`auth-status ${statusType === 'success' ? 'success' : 'error'}`}>
                {status}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-label">Token de recuperación</label>
              <input
                className="auth-input"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Pega el token que recibiste"
              />

              <label className="auth-label">Nueva contraseña</label>
              <div className="auth-input-wrapper">
                <input
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'}`}></i>
                </button>
              </div>

              <label className="auth-label">Confirmar contraseña</label>
              <input
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
              />

              <button className="auth-button" type="submit" disabled={isLoading}>
                {isLoading ? 'Actualizando...' : 'Restablecer contraseña'}
              </button>
            </form>

            <div className="auth-help">
              <button className="link-button" onClick={() => navigate('/login')}>
                <i className='bx bx-arrow-back'></i> Volver al inicio de sesión
              </button>
              <div className="auth-help-row">
                <button className="auth-help-link" onClick={() => navigate('/forgot-password')}>
                  <i className='bx bx-key'></i> Solicitar nuevo token
                </button>
                <a href="mailto:soporte@fortalezagym.com" className="auth-help-link">
                  <i className='bx bx-help-circle'></i> ¿Necesitas ayuda?
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
