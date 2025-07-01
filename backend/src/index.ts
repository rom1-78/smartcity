// backend/src/index.ts - VERSION COMPLÈTE ET SÉCURISÉE
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Routes existantes
import authRoutes from './routes/auth.routes';
import sensorRoutes from './routes/sensor.routes';

// Nouvelles routes
import alertRoutes from './routes/alert.routes';
import suggestionRoutes from './routes/suggestion.routes';
import sensorDataRoutes from './routes/sensorData.routes';
import adminRoutes from './routes/admin.routes';

// Services
import dataSimulator from './services/dataSimulator';

dotenv.config();

const app = express();
const server = http.createServer(app);

// ============================================
//  SÉCURITÉ AVEC HELMET.JS
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws://localhost:5000", "wss://localhost:5000"]
    }
  },
  crossOriginEmbedderPolicy: false, // Pour Socket.IO
}));

// ============================================
//  RATE LIMITING
// ============================================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requêtes par IP
  message: {
    error: 'Trop de requêtes',
    message: 'Limite de 100 requêtes par 15 minutes dépassée'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 tentatives de connexion
  message: {
    error: 'Trop de tentatives de connexion',
    message: 'Limite de 10 tentatives par 15 minutes dépassée'
  },
  skipSuccessfulRequests: true, // Ne compte pas les connexions réussies
});

// Appliquer le rate limiting
app.use(generalLimiter);
app.use('/api/auth', authLimiter);

// ============================================
//  CORS ET MIDDLEWARE
// ============================================
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-domain.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ============================================
//  ROUTES API
// ============================================
// Routes existantes
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);

// Nouvelles routes
app.use('/api/alerts', alertRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/sensor-data', sensorDataRoutes);
app.use('/api/admin', adminRoutes);

// Route de santé améliorée
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: [
      'Authentification JWT sécurisée',
      'WebSocket authentifié',
      'Rate limiting anti-DDoS',
      'Headers sécurisés Helmet.js',
      'Stockage données capteurs en BDD',
      'Système d\'alertes temps réel',
      'Suggestions citoyens',
      'Gestion utilisateurs admin',
      'API RESTful complète'
    ],
    security: {
      helmet: 'active',
      rateLimit: 'active',
      jwt: 'active',
      websocketAuth: 'active'
    }
  });
});

// ============================================
// 📡 WEBSOCKET SÉCURISÉ
// ============================================
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://your-domain.com']
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  }
});

//  Middleware d'authentification pour WebSocket
io.use((socket: any, next: any) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.log(' WebSocket: Token manquant');
    return next(new Error('Token d\'authentification requis'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    socket.data.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      first_name: decoded.first_name,
      last_name: decoded.last_name
    };
    console.log(` WebSocket: Utilisateur ${decoded.email} (${decoded.role}) connecté`);
    next();
  } catch (error) {
    console.log(' WebSocket: Token invalide');
    return next(new Error('Token d\'authentification invalide'));
  }
});

// ============================================
//  GESTION DES CONNEXIONS WEBSOCKET
// ============================================
interface UserSocket {
  socket: any;
  user: {
    id: number;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  };
  lastActivity: Date;
}

const connectedUsers = new Map<string, UserSocket>();

