// backend/src/routes/suggestion.routes.ts (VERSION CORRIGÉE)
import express from 'express';
import { 
  getSuggestions, 
  getSuggestionById,
  createSuggestion,
  addAdminResponse,
  deleteSuggestion
} from '../controllers/suggestion.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/roleAuth';

const router = express.Router();

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', authenticateToken, getSuggestions);
router.get('/:id', authenticateToken, getSuggestionById);
router.post('/', authenticateToken, createSuggestion);

// Routes restreintes aux administrateurs
router.put('/:id/response', authenticateToken, requireRole(['admin']), addAdminResponse);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteSuggestion);

export default router;