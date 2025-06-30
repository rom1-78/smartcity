// backend/src/index.ts (VERSION CORRIGÉE)
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes existantes
import authRoutes from './routes/auth.routes';
import sensorRoutes from './routes/sensor.routes';

// Nouvelles routes
import alertRoutes from './routes/alert.routes';
import suggestionRoutes from './routes/suggestion.routes';
import sensorDataRoutes from './routes/sensorData.routes';  // NOUVEAU
import adminRoutes from './routes/admin.routes';            // NOUVEAU

// Services
import dataSimulator from './services/dataSimulator';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes existantes
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);

// Nouvelles routes
app.use('/api/alerts', alertRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/sensor-data', sensorDataRoutes);  // NOUVEAU
app.use('/api/admin', adminRoutes);              // NOUVEAU

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      'Stockage données capteurs en BDD',
      'Système d\'alertes complet',
      'Suggestions citoyens',
      'Gestion utilisateurs admin',
      'API temps réel'
    ]
  });
});

// WebSocket pour les données temps réel (amélioré)
io.on('connection', (socket) => {
  console.log(' Client connecté:', socket.id);

  // Simulation d'alertes temps réel
  const alertInterval = setInterval(() => {
    // Simuler une alerte occasionnelle
    if (Math.random() > 0.95) { // 5% de chance
      const alertTypes = ['info', 'warning', 'critical'];
      const messages = [
        'Niveau de pollution élevé détecté',
        'Température anormale mesurée',
        'Niveau sonore dépassé',
        'Qualité de l\'air dégradée'
      ];

      const mockAlert = {
        id: Date.now(),
        alert_type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        created_at: new Date().toISOString(),
        sensor_id: Math.floor(Math.random() * 10) + 1,
        current_value: Math.random() * 100,
        seuil_value: 75
      };

      socket.emit('newAlert', mockAlert);
      console.log(' Alerte envoyée:', mockAlert.alert_type);
    }
  }, 10000); // Toutes les 10 secondes

  // Simulation de nouvelles données de capteurs
  const dataInterval = setInterval(() => {
    const sensorTypes = ['temperature', 'air_quality', 'noise', 'humidity', 'traffic'];
    const units = { temperature: '°C', air_quality: 'µg/m³', noise: 'dB', humidity: '%', traffic: 'véh/h' };

    const sensorType = sensorTypes[Math.floor(Math.random() * sensorTypes.length)];

    const mockSensorData = {
      sensor_id: Math.floor(Math.random() * 10) + 1,
      value: Math.random() * 100,
      unit: units[sensorType as keyof typeof units],
      timestamp: new Date().toISOString(),
      type: sensorType
    };

    socket.emit('newSensorData', mockSensorData);
  }, 15000); // Toutes les 15 secondes

  // Simulation de nouvelles suggestions
  const suggestionInterval = setInterval(() => {
    if (Math.random() > 0.98) { // 2% de chance
      const mockSuggestion = {
        id: Date.now(),
        title: 'Nouvelle suggestion citoyenne',
        message: 'Un citoyen a proposé une amélioration',
        category: 'new_feature',
        priority: 'medium',
        created_at: new Date().toISOString()
      };

      socket.emit('newSuggestion', mockSuggestion);
      console.log(' Nouvelle suggestion simulée');
    }
  }, 20000); // Toutes les 20 secondes

  // Nettoyage à la déconnexion
  socket.on('disconnect', () => {
    console.log(' Client déconnecté:', socket.id);
    clearInterval(alertInterval);
    clearInterval(dataInterval);
    clearInterval(suggestionInterval);
  });
});

const PORT = process.env.PORT || 5000;

// Démarrage du serveur
server.listen(PORT, async () => {
  console.log('=================================');
  console.log(` Serveur Smart City IoT démarré !`);
  console.log(` Port: ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log('=================================');

  // Démarrer la simulation de données IoT
  console.log(' Démarrage de la simulation des données IoT...');
  try {
    //await dataSimulator.startSimulation();
    console.log(' Serveur démarré sans simulation pour le moment');

    console.log(' Simulation de données démarrée avec succès');
  } catch (error) {
    console.error(' Erreur démarrage simulation:', error);
  }
});

export default app;