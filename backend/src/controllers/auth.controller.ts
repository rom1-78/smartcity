import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../services/db';

export const registerUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, role, organization } = req.body;

  try {
    // Vérifie si l'email existe déjà
    const [existingUsers]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insertion dans la base
    await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, role, organization)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, hashedPassword, role, organization]
    );

    res.status(201).json({ message: 'Utilisateur enregistré avec succès' });
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  console.log('loginUser called', req.body); // <-- Ajoute ça

  const { email, password } = req.body;

  try {
    const [users]: any = await pool.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    console.log('Users found:', users);

    if (users.length === 0) {
      console.log('No user found for email:', email);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password incorrect');
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }, process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    console.log('Login successful, token generated');
    res.json({ token });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
