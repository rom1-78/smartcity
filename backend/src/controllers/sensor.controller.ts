import { Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../services/db';
import { AuthRequest } from '../middleware/auth';

// GET /api/sensors - Récupérer tous les capteurs
export const getSensors = async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM sensors ORDER BY id DESC'
    );

    res.json({
      sensors: rows,
      total: rows.length
    });
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

    if (!id || isNaN(parseInt(id))) {
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

// POST /api/sensors - Créer un nouveau capteur (Gestionnaires/Admins seulement)
export const createSensor = async (req: AuthRequest, res: Response) => {
  try {
    // Vérification des permissions
    if (req.user?.role !== 'gestionnaire' && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Permissions insuffisantes',
        message: 'Seuls les gestionnaires et administrateurs peuvent créer des capteurs'
      });
    }

    const {
      name,
      type,
      location,
      latitude,
      longitude,
      status,
      installed_at
    } = req.body;

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
        error: 'Nom de capteur existant',
        message: 'Un capteur avec ce nom existe déjà'
      });
    }

    // Insérer le nouveau capteur
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO sensors (name, type, location, latitude, longitude, status, installed_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, type, location, latitude || null, longitude || null, status, installed_at]
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

// PUT /api/sensors/:id - Mettre à jour un capteur (Gestionnaires/Admins seulement)
export const updateSensor = async (req: AuthRequest, res: Response) => {
  try {
    // Vérification des permissions
    if (req.user?.role !== 'gestionnaire' && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Permissions insuffisantes',
        message: 'Seuls les gestionnaires et administrateurs peuvent modifier des capteurs'
      });
    }

    const { id } = req.params;
    const {
      name,
      type,
      location,
      latitude,
      longitude,
      status,
      installed_at
    } = req.body;

    if (!id || isNaN(parseInt(id))) {
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

    // Mettre à jour le capteur
    await db.execute(
      `UPDATE sensors SET 
        name = ?, type = ?, location = ?, latitude = ?, longitude = ?, status = ?, installed_at = ?
      WHERE id = ?`,
      [name, type, location, latitude || null, longitude || null, status, installed_at, id]
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

// DELETE /api/sensors/:id - Supprimer un capteur (Gestionnaires/Admins seulement)
export const deleteSensor = async (req: AuthRequest, res: Response) => {
  try {
    // Vérification des permissions
    if (req.user?.role !== 'gestionnaire' && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Permissions insuffisantes',
        message: 'Seuls les gestionnaires et administrateurs peuvent supprimer des capteurs'
      });
    }

    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
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