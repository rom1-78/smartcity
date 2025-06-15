// backend/src/controllers/alert.controller.ts
import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import db from '../services/db';

interface AuthRequest extends Request {
  user?: { id: number; role: string; email: string };
}

// GET /api/alerts - Récupérer toutes les alertes
export const getAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      type, 
      resolved, 
      sensor_id,
      start_date,
      end_date 
    } = req.query;

    let query = `
      SELECT a.*, s.name as sensor_name, s.location, s.type as sensor_type
      FROM alerts a
      JOIN sensors s ON a.sensor_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filtres
    if (type) {
      query += ' AND a.alert_type = ?';
      params.push(type);
    }

    if (resolved !== undefined) {
      if (resolved === 'true') {
        query += ' AND a.resolved_at IS NOT NULL';
      } else {
        query += ' AND a.resolved_at IS NULL';
      }
    }

    if (sensor_id) {
      query += ' AND a.sensor_id = ?';
      params.push(sensor_id);
    }

    if (start_date) {
      query += ' AND a.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND a.created_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [rows] = await db.execute<RowDataPacket[]>(query, params);

    // Compter le total pour la pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM alerts a
      JOIN sensors s ON a.sensor_id = s.id
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (type) {
      countQuery += ' AND a.alert_type = ?';
      countParams.push(type);
    }

    if (resolved !== undefined) {
      if (resolved === 'true') {
        countQuery += ' AND a.resolved_at IS NOT NULL';
      } else {
        countQuery += ' AND a.resolved_at IS NULL';
      }
    }

    if (sensor_id) {
      countQuery += ' AND a.sensor_id = ?';
      countParams.push(sensor_id);
    }

    if (start_date) {
      countQuery += ' AND a.created_at >= ?';
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ' AND a.created_at <= ?';
      countParams.push(end_date);
    }

    const [countRows] = await db.execute<RowDataPacket[]>(countQuery, countParams);

    res.json({
      alerts: rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: countRows[0].total
      }
    });
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
      `SELECT a.*, s.name as sensor_name, s.location, s.type as sensor_type
       FROM alerts a
       JOIN sensors s ON a.sensor_id = s.id
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
    const { sensor_id, alert_type, seuil_value, current_value, message } = req.body;

    // Validation des données requises
    if (!sensor_id || !alert_type || seuil_value === undefined || current_value === undefined || !message) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Les champs sensor_id, alert_type, seuil_value, current_value et message sont requis'
      });
    }

    // Validation du type d'alerte
    const validTypes = ['info', 'warning', 'critical'];
    if (!validTypes.includes(alert_type)) {
      return res.status(400).json({
        error: 'Type d\'alerte invalide',
        message: `Le type d'alerte doit être l'un des suivants: ${validTypes.join(', ')}`
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

    const [result] = await db.execute(
      'INSERT INTO alerts (sensor_id, alert_type, seuil_value, current_value, message) VALUES (?, ?, ?, ?, ?)',
      [sensor_id, alert_type, seuil_value, current_value, message]
    );

    const insertId = (result as any).insertId;

    // Récupérer l'alerte créée avec les informations du capteur
    const [newAlert] = await db.execute<RowDataPacket[]>(
      `SELECT a.*, s.name as sensor_name, s.location, s.type as sensor_type
       FROM alerts a
       JOIN sensors s ON a.sensor_id = s.id
       WHERE a.id = ?`,
      [insertId]
    );

    res.status(201).json({
      message: 'Alerte créée avec succès',
      alert: newAlert[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de créer l\'alerte'
    });
  }
};

// PUT /api/alerts/:id/resolve - Résoudre une alerte
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
        message: 'Cette alerte a déjà été résolue'
      });
    }

    await db.execute(
      'UPDATE alerts SET resolved_at = NOW() WHERE id = ?',
      [id]
    );

    // Récupérer l'alerte mise à jour
    const [updatedAlert] = await db.execute<RowDataPacket[]>(
      `SELECT a.*, s.name as sensor_name, s.location, s.type as sensor_type
       FROM alerts a
       JOIN sensors s ON a.sensor_id = s.id
       WHERE a.id = ?`,
      [id]
    );

    res.json({
      message: 'Alerte résolue avec succès',
      alert: updatedAlert[0]
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
      'SELECT id, message FROM alerts WHERE id = ?',
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
      deletedAlert: {
        id: parseInt(id),
        message: existingRows[0].message
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'alerte:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de supprimer l\'alerte'
    });
  }
};

// GET /api/alerts/statistics - Récupérer les statistiques des alertes
export const getAlertStatistics = async (req: AuthRequest, res: Response) => {
  try {
    // Total des alertes
    const [totalRows] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM alerts'
    );

    // Alertes par type
    const [typeRows] = await db.execute<RowDataPacket[]>(
      'SELECT alert_type, COUNT(*) as count FROM alerts GROUP BY alert_type'
    );

    // Alertes résolues vs non résolues
    const [statusRows] = await db.execute<RowDataPacket[]>(
      `SELECT 
        SUM(CASE WHEN resolved_at IS NULL THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved
       FROM alerts`
    );

    // Alertes des dernières 24h
    const [recentRows] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
    );

    // Top 5 des capteurs avec le plus d'alertes
    const [topSensorsRows] = await db.execute<RowDataPacket[]>(
      `SELECT s.name, s.location, COUNT(a.id) as alert_count
       FROM sensors s
       JOIN alerts a ON s.id = a.sensor_id
       GROUP BY s.id, s.name, s.location
       ORDER BY alert_count DESC
       LIMIT 5`
    );

    const statistics = {
      total: totalRows[0].total,
      byType: typeRows.reduce((acc: any, row: any) => {
        acc[row.alert_type] = row.count;
        return acc;
      }, {}),
      status: {
        active: statusRows[0].active || 0,
        resolved: statusRows[0].resolved || 0
      },
      recent24h: recentRows[0].count,
      topSensors: topSensorsRows
    };

    res.json(statistics);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques d\'alertes:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les statistiques d\'alertes'
    });
  }
};