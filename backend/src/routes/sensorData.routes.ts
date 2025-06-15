import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { addSensorData } from '../controllers/sensor.controller';

const router = Router();
router.use(authenticateToken);
router.post('/', addSensorData);

export default router;