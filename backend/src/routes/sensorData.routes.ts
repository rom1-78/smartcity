import express from 'express';
import { getSensorData, addSensorData, getSensorDataStatistics } from '../controllers/sensorData.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getSensorData);
router.post('/', addSensorData);
router.get('/statistics', getSensorDataStatistics);

export default router;
;