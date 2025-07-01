import rateLimit from 'express-rate-limit';

// Rate limiting pour les tentatives de connexion
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives maximum par IP
  message: {
    error: 'Trop de tentatives de connexion',
    message: 'Veuillez réessayer dans 15 minutes'
  },
  standardHeaders: true, // Inclut les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
});

// Rate limiting général pour toute l'API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par IP
  message: {
    error: 'Trop de requêtes',
    message: 'Limite dépassée, réessayez plus tard'
  }
});