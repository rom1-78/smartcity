// backend/src/controllers/userManagement.controller.ts (NOUVEAU FICHIER)
import { Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../services/db';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

// GET /api/admin/users - Récupérer tous les utilisateurs (admin uniquement)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      role, 
      is_active,
      search,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT id, first_name, last_name, email, role, organization, 
             is_active, created_at, last_login, updated_at
      FROM users 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true');
    }

    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [rows] = await db.execute<RowDataPacket[]>(query, params);

    // Compter le total
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = params.slice(0, -2);

    if (role) countQuery += ' AND role = ?';
    if (is_active !== undefined) countQuery += ' AND is_active = ?';
    if (search) countQuery += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';

    const [countRows] = await db.execute<RowDataPacket[]>(countQuery, countParams);
    const total = countRows[0].total;

    res.json({
      users: rows,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les utilisateurs'
    });
  }
};

// POST /api/admin/users - Créer un nouvel utilisateur (admin uniquement)
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      first_name, 
      last_name, 
      email, 
      password, 
      role, 
      organization,
      is_active = true
    } = req.body;

    // Validation des données obligatoires
    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Les champs first_name, last_name, email, password et role sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    const [existingUsers] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Email déjà utilisé',
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Vérifier que le rôle est valide
    const validRoles = ['admin', 'gestionnaire', 'chercheur', 'citoyen'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Rôle invalide',
        message: `Le rôle doit être l'un des suivants: ${validRoles.join(', ')}`
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO users (first_name, last_name, email, password, role, organization, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, hashedPassword, role, organization || null, is_active]
    );

    // Récupérer l'utilisateur créé (sans le mot de passe)
    const [newUser] = await db.execute<RowDataPacket[]>(
      `SELECT id, first_name, last_name, email, role, organization, is_active, created_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: newUser[0]
    });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de créer l\'utilisateur'
    });
  }
};

// PUT /api/admin/users/:id - Mettre à jour un utilisateur (admin uniquement)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      first_name, 
      last_name, 
      email, 
      role, 
      organization,
      is_active,
      password
    } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID de l\'utilisateur doit être un nombre valide'
      });
    }

    // Vérifier si l'utilisateur existe
    const [existingUsers] = await db.execute<RowDataPacket[]>(
      'SELECT id, email FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé',
        message: `Aucun utilisateur trouvé avec l'ID ${id}`
      });
    }

    // Vérifier l'unicité de l'email si changé
    if (email && email !== existingUsers[0].email) {
      const [emailCheck] = await db.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.length > 0) {
        return res.status(409).json({
          error: 'Email déjà utilisé',
          message: 'Un autre utilisateur avec cet email existe déjà'
        });
      }
    }

    // Construire la requête de mise à jour dynamiquement
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (first_name) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
    }
    if (last_name) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (role) {
      const validRoles = ['admin', 'gestionnaire', 'chercheur', 'citoyen'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Rôle invalide',
          message: `Le rôle doit être l'un des suivants: ${validRoles.join(', ')}`
        });
      }
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (organization !== undefined) {
      updateFields.push('organization = ?');
      updateValues.push(organization);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    // Ajouter la mise à jour du timestamp
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    if (updateFields.length === 1) { // Seulement updated_at
      return res.status(400).json({ 
        error: 'Aucune donnée à mettre à jour',
        message: 'Aucun champ valide fourni pour la mise à jour'
      });
    }

    await db.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Récupérer l'utilisateur mis à jour
    const [updatedUser] = await db.execute<RowDataPacket[]>(
      `SELECT id, first_name, last_name, email, role, organization, is_active, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de mettre à jour l\'utilisateur'
    });
  }
};

// DELETE /api/admin/users/:id - Supprimer un utilisateur (admin uniquement)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID de l\'utilisateur doit être un nombre valide'
      });
    }

    // Empêcher l'auto-suppression
    if (id === req.user?.id?.toString()) {
      return res.status(400).json({
        error: 'Auto-suppression interdite',
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Vérifier si l'utilisateur existe
    const [existingUsers] = await db.execute<RowDataPacket[]>(
      'SELECT id, first_name, last_name, email FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé',
        message: `Aucun utilisateur trouvé avec l'ID ${id}`
      });
    }

    const userToDelete = existingUsers[0];

    // Supprimer l'utilisateur
    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      message: 'Utilisateur supprimé avec succès',
      deleted_user: {
        id: parseInt(id),
        name: `${userToDelete.first_name} ${userToDelete.last_name}`,
        email: userToDelete.email
      }
    });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de supprimer l\'utilisateur'
    });
  }
};

// GET /api/admin/users/statistics - Statistiques des utilisateurs (admin uniquement)
export const getUserStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const [stats] = await db.execute<RowDataPacket[]>(`
      SELECT 
        role,
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive,
        COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_last_30_days
      FROM users 
      GROUP BY role
      ORDER BY role
    `);

    // Statistiques globales
    const [globalStats] = await db.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_users_week,
        COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as active_today
      FROM users
    `);

    res.json({
      by_role: stats,
      global: globalStats[0],
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur statistiques utilisateurs:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les statistiques'
    });
  }
};