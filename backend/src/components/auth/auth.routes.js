import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../../controllers/authController.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas protegidas
router.get('/profile', auth, getUserProfile);

export default router;