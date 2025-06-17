import express from 'express';
import { 
  getAlerts, 
  getAlertById, 
  createAlert, 
  resolveAlert, 
  deleteAlert
} from '../controllers/alert.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/roleAuth';

const router = express.Router();

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', authenticateToken, getAlerts);
router.get('/:id', authenticateToken, getAlertById);

// Routes restreintes aux gestionnaires et administrateurs
router.post('/', authenticateToken, requireRole(['admin', 'gestionnaire']), createAlert);
router.put('/:id/resolve', authenticateToken, requireRole(['admin', 'gestionnaire']), resolveAlert);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteAlert);

export default router;