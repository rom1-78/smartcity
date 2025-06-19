// backend/src/index.ts (MISE À JOUR)
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import sensorRoutes from './routes/sensor.routes';
import alertRoutes from './routes/alert.routes';         // NOUVEAU
import reportRoutes from './routes/report.routes';       // NOUVEAU
import suggestionRoutes from './routes/suggestion.routes'; // NOUVEAU

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Routes existantes
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);

// Nouvelles routes
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/suggestions', suggestionRoutes);

// WebSocket pour les données temps réel (amélioré)
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);
  
  // Simulation d'alertes temps réel
  const alertInterval = setInterval(() => {
    // Simuler une alerte occasionnelle
    if (Math.random() > 0.95) { // 5% de chance
      const mockAlert = {
        id: Date.now(),
        type: Math.random() > 0.7 ? 'critical' : 'warning',
        message: 'Nouvelle alerte détectée',
        timestamp: new Date().toISOString(),
        sensor_id: Math.floor(Math.random() * 10) + 1
      };
      socket.emit('newAlert', mockAlert);
    }
  }, 5000);

  // Simulation de nouvelles données de capteurs
  const dataInterval = setInterval(() => {
    const mockSensorData = {
      sensor_id: Math.floor(Math.random() * 10) + 1,
      value: Math.random() * 100,
      unit: 'mock',
      timestamp: new Date().toISOString()
    };
    socket.emit('newSensorData', mockSensorData);
  }, 10000);

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
    clearInterval(alertInterval);
    clearInterval(dataInterval);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
});