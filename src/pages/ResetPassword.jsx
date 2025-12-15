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
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const validate = () => {
    if (!token.trim()) {
      setStatus('Falta el token de recuperación.');
      return false;
    }
    if (password.length < 6) {
      setStatus('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }
    if (password !== confirmPassword) {
      setStatus('Las contraseñas deben coincidir.');
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
      setStatus('Contraseña restablecida. Iniciando sesión...');
      setTimeout(() => navigate('/dashboard'), 800);
    } else {
      setStatus(response.error || authError || 'No se pudo restablecer la contraseña.');
    }

    setIsLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Restablecer contraseña</h1>
        <p className="auth-subtitle">Crea una nueva contraseña segura para tu cuenta.</p>

        {status && <div className="auth-status">{status}</div>}

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
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />

          <label className="auth-label">Confirmar contraseña</label>
          <input
            className="auth-input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
          />

          <button className="auth-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Restablecer contraseña'}
          </button>
        </form>

        <button className="link-button" onClick={() => navigate('/login')}>
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
