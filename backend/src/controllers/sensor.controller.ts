// backend/src/controllers/sensor.controller.ts
import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import db from '../services/db';

interface AuthRequest extends Request {
  user?: { id: number; role: string; email: string };
}

// GET /api/sensors - Récupérer tous les capteurs
export const getSensors = async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors ORDER BY created_at DESC'
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des capteurs:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les capteurs'
    });
  }
};

// GET /api/sensors/:id - Récupérer un capteur par ID
export const getSensorById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        error: 'ID invalide',
        message: 'L\'ID du capteur doit être un nombre valide'
      });
    }

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Capteur non trouvé',
        message: `Aucun capteur trouvé avec l'ID ${id}`
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du capteur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer le capteur'
    });
  }
};

// POST /api/sensors - Créer un nouveau capteur
export const createSensor = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, location, latitude, longitude, status, installed_at } = req.body;

    // Validation des données requises
    if (!name || !type || !location || !installed_at) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Les champs name, type, location et installed_at sont requis'
      });
    }

    // Validation du type
    const validTypes = ['temperature', 'air_quality', 'noise', 'humidity', 'traffic', 'pollution'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Type invalide',
        message: `Le type doit être l'un des suivants: ${validTypes.join(', ')}`
      });
    }

    // Validation du statut
    const validStatuses = ['actif', 'inactif', 'maintenance'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Statut invalide',
        message: `Le statut doit être l'un des suivants: ${validStatuses.join(', ')}`
      });
    }

    const [result] = await db.execute(
      'INSERT INTO sensors (name, type, location, latitude, longitude, status, installed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, type, location, latitude || null, longitude || null, status || 'actif', installed_at]
    );

    const insertId = (result as any).insertId;

    // Récupérer le capteur créé
    const [newSensor] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors WHERE id = ?',
      [insertId]
    );

    res.status(201).json({
      message: 'Capteur créé avec succès',
      sensor: newSensor[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création du capteur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de créer le capteur'
    });
  }
};

// PUT /api/sensors/:id - Mettre à jour un capteur
export const updateSensor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        error: 'ID invalide',
        message: 'L\'ID du capteur doit être un nombre valide'
      });
    }

    // Vérifier si le capteur existe
    const [existingRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM sensors WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ 
        error: 'Capteur non trouvé',
        message: `Aucun capteur trouvé avec l'ID ${id}`
      });
    }

    // Construire la requête de mise à jour dynamiquement
    const allowedFields = ['name', 'type', 'location', 'latitude', 'longitude', 'status'];
    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Aucune donnée à mettre à jour',
        message: 'Veuillez fournir au moins un champ à mettre à jour'
      });
    }

    updateValues.push(id);

    await db.execute(
      `UPDATE sensors SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Récupérer le capteur mis à jour
    const [updatedSensor] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Capteur mis à jour avec succès',
      sensor: updatedSensor[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du capteur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de mettre à jour le capteur'
    });
  }
};

// DELETE /api/sensors/:id - Supprimer un capteur
export const deleteSensor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        error: 'ID invalide',
        message: 'L\'ID du capteur doit être un nombre valide'
      });
    }

    // Vérifier si le capteur existe
    const [existingRows] = await db.execute<RowDataPacket[]>(
      'SELECT name FROM sensors WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ 
        error: 'Capteur non trouvé',
        message: `Aucun capteur trouvé avec l'ID ${id}`
      });
    }

    const sensorName = existingRows[0].name;

    // Les données seront automatiquement supprimées grâce à ON DELETE CASCADE
    await db.execute('DELETE FROM sensors WHERE id = ?', [id]);
    
    res.json({
      message: 'Capteur supprimé avec succès',
      deletedSensor: {
        id: parseInt(id),
        name: sensorName
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du capteur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de supprimer le capteur'
    });
  }
};

// GET /api/sensors/:id/data - Récupérer les données d'un capteur
export const getSensorData = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0, start_date, end_date } = req.query;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        error: 'ID invalide',
        message: 'L\'ID du capteur doit être un nombre valide'
      });
    }
    
    // Vérifier si le capteur existe
    const [sensorRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM sensors WHERE id = ?',
      [id]
    );

    if (sensorRows.length === 0) {
      return res.status(404).json({ 
        error: 'Capteur non trouvé',
        message: `Aucun capteur trouvé avec l'ID ${id}`
      });
    }

    let query = 'SELECT * FROM sensor_data WHERE sensor_id = ?';
    const params: any[] = [id];

    // Ajouter les filtres de date si fournis
    if (start_date) {
      query += ' AND timestamp >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND timestamp <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [dataRows] = await db.execute<RowDataPacket[]>(query, params);
    
    res.json({
      data: dataRows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: dataRows.length
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données du capteur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les données du capteur'
    });
  }
};

