import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getSensors,
  getSensorById,
  createSensor,
  updateSensor,
  deleteSensor
} from '../controllers/sensor.controller';

const router = Router();

// Routes des capteurs (avec authentification)
router.get('/', authenticateToken, getSensors);
router.get('/:id', authenticateToken, getSensorById);
router.post('/', authenticateToken, createSensor);      // Gestionnaires/Admins
router.put('/:id', authenticateToken, updateSensor);    // Gestionnaires/Admins  
router.delete('/:id', authenticateToken, deleteSensor); // Gestionnaires/Admins

export default router;