import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Constantes de roles (sincronizadas con el backend)
export const ROLES = {
  ADMINISTRADOR: 1,
  RECEPCIONISTA: 2,
  PROFESOR: 3,
  ALUMNO: 4
};

// Jerarquía de roles
export const ROLE_HIERARCHY = {
  1: 4, // administrador - nivel 4
  2: 3, // recepcionista - nivel 3
  3: 2, // profesor - nivel 2
  4: 1  // alumno - nivel 1
};

// Nombres de roles para mostrar
export const ROLE_NAMES = {
  1: 'Administrador',
  2: 'Recepcionista',
  3: 'Profesor',
  4: 'Alumno'
};

// Rutas permitidas por rol
export const ROLE_ROUTES = {
  [ROLES.ADMINISTRADOR]: [
    '/dashboard',
    '/dashboard/usuarios',
    '/dashboard/actividades',
    '/dashboard/alquileres',
    '/dashboard/pagos',
    '/dashboard/reportes',
    '/dashboard/configuracion',
    '/dashboard/perfil'
  ],
  [ROLES.RECEPCIONISTA]: [
    '/dashboard',
    '/dashboard/alquileres',
    '/dashboard/pagos',
    '/dashboard/consultas',
    '/dashboard/perfil'
  ],
  [ROLES.PROFESOR]: [
    '/dashboard',
    '/dashboard/actividades',
    '/dashboard/mis-clases',
    '/dashboard/alumnos',
    '/dashboard/alquileres',
    '/dashboard/perfil'
  ],
  [ROLES.ALUMNO]: [
    '/dashboard',
    '/dashboard/mis-cuotas',
    '/dashboard/mis-reservas',
    '/dashboard/perfil'
  ]
};

// Componente para rutas protegidas por autenticación
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (user && user.email_verified === false) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Componente para rutas protegidas por rol específico
export const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (user && user.email_verified === false) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoleId = user.role?.id || ROLES.ALUMNO;

  // Si no se especifican roles, permitir a todos los autenticados
  if (allowedRoles.length === 0) {
    return children;
  }

  // Verificar si el usuario tiene un rol permitido
  if (!allowedRoles.includes(userRoleId)) {
    return <Navigate to="/dashboard" state={{ unauthorized: true }} replace />;
  }

  return children;
};

// Componente para rutas protegidas por jerarquía mínima
export const MinRoleRoute = ({ children, minRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (user && user.email_verified === false) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoleId = user.role?.id || ROLES.ALUMNO;
  const userHierarchy = ROLE_HIERARCHY[userRoleId] || 0;
  const requiredHierarchy = ROLE_HIERARCHY[minRole] || 0;

  if (userHierarchy < requiredHierarchy) {
    return <Navigate to="/dashboard" state={{ unauthorized: true }} replace />;
  }

  return children;
};

// Hook para verificar permisos
export const usePermissions = () => {
  const { user } = useAuth();

  const userRoleId = user?.role?.id || ROLES.ALUMNO;
  const userHierarchy = ROLE_HIERARCHY[userRoleId] || 0;

  const hasRole = (roleId) => userRoleId === roleId;

  const hasAnyRole = (roleIds) => roleIds.includes(userRoleId);

  const hasMinRole = (minRoleId) => {
    const requiredHierarchy = ROLE_HIERARCHY[minRoleId] || 0;
    return userHierarchy >= requiredHierarchy;
  };

  const isAdmin = () => userRoleId === ROLES.ADMINISTRADOR;
  const isRecepcionista = () => userRoleId === ROLES.RECEPCIONISTA;
  const isProfesor = () => userRoleId === ROLES.PROFESOR;
  const isAlumno = () => userRoleId === ROLES.ALUMNO;

  const canAccess = (route) => {
    const allowedRoutes = ROLE_ROUTES[userRoleId] || [];
    return allowedRoutes.some(r => route.startsWith(r));
  };

  return {
    userRoleId,
    userHierarchy,
    roleName: ROLE_NAMES[userRoleId],
    hasRole,
    hasAnyRole,
    hasMinRole,
    isAdmin,
    isRecepcionista,
    isProfesor,
    isAlumno,
    canAccess
  };
};

export default ProtectedRoute;