io.on('connection', (socket) => {
  const user = socket.data.user;
  const userKey = `${user.id}_${socket.id}`;

  // Stocker la connexion utilisateur
  connectedUsers.set(userKey, {
    socket,
    user,
    lastActivity: new Date()
  });

  console.log(`🔌 WebSocket connecté: ${user.first_name} ${user.last_name} (${user.role}) - Total: ${connectedUsers.size} utilisateurs`);

  // ============================================
  //  REJOINDRE DES ROOMS SELON LE RÔLE
  // ============================================
  socket.join(`role_${user.role}`);
  if (user.role === 'manager' || user.role === 'admin') {
    socket.join('privileged_users');
  }

  // Notification de connexion aux autres utilisateurs du même rôle
  socket.broadcast.to(`role_${user.role}`).emit('userConnected', {
    userId: user.id,
    name: `${user.first_name} ${user.last_name}`,
    role: user.role,
    timestamp: new Date().toISOString()
  });

  // ============================================
  //  SIMULATION D'ALERTES TEMPS RÉEL
  // ============================================
  const alertInterval = setInterval(() => {
    // Mettre à jour l'activité
    const userConnection = connectedUsers.get(userKey);
    if (userConnection) {
      userConnection.lastActivity = new Date();
    }

    // Simuler des alertes selon le rôle et la probabilité
    if (Math.random() > 0.95) { // 5% de chance
      const alertTypes = ['info', 'warning', 'critical'];
      const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];

      const alertMessages = {
        info: [
          'Nouveau capteur installé en Zone Sud',
          'Maintenance programmée terminée',
          'Calibration automatique effectuée',
          'Rapport mensuel généré'
        ],
        warning: [
          'Niveau de pollution modérément élevé détecté',
          'Température anormale mesurée',
          'Niveau sonore légèrement dépassé',
          'Capteur nécessite une calibration'
        ],
        critical: [
          'Seuil critique de pollution dépassé !',
          'Panne capteur détectée - intervention requise',
          'Alerte qualité air - mesures d\'urgence',
          'Dysfonctionnement système de ventilation'
        ]
      };

      const messages = alertMessages[randomType as keyof typeof alertMessages];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      const mockAlert = {
        id: Date.now(),
        alert_type: randomType,
        message: randomMessage,
        created_at: new Date().toISOString(),
        sensor_id: Math.floor(Math.random() * 10) + 1,
        current_value: Math.random() * 100,
        seuil_value: randomType === 'critical' ? 80 : randomType === 'warning' ? 60 : 40,
        location: `Zone ${Math.floor(Math.random() * 5) + 1}`,
        priority: randomType === 'critical' ? 'high' : randomType === 'warning' ? 'medium' : 'low'
      };

      // 🔐 Filtrage selon le rôle
      let shouldSendAlert = true;

      if (user.role === 'citizen') {
        // Les citoyens ne reçoivent que les alertes publiques (info et warning)
        if (randomType === 'critical') {
          shouldSendAlert = false;
        }
        // Modifier le message pour les citoyens
        if (shouldSendAlert) {
          mockAlert.message = randomType === 'warning'
            ? 'Attention: Qualité de l\'air dégradée dans votre secteur'
            : 'Information: Nouveau capteur disponible dans votre quartier';
        }
      }

      if (shouldSendAlert) {
        socket.emit('newAlert', mockAlert);
        console.log(` Alerte ${randomType} envoyée à ${user.first_name}: ${mockAlert.message.substring(0, 50)}...`);
      }
    }
  }, 8000); // Toutes les 8 secondes

  // ============================================
  //  SIMULATION DE DONNÉES CAPTEURS
  // ============================================
  const dataInterval = setInterval(() => {
    // Vérifier si l'utilisateur est toujours actif
    const userConnection = connectedUsers.get(userKey);
    if (!userConnection) {
      clearInterval(dataInterval);
      return;
    }

    const sensorTypes = ['air_quality', 'temperature', 'humidity', 'noise', 'traffic'];
    const randomSensorType = sensorTypes[Math.floor(Math.random() * sensorTypes.length)];

    // Générer des valeurs réalistes selon le type de capteur
    const generateRealisticValue = (type: string) => {
      switch (type) {
        case 'air_quality': return Math.random() * 100; // μg/m³
        case 'temperature': return 15 + Math.random() * 20; // 15-35°C
        case 'humidity': return 30 + Math.random() * 40; // 30-70%
        case 'noise': return 40 + Math.random() * 40; // 40-80 dB
        case 'traffic': return Math.random() * 200; // véhicules/heure
        default: return Math.random() * 100;
      }
    };

    const mockSensorData = {
      sensor_id: Math.floor(Math.random() * 10) + 1,
      type: randomSensorType,
      value: parseFloat(generateRealisticValue(randomSensorType).toFixed(2)),
      unit: getUnitForSensorType(randomSensorType),
      timestamp: new Date().toISOString(),
      location: `Zone ${Math.floor(Math.random() * 5) + 1}`,
      quality_index: Math.floor(Math.random() * 5) + 1, // 1-5
      sensor_status: Math.random() > 0.1 ? 'active' : 'maintenance' // 90% actif
    };

    //  Filtrage des données selon le rôle
    if (user.role === 'citizen' && !isPublicSensor(mockSensorData.sensor_id)) {
      // Les citoyens n'ont accès qu'aux capteurs publics
      return;
    }

    socket.emit('newSensorData', mockSensorData);
  }, 12000); // Toutes les 12 secondes

  // ============================================
  //  SIMULATION DE NOUVELLES SUGGESTIONS
  // ============================================
  const suggestionInterval = setInterval(() => {
    if (Math.random() > 0.98 && (user.role === 'admin' || user.role === 'manager')) { // 2% de chance, uniquement pour admin/manager
      const suggestionTitles = [
        'Nouveau capteur proposé pour le parc central',
        'Amélioration du système d\'alerte',
        'Optimisation des seuils de pollution',
        'Installation de panneaux d\'information',
        'Extension du réseau de capteurs'
      ];

      const mockSuggestion = {
        id: Date.now(),
        title: suggestionTitles[Math.floor(Math.random() * suggestionTitles.length)],
        message: 'Un citoyen a proposé une amélioration du système',
        category: ['new_feature', 'improvement', 'location', 'maintenance'][Math.floor(Math.random() * 4)],
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        created_at: new Date().toISOString(),
        user_name: 'Citoyen anonyme'
      };

      socket.emit('newSuggestion', mockSuggestion);
      console.log(` Nouvelle suggestion envoyée à ${user.first_name}: ${mockSuggestion.title}`);
    }
  }, 20000); // Toutes les 20 secondes

  // ============================================
  //  GESTION DES ÉVÉNEMENTS PERSONNALISÉS
  // ============================================

  // Événement pour demander des données spécifiques
  socket.on('requestSensorData', (sensorId: number) => {
    if (user.role === 'citizen' && !isPublicSensor(sensorId)) {
      socket.emit('error', {
        message: 'Accès refusé à ce capteur',
        code: 'ACCESS_DENIED',
        sensorId
      });
      return;
    }

    // Simuler des données du capteur demandé
    const sensorTypes = ['air_quality', 'temperature', 'humidity', 'noise', 'traffic'];
    const randomType = sensorTypes[Math.floor(Math.random() * sensorTypes.length)];

    const mockData = {
      sensor_id: sensorId,
      type: randomType,
      value: Math.random() * 100,
      unit: getUnitForSensorType(randomType),
      timestamp: new Date().toISOString(),
      location: `Zone ${Math.floor(Math.random() * 5) + 1}`,
      historical_data: generateHistoricalData(randomType, 24) // 24h de données
    };

    socket.emit('sensorDataResponse', mockData);
    console.log(` Données capteur ${sensorId} envoyées à ${user.first_name}`);
  });

  // Événement pour les notifications de statut
  socket.on('updateStatus', (status: string) => {
    console.log(`👤 ${user.first_name} ${user.last_name} status: ${status}`);
    socket.broadcast.to(`role_${user.role}`).emit('userStatusUpdate', {
      userId: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      status,
      timestamp: new Date().toISOString()
    });
  });

  // Événement pour rejoindre une room spécifique (par zone géographique)
  socket.on('joinZone', (zoneId: string) => {
    socket.join(`zone_${zoneId}`);
    console.log(` ${user.first_name} a rejoint la zone ${zoneId}`);

    socket.emit('zoneJoined', {
      zoneId,
      message: `Vous recevrez maintenant les alertes de la zone ${zoneId}`
    });
  });

  // ============================================
  //  GESTION DE LA DÉCONNEXION
  // ============================================
  socket.on('disconnect', (reason) => {
    console.log(`🔌 WebSocket déconnecté: ${user.first_name} ${user.last_name} - Raison: ${reason}`);

    // Nettoyer les intervalles
    clearInterval(alertInterval);
    clearInterval(dataInterval);
    clearInterval(suggestionInterval);

    // Supprimer de la liste des utilisateurs connectés
    connectedUsers.delete(userKey);

    // Notifier les autres utilisateurs du même rôle
    socket.broadcast.to(`role_${user.role}`).emit('userDisconnected', {
      userId: user.id,
      name: `${user.first_name} ${user.last_name}`,
      timestamp: new Date().toISOString()
    });

    console.log(` Utilisateurs restants: ${connectedUsers.size}`);
  });

  // Gérer les erreurs WebSocket
  socket.on('error', (error) => {
    console.error(` Erreur WebSocket pour ${user.first_name} ${user.last_name}:`, error);
  });
});

