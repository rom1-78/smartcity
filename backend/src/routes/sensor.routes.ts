import express from 'express';
import { getSensors } from '../controllers/sensor.controller';

const router = express.Router();
router.get('/', getSensors);
export default router;
