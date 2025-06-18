import React, { useState, useEffect } from 'react';
import { MapPin, Thermometer, Wind, Volume2, Car, Activity, AlertTriangle, CheckCircle, Zap, RefreshCw, Eye, Settings } from 'lucide-react';

// Types basés sur votre structure de BDD
interface Sensor {
  id: number;
  name: string;
  type: 'air_quality' | 'noise' | 'temperature' | 'humidity' | 'traffic' | 'pollution';
  location: string;
  latitude: number;
  longitude: number;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  firmware_version?: string;
}

interface SensorData {
  id: number;
  sensor_id: number;
  value: number;
  unit: string;
  timestamp: string;
}

interface Alert {
  id: number;
  sensor_id: number;
  alert_type: 'info' | 'warning' | 'critical';
  threshold_value: number;
  current_value: number;
  message: string;
  created_at: string;
  resolved_at?: string;
}

// Fonction pour obtenir l'icône selon le type de capteur
const getSensorIcon = (type: string) => {
  switch (type) {
    case 'air_quality':
      return <Wind className="h-5 w-5" />;
    case 'temperature':
      return <Thermometer className="h-5 w-5" />;
    case 'noise':
      return <Volume2 className="h-5 w-5" />;
    case 'traffic':
      return <Car className="h-5 w-5" />;
    case 'humidity':
      return <Activity className="h-5 w-5" />;
    case 'pollution':
      return <Zap className="h-5 w-5" />;
    default:
      return <MapPin className="h-5 w-5" />;
  }
};

// Fonction pour obtenir la couleur selon le statut
const getStatusColor = (status: string) => {
  switch (status) {
    case 'actif':
      return 'bg-green-500 border-green-600';
    case 'inactif':
      return 'bg-red-500 border-red-600';
    case 'maintenance':
      return 'bg-yellow-500 border-yellow-600';
    default:
      return 'bg-gray-500 border-gray-600';
  }
};

// Fonction pour formater le type de capteur
const formatSensorType = (type: string) => {
  const types: { [key: string]: string } = {
    'air_quality': 'Qualité de l\'air',
    'temperature': 'Température',
    'noise': 'Niveau sonore',
    'traffic': 'Circulation',
    'humidity': 'Humidité',
    'pollution': 'Pollution'
  };
  return types[type] || type;
};

