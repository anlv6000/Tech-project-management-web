import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, userController.getAllUsers);
router.get('/:id', authenticateToken, userController.getUserById);
router.post('/', userController.createUser);
router.post('/auth/login', userController.loginUser);
router.post('/auth/register', userController.registerUser);
router.put('/:id', authenticateToken, userController.updateUser);
router.delete('/:id', authenticateToken, requireAdmin, userController.deleteUser);

export default router;
