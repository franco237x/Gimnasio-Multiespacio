import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

// Configurar la URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const IS_DEVELOPMENT = import.meta.env.MODE === 'development';

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
      
      // Modo desarrollo - simular login exitoso
      if (IS_DEVELOPMENT && !API_URL.includes('localhost:5000')) {
        console.log('Modo desarrollo: simulando login exitoso');
        const mockUser = { 
          id: 1, 
          email: credentials.email, 
          name: 'Usuario Demo' 
        };
        const mockToken = 'demo-token-' + Date.now();
        
        localStorage.setItem('authToken', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        return true;
      }
      
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
        return true;
      } else {
        setError(data.message || 'Error al iniciar sesión');
        return false;
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('No se puede conectar al servidor. Verifica que el backend esté corriendo.');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      
      // Modo desarrollo - simular registro exitoso
      if (IS_DEVELOPMENT && !API_URL.includes('localhost:5000')) {
        console.log('Modo desarrollo: simulando registro exitoso');
        const mockUser = { 
          id: Date.now(), 
          email: userData.email, 
          name: userData.name || 'Usuario Demo' 
        };
        const mockToken = 'demo-token-' + Date.now();
        
        localStorage.setItem('authToken', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        return true;
      }
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (response.ok) {
        const { token, user } = data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return true;
      } else {
        setError(data.message || 'Error en el registro');
        return false;
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setError('No se puede conectar al servidor. Verifica que el backend esté corriendo.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
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
      logout, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);