// Fonction pour obtenir la couleur de la valeur selon le type et la valeur
const getValueColor = (type: string, value: number) => {
  switch (type) {
    case 'air_quality':
      if (value > 50) return 'text-red-600';
      if (value > 25) return 'text-yellow-600';
      return 'text-green-600';
    case 'noise':
      if (value > 70) return 'text-red-600';
      if (value > 55) return 'text-yellow-600';
      return 'text-green-600';
    case 'temperature':
      if (value > 30 || value < 5) return 'text-red-600';
      if (value > 25 || value < 10) return 'text-yellow-600';
      return 'text-green-600';
    case 'traffic':
      if (value > 300) return 'text-red-600';
      if (value > 200) return 'text-yellow-600';
      return 'text-green-600';
    case 'pollution':
      if (value > 0.08) return 'text-red-600';
      if (value > 0.05) return 'text-yellow-600';
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

const RealSensorsMap: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorData, setSensorData] = useState<{ [key: number]: SensorData }>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Configuration de la carte centrée sur Paris (TechCity)
  const mapConfig = {
    center: { lat: 48.8566, lng: 2.3522 },
    zoom: 13
  };

  // Fonction pour récupérer les capteurs depuis votre API
  const fetchSensors = async () => {
    try {
      // Remplacez par votre vraie URL d'API
      const response = await fetch('/api/sensors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const sensorsData = await response.json();
        setSensors(sensorsData);
        
        // Récupérer les dernières données pour chaque capteur
        for (const sensor of sensorsData) {
          await fetchSensorData(sensor.id);
        }
      } else {
        // Données de fallback basées sur votre seed.sql
        loadFallbackData();
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des capteurs:', error);
      loadFallbackData();
    }
  };

  // Fonction pour récupérer les données d'un capteur
  const fetchSensorData = async (sensorId: number) => {
    try {
      const response = await fetch(`/api/sensors/${sensorId}/data/latest`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSensorData(prev => ({
          ...prev,
          [sensorId]: data
        }));
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des données du capteur ${sensorId}:`, error);
    }
  };

  // Fonction pour récupérer les alertes actives
  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const alertsData = await response.json();
        setAlerts(alertsData.filter((alert: Alert) => !alert.resolved_at));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
    }
  };

  // Données de fallback basées sur votre seed.sql
  const loadFallbackData = () => {
    const fallbackSensors: Sensor[] = [
      {
        id: 1,
        name: 'Air-Centre-001',
        type: 'air_quality',
        location: 'Place de la République',
        latitude: 48.8566,
        longitude: 2.3522,
        status: 'actif',
        installed_at: '2024-01-15'
      },
      {
        id: 2,
        name: 'Air-Nord-002',
        type: 'air_quality',
        location: 'Avenue du Général de Gaulle',
        latitude: 48.8680,
        longitude: 2.3420,
        status: 'actif',
        installed_at: '2024-01-20'
      },
      {
        id: 3,
        name: 'Air-Sud-003',
        type: 'air_quality',
        location: 'Zone Industrielle Sud',
        latitude: 48.8420,
        longitude: 2.3650,
        status: 'maintenance',
        installed_at: '2024-01-25'
      },
      {
        id: 6,
        name: 'Bruit-Centre-001',
        type: 'noise',
        location: 'Place de la République',
        latitude: 48.8566,
        longitude: 2.3522,
        status: 'actif',
        installed_at: '2024-01-15'
      },
      {
        id: 7,
        name: 'Bruit-Ecole-002',
        type: 'noise',
        location: 'École Primaire Nord',
        latitude: 48.8650,
        longitude: 2.3450,
        status: 'actif',
        installed_at: '2024-01-22'
      },
      {
        id: 11,
        name: 'Temp-Centre-001',
        type: 'temperature',
        location: 'Hôtel de Ville',
        latitude: 48.8566,
        longitude: 2.3522,
        status: 'actif',
        installed_at: '2024-01-15'
      },
      {
        id: 15,
        name: 'Humid-Parc-001',
        type: 'humidity',
        location: 'Parc des Sports',
        latitude: 48.8630,
        longitude: 2.3720,
        status: 'actif',
        installed_at: '2024-01-20'
      },
      {
        id: 18,
        name: 'Traffic-A1-001',
        type: 'traffic',
        location: 'Avenue Principale',
        latitude: 48.8550,
        longitude: 2.3500,
        status: 'actif',
        installed_at: '2024-02-05'
      },
      {
        id: 22,
        name: 'Pollution-Usine-001',
        type: 'pollution',
        location: 'Zone Industrielle Nord',
        latitude: 48.8720,
        longitude: 2.3300,
        status: 'actif',
        installed_at: '2024-02-10'
      }
    ];

    const fallbackData: { [key: number]: SensorData } = {
      1: { id: 1, sensor_id: 1, value: 41.5, unit: 'µg/m³', timestamp: new Date().toISOString() },
      2: { id: 2, sensor_id: 2, value: 39.6, unit: 'µg/m³', timestamp: new Date().toISOString() },
      6: { id: 6, sensor_id: 6, value: 68.7, unit: 'dB', timestamp: new Date().toISOString() },
      7: { id: 7, sensor_id: 7, value: 52.6, unit: 'dB', timestamp: new Date().toISOString() },
      11: { id: 11, sensor_id: 11, value: 23.1, unit: '°C', timestamp: new Date().toISOString() },
      15: { id: 15, sensor_id: 15, value: 58.4, unit: '%', timestamp: new Date().toISOString() },
      18: { id: 18, sensor_id: 18, value: 245, unit: 'véh/h', timestamp: new Date().toISOString() },
      22: { id: 22, sensor_id: 22, value: 0.061, unit: 'ppm', timestamp: new Date().toISOString() }
    };

    setSensors(fallbackSensors);
    setSensorData(fallbackData);
  };

  // Effet pour charger les données au montage
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSensors(),
      fetchAlerts()
    ]).finally(() => {
      setLoading(false);
      setLastUpdate(new Date());
    });
  }, []);

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSensors(),
      fetchAlerts()
    ]);
    setLoading(false);
    setLastUpdate(new Date());
  };

  // Fonction pour convertir les coordonnées GPS en position pixel
  const getMapPosition = (sensor: Sensor) => {
    // Conversion des coordonnées GPS en position pixel sur une carte de 800x600
    const mapWidth = 800;
    const mapHeight = 600;
    
    // Bornes de TechCity (basées sur vos données)
    const bounds = {
      north: 48.872,
      south: 48.842,
      east: 2.385,
      west: 2.320
    };
    
    const x = ((sensor.longitude - bounds.west) / (bounds.east - bounds.west)) * mapWidth;
    const y = ((bounds.north - sensor.latitude) / (bounds.north - bounds.south)) * mapHeight;
    
    return { 
      x: Math.max(50, Math.min(mapWidth - 50, x)), 
      y: Math.max(50, Math.min(mapHeight - 50, y)) 
    };
  };

  // Calculer les statistiques
  const stats = {
    total: sensors.length,
    actif: sensors.filter(s => s.status === 'actif').length,
    maintenance: sensors.filter(s => s.status === 'maintenance').length,
    inactif: sensors.filter(s => s.status === 'inactif').length,
    alertes: alerts.length
  };

  if (loading && sensors.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la carte des capteurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques et contrôles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-500" />
            Carte des Capteurs IoT - TechCity
          </h3>
          <div className="flex items-center space-x-3">
            {/* Boutons de vue */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'map' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Carte
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'list' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Liste
              </button>
            </div>
            
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
            <span className="text-xs text-gray-500">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          </div>
        </div>
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.actif}</div>
            <div className="text-sm text-gray-500">Actifs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
            <div className="text-sm text-gray-500">Maintenance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.inactif}</div>
            <div className="text-sm text-gray-500">Inactifs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.alertes}</div>
            <div className="text-sm text-gray-500">Alertes</div>
          </div>
        </div>
      </div>

      {/* Vue carte ou liste */}
      <div className="flex space-x-6">
        {/* Zone principale */}
        <div className="flex-1">
          {viewMode === 'map' ? (
            /* Vue carte */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div 
                className="w-full h-[600px] bg-gradient-to-br from-green-50 via-blue-50 to-gray-100 relative overflow-hidden rounded-xl"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                    linear-gradient(45deg, rgba(156, 163, 175, 0.05) 25%, transparent 25%), 
                    linear-gradient(-45deg, rgba(156, 163, 175, 0.05) 25%, transparent 25%)
                  `,
                  backgroundSize: '400px 400px, 300px 300px, 20px 20px, 20px 20px'
                }}
              >
                {/* Grille de fond */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(15)].map((_, i) => (
                    <div key={`h-${i}`} className="absolute w-full border-t border-gray-400" style={{ top: `${i * 6.67}%` }} />
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <div key={`v-${i}`} className="absolute h-full border-l border-gray-400" style={{ left: `${i * 5}%` }} />
                  ))}
                </div>

                {/* Labels de zones */}
                <div className="absolute top-10 left-10 bg-white bg-opacity-80 rounded-lg p-2 shadow-sm">
                  <div className="text-xs font-medium text-gray-700">Quartier Nord</div>
                </div>
                <div className="absolute top-1/3 right-10 bg-white bg-opacity-80 rounded-lg p-2 shadow-sm">
                  <div className="text-xs font-medium text-gray-700">Zone Est</div>
                </div>
                <div className="absolute bottom-20 left-1/4 bg-white bg-opacity-80 rounded-lg p-2 shadow-sm">
                  <div className="text-xs font-medium text-gray-700">Centre-ville</div>
                </div>
                <div className="absolute bottom-10 right-1/4 bg-white bg-opacity-80 rounded-lg p-2 shadow-sm">
                  <div className="text-xs font-medium text-gray-700">Zone Sud</div>
                </div>

                {/* Capteurs positionnés */}
                {sensors.map((sensor) => {
                  const position = getMapPosition(sensor);
                  const data = sensorData[sensor.id];
                  
                  return (
                    <div
                      key={sensor.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`
                      }}
                      onClick={() => setSelectedSensor(sensor)}
                    >
                      {/* Marker du capteur */}
                      <div className={`
                        relative transition-all duration-200 ${
                          selectedSensor?.id === sensor.id ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                        }
                      `}>
                        <div className={`
                          w-12 h-12 rounded-full ${getStatusColor(sensor.status)} 
                          flex items-center justify-center text-white shadow-lg border-2
                          ${selectedSensor?.id === sensor.id ? 'ring-4 ring-blue-300 ring-opacity-50' : ''}
                        `}>
                          {getSensorIcon(sensor.type)}
                        </div>
                        
                        {/* Animation pour capteurs actifs */}
                        {sensor.status === 'actif' && (
                          <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-75"></div>
                        )}
                        
                        {/* Badge de valeur */}
                        {data && sensor.status === 'actif' && (
                          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[2rem] text-center">
                            {typeof data.value === 'number' ? data.value.toFixed(data.unit === 'ppm' ? 3 : 0) : data.value}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Indicateur de chargement */}
                {loading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Mise à jour des données...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Vue liste */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Liste des capteurs</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capteur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localisation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valeur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sensors.map((sensor) => {
                        const data = sensorData[sensor.id];
                        return (
                          <tr key={sensor.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full ${getStatusColor(sensor.status)} flex items-center justify-center text-white mr-3`}>
                                  {getSensorIcon(sensor.type)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{sensor.name}</div>
                                  <div className="text-sm text-gray-500">{formatSensorType(sensor.type)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {sensor.location}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {data ? (
                                <div className={`text-sm font-medium ${getValueColor(sensor.type, data.value)}`}>
                                  {typeof data.value === 'number' ? data.value.toFixed(data.unit === 'ppm' ? 3 : 1) : data.value} {data.unit}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">Aucune donnée</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                sensor.status === 'actif' ? 'bg-green-100 text-green-800' :
                                sensor.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {sensor.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => setSelectedSensor(sensor)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="text-yellow-600 hover:text-yellow-900">
                                  <Settings className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panneau d'informations */}
        <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 h-[600px] overflow-y-auto">
            <h4 className="font-medium text-gray-900 mb-4">Détails du capteur</h4>
            
            {selectedSensor ? (
              <div className="space-y-4">
                {/* En-tête du capteur */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-8 h-8 rounded-full ${getStatusColor(selectedSensor.status)} flex items-center justify-center text-white`}>
                      {getSensorIcon(selectedSensor.type)}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{selectedSensor.name}</h5>
                      <p className="text-sm text-gray-600">{selectedSensor.location}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-gray-500">Type</span>
                      <p className="text-sm font-medium">{formatSensorType(selectedSensor.type)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Statut</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedSensor.status === 'actif' ? 'bg-green-500' : 
                          selectedSensor.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium capitalize">{selectedSensor.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Données en temps réel */}
                {sensorData[selectedSensor.id] && selectedSensor.status === 'actif' && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <h6 className="text-sm font-medium text-gray-700 mb-3">Mesure en temps réel</h6>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getValueColor(selectedSensor.type, sensorData[selectedSensor.id].value)}`}>
                        {typeof sensorData[selectedSensor.id].value === 'number' 
                          ? sensorData[selectedSensor.id].value.toFixed(sensorData[selectedSensor.id].unit === 'ppm' ? 3 : 1) 
                          : sensorData[selectedSensor.id].value}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {sensorData[selectedSensor.id].unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(sensorData[selectedSensor.id].timestamp).toLocaleString('fr-FR')}
                      </div>
                    </div>

                    {/* Indicateur de qualité */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Qualité</span>
                        <span>{getQualityLabel(selectedSensor.type, sensorData[selectedSensor.id].value)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getQualityBarColor(selectedSensor.type, sensorData[selectedSensor.id].value)}`}
                          style={{ width: `${getQualityPercentage(selectedSensor.type, sensorData[selectedSensor.id].value)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alertes liées à ce capteur */}
                {alerts.filter(alert => alert.sensor_id === selectedSensor.id).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h6 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Alertes actives
                    </h6>
                    <div className="space-y-2">
                      {alerts.filter(alert => alert.sensor_id === selectedSensor.id).map(alert => (
                        <div key={alert.id} className="text-sm text-red-700 bg-red-100 rounded p-2">
                          <div className="font-medium">{alert.alert_type.toUpperCase()}</div>
                          <div className="text-xs mt-1">{alert.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informations techniques */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h6 className="text-sm font-medium text-gray-700 mb-3">Informations techniques</h6>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Installation</span>
                      <span className="text-gray-900">{new Date(selectedSensor.installed_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {selectedSensor.serial_number && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">N° Série</span>
                        <span className="text-gray-900 font-mono">{selectedSensor.serial_number}</span>
                      </div>
                    )}
                    {selectedSensor.manufacturer && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Fabricant</span>
                        <span className="text-gray-900">{selectedSensor.manufacturer}</span>
                      </div>
                    )}
                    {selectedSensor.model && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Modèle</span>
                        <span className="text-gray-900">{selectedSensor.model}</span>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Coordonnées GPS</div>
                      <div className="text-xs font-mono text-gray-700">
                        {selectedSensor.latitude.toFixed(6)}, {selectedSensor.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm transition-colors">
                    Voir l'historique
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm transition-colors">
                    Configurer alertes
                  </button>
                  {selectedSensor.status === 'maintenance' && (
                    <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm transition-colors">
                      Planifier maintenance
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-sm mb-2">Aucun capteur sélectionné</p>
                <p className="text-gray-500 text-xs">Cliquez sur un marqueur ou sélectionnez dans la liste</p>
              </div>
            )}
          </div>

          {/* Légende fixe en bas */}
          <div className="border-t border-gray-200 bg-gray-50 p-4 rounded-b-xl">
            <h4 className="font-medium text-gray-900 mb-3">Légende</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Actif</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Maintenance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Inactif</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border-2 border-blue-300 rounded-full"></div>
                <span className="text-gray-600">Sélectionné</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Types de capteurs:</span>
                <span>{new Set(sensors.map(s => s.type)).size} différents</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonctions utilitaires pour les indicateurs de qualité
const getQualityLabel = (type: string, value: number): string => {
  switch (type) {
    case 'air_quality':
      if (value <= 25) return 'Bonne';
      if (value <= 50) return 'Moyenne';
      if (value <= 75) return 'Dégradée';
      return 'Mauvaise';
    case 'noise':
      if (value <= 45) return 'Calme';
      if (value <= 60) return 'Modéré';
      if (value <= 75) return 'Bruyant';
      return 'Très bruyant';
    case 'temperature':
      if (value >= 18 && value <= 25) return 'Idéale';
      if (value >= 15 && value <= 30) return 'Confortable';
      if (value >= 10 && value <= 35) return 'Acceptable';
      return 'Extrême';
    case 'traffic':
      if (value <= 100) return 'Fluide';
      if (value <= 200) return 'Modéré';
      if (value <= 300) return 'Dense';
      return 'Saturé';
    case 'pollution':
      if (value <= 0.03) return 'Faible';
      if (value <= 0.06) return 'Modérée';
      if (value <= 0.09) return 'Élevée';
      return 'Critique';
    default:
      return 'Normal';
  }
};

const getQualityBarColor = (type: string, value: number): string => {
  switch (type) {
    case 'air_quality':
      if (value <= 25) return 'bg-green-500';
      if (value <= 50) return 'bg-yellow-500';
      if (value <= 75) return 'bg-orange-500';
      return 'bg-red-500';
    case 'noise':
      if (value <= 45) return 'bg-green-500';
      if (value <= 60) return 'bg-yellow-500';
      if (value <= 75) return 'bg-orange-500';
      return 'bg-red-500';
    case 'temperature':
      if (value >= 18 && value <= 25) return 'bg-green-500';
      if (value >= 15 && value <= 30) return 'bg-yellow-500';
      if (value >= 10 && value <= 35) return 'bg-orange-500';
      return 'bg-red-500';
    case 'traffic':
      if (value <= 100) return 'bg-green-500';
      if (value <= 200) return 'bg-yellow-500';
      if (value <= 300) return 'bg-orange-500';
      return 'bg-red-500';
    case 'pollution':
      if (value <= 0.03) return 'bg-green-500';
      if (value <= 0.06) return 'bg-yellow-500';
      if (value <= 0.09) return 'bg-orange-500';
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getQualityPercentage = (type: string, value: number): number => {
  switch (type) {
    case 'air_quality':
      return Math.min(100, (value / 100) * 100);
    case 'noise':
      return Math.min(100, (value / 100) * 100);
    case 'temperature':
      if (value >= 18 && value <= 25) return 100;
      if (value >= 15 && value <= 30) return 75;
      if (value >= 10 && value <= 35) return 50;
      return 25;
    case 'traffic':
      return Math.min(100, (value / 400) * 100);
    case 'pollution':
      return Math.min(100, (value / 0.1) * 100);
    default:
      return 50;
  }
};

export default RealSensorsMap;