import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

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

const SimpleMapWithDB: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedSensorData, setSelectedSensorData] = useState<SensorData[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // API Helper
  const apiCall = async (url: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) throw new Error('Token manquant');

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    return response.json();
  };

  // Charger les capteurs depuis votre table sensors
  const loadSensors = async () => {
    try {
      console.log('🔄 Chargement des capteurs...');
      const data = await apiCall('http://localhost:5000/api/sensors');
      
      // Filtrer uniquement ceux avec coordonnées valides
      const validSensors = data.filter((s: Sensor) => 
        s.latitude && s.longitude && 
        s.latitude !== 0 && s.longitude !== 0
      );
      
      setSensors(validSensors);
      setError('');
      console.log('✅ Capteurs chargés:', validSensors.length);
      
    } catch (err: any) {
      console.error('❌ Erreur capteurs:', err);
      setError(`Erreur: ${err.message}`);
    }
  };

  // Charger les données d'un capteur depuis sensor_data
  const loadSensorData = async (sensorId: number) => {
    try {
      setLoadingData(true);
      console.log('🔄 Chargement données capteur:', sensorId);
      
      // Récupérer les 10 dernières mesures du capteur
      const data = await apiCall(`http://localhost:5000/api/sensors/${sensorId}/data?limit=10`);
      
      setSelectedSensorData(data);
      console.log('✅ Données capteur chargées:', data.length);
      
    } catch (err: any) {
      console.error('❌ Erreur données capteur:', err);
      setSelectedSensorData([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Initialisation carte SIMPLE (basée sur TestMap qui fonctionne)
  useEffect(() => {
    const initMap = async () => {
      try {
        console.log('🚀 Init carte...');
        
        // 1. Charger les capteurs
        await loadSensors();
        
        // 2. Charger CSS Leaflet
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 3. Charger JS Leaflet
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

        // 4. Créer carte simple
        const map = window.L.map(mapRef.current).setView([48.8566, 2.3522], 12);
        
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        mapInstanceRef.current = map;
        console.log('✅ Carte créée');
        
      } catch (err: any) {
        console.error('❌ Erreur init:', err);
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

    // Icônes selon le type
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

    // Couleur selon statut
    const getColor = (status: string) => {
      switch (status) {
        case 'actif': return 'green';
        case 'maintenance': return 'orange';
        case 'inactif': return 'red';
        default: return 'gray';
      }
    };

    // Créer marqueurs
    const bounds = window.L.latLngBounds([]);

    sensors.forEach(sensor => {
      const icon = getIcon(sensor.type);
      const color = getColor(sensor.status);

      // Popup de base avec infos capteur
      const popupContent = `
        <div style="font-family: sans-serif; min-width: 250px;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">
            ${icon} ${sensor.name}
          </h3>
          <div style="margin-bottom: 8px;">
            <strong>Type:</strong> ${sensor.type}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Localisation:</strong> ${sensor.location}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Statut:</strong> 
            <span style="color: ${color}; font-weight: bold;">${sensor.status}</span>
          </div>
          <div style="margin-bottom: 12px; font-size: 12px; color: #666;">
            Installé le: ${new Date(sensor.installed_at).toLocaleDateString('fr-FR')}
          </div>
          <button 
            onclick="window.loadSensorData(${sensor.id})" 
            style="
              background: #2563eb; 
              color: white; 
              border: none; 
              padding: 8px 16px; 
              border-radius: 4px; 
              cursor: pointer;
              width: 100%;
            "
          >
            📊 Voir les données
          </button>
          <div id="sensor-data-${sensor.id}" style="margin-top: 10px;">
            <!-- Les données apparaîtront ici -->
          </div>
        </div>
      `;

      const marker = window.L.marker([sensor.latitude, sensor.longitude])
        .bindPopup(popupContent, { maxWidth: 350 })
        .addTo(map);

      bounds.extend([sensor.latitude, sensor.longitude]);
    });

    // Ajuster vue
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }

    // Fonction globale pour charger données (appelée depuis popup)
    (window as any).loadSensorData = async (sensorId: number) => {
      const dataDiv = document.getElementById(`sensor-data-${sensorId}`);
      if (!dataDiv) return;

      dataDiv.innerHTML = '<div style="text-align: center; color: #666;">⏳ Chargement...</div>';

      try {
        const data = await apiCall(`http://localhost:5000/api/sensors/${sensorId}/data?limit=5`);
        
        if (data.length === 0) {
          dataDiv.innerHTML = '<div style="color: #666; text-align: center;">Aucune donnée disponible</div>';
          return;
        }

        // Afficher les 5 dernières mesures
        let html = '<div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px;">';
        html += '<h4 style="margin: 0 0 8px 0; color: #374151;">📈 Dernières mesures:</h4>';
        
        data.forEach((measurement: SensorData, index: number) => {
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
        dataDiv.innerHTML = '<div style="color: #dc2626;">❌ Erreur chargement données</div>';
      }
    };

    console.log('✅ Marqueurs ajoutés');
  }, [sensors]);

  // Stats
  const stats = {
    total: sensors.length,
    active: sensors.filter(s => s.status === 'actif').length,
    maintenance: sensors.filter(s => s.status === 'maintenance').length,
    inactive: sensors.filter(s => s.status === 'inactif').length
  };

  return (
    <div className="space-y-4">
      {/* Header simple */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🗺️ Carte IoT connectée à la BDD</h2>
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Recharger
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            ❌ {error}
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

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-blue-900 font-semibold mb-2">💡 Comment utiliser :</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Cliquez sur un marqueur pour voir les infos du capteur</li>
          <li>• Cliquez sur "📊 Voir les données" pour charger les mesures depuis sensor_data</li>
          <li>• Les données s'affichent directement dans la popup</li>
          <li>• Les capteurs proviennent de votre table 'sensors'</li>
          <li>• Les mesures proviennent de votre table 'sensor_data'</li>
        </ul>
      </div>

      {/* Debug */}
      <div className="bg-gray-100 p-3 rounded text-xs text-gray-600">
        🔧 Debug: {sensors.length} capteurs | Loading: {loading ? 'Oui' : 'Non'} | 
        Leaflet: {typeof window !== 'undefined' && window.L ? 'Chargé' : 'Non chargé'}
      </div>
    </div>
  );
};

export default SimpleMapWithDB;