// POST /api/sensor-data - Ajouter des données de capteur
export const addSensorData = async (req: AuthRequest, res: Response) => {
  try {
    const { sensor_id, value, unit } = req.body;

    if (!sensor_id || value === undefined || !unit) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Les champs sensor_id, value et unit sont requis'
      });
    }

    // Vérifier si le capteur existe
    const [sensorRows] = await db.execute<RowDataPacket[]>(
      'SELECT id, type FROM sensors WHERE id = ?',
      [sensor_id]
    );

    if (sensorRows.length === 0) {
      return res.status(404).json({
        error: 'Capteur non trouvé',
        message: `Aucun capteur trouvé avec l'ID ${sensor_id}`
      });
    }

    const [result] = await db.execute(
      'INSERT INTO sensor_data (sensor_id, value, unit) VALUES (?, ?, ?)',
      [sensor_id, value, unit]
    );

    const insertId = (result as any).insertId;

    // Récupérer les données créées
    const [newData] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensor_data WHERE id = ?',
      [insertId]
    );

    // Vérifier s'il faut créer une alerte
    await checkAndCreateAlert(sensor_id, value, sensorRows[0].type);

    res.status(201).json({
      message: 'Données ajoutées avec succès',
      data: newData[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout des données:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible d\'ajouter les données'
    });
  }
};

// GET /api/sensors/statistics - Récupérer les statistiques globales
export const getSensorStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const [totalRows] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM sensors'
    );

    const [statusRows] = await db.execute<RowDataPacket[]>(
      'SELECT status, COUNT(*) as count FROM sensors GROUP BY status'
    );

    const [typeRows] = await db.execute<RowDataPacket[]>(
      'SELECT type, COUNT(*) as count FROM sensors GROUP BY type'
    );

    const [recentDataRows] = await db.execute<RowDataPacket[]>(
      `SELECT s.type, COUNT(sd.id) as data_count, AVG(sd.value) as avg_value
       FROM sensors s 
       LEFT JOIN sensor_data sd ON s.id = sd.sensor_id 
       WHERE sd.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY s.type`
    );

    const statistics = {
      total: totalRows[0].total,
      byStatus: statusRows.reduce((acc: any, row: any) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      byType: typeRows.reduce((acc: any, row: any) => {
        acc[row.type] = row.count;
        return acc;
      }, {}),
      recentData: recentDataRows.reduce((acc: any, row: any) => {
        acc[row.type] = {
          count: row.data_count,
          average: parseFloat(row.avg_value || 0).toFixed(2)
        };
        return acc;
      }, {})
    };

    res.json(statistics);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les statistiques'
    });
  }
};

// Fonction utilitaire pour vérifier et créer des alertes
const checkAndCreateAlert = async (sensorId: number, value: number, sensorType: string) => {
  try {
    // Définir les seuils par type de capteur
    const thresholds: Record<string, { warning: number; critical: number }> = {
      temperature: { warning: 25, critical: 30 },
      air_quality: { warning: 100, critical: 150 },
      noise: { warning: 60, critical: 70 },
      humidity: { warning: 80, critical: 90 },
      traffic: { warning: 300, critical: 400 },
      pollution: { warning: 50, critical: 100 }
    };

    const threshold = thresholds[sensorType];
    if (!threshold) return;

    let alertType: 'info' | 'warning' | 'critical' | null = null;
    let seuil_value = 0;

    if (value >= threshold.critical) {
      alertType = 'critical';
      seuil_value = threshold.critical;
    } else if (value >= threshold.warning) {
      alertType = 'warning';
      seuil_value = threshold.warning;
    }

    if (alertType) {
      // Vérifier s'il n'y a pas déjà une alerte non résolue pour ce capteur
      const [existingAlert] = await db.execute<RowDataPacket[]>(
        'SELECT id FROM alerts WHERE sensor_id = ? AND resolved_at IS NULL AND alert_type = ? ORDER BY created_at DESC LIMIT 1',
        [sensorId, alertType]
      );

      if (existingAlert.length === 0) {
        const message = `Seuil ${alertType} dépassé pour ${sensorType}: ${value} (seuil: ${seuil_value})`;
        
        await db.execute(
          'INSERT INTO alerts (sensor_id, alert_type, seuil_value, current_value, message) VALUES (?, ?, ?, ?, ?)',
          [sensorId, alertType, seuil_value, value, message]
        );
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des alertes:', error);
  }
};