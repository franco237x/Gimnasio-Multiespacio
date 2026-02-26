const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, requireRole, ROLES } = require('../middleware/auth');

// GET /api/users - Listar todos los usuarios
router.get('/', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const { role, search, status } = req.query;
        let users = await User.findAll();

        // Filtrar por rol
        if (role) {
            users = users.filter(u => u.role_name?.toLowerCase() === role.toLowerCase());
        }

        // Filtrar por búsqueda
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(u =>
                u.name?.toLowerCase().includes(searchLower) ||
                u.email?.toLowerCase().includes(searchLower) ||
                u.phone?.includes(search)
            );
        }

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
});

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ success: false, message: 'Error al obtener usuario' });
    }
});

// POST /api/users - Crear usuario
router.post('/', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const { name, email, password, phone, role_id } = req.body;

        // Validar campos requeridos
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y contraseña son requeridos'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Formato de email inválido' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar si el email ya existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        const newUser = await User.create({ name, email, password, phone, role_id });
        res.status(201).json({ success: true, data: newUser });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ success: false, message: 'Error al crear usuario' });
    }
});

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const { name, email, phone, role_id, is_active, password } = req.body;
        const targetId = parseInt(req.params.id);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Formato de email inválido' });
        }

        if (password && password.length < 6) {
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const user = await User.findById(targetId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        // Prevención de auto-modificación riesgosa
        if (req.user.id === targetId) {
            if (role_id !== undefined && role_id !== user.role_id) {
                return res.status(400).json({ success: false, message: 'No puedes cambiar tu propio rol' });
            }
            if (is_active !== undefined && is_active !== user.is_active) {
                return res.status(400).json({ success: false, message: 'No puedes desactivar tu propia cuenta' });
            }
        }

        const updatedUser = await User.update(targetId, { name, email, phone, role_id, is_active, password });
        res.json({ success: true, data: updatedUser });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
});

// DELETE /api/users/:id - Eliminar usuario
router.delete('/:id', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        if (req.user.id === parseInt(req.params.id)) {
            return res.status(400).json({ success: false, message: 'No puedes eliminar tu propia cuenta' });
        }

        const deleted = await User.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
    }
});

// PATCH /api/users/:id/role - Cambiar rol de usuario
router.patch('/:id/role', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const { role_id } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const updatedUser = await User.update(req.params.id, { role_id });
        res.json({ success: true, data: updatedUser });
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).json({ success: false, message: 'Error al cambiar rol' });
    }
});

// GET /api/users/role/:roleName - Obtener usuarios por nombre de rol
router.get('/role/:roleName', authenticateToken, requireRole(ROLES.ADMINISTRADOR), async (req, res) => {
    try {
        const users = await User.findAll();
        const filteredUsers = users.filter(u =>
            u.role_name?.toLowerCase() === req.params.roleName.toLowerCase()
        );
        res.json({ success: true, data: filteredUsers });
    } catch (error) {
        console.error('Error al obtener usuarios por rol:', error);
        res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
});

module.exports = router;
