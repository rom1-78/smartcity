import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../services/db';
import { AuthRequest } from '../middleware/auth';

// GET /api/sensor-data - Récupérer toutes les données avec filtres
export const getSensorData = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      sensor_id, 
      start_date, 
      end_date, 
      limit = 100, 
      offset = 0,
      type 
    } = req.query;

    let query = `
      SELECT sd.*, s.name as sensor_name, s.type, s.location, s.latitude, s.longitude
      FROM sensor_data sd
      JOIN sensors s ON sd.sensor_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (sensor_id) {
      query += ' AND sd.sensor_id = ?';
      params.push(sensor_id);
    }

    if (type) {
      query += ' AND s.type = ?';
      params.push(type);
    }

    if (start_date) {
      query += ' AND sd.timestamp >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND sd.timestamp <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY sd.timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [rows] = await db.execute<RowDataPacket[]>(query, params);

    // Compter le total pour la pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM sensor_data sd 
      JOIN sensors s ON sd.sensor_id = s.id 
      WHERE 1=1
    `;
    const countParams = params.slice(0, -2); // Retirer limit et offset

    if (sensor_id) countQuery += ' AND sd.sensor_id = ?';
    if (type) countQuery += ' AND s.type = ?';
    if (start_date) countQuery += ' AND sd.timestamp >= ?';
    if (end_date) countQuery += ' AND sd.timestamp <= ?';

    const [countRows] = await db.execute<RowDataPacket[]>(countQuery, countParams);
    const total = countRows[0].total;

    res.json({
      data: rows,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Erreur récupération données capteurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/sensor-data - Ajouter des données (pour simulation)
export const addSensorData = async (req: AuthRequest, res: Response) => {
  try {
    const { sensor_id, value, unit } = req.body;

    if (!sensor_id || value === undefined || !unit) {
      return res.status(400).json({ 
        error: 'sensor_id, value et unit sont requis' 
      });
    }

    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO sensor_data (sensor_id, value, unit) VALUES (?, ?, ?)',
      [sensor_id, value, unit]
    );

    res.status(201).json({
      message: 'Données ajoutées avec succès',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erreur ajout données:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/sensor-data/statistics - Statistiques des données
export const getSensorDataStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { period = '24h', sensor_id, type } = req.query;

    let periodClause = 'DATE_SUB(NOW(), INTERVAL 24 HOUR)';
    switch (period) {
      case '1h': periodClause = 'DATE_SUB(NOW(), INTERVAL 1 HOUR)'; break;
      case '7d': periodClause = 'DATE_SUB(NOW(), INTERVAL 7 DAY)'; break;
      case '30d': periodClause = 'DATE_SUB(NOW(), INTERVAL 30 DAY)'; break;
    }

    let query = `
      SELECT 
        s.type,
        s.location,
        COUNT(sd.id) as data_count,
        AVG(sd.value) as avg_value,
        MIN(sd.value) as min_value,
        MAX(sd.value) as max_value,
        MAX(sd.timestamp) as last_reading
      FROM sensors s
      LEFT JOIN sensor_data sd ON s.id = sd.sensor_id AND sd.timestamp >= ${periodClause}
      WHERE 1=1
    `;
    const params: any[] = [];

    if (sensor_id) {
      query += ' AND s.id = ?';
      params.push(sensor_id);
    }

    if (type) {
      query += ' AND s.type = ?';
      params.push(type);
    }

    query += ' GROUP BY s.id, s.type, s.location ORDER BY s.type, s.location';

    const [rows] = await db.execute<RowDataPacket[]>(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};