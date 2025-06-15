// src/components/SensorMapReal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Wind, Thermometer, Volume2, Car, Activity, Droplets } from 'lucide-react';

// Types pour les données de capteurs (selon votre BDD)
interface SensorData {
  id: string;
  type: string;
  location: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: Date;
  latitude: number;
  longitude: number;
}

interface RealSensor {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'actif' | 'inactif' | 'maintenance';
  latitude: number;
  longitude: number;
  installed_at: string;
}

interface SensorMapProps {
  sensorData: SensorData[];
  className?: string;
}

// Fonction pour obtenir l'icône selon le type
const getSensorIcon = (type: string, status: string) => {
  const color = status === 'critical' ? '#ef4444' : 
               status === 'warning' ? '#f59e0b' : '#10b981';
  
  switch (type) {
    case 'temperature':
      return <Thermometer size={16} color={color} />;
    case 'air_quality':
      return <Wind size={16} color={color} />;
    case 'noise':
    case 'noise_level':
      return <Volume2 size={16} color={color} />;
    case 'traffic':
      return <Car size={16} color={color} />;
    case 'humidity':
      return <Droplets size={16} color={color} />;
    default:
      return <Activity size={16} color={color} />;
  }
};

// Fonction pour obtenir le nom lisible du type
const getSensorTypeName = (type: string) => {
  switch (type) {
    case 'temperature': return 'Température';
    case 'air_quality': return 'Qualité de l\'air';
    case 'noise': 
    case 'noise_level': return 'Niveau sonore';
    case 'traffic': return 'Trafic';
    case 'humidity': return 'Humidité';
    case 'pollution': return 'Pollution';
    default: return 'Capteur';
  }
};

const SensorMapReal: React.FC<SensorMapProps> = ({ sensorData, className = '' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null);
  const [realSensors, setRealSensors] = useState<RealSensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // Récupération des vrais capteurs depuis l'API
  useEffect(() => {
    const fetchRealSensors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/sensors', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const sensors = await response.json();
          setRealSensors(sensors);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des capteurs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealSensors();
  }, []);

  // Initialisation de la carte OpenStreetMap
  useEffect(() => {
    if (!mapRef.current || isLoading || mapInstance) return;

    // Chargement dynamique de Leaflet
    const loadLeaflet = async () => {
      // Charger les CSS et JS de Leaflet
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      // Initialiser la carte
      const L = window.L;
      const map = L.map(mapRef.current).setView([48.8566, 2.3522], 12);

      // Ajouter les tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      setMapInstance(map);
    };

    loadLeaflet();
  }, [isLoading, mapInstance]);

  // Ajouter les marqueurs des vrais capteurs
  useEffect(() => {
    if (!mapInstance || !realSensors.length) return;

    const L = window.L;
    
    // Nettoyer les marqueurs existants
    mapInstance.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        mapInstance.removeLayer(layer);
      }
    });

    // Ajouter les nouveaux marqueurs
    const bounds = L.latLngBounds([]);
    
    realSensors.forEach((sensor) => {
      if (sensor.latitude && sensor.longitude) {
        // Déterminer le statut basé sur le capteur
        const status = sensor.status === 'actif' ? 'normal' : 
                      sensor.status === 'maintenance' ? 'warning' : 'critical';
        
        // Créer une icône personnalisée
        const iconHtml = `
          <div style="
            background: white; 
            border-radius: 50%; 
            padding: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.3); 
            border: 3px solid ${status === 'critical' ? '#ef4444' : 
                                status === 'warning' ? '#f59e0b' : '#10b981'};
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
          ">
            ${getSensorIcon(sensor.type, status).props.children || '📍'}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-sensor-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });

        // Trouver les données correspondantes dans sensorData
        const correspondingData = sensorData.find(data => 
          data.location === sensor.location || 
          data.type === sensor.type
        );

        const marker = L.marker([sensor.latitude, sensor.longitude], { icon: customIcon })
          .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; font-weight: bold; color: #1f2937;">
                ${getSensorTypeName(sensor.type)}
              </h3>
              <div style="margin-bottom: 8px;">
                <strong>Nom:</strong> ${sensor.name}
              </div>
              <div style="margin-bottom: 8px;">
                <strong>Localisation:</strong> ${sensor.location}
              </div>
              <div style="margin-bottom: 8px;">
                <strong>Statut:</strong> 
                <span style="
                  padding: 2px 8px; 
                  border-radius: 12px; 
                  font-size: 12px; 
                  background: ${sensor.status === 'actif' ? '#dcfce7' : 
                              sensor.status === 'maintenance' ? '#fef3c7' : '#fee2e2'};
                  color: ${sensor.status === 'actif' ? '#166534' : 
                           sensor.status === 'maintenance' ? '#92400e' : '#991b1b'};
                ">
                  ${sensor.status === 'actif' ? 'Actif' : 
                    sensor.status === 'maintenance' ? 'Maintenance' : 'Inactif'}
                </span>
              </div>
              ${correspondingData ? `
                <div style="margin-bottom: 8px;">
                  <strong>Valeur actuelle:</strong> 
                  <span style="font-weight: bold; color: ${
                    correspondingData.status === 'critical' ? '#dc2626' :
                    correspondingData.status === 'warning' ? '#d97706' : '#059669'
                  };">
                    ${correspondingData.value} ${correspondingData.unit}
                  </span>
                </div>
              ` : ''}
              <div style="font-size: 12px; color: #6b7280;">
                Installé le: ${new Date(sensor.installed_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          `)
          .addTo(mapInstance);

        bounds.extend([sensor.latitude, sensor.longitude]);
      }
    });

    // Ajuster la vue pour inclure tous les marqueurs
    if (bounds.isValid()) {
      mapInstance.fitBounds(bounds, { padding: [20, 20] });
    }

  }, [mapInstance, realSensors, sensorData]);

  if (isLoading) {
    return (
      <div className={`bg-gray-100 animate-pulse rounded-lg ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Chargement de la carte...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef}
        className="w-full h-full rounded-lg border border-gray-200"
        style={{ minHeight: '400px' }}
      >
      </div>

      {/* Légende */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="font-medium text-gray-900 mb-2">Légende</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Actif</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Inactif</span>
          </div>
        </div>
      </div>

      {/* Compteur de capteurs */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="font-medium text-gray-900">
          {realSensors.filter(s => s.latitude && s.longitude).length} capteurs sur la carte
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {realSensors.filter(s => s.status === 'actif').length} actifs
        </div>
      </div>
    </div>
  );
};

// Déclaration pour TypeScript
declare global {
  interface Window {
    L: any;
  }
}

export default SensorMapReal;