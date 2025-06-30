// backend/src/routes/admin.routes.ts (VERSION CORRIGÉE - VRAIE ROUTE)
import express from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserStatistics
} from '../controllers/userManagement.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/roleAuth';

const router = express.Router();

// Toutes les routes admin nécessitent d'être connecté et d'avoir le rôle admin
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Routes pour la gestion des utilisateurs
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/users/statistics', getUserStatistics);

export default router;