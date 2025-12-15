import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthFlow.css';

const ForgotPassword = () => {
  const { requestPasswordReset, error: authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    if (!email.trim()) {
      setStatus('Ingresa tu correo registrado.');
      return;
    }

    setIsLoading(true);
    const response = await requestPasswordReset(email.trim().toLowerCase());

    if (response.success) {
      setStatus(response.message || 'Si el correo existe, enviamos un enlace de recuperación.');
    } else {
      setStatus(response.error || authError || 'No pudimos procesar la solicitud.');
    }

    setIsLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Recuperar contraseña</h1>
        <p className="auth-subtitle">
          Ingresa tu correo para enviarte un enlace seguro de recuperación.
        </p>

        {status && <div className="auth-status">{status}</div>}

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
            {isLoading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        <button className="link-button" onClick={() => navigate('/login')}>
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
