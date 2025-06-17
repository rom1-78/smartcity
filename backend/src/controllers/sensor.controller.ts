// backend/src/controllers/sensor.controller.ts (VERSION CORRIGÉE)
import { Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../services/db';
import { AuthRequest } from '../middleware/auth';

interface Sensor {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
  latitude?: number;
  longitude?: number;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  firmware_version?: string;
}

interface SensorRequest {
  name: string;
  type: string;
  location: string;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
  latitude?: number;
  longitude?: number;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  firmware_version?: string;
}

// GET /api/sensors - Récupérer tous les capteurs
export const getSensors = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔄 Récupération des capteurs depuis la base de données...');
    
    // 🔧 CORRECTION: Requête simplifiée sans created_at si la colonne n'existe pas
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors ORDER BY id DESC'
    );
    
    console.log('✅ Capteurs récupérés:', rows.length);
    res.json(rows);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des capteurs:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les capteurs',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
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

// POST /api/sensors - Créer un nouveau capteur
export const createSensor = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      name, 
      type, 
      location, 
      status, 
      installed_at,
      latitude,
      longitude,
      serial_number,
      manufacturer,
      model,
      firmware_version
    }: SensorRequest = req.body;
    
    // Validation des données obligatoires
    if (!name || !type || !location || !status || !installed_at) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        message: 'Les champs name, type, location, status et installed_at sont requis'
      });
    }

    // Vérifier si le type est valide
    const validTypes = ['temperature', 'air_quality', 'noise', 'humidity', 'traffic', 'pollution'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Type invalide',
        message: `Le type doit être l'un des suivants: ${validTypes.join(', ')}`
      });
    }

    // Vérifier si le statut est valide
    const validStatuses = ['actif', 'inactif', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Statut invalide',
        message: 'Le statut doit être: actif, inactif ou maintenance'
      });
    }

    // Vérifier si un capteur avec le même nom existe déjà
    const [existingRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM sensors WHERE name = ?',
      [name]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ 
        error: 'Capteur existant',
        message: 'Un capteur avec ce nom existe déjà'
      });
    }

    // Vérifier le numéro de série s'il est fourni
    if (serial_number) {
      const [serialRows] = await db.execute<RowDataPacket[]>(
        'SELECT id FROM sensors WHERE serial_number = ?',
        [serial_number]
      );

      if (serialRows.length > 0) {
        return res.status(409).json({ 
          error: 'Numéro de série existant',
          message: 'Un capteur avec ce numéro de série existe déjà'
        });
      }
    }

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO sensors (
        name, type, location, status, installed_at, 
        latitude, longitude, serial_number, manufacturer, model, firmware_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, type, location, status, installed_at,
        latitude || null, longitude || null, serial_number || null,
        manufacturer || null, model || null, firmware_version || null
      ]
    );
    
    // Récupérer le capteur créé
    const [newSensorRows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Capteur créé avec succès',
      sensor: newSensorRows[0]
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
    const { 
      name, 
      type, 
      location, 
      status, 
      installed_at,
      latitude,
      longitude,
      serial_number,
      manufacturer,
      model,
      firmware_version
    }: SensorRequest = req.body;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        error: 'ID invalide',
        message: 'L\'ID du capteur doit être un nombre valide'
      });
    }

    // Validation des données obligatoires
    if (!name || !type || !location || !status || !installed_at) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        message: 'Tous les champs obligatoires sont requis'
      });
    }

    // Vérifier si le type est valide
    const validTypes = ['temperature', 'air_quality', 'noise', 'humidity', 'traffic', 'pollution'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Type invalide',
        message: `Le type doit être l'un des suivants: ${validTypes.join(', ')}`
      });
    }

    // Vérifier si le statut est valide
    const validStatuses = ['actif', 'inactif', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Statut invalide',
        message: 'Le statut doit être: actif, inactif ou maintenance'
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

    // Vérifier si un autre capteur avec le même nom existe
    const [duplicateRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM sensors WHERE name = ? AND id != ?',
      [name, id]
    );

    if (duplicateRows.length > 0) {
      return res.status(409).json({ 
        error: 'Nom de capteur existant',
        message: 'Un autre capteur avec ce nom existe déjà'
      });
    }

    // Vérifier le numéro de série s'il est fourni
    if (serial_number) {
      const [serialRows] = await db.execute<RowDataPacket[]>(
        'SELECT id FROM sensors WHERE serial_number = ? AND id != ?',
        [serial_number, id]
      );

      if (serialRows.length > 0) {
        return res.status(409).json({ 
          error: 'Numéro de série existant',
          message: 'Un autre capteur avec ce numéro de série existe déjà'
        });
      }
    }

    // 🔧 CORRECTION: Requête de mise à jour simplifiée
    await db.execute(
      `UPDATE sensors SET 
        name = ?, type = ?, location = ?, status = ?, installed_at = ?,
        latitude = ?, longitude = ?, serial_number = ?, manufacturer = ?, 
        model = ?, firmware_version = ?
      WHERE id = ?`,
      [
        name, type, location, status, installed_at,
        latitude || null, longitude || null, serial_number || null,
        manufacturer || null, model || null, firmware_version || null, id
      ]
    );
    
    // Récupérer le capteur mis à jour
    const [updatedRows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors WHERE id = ?',
      [id]
    );
    
    res.json({
      message: 'Capteur mis à jour avec succès',
      sensor: updatedRows[0]
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
      'SELECT id, name FROM sensors WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ 
        error: 'Capteur non trouvé',
        message: `Aucun capteur trouvé avec l'ID ${id}`
      });
    }

    const sensorName = existingRows[0].name;

    // Vérifier s'il y a des données associées (optionnel)
    let dataCount = 0;
    try {
      const [dataRows] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM sensor_data WHERE sensor_id = ?',
        [id]
      );
      dataCount = dataRows[0].count;
    } catch {
      // Ignorer l'erreur si la table sensor_data n'existe pas
    }

    await db.execute('DELETE FROM sensors WHERE id = ?', [id]);
    
    res.json({
      message: 'Capteur supprimé avec succès',
      deletedSensor: {
        id: parseInt(id),
        name: sensorName,
        deletedDataCount: dataCount
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

    // Statistiques des données récentes (optionnel, ignorer l'erreur si sensor_data n'existe pas)
    let recentDataRows: any[] = [];
    try {
      const [result] = await db.execute<RowDataPacket[]>(
        `SELECT s.type, COUNT(sd.id) as data_count, AVG(sd.value) as avg_value
         FROM sensors s 
         LEFT JOIN sensor_data sd ON s.id = sd.sensor_id 
         WHERE sd.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         GROUP BY s.type`
      );
      recentDataRows = result;
    } catch {
      console.log('Table sensor_data non disponible pour les statistiques');
    }

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