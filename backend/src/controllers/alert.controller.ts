// backend/src/controllers/alert.controller.ts (NOUVEAU FICHIER)
import { Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../services/db';
import { AuthRequest } from '../middleware/auth';

interface Alert {
  id: number;
  sensor_id: number;
  alert_type: 'info' | 'warning' | 'critical';
  seuil_value: number;
  current_value: number;
  message: string;
  created_at: string;
  resolved_at: string | null;
}

// GET /api/alerts - Récupérer toutes les alertes
export const getAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      alert_type, 
      resolved,
      sensor_id 
    } = req.query;

    let query = `
      SELECT a.*, s.name as sensor_name, s.location as sensor_location 
      FROM alerts a 
      LEFT JOIN sensors s ON a.sensor_id = s.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filtrer par type d'alerte
    if (alert_type && ['info', 'warning', 'critical'].includes(alert_type as string)) {
      query += ' AND a.alert_type = ?';
      params.push(alert_type);
    }

    // Filtrer par statut résolu/non résolu
    if (resolved !== undefined) {
      if (resolved === 'true') {
        query += ' AND a.resolved_at IS NOT NULL';
      } else if (resolved === 'false') {
        query += ' AND a.resolved_at IS NULL';
      }
    }

    // Filtrer par capteur
    if (sensor_id) {
      query += ' AND a.sensor_id = ?';
      params.push(parseInt(sensor_id as string));
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [rows] = await db.execute<RowDataPacket[]>(query, params);
    
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les alertes'
    });
  }
};

// GET /api/alerts/:id - Récupérer une alerte par ID
export const getAlertById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        error: 'ID invalide',
        message: 'L\'ID de l\'alerte doit être un nombre valide'
      });
    }
    
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT a.*, s.name as sensor_name, s.location as sensor_location 
       FROM alerts a 
       LEFT JOIN sensors s ON a.sensor_id = s.id 
       WHERE a.id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Alerte non trouvée',
        message: `Aucune alerte trouvée avec l'ID ${id}`
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'alerte:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer l\'alerte'
    });
  }
};

// POST /api/alerts - Créer une nouvelle alerte
export const createAlert = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      sensor_id, 
      alert_type, 
      seuil_value, 
      current_value, 
      message 
    } = req.body;
    
    // Validation des données obligatoires
    if (!sensor_id || !alert_type || !seuil_value || !current_value || !message) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        message: 'Les champs sensor_id, alert_type, seuil_value, current_value et message sont requis'
      });
    }

    // Vérifier si le type d'alerte est valide
    if (!['info', 'warning', 'critical'].includes(alert_type)) {
      return res.status(400).json({ 
        error: 'Type d\'alerte invalide',
        message: 'Le type d\'alerte doit être: info, warning ou critical'
      });
    }

    // Vérifier si le capteur existe
    const [sensorRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM sensors WHERE id = ?',
      [sensor_id]
    );

    if (sensorRows.length === 0) {
      return res.status(404).json({ 
        error: 'Capteur non trouvé',
        message: `Aucun capteur trouvé avec l'ID ${sensor_id}`
      });
    }

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO alerts (sensor_id, alert_type, seuil_value, current_value, message) 
       VALUES (?, ?, ?, ?, ?)`,
      [sensor_id, alert_type, seuil_value, current_value, message]
    );
    
    const newAlert = {
      id: result.insertId,
      sensor_id,
      alert_type,
      seuil_value,
      current_value,
      message,
      created_at: new Date().toISOString(),
      resolved_at: null
    };
    
    res.status(201).json({
      message: 'Alerte créée avec succès',
      alert: newAlert
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de créer l\'alerte'
    });
  }
};

// PUT /api/alerts/:id/resolve - Marquer une alerte comme résolue
export const resolveAlert = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        error: 'ID invalide',
        message: 'L\'ID de l\'alerte doit être un nombre valide'
      });
    }

    // Vérifier si l'alerte existe
    const [existingRows] = await db.execute<RowDataPacket[]>(
      'SELECT id, resolved_at FROM alerts WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ 
        error: 'Alerte non trouvée',
        message: `Aucune alerte trouvée avec l'ID ${id}`
      });
    }

    if (existingRows[0].resolved_at) {
      return res.status(400).json({ 
        error: 'Alerte déjà résolue',
        message: 'Cette alerte a déjà été marquée comme résolue'
      });
    }

    await db.execute(
      'UPDATE alerts SET resolved_at = NOW() WHERE id = ?',
      [id]
    );
    
    res.json({
      message: 'Alerte marquée comme résolue',
      alert_id: parseInt(id),
      resolved_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la résolution de l\'alerte:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de résoudre l\'alerte'
    });
  }
};

// DELETE /api/alerts/:id - Supprimer une alerte
export const deleteAlert = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        error: 'ID invalide',
        message: 'L\'ID de l\'alerte doit être un nombre valide'
      });
    }

    // Vérifier si l'alerte existe
    const [existingRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM alerts WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ 
        error: 'Alerte non trouvée',
        message: `Aucune alerte trouvée avec l'ID ${id}`
      });
    }

    await db.execute('DELETE FROM alerts WHERE id = ?', [id]);
    
    res.json({
      message: 'Alerte supprimée avec succès',
      deleted_alert_id: parseInt(id)
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'alerte:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de supprimer l\'alerte'
    });
  }
};