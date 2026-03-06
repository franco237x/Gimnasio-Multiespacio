import { createContext, useState, useContext, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      checkAuth(token);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        const { token, user } = data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true };
      } else {
        setError(data.message || 'Error al iniciar sesión');
        return {
          success: false,
          requiresVerification: data.requiresVerification
        };
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error de conexión. Intenta nuevamente.');
      return { success: false };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          requiresVerification: data.requiresVerification
        };
      } else {
        const errorMessage = data.message || 'Error en el registro';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      const errorMessage = 'Error de conexión. Intenta nuevamente.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const verifyEmail = async (token) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      }

      setError(data.message || 'No se pudo verificar el email');
      return { success: false, error: data.message };
    } catch (err) {
      console.error('Error verificando email:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
    }
  };

  const resendVerification = async (email) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message
        };
      }

      setError(data.message || 'No se pudo reenviar el email');
      return { success: false, error: data.message };
    } catch (err) {
      console.error('Error reenviando verificación:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message
        };
      }

      setError(data.message || 'No se pudo iniciar la recuperación');
      return { success: false, error: data.message };
    } catch (err) {
      console.error('Error solicitando recuperación:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
    }
  };

  const resetPassword = async ({ token, password }) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      }

      setError(data.message || 'No se pudo restablecer la contraseña');
      return { success: false, error: data.message };
    } catch (err) {
      console.error('Error restableciendo contraseña:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      register,
      verifyEmail,
      resendVerification,
      requestPasswordReset,
      resetPassword,
      logout,
      updateUser,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);