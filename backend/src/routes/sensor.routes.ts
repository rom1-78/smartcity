// backend/src/routes/sensor.routes.ts (VERSION CORRIGÉE)
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getSensors,
  getSensorById,
  createSensor,
  updateSensor,
  deleteSensor,
  getSensorData,
  getSensorStats,
  searchSensors
} from '../controllers/sensor.controller';

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Routes des capteurs
router.get('/', getSensors);                    // GET /api/sensors
router.get('/search', searchSensors);           // GET /api/sensors/search
router.get('/stats', getSensorStats);           // GET /api/sensors/stats
router.get('/:id', getSensorById);              // GET /api/sensors/:id
router.get('/:id/data', getSensorData);         // GET /api/sensors/:id/data
router.post('/', createSensor);                 // POST /api/sensors
router.put('/:id', updateSensor);               // PUT /api/sensors/:id
router.delete('/:id', deleteSensor);            // DELETE /api/sensors/:id

export default router;