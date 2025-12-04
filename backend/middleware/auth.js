const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES } = require('../models/User');

// Jerarquía de roles (mayor número = mayor jerarquía)
const ROLE_HIERARCHY = {
  1: 4, // administrador
  2: 3, // recepcionista
  3: 2, // profesor
  4: 1  // alumno
};

// Middleware para verificar el token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Token de acceso requerido' 
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        message: 'Usuario no encontrado' 
      });
    }

    // Agregar el usuario al request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        message: 'Token inválido' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        message: 'Token expirado' 
      });
    }
    
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

// Función para generar JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { 
      expiresIn: '24h' // El token expira en 24 horas
    }
  );
};

// Middleware opcional de autenticación (para rutas que pueden funcionar con o sin usuario)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En autenticación opcional, ignoramos errores y continuamos
    next();
  }
};

// Middleware para verificar rol específico
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Autenticación requerida' 
      });
    }

    const userRoleId = req.user.role_id;
    
    if (!allowedRoles.includes(userRoleId)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para realizar esta acción',
        requiredRoles: allowedRoles,
        userRole: userRoleId
      });
    }

    next();
  };
};

// Middleware para verificar jerarquía mínima de rol
const requireMinRole = (minRoleId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Autenticación requerida' 
      });
    }

    const userHierarchy = ROLE_HIERARCHY[req.user.role_id] || 0;
    const requiredHierarchy = ROLE_HIERARCHY[minRoleId] || 0;

    if (userHierarchy < requiredHierarchy) {
      return res.status(403).json({ 
        message: 'No tienes el nivel de permisos necesario',
        requiredLevel: requiredHierarchy,
        userLevel: userHierarchy
      });
    }

    next();
  };
};

// Middleware para verificar si es el propio usuario o admin
const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Autenticación requerida' 
    });
  }

  const targetUserId = parseInt(req.params.userId || req.params.id);
  const isOwnProfile = req.user.id === targetUserId;
  const isAdmin = req.user.role_id === ROLES.ADMINISTRADOR;

  if (!isOwnProfile && !isAdmin) {
    return res.status(403).json({ 
      message: 'Solo puedes acceder a tu propia información' 
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  generateToken,
  optionalAuth,
  requireRole,
  requireMinRole,
  requireSelfOrAdmin,
  ROLES,
  ROLE_HIERARCHY
};