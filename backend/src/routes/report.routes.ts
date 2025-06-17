import express from 'express';
import { 
  getReports, 
  getReportById, 
  createReport, 
  updateReport, 
  deleteReport
} from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/roleAuth';

const router = express.Router();

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', authenticateToken, getReports);
router.get('/:id', authenticateToken, getReportById);

// Routes pour créer et modifier (gestionnaires, chercheurs, admins)
router.post('/', authenticateToken, requireRole(['admin', 'gestionnaire', 'chercheur']), createReport);
router.put('/:id', authenticateToken, requireRole(['admin', 'gestionnaire', 'chercheur']), updateReport);

// Route pour supprimer (admins seulement)
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteReport);

export default router;