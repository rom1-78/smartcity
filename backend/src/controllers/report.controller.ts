// backend/src/controllers/report.controller.ts (NOUVEAU FICHIER)
import { Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../services/db';
import { AuthRequest } from '../middleware/auth';

interface Report {
  id: number;
  user_id: number;
  title: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom' | 'predictive';
  content: string;
  generated_at: string;
  start_date: string | null;
  end_date: string | null;
  is_public: boolean;
}

// GET /api/reports - Récupérer tous les rapports
export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      report_type, 
      is_public,
      user_id 
    } = req.query;

    let query = `
      SELECT r.*, u.first_name, u.last_name, u.organization 
      FROM reports r 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    // Si ce n'est pas un admin, filtrer par rapports publics ou rapports de l'utilisateur
    if (req.user?.role !== 'admin') {
      query += ' AND (r.is_public = true OR r.user_id = ?)';
      params.push(req.user?.id);
    }

    // Filtrer par type de rapport
    if (report_type) {
      query += ' AND r.report_type = ?';
      params.push(report_type);
    }

    // Filtrer par statut public
    if (is_public !== undefined) {
      query += ' AND r.is_public = ?';
      params.push(is_public === 'true');
    }

    // Filtrer par utilisateur (pour les admins)
    if (user_id && req.user?.role === 'admin') {
      query += ' AND r.user_id = ?';
      params.push(parseInt(user_id as string));
    }

    query += ' ORDER BY r.generated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [rows] = await db.execute<RowDataPacket[]>(query, params);
    
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les rapports'
    });
  }
};

// GET /api/reports/:id - Récupérer un rapport par ID
export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        error: 'ID invalide',
        message: 'L\'ID du rapport doit être un nombre valide'
      });
    }

    let query = `
      SELECT r.*, u.first_name, u.last_name, u.organization 
      FROM reports r 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE r.id = ?
    `;
    const params: any[] = [id];

    // Si ce n'est pas un admin, vérifier les permissions
    if (req.user?.role !== 'admin') {
      query += ' AND (r.is_public = true OR r.user_id = ?)';
      params.push(req.user?.id);
    }
    
    const [rows] = await db.execute<RowDataPacket[]>(query, params);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Rapport non trouvé',
        message: `Aucun rapport trouvé avec l'ID ${id} ou vous n'avez pas les permissions`
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer le rapport'
    });
  }
};

// POST /api/reports - Créer un nouveau rapport
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      report_type, 
      content, 
      start_date, 
      end_date, 
      is_public = false 
    } = req.body;
    
    // Validation des données obligatoires
    if (!title || !report_type || !content) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        message: 'Les champs title, report_type et content sont requis'
      });
    }

    // Vérifier si le type de rapport est valide
    const validTypes = ['daily', 'weekly', 'monthly', 'custom', 'predictive'];
    if (!validTypes.includes(report_type)) {
      return res.status(400).json({ 
        error: 'Type de rapport invalide',
        message: `Le type de rapport doit être l'un des suivants: ${validTypes.join(', ')}`
      });
    }

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO reports (user_id, title, report_type, content, start_date, end_date, is_public) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user?.id, title, report_type, content, start_date, end_date, is_public]
    );
    
    const newReport = {
      id: result.insertId,
      user_id: req.user?.id,
      title,
      report_type,
      content,
      generated_at: new Date().toISOString(),
      start_date,
      end_date,
      is_public
    };
    
    res.status(201).json({
      message: 'Rapport créé avec succès',
      report: newReport
    });
  } catch (error) {
    console.error('Erreur lors de la création du rapport:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de créer le rapport'
    });
  }
};

// PUT /api/reports/:id - Mettre à jour un rapport
export const updateReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, is_public } = req.body;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        error: 'ID invalide',
        message: 'L\'ID du rapport doit être un nombre valide'
      });
    }

    // Vérifier si le rapport existe et appartient à l'utilisateur (sauf admin)
    let checkQuery = 'SELECT user_id FROM reports WHERE id = ?';
    const checkParams: any[] = [id];

    if (req.user?.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkParams.push(req.user?.id);
    }

    const [existingRows] = await db.execute<RowDataPacket[]>(checkQuery, checkParams);

    if (existingRows.length === 0) {
      return res.status(404).json({ 
        error: 'Rapport non trouvé',
        message: `Aucun rapport trouvé avec l'ID ${id} ou vous n'avez pas les permissions`
      });
    }

    // Construire la requête de mise à jour dynamiquement
    const updates: string[] = [];
    const updateParams: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      updateParams.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      updateParams.push(content);
    }
    if (is_public !== undefined) {
      updates.push('is_public = ?');
      updateParams.push(is_public);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        error: 'Aucune donnée à mettre à jour',
        message: 'Au moins un champ doit être fourni pour la mise à jour'
      });
    }

    updateParams.push(id);

    await db.execute(
      `UPDATE reports SET ${updates.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    res.json({
      message: 'Rapport mis à jour avec succès',
      report_id: parseInt(id)
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rapport:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de mettre à jour le rapport'
    });
  }
};

// DELETE /api/reports/:id - Supprimer un rapport
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        error: 'ID invalide',
        message: 'L\'ID du rapport doit être un nombre valide'
      });
    }

    // Vérifier si le rapport existe et appartient à l'utilisateur (sauf admin)
    let checkQuery = 'SELECT user_id, title FROM reports WHERE id = ?';
    const checkParams: any[] = [id];

    if (req.user?.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkParams.push(req.user?.id);
    }

    const [existingRows] = await db.execute<RowDataPacket[]>(checkQuery, checkParams);

    if (existingRows.length === 0) {
      return res.status(404).json({ 
        error: 'Rapport non trouvé',
        message: `Aucun rapport trouvé avec l'ID ${id} ou vous n'avez pas les permissions`
      });
    }

    const reportTitle = existingRows[0].title;

    await db.execute('DELETE FROM reports WHERE id = ?', [id]);
    
    res.json({
      message: 'Rapport supprimé avec succès',
      deleted_report: {
        id: parseInt(id),
        title: reportTitle
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du rapport:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de supprimer le rapport'
    });
  }
};