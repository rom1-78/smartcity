import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAlerts,
  getAlertById,
  createAlert,
  resolveAlert,
  deleteAlert,
  getAlertStatistics
} from '../controllers/alert.controller';

const router = Router();
router.use(authenticateToken);

router.get('/', getAlerts);
router.get('/statistics', getAlertStatistics);
router.get('/:id', getAlertById);
router.post('/', createAlert);
router.put('/:id/resolve', resolveAlert);
router.delete('/:id', deleteAlert);

export default router;