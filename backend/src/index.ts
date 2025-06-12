import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import sensorRoutes from './routes/sensor.routes';

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);

io.on('connection', (socket) => {
  console.log('Client connecté');
  setInterval(() => {
    const fakeData = {
      temperature: Math.floor(Math.random() * 10) + 20,
      humidity: Math.floor(Math.random() * 50) + 30,
      timestamp: new Date().toISOString(),
    };
    socket.emit('sensorData', fakeData);
  }, 3000);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));