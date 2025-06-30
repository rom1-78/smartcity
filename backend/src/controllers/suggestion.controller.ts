// backend/src/controllers/suggestion.controller.ts (VERSION CORRIGÉE)
import { Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../services/db';
import { AuthRequest } from '../middleware/auth';

// GET /api/suggestions - Récupérer toutes les suggestions
export const getSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const {
      limit = 20,
      offset = 0,
      category,
      priority,
      user_id
    } = req.query;

    let query = `
      SELECT s.*, u.first_name, u.last_name 
      FROM suggestions s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    // Si ce n'est pas un admin, filtrer par suggestions de l'utilisateur
    if (req.user?.role !== 'admin') {
      query += ' AND s.user_id = ?';
      params.push(req.user?.id);
    }

    // Filtrer par catégorie
    if (category) {
      query += ' AND s.category = ?';
      params.push(category);
    }

    // Filtrer par priorité
    if (priority) {
      query += ' AND s.priority = ?';
      params.push(priority);
    }

    // Filtrer par utilisateur (pour les admins)
    if (user_id && req.user?.role === 'admin') {
      query += ' AND s.user_id = ?';
      params.push(parseInt(user_id as string));
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [rows] = await db.execute<RowDataPacket[]>(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les suggestions'
    });
  }
};

// GET /api/suggestions/:id - Récupérer une suggestion par ID
export const getSuggestionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID de la suggestion doit être un nombre valide'
      });
    }

    let query = `
      SELECT s.*, u.first_name, u.last_name 
      FROM suggestions s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE s.id = ?
    `;
    const params: any[] = [id];

    // Si ce n'est pas un admin, vérifier que c'est sa suggestion
    if (req.user?.role !== 'admin') {
      query += ' AND s.user_id = ?';
      params.push(req.user?.id);
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Suggestion non trouvée',
        message: `Aucune suggestion trouvée avec l'ID ${id} ou vous n'avez pas les permissions`
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de la suggestion:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer la suggestion'
    });
  }
};

// POST /api/suggestions - Créer une nouvelle suggestion
export const createSuggestion = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body; // SEULEMENT message, pas title ni description

    // Validation
    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Message requis',
        message: 'Le champ message est obligatoire'
      });
    }

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO suggestions (user_id, message) VALUES (?, ?)`, // SEULEMENT user_id et message
      [req.user?.id, message.trim()]
    );

    res.status(201).json({
      message: 'Suggestion créée avec succès',
      suggestion: {
        id: result.insertId,
        user_id: req.user?.id,
        message: message.trim(),
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur création suggestion:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de créer la suggestion'
    });
  }
};

// PUT /api/suggestions/:id/response - Ajouter une réponse admin à une suggestion
export const addAdminResponse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { admin_response } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID de la suggestion doit être un nombre valide'
      });
    }

    if (!admin_response) {
      return res.status(400).json({
        error: 'Réponse manquante',
        message: 'Le champ admin_response est requis'
      });
    }

    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Seuls les administrateurs peuvent répondre aux suggestions'
      });
    }

    // Vérifier si la suggestion existe
    const [existingRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM suggestions WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        error: 'Suggestion non trouvée',
        message: `Aucune suggestion trouvée avec l'ID ${id}`
      });
    }

    await db.execute(
      'UPDATE suggestions SET admin_response = ?, updated_at = NOW() WHERE id = ?',
      [admin_response, id]
    );

    res.json({
      message: 'Réponse ajoutée avec succès',
      suggestion_id: parseInt(id),
      admin_response
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la réponse:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible d\'ajouter la réponse'
    });
  }
};

// DELETE /api/suggestions/:id - Supprimer une suggestion (admin uniquement)
export const deleteSuggestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID de la suggestion doit être un nombre valide'
      });
    }

    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Seuls les administrateurs peuvent supprimer les suggestions'
      });
    }

    // Vérifier si la suggestion existe
    const [existingRows] = await db.execute<RowDataPacket[]>(
      'SELECT id, title FROM suggestions WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        error: 'Suggestion non trouvée',
        message: `Aucune suggestion trouvée avec l'ID ${id}`
      });
    }

    const suggestionTitle = existingRows[0].title;

    await db.execute('DELETE FROM suggestions WHERE id = ?', [id]);

    res.json({
      message: 'Suggestion supprimée avec succès',
      deleted_suggestion: {
        id: parseInt(id),
        title: suggestionTitle
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la suggestion:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de supprimer la suggestion'
    });
  }
};