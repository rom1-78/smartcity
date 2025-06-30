import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { getUserFromToken } from '../services/auth'; // Assurez-vous d'importer cette fonction

declare global {
  interface Window {
    L: any;
  }
}

// Types pour vos données BDD
interface Sensor {
  id: number;
  name: string;
  type: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
}

interface SensorData {
  id: number;
  sensor_id: number;
  value: number;
  unit: string;
  timestamp: string;
}

// Props pour le composant
interface MapProps {
  onAddSensor?: () => void;
  onSensorChange?: () => void;
}

const Map: React.FC<MapProps> = ({ onAddSensor, onSensorChange }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedSensorData, setSelectedSensorData] = useState<SensorData[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataGenerationActive, setDataGenerationActive] = useState(false);

  // Obtenir les informations utilisateur pour les permissions
  const user = getUserFromToken();
  const role = user?.role;

  // API Helper avec support POST
  const apiCall = async (url: string, method: string = 'GET', body?: any) => {
    const token = localStorage.getItem('userToken');
    if (!token) throw new Error('Token manquant');

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    return response.json();
  };

  // Charger les capteurs depuis votre table sensors
  const loadSensors = async () => {
    try {
      console.log('🔄 Chargement des capteurs...');
      const response = await apiCall('http://localhost:5000/api/sensors');

      console.log('📊 Réponse API complète:', response);

      // 🔧 CORRECTION: Extraire les capteurs de la réponse
      let sensors: Sensor[] = [];

      if (Array.isArray(response)) {
        sensors = response;
      } else if (response && Array.isArray(response.sensors)) {
        sensors = response.sensors;
      } else {
        console.error(' Format de réponse invalide:', response);
        throw new Error('Format de données invalide');
      }

      console.log('📡 Capteurs extraits:', sensors.length);

      // Filtrer uniquement ceux avec coordonnées valides
      const validSensors = sensors.filter((s: Sensor) =>
        s.latitude && s.longitude &&
        s.latitude !== 0 && s.longitude !== 0
      );

      setSensors(validSensors);
      setError('');
      console.log(' Capteurs valides chargés:', validSensors.length);

      // Notifier le composant parent si nécessaire
      if (onSensorChange) {
        onSensorChange();
      }

    } catch (err: any) {
      console.error(' Erreur capteurs:', err);
      setError(`Erreur: ${err.message}`);
    }
  };

  // Générer des données réalistes selon le type de capteur
  const generateSensorValue = (type: string) => {
    const configs = {
      temperature: { min: -10, max: 45, unit: '°C', precision: 1 },
      air_quality: { min: 10, max: 200, unit: 'µg/m³', precision: 0 },
      pollution: { min: 5, max: 150, unit: 'µg/m³', precision: 0 },
      noise: { min: 30, max: 120, unit: 'dB', precision: 1 },
      humidity: { min: 20, max: 95, unit: '%', precision: 1 },
      traffic: { min: 0, max: 500, unit: 'véh/h', precision: 0 }
    };

    const config = configs[type as keyof typeof configs] || { min: 0, max: 100, unit: '', precision: 1 };
    const value = Math.random() * (config.max - config.min) + config.min;

    return {
      value: Number(value.toFixed(config.precision)),
      unit: config.unit
    };
  };

  // Ajouter des données simulées pour tous les capteurs actifs
  const generateDataForAllSensors = async () => {
    try {
      console.log('🔄 Génération de données pour tous les capteurs...');

      const activeSensors = sensors.filter(s => s.status === 'actif');
      if (activeSensors.length === 0) {
        console.log('⚠️ Aucun capteur actif trouvé');
        return;
      }

      const dataToInsert = activeSensors.map(sensor => {
        const { value, unit } = generateSensorValue(sensor.type);
        return {
          sensor_id: sensor.id,
          value: value,
          unit: unit,
          timestamp: new Date().toISOString()
        };
      });

      console.log('📊 Données à insérer:', dataToInsert.length);

      // Insérer toutes les données en une seule requête
      await apiCall('http://localhost:5000/api/sensor-data/batch', 'POST', {
        measurements: dataToInsert
      });

      console.log(' Données générées et insérées avec succès');

    } catch (err: any) {
      console.error(' Erreur génération données:', err);
    }
  };

  // Démarrer/arrêter la génération automatique de données
  const toggleDataGeneration = async () => {
    if (dataGenerationActive) {
      setDataGenerationActive(false);
      console.log('⏹️ Génération de données arrêtée');
    } else {
      setDataGenerationActive(true);
      console.log('▶️ Génération de données démarrée');

      // Générer immédiatement
      await generateDataForAllSensors();
    }
  };

  // Effet pour la génération automatique toutes les 30 secondes
  useEffect(() => {
    if (!dataGenerationActive) return;

    const interval = setInterval(async () => {
      await generateDataForAllSensors();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [dataGenerationActive, sensors]);

  // Charger les données d'un capteur depuis sensor_data
  const loadSensorData = async (sensorId: number) => {
    try {
      setLoadingData(true);
      console.log('🔄 Chargement données capteur:', sensorId);

      const response = await apiCall(`http://localhost:5000/api/sensors/${sensorId}/data?limit=10`);

      const sensorData = response.data || response;
      setSelectedSensorData(Array.isArray(sensorData) ? sensorData : []);
      console.log(' Données capteur chargées:', sensorData.length);

    } catch (err: any) {
      console.error(' Erreur données capteur:', err);
      setSelectedSensorData([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Initialisation carte
  useEffect(() => {
    const initMap = async () => {
      try {
        console.log(' Init carte...');

        await loadSensors();

        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!window.L) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          document.head.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });

          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!window.L || !mapRef.current) {
          throw new Error('Leaflet ou div manquant');
        }

        const map = window.L.map(mapRef.current).setView([48.8566, 2.3522], 12);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        mapInstanceRef.current = map;
        console.log(' Carte créée');

      } catch (err: any) {
        console.error(' Erreur init:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initMap();
  }, []);

  // Ajouter marqueurs quand les capteurs sont chargés
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !sensors.length) return;

    const map = mapInstanceRef.current;
    console.log('📍 Ajout marqueurs:', sensors.length);

    // Supprimer anciens marqueurs
    map.eachLayer((layer: any) => {
      if (layer instanceof window.L.Marker) {
        map.removeLayer(layer);
      }
    });

    const getIcon = (type: string) => {
      const icons: { [key: string]: string } = {
        'air_quality': '🌬️',
        'pollution': '🏭',
        'noise': '🔊',
        'temperature': '🌡️',
        'humidity': '💧',
        'traffic': '🚗'
      };
      return icons[type] || '📡';
    };

    const getColor = (status: string) => {
      switch (status) {
        case 'actif': return 'green';
        case 'maintenance': return 'orange';
        case 'inactif': return 'red';
        default: return 'gray';
      }
    };

    // Ajouter chaque capteur
    sensors.forEach((sensor) => {
      if (!sensor.latitude || !sensor.longitude) return;

      const divIcon = window.L.divIcon({
        html: `
          <div style="
            background: ${getColor(sensor.status)};
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${getIcon(sensor.type)}
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = window.L.marker([sensor.latitude, sensor.longitude], {
        icon: divIcon
      }).addTo(map);

      const popupContent = `
        <div style="min-width: 200px; font-family: Arial;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">
            ${getIcon(sensor.type)} ${sensor.name}
          </h3>
          <div style="margin-bottom: 8px;">
            <strong>Type:</strong> ${sensor.type}<br>
            <strong>Lieu:</strong> ${sensor.location}<br>
            <strong>Statut:</strong> 
            <span style="color: ${getColor(sensor.status)}; font-weight: bold;">
              ${sensor.status}
            </span>
          </div>
          <div id="sensor-data-${sensor.id}" style="
            background: #f9fafb; 
            padding: 8px; 
            border-radius: 4px; 
            margin-top: 8px;
            border-left: 3px solid ${getColor(sensor.status)};
          ">
            <em>Cliquez pour charger les données...</em>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });

      marker.on('popupopen', async () => {
        const dataDiv = document.getElementById(`sensor-data-${sensor.id}`);
        if (!dataDiv) return;

        dataDiv.innerHTML = '<div style="color: #6b7280;">⏳ Chargement...</div>';

        try {
          await loadSensorData(sensor.id);

          if (selectedSensorData.length === 0) {
            dataDiv.innerHTML = '<div style="color: #9ca3af;">📊 Aucune donnée disponible</div>';
            return;
          }

          let html = '<div style="font-size: 12px;">';
          html += '<strong style="color: #374151;">Dernières mesures:</strong><br>';

          selectedSensorData.slice(0, 3).forEach((measurement, index) => {
            const date = new Date(measurement.timestamp).toLocaleString('fr-FR');
            html += `
              <div style="
                background: ${index === 0 ? '#f0f9ff' : '#f9fafb'}; 
                padding: 6px 8px; 
                margin-bottom: 4px; 
                border-radius: 4px;
                border-left: 3px solid ${index === 0 ? '#2563eb' : '#d1d5db'};
              ">
                <div style="font-weight: bold; color: #1f2937;">
                  ${measurement.value} ${measurement.unit}
                </div>
                <div style="font-size: 11px; color: #6b7280;">
                  ${date}
                </div>
              </div>
            `;
          });

          html += '</div>';
          dataDiv.innerHTML = html;

        } catch (err) {
          dataDiv.innerHTML = '<div style="color: #dc2626;"> Erreur chargement données</div>';
        }
      });
    });

    console.log(' Marqueurs ajoutés');
  }, [sensors, selectedSensorData]);

  // Stats
  const stats = {
    total: sensors.length,
    active: sensors.filter(s => s.status === 'actif').length,
    maintenance: sensors.filter(s => s.status === 'maintenance').length,
    inactive: sensors.filter(s => s.status === 'inactif').length
  };

  return (
    <div className="space-y-4">
      {/* Header avec boutons */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🗺️ Carte IoT connectée à la BDD</h2>
          <div className="flex gap-2">
            {/* Bouton Ajouter capteur - visible seulement pour gestionnaires/admins */}
            {(role === 'gestionnaire' || role === 'admin') && onAddSensor && (
              <button
                onClick={onAddSensor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Plus size={16} />
                Ajouter capteur
              </button>
            )}

            
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Indicateur de génération de données */}
        {dataGenerationActive && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>🔄 Génération automatique de données activée (toutes les 30s)</span>
          </div>
        )}

        {/* Stats des capteurs */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded text-center">
            <div className="text-blue-600 text-sm">Total</div>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-3 rounded text-center">
            <div className="text-green-600 text-sm">Actifs</div>
            <div className="text-2xl font-bold text-green-900">{stats.active}</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded text-center">
            <div className="text-yellow-600 text-sm">Maintenance</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.maintenance}</div>
          </div>
          <div className="bg-red-50 p-3 rounded text-center">
            <div className="text-red-600 text-sm">Inactifs</div>
            <div className="text-2xl font-bold text-red-900">{stats.inactive}</div>
          </div>
        </div>
      </div>

      {/* Carte */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {loading ? (
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <div>Chargement de la carte et des capteurs...</div>
            </div>
          </div>
        ) : (
          <div
            ref={mapRef}
            style={{
              height: '500px',
              width: '100%',
              border: '2px solid #ccc',
              borderRadius: '8px'
            }}
          />
        )}
      </div>

      {/* Debug étendu */}
      <div className="bg-gray-100 p-3 rounded text-xs text-gray-600">
        🔧 Debug: {sensors.length} capteurs | Loading: {loading ? 'Oui' : 'Non'} |
        Leaflet: {typeof window !== 'undefined' && window.L ? 'Chargé' : 'Non chargé'} |
        Génération: {dataGenerationActive ? 'Active' : 'Inactive'} |
        Rôle: {role || 'Non défini'}
      </div>
    </div>
  );
};

export default Map;