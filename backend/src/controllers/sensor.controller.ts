// backend/src/controllers/sensor.controller.ts (VERSION CORRIGÉE COMPLÈTE)
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
}

interface SensorRequest {
  name: string;
  type: string;
  location: string;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
  latitude?: number;
  longitude?: number;
}

// GET /api/sensors - Récupérer tous les capteurs
export const getSensors = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 Récupération de tous les capteurs...');

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors ORDER BY id DESC'
    );

    console.log(`✅ ${rows.length} capteurs récupérés`);
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

// POST /api/sensors - Créer un nouveau capteur
export const createSensor = async (req: AuthRequest, res: Response) => {
  try {
    console.log('📝 Tentative de création d\'un capteur:', req.body);

    const {
      name,
      type,
      location,
      status,
      installed_at,
      latitude,
      longitude
    }: SensorRequest = req.body;

    // Validation des données obligatoires
    if (!name || !type || !location || !status || !installed_at) {
      console.log('❌ Données manquantes pour la création');
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
    const [duplicateRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM sensors WHERE name = ?',
      [name]
    );

    if (duplicateRows.length > 0) {
      return res.status(409).json({
        error: 'Nom de capteur existant',
        message: 'Un capteur avec ce nom existe déjà'
      });
    }

    // Créer le capteur
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO sensors (
        name, type, location, status, installed_at, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name, type, location, status, installed_at,
        latitude || null, longitude || null
      ]
    );

    // Récupérer le capteur créé
    const [newSensorRows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors WHERE id = ?',
      [result.insertId]
    );

    console.log('✅ Capteur créé avec succès:', newSensorRows[0]);

    res.status(201).json({
      message: 'Capteur créé avec succès',
      sensor: newSensorRows[0]
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création du capteur:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de créer le capteur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};

// PUT /api/sensors/:id - Mettre à jour un capteur
export const updateSensor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Tentative de mise à jour du capteur ID: ${id}`, req.body);

    const {
      name,
      type,
      location,
      status,
      installed_at,
      latitude,
      longitude
    }: SensorRequest = req.body;

    if (!id || isNaN(Number(id))) {
      console.log('❌ ID invalide:', id);
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID du capteur doit être un nombre valide'
      });
    }

    // Validation des données obligatoires
    if (!name || !type || !location || !status || !installed_at) {
      console.log('❌ Données manquantes pour la mise à jour');
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

    // Vérifier si le capteur existe
    const [existingRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM sensors WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      console.log(`❌ Capteur non trouvé avec l'ID: ${id}`);
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
      console.log(`❌ Nom de capteur déjà utilisé: ${name}`);
      return res.status(409).json({
        error: 'Nom de capteur existant',
        message: 'Un autre capteur avec ce nom existe déjà'
      });
    }

    // Mettre à jour le capteur
    console.log('🔄 Exécution de la mise à jour...');
    const [updateResult] = await db.execute<ResultSetHeader>(
      `UPDATE sensors SET 
        name = ?, type = ?, location = ?, status = ?, installed_at = ?,
        latitude = ?, longitude = ?
      WHERE id = ?`,
      [
        name, type, location, status, installed_at,
        latitude || null, longitude || null, id
      ]
    );

    console.log('📊 Résultat de la mise à jour:', updateResult);

    // Vérifier si la mise à jour a affecté une ligne
    if (updateResult.affectedRows === 0) {
      console.log(`❌ Aucune ligne affectée lors de la mise à jour de l'ID: ${id}`);
      return res.status(404).json({
        error: 'Mise à jour échouée',
        message: 'Aucune modification effectuée'
      });
    }

    // Récupérer le capteur mis à jour
    const [updatedRows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors WHERE id = ?',
      [id]
    );

    console.log('✅ Capteur mis à jour avec succès:', updatedRows[0]);

    res.json({
      message: 'Capteur mis à jour avec succès',
      sensor: updatedRows[0]
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du capteur:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de mettre à jour le capteur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
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

    // Supprimer le capteur
    await db.execute('DELETE FROM sensors WHERE id = ?', [id]);

    res.json({
      message: 'Capteur supprimé avec succès',
      sensor: {
        id: parseInt(id),
        name: sensorName,
        associated_data_count: dataCount
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

// GET /api/sensors/stats - Statistiques des capteurs
export const getSensorStats = async (req: AuthRequest, res: Response) => {
  try {
    // Statistiques générales
    const [totalRows] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM sensors'
    );

    const [statusRows] = await db.execute<RowDataPacket[]>(
      'SELECT status, COUNT(*) as count FROM sensors GROUP BY status'
    );

    const [typeRows] = await db.execute<RowDataPacket[]>(
      'SELECT type, COUNT(*) as count FROM sensors GROUP BY type'
    );

    // Capteurs récemment ajoutés (derniers 30 jours)
    const [recentRows] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM sensors WHERE installed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    const stats = {
      total: totalRows[0].total,
      recent_additions: recentRows[0].count,
      by_status: statusRows.reduce((acc: any, row: any) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      by_type: typeRows.reduce((acc: any, row: any) => {
        acc[row.type] = row.count;
        return acc;
      }, {})
    };

    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les statistiques'
    });
  }
};