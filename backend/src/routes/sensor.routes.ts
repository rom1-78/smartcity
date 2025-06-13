// backend/src/routes/sensor.routes.ts
import express from 'express';
import { 
  getSensors, 
  getSensorById, 
  createSensor, 
  updateSensor, 
  deleteSensor, 
  getSensorData,
  getSensorStatistics
} from '../controllers/sensor.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/roleAuth';

const router = express.Router();

// Routes publiques (accessibles à tous les utilisateurs authentifiés)
router.get('/', authenticateToken, getSensors);
router.get('/statistics', authenticateToken, getSensorStatistics);
router.get('/:id', authenticateToken, getSensorById);
router.get('/:id/data', authenticateToken, getSensorData);

// Routes restreintes aux gestionnaires et administrateurs
router.post('/', authenticateToken, requireRole(['admin', 'gestionnaire']), createSensor);
router.put('/:id', authenticateToken, requireRole(['admin', 'gestionnaire']), updateSensor);
router.delete('/:id', authenticateToken, requireRole(['admin', 'gestionnaire']), deleteSensor);

export default router;