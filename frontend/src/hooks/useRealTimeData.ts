import { useState, useEffect, useRef } from 'react';
import { getSensors, getSensorData, getAlerts, RealSensor, RealSensorData, RealAlert } from '../services/sensor';

export interface ProcessedSensorData {
  id: string;
  sensor_id: number;
  type: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  location: string;
  timestamp: Date;
  sensor_name: string;
}

export interface ProcessedAlert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  location: string;
  sensor_name: string;
}

export const useRealTimeData = (refreshInterval = 30000) => {
  const [sensors, setSensors] = useState<RealSensor[]>([]);
  const [sensorData, setSensorData] = useState<ProcessedSensorData[]>([]);
  const [alerts, setAlerts] = useState<ProcessedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour déterminer le statut basé sur le type et la valeur
  const determineStatus = (type: string, value: number): 'normal' | 'warning' | 'critical' => {
    switch (type) {
      case 'air_quality':
        if (value > 150) return 'critical';
        if (value > 100) return 'warning';
        return 'normal';
      
      case 'noise':
        if (value > 75) return 'critical';
        if (value > 65) return 'warning';
        return 'normal';
      
      case 'temperature':
        if (value < 10 || value > 35) return 'critical';
        if (value < 15 || value > 30) return 'warning';
        return 'normal';
      
      case 'humidity':
        if (value < 30 || value > 80) return 'warning';
        return 'normal';
      
      case 'traffic':
        if (value > 300) return 'critical';
        if (value > 200) return 'warning';
        return 'normal';
      
      case 'pollution':
        if (value > 0.08) return 'critical';
        if (value > 0.05) return 'warning';
        return 'normal';
      
      default:
        return 'normal';
    }
  };

  // Fonction pour charger toutes les données
  const loadData = async () => {
    try {
      setError(null);
      
      // Charger les capteurs
      const sensorsData = await getSensors();
      setSensors(sensorsData);

      // Charger les données récentes de chaque capteur
      const allSensorData: ProcessedSensorData[] = [];
      
      for (const sensor of sensorsData) {
        try {
          const { data } = await getSensorData(sensor.id, { limit: 1 }); // Dernière mesure
          
          if (data && data.length > 0) {
            const latestData = data[0];
            const status = determineStatus(sensor.type, latestData.value);
            
            allSensorData.push({
              id: `${sensor.id}-${latestData.id}`,
              sensor_id: sensor.id,
              type: sensor.type,
              value: latestData.value,
              unit: latestData.unit,
              status,
              location: sensor.location,
              timestamp: new Date(latestData.timestamp),
              sensor_name: sensor.name
            });
          }
        } catch (sensorError) {
          console.warn(`Erreur pour le capteur ${sensor.id}:`, sensorError);
        }
      }

      setSensorData(allSensorData);

      // Charger les alertes actives
      const alertsData = await getAlerts({ limit: 10, resolved: false });
      const processedAlerts: ProcessedAlert[] = alertsData.map(alert => {
        const sensor = sensorsData.find(s => s.id === alert.sensor_id);
        return {
          id: alert.id.toString(),
          type: alert.alert_type,
          message: alert.message,
          timestamp: new Date(alert.created_at),
          location: sensor?.location || 'Lieu inconnu',
          sensor_name: sensor?.name || 'Capteur inconnu'
        };
      });

      setAlerts(processedAlerts);
      setLastUpdate(new Date());
      setLoading(false);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setLoading(false);
    }
  };

  // Fonction pour démarrer le rafraîchissement automatique
  const startRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(loadData, refreshInterval);
  };

  // Fonction pour arrêter le rafraîchissement
  const stopRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Initialisation et nettoyage
  useEffect(() => {
    loadData();
    startRefresh();

    return () => {
      stopRefresh();
    };
  }, [refreshInterval]);

  // Fonction pour forcer un rafraîchissement manuel
  const refresh = () => {
    setLoading(true);
    loadData();
  };

  return {
    sensors,
    sensorData,
    alerts,
    loading,
    error,
    lastUpdate,
    refresh,
    startRefresh,
    stopRefresh
  };
};