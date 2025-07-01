// backend/src/controllers/sensor.controller.ts - VERSION FINALE CORRIGÉE
import { Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../services/db';
import { AuthRequest } from '../middleware/auth';

// INTERFACES CORRIGÉES - correspondent à votre structure de BDD
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
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors ORDER BY id DESC'
    );
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

// POST /api/sensors - Créer un nouveau capteur (VERSION CORRIGÉE FINALE)
export const createSensor = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== DÉBUT CRÉATION CAPTEUR ===');
    console.log('🔍 Body reçu:', JSON.stringify(req.body, null, 2));

    // DESTRUCTURATION CORRIGÉE - seulement les champs existants
    const {
      name,
      type,
      location,
      status,
      installed_at,
      latitude,
      longitude
    }: SensorRequest = req.body;

    console.log(' Données extraites:', {
      name: name || 'MANQUANT',
      type: type || 'MANQUANT',
      location: location || 'MANQUANT',
      status: status || 'MANQUANT',
      installed_at: installed_at || 'MANQUANT',
      latitude,
      longitude
    });

    // Validation des données obligatoires
    if (!name || !type || !location || !status) {
      console.log(' Validation échouée - champs manquants');
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Les champs name, type, location, status et installed_at sont requis',
        received: { name, type, location, status, installed_at }
      });
    }

    console.log(' Validation des champs obligatoires réussie');

    // Vérifier si le type est valide
    const validTypes = ['temperature', 'air_quality', 'noise', 'humidity', 'traffic', 'pollution'];
    if (!validTypes.includes(type)) {
      console.log(` Type invalide: ${type}`);
      return res.status(400).json({
        error: 'Type invalide',
        message: `Le type doit être l'un des suivants: ${validTypes.join(', ')}`,
        received: type
      });
    }

    console.log('✅ Validation du type réussie');

    // Vérifier si le statut est valide
    const validStatuses = ['actif', 'inactif', 'maintenance'];
    if (!validStatuses.includes(status)) {
      console.log(`❌ Statut invalide: ${status}`);
      return res.status(400).json({
        error: 'Statut invalide',
        message: 'Le statut doit être: actif, inactif ou maintenance',
        received: status
      });
    }

    console.log('✅ Validation du statut réussie');

    // Vérifier si un capteur avec le même nom existe déjà
    console.log('🔍 Vérification nom unique...');
    const [existingRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM sensors WHERE name = ?',
      [name]
    );

    if (existingRows.length > 0) {
      console.log(`❌ Nom déjà existant: ${name}`);
      return res.status(409).json({
        error: 'Nom de capteur existant',
        message: 'Un capteur avec ce nom existe déjà',
        existing_id: existingRows[0].id
      });
    }

    console.log('✅ Nom unique validé');

    // Préparer les valeurs pour l'insertion
    const insertValues = [
      name,
      type,
      location,
      latitude || null,
      longitude || null,
      status,
      installed_at
    ];

    console.log('📝 Valeurs pour insertion:', insertValues);

    // Insérer le nouveau capteur
    console.log('💾 Insertion en base de données...');
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO sensors 
        (name, type, location, latitude, longitude, status, installed_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      insertValues
    );

    console.log('✅ Insertion réussie, ID:', result.insertId);

    // Récupérer le capteur créé
    console.log('🔍 Récupération du capteur créé...');
    const [newSensorRows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors WHERE id = ?',
      [result.insertId]
    );

    console.log('✅ Capteur récupéré:', newSensorRows[0]);

    const response = {
      message: 'Capteur créé avec succès',
      sensor: newSensorRows[0]
    };

    console.log('📤 Réponse envoyée:', response);
    console.log('=== FIN CRÉATION CAPTEUR SUCCÈS ===');

    res.status(201).json(response);

  } catch (error) {
    console.log('=== ERREUR CRÉATION CAPTEUR ===');
    console.error('❌ Erreur complète:', error);
    console.error('❌ Message:', error instanceof Error ? error.message : 'Erreur inconnue');

    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de créer le capteur',
      details: process.env.NODE_ENV === 'development' ? {
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : 'Pas de stack'
      } : undefined
    });
    console.log('=== FIN ERREUR CRÉATION CAPTEUR ===');
  }
};

// PUT /api/sensors/:id - Mettre à jour un capteur (VERSION CORRIGÉE)
export const updateSensor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // DESTRUCTURATION CORRIGÉE - seulement les champs existants
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
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID du capteur doit être un nombre valide'
      });
    }

    // Validation des données obligatoires
    if (!name || !type || !location || !status) {
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

    // Mettre à jour le capteur (REQUÊTE CORRIGÉE)
    await db.execute(
      `UPDATE sensors SET 
      name = ?, type = ?, location = ?, latitude = ?, longitude = ?, 
      status = ?
      WHERE id = ?`,
      [
        name, type, location, latitude || null, longitude || null,
        status, installed_at, id
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

    // Supprimer le capteur
    await db.execute('DELETE FROM sensors WHERE id = ?', [id]);

    res.json({
      message: 'Capteur supprimé avec succès',
      sensor: {
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

    const stats = {
      total: totalRows[0].total,
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