const express = require('express');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Datos recibidos para registro:', req.body);
    const { name, email, password, phone } = req.body;

    // Validaciones básicas
    if (!name || !email || !password) {
      console.log('❌ Faltan campos requeridos:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({
        message: 'Nombre, email y contraseña son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Formato de email inválido:', email);
      return res.status(400).json({
        message: 'Formato de email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      console.log('❌ Contraseña muy corta:', password.length);
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    console.log('✅ Creando usuario con datos:', { name, email, phone: phone || null });

    // Crear el usuario
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone
    });

    console.log('✅ Usuario creado exitosamente:', newUser.id);

    // Generar token
    const token = generateToken(newUser.id);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: newUser.toSafeObject()
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    if (error.message === 'Ya existe un usuario con ese email') {
      return res.status(409).json({
        message: 'Ya existe una cuenta con ese email'
      });
    }

    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Intento de login:', req.body.email);
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      console.log('❌ Faltan credenciales');
      return res.status(400).json({
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    console.log('✅ Usuario encontrado, verificando contraseña');
    // Verificar contraseña
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generateToken(user.id);

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/profile - Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'Perfil obtenido exitosamente',
      user: req.user.toSafeObject()
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/auth/profile - Actualizar perfil del usuario
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'El nombre es requerido'
      });
    }

    const updatedUser = await User.update(req.user.id, { name, phone });

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser.toSafeObject()
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión (opcional, principalmente del lado del cliente)
router.post('/logout', authenticateToken, (req, res) => {
  // En JWT no necesitamos invalidar el token del lado del servidor
  // La invalidación se maneja en el frontend eliminando el token
  res.json({
    message: 'Sesión cerrada exitosamente'
  });
});

module.exports = router;