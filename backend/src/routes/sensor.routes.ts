import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getSensors,
  getSensorById,
  createSensor,
  updateSensor,
  deleteSensor,
  getSensorData,
  addSensorData,
  getSensorStatistics
} from '../controllers/sensor.controller';

const router = Router();
router.use(authenticateToken);

router.get('/', getSensors);
router.get('/statistics', getSensorStatistics);
router.get('/:id', getSensorById);
router.post('/', createSensor);
router.put('/:id', updateSensor);
router.delete('/:id', deleteSensor);
router.get('/:id/data', getSensorData);

export default router;