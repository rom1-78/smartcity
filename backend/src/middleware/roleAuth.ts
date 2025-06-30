// backend/src/middleware/roleAuth.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Non authentifié',
        message: 'Authentification requise'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: `Accès réservé aux rôles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Middlewares prédéfinis pour faciliter l'usage
export const requireAdmin = requireRole(['admin']);
export const requireGestionnaire = requireRole(['admin', 'gestionnaire']);
export const requireResearcher = requireRole(['admin', 'gestionnaire', 'chercheur']);

// Middleware pour vérifier si l'utilisateur peut gérer les ressources
export const canManageResource = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication requise' });
  }

  // Les admins et gestionnaires peuvent tout gérer
  if (['admin', 'gestionnaire'].includes(req.user.role)) {
    return next();
  }

  // Les autres utilisateurs ne peuvent gérer que leurs propres ressources
  const resourceUserId = req.body.user_id || req.params.user_id;
  if (resourceUserId && resourceUserId.toString() !== req.user.id?.toString()) {
    return res.status(403).json({ 
      error: 'Accès refusé',
      message: 'Vous ne pouvez gérer que vos propres ressources'
    });
  }

  next();
};