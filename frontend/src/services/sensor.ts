import axios from 'axios';
import { getToken } from './auth';

const API_BASE_URL = 'http://localhost:5000/api';

// Interface pour les capteurs (correspond à votre usage dans SensorCRUDModal)
export interface Sensor {
  id?: number;
  name: string;
  type: 'temperature' | 'air_quality' | 'noise' | 'humidity' | 'traffic' | 'pollution';
  location: string;
  latitude?: number;
  longitude?: number;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
}

export interface SensorRequest {
  name: string;
  type: string;
  location: string;
  latitude?: number;
  longitude?: number;
  status: string;
  installed_at: string;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour l'auth
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth?mode=login';
    }
    return Promise.reject(error);
  }
);

export const getSensors = async (): Promise<Sensor[]> => {
  try {
    const response = await apiClient.get('/sensors');
    // Gérer les différents formats de réponse
    if (response.data.sensors) {
      return response.data.sensors;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des capteurs:', error);
    throw error;
  }
};

export const createSensor = async (sensorData: SensorRequest): Promise<Sensor> => {
  try {
    const response = await apiClient.post('/sensors', sensorData);
    return response.data.sensor || response.data;
  } catch (error) {
    console.error('Erreur lors de la création du capteur:', error);
    throw error;
  }
};

export const updateSensor = async (id: number, sensorData: SensorRequest): Promise<Sensor> => {
  try {
    const response = await apiClient.put(`/sensors/${id}`, sensorData);
    return response.data.sensor || response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du capteur:', error);
    throw error;
  }
};

export const deleteSensor = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/sensors/${id}`);
  } catch (error) {
    console.error('Erreur lors de la suppression du capteur:', error);
    throw error;
  }
};