// ============================================
//  FONCTIONS UTILITAIRES
// ============================================
function getUnitForSensorType(type: string): string {
  const units: { [key: string]: string } = {
    'air_quality': 'μg/m³',
    'temperature': '°C',
    'humidity': '%',
    'noise': 'dB',
    'traffic': 'véh/h'
  };
  return units[type] || 'unité';
}

function isPublicSensor(sensorId: number): boolean {
  // Les capteurs 1-5 sont publics, 6-10 sont réservés aux gestionnaires
  return sensorId <= 5;
}

function generateHistoricalData(sensorType: string, hours: number) {
  const data = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    data.push({
      timestamp: timestamp.toISOString(),
      value: Math.random() * 100,
      unit: getUnitForSensorType(sensorType)
    });
  }

  return data;
}

// ============================================
//  NETTOYAGE PÉRIODIQUE DES CONNEXIONS INACTIVES
// ============================================
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

  connectedUsers.forEach((userConnection, key) => {
    const inactiveTime = now.getTime() - userConnection.lastActivity.getTime();

    if (inactiveTime > inactiveThreshold) {
      console.log(` Déconnexion utilisateur inactif: ${userConnection.user.first_name} ${userConnection.user.last_name}`);
      userConnection.socket.disconnect(true);
      connectedUsers.delete(key);
    }
  });

  // Log des statistiques de connexion
  if (connectedUsers.size > 0) {
    const roleStats = Array.from(connectedUsers.values()).reduce((acc, user) => {
      acc[user.user.role] = (acc[user.user.role] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    console.log(` Utilisateurs connectés: ${connectedUsers.size} | Répartition: ${JSON.stringify(roleStats)}`);
  }
}, 10 * 60 * 1000); // Vérification toutes les 10 minutes

// ============================================
//  DÉMARRAGE DU SERVEUR
// ============================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log('==========================================');
  console.log(` Serveur Smart City IoT démarré !`);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log('==========================================');
  console.log(' Sécurité activée:');
  console.log('    Helmet.js - Headers sécurisés');
  console.log('    Rate Limiting - Protection DDoS');
  console.log('    JWT Authentication - API & WebSocket');
  console.log('    CORS configuré');
  console.log('==========================================');
  console.log(' Fonctionnalités disponibles:');
  console.log('    API RESTful complète');
  console.log('    WebSocket temps réel sécurisé');
  console.log('    Gestion multi-utilisateurs');
  console.log('    Système d\'alertes intelligent');
  console.log('    Stockage données en base');
  console.log('    Suggestions citoyens');
  console.log('==========================================');

  // Démarrer la simulation de données IoT
  console.log(' Démarrage de la simulation des données IoT...');
  try {
    // await dataSimulator.startSimulation();
    console.log('ℹ  Simulation désactivée pour le moment (pour tests)');
    console.log(' Serveur prêt à recevoir les connexions');
  } catch (error) {
    console.error(' Erreur démarrage simulation:', error);
  }
});

export default app;