// frontend/src/services/sensor.ts - Types corrigés
const API_BASE_URL = 'http://localhost:5000/api';

// Types de base
export interface Sensor {
  id?: number;
  name: string;
  type: 'temperature' | 'air_quality' | 'noise' | 'humidity' | 'traffic' | 'pollution';
  location: string;
  latitude?: number;
  longitude?: number;
  status: 'actif' | 'inactif' | 'maintenance'; // Statut technique du capteur
  installed_at: string;
}

// Type étendu pour les données avec statut fonctionnel
export interface SensorWithData extends Omit<Sensor, 'status'> {
  value?: number;
  unit?: string;
  status: 'actif' | 'inactif' | 'maintenance'; // Statut technique
  functionalStatus?: 'normal' | 'warning' | 'critical'; // Statut fonctionnel basé sur les données
  timestamp?: Date;
}

export interface SensorData {
  id?: number;
  sensor_id: number;
  value: number;
  unit: string;
  timestamp?: string;
}

export interface Alert {
  id?: number;
  sensor_id: number;
  sensor_name?: string;
  location?: string;
  sensor_type?: string;
  alert_type: 'info' | 'warning' | 'critical';
  seuil_value: number;
  current_value: number;
  message: string;
  created_at?: string;
  resolved_at?: string;
}

export interface AlertResponse {
  alerts: Alert[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Services pour les capteurs
export const getSensors = async (): Promise<Sensor[]> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/sensors`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des capteurs');
  }

  return response.json();
};

export const getSensorById = async (id: number): Promise<Sensor> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/sensors/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du capteur');
  }

  return response.json();
};

export const createSensor = async (sensor: Omit<Sensor, 'id'>): Promise<Sensor> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/sensors`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sensor)
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la création du capteur');
  }

  const result = await response.json();
  return result.sensor || result;
};

export const updateSensor = async (id: number, sensor: Partial<Sensor>): Promise<Sensor> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/sensors/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sensor)
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour du capteur');
  }

  const result = await response.json();
  return result.sensor || result;
};

export const deleteSensor = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/sensors/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la suppression du capteur');
  }
};

// Services pour les données de capteurs
export const getSensorData = async (sensorId: number, options?: {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}): Promise<SensorData[]> => {
  const token = localStorage.getItem('token');
  const queryParams = new URLSearchParams();
  
  if (options?.limit) queryParams.append('limit', options.limit.toString());
  if (options?.offset) queryParams.append('offset', options.offset.toString());
  if (options?.start_date) queryParams.append('start_date', options.start_date);
  if (options?.end_date) queryParams.append('end_date', options.end_date);

  const response = await fetch(`${API_BASE_URL}/sensors/${sensorId}/data?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données');
  }

  const result = await response.json();
  return result.data || result;
};

export const addSensorData = async (data: Omit<SensorData, 'id' | 'timestamp'>): Promise<SensorData> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/sensor-data`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Erreur lors de l\'ajout des données');
  }

  const result = await response.json();
  return result.data || result;
};

// Services pour les alertes
export const getAlerts = async (options?: {
  limit?: number;
  offset?: number;
  type?: string;
  resolved?: boolean;
}): Promise<AlertResponse> => {
  const token = localStorage.getItem('token');
  const queryParams = new URLSearchParams();
  
  if (options?.limit) queryParams.append('limit', options.limit.toString());
  if (options?.offset) queryParams.append('offset', options.offset.toString());
  if (options?.type) queryParams.append('type', options.type);
  if (options?.resolved !== undefined) queryParams.append('resolved', options.resolved.toString());

  const response = await fetch(`${API_BASE_URL}/alerts?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des alertes');
  }

  return response.json();
};

export const createAlert = async (alert: Omit<Alert, 'id' | 'created_at'>): Promise<Alert> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/alerts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(alert)
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la création de l\'alerte');
  }

  const result = await response.json();
  return result.alert || result;
};

export const resolveAlert = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/alerts/${id}/resolve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la résolution de l\'alerte');
  }
};

// Service pour les statistiques
export const getSensorStatistics = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/sensors/statistics`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des statistiques');
  }

  return response.json();
};

// Fonction utilitaire pour déterminer le statut fonctionnel
export const getFunctionalStatus = (sensorType: string, value: number): 'normal' | 'warning' | 'critical' => {
  const thresholds: Record<string, { warning: number; critical: number }> = {
    temperature: { warning: 25, critical: 30 },
    air_quality: { warning: 100, critical: 150 },
    noise: { warning: 60, critical: 70 },
    humidity: { warning: 80, critical: 85 },
    traffic: { warning: 300, critical: 400 },
    pollution: { warning: 80, critical: 120 }
  };

  const threshold = thresholds[sensorType];
  if (!threshold) return 'normal';

  if (value >= threshold.critical) return 'critical';
  if (value >= threshold.warning) return 'warning';
  return 'normal';
};