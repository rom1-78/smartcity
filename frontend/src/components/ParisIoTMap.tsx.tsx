import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Thermometer, Wind, Volume2, Car, Activity, AlertTriangle, CheckCircle, Zap, RefreshCw, Eye, Settings } from 'lucide-react';

// Interface locale pour éviter les conflits
interface LocalSensor {
  id: number;
  name?: string;
  type: string;
  location: string;
  latitude?: number;
  longitude?: number;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at?: string;
}

interface MapSensorData extends LocalSensor {
  currentValue?: number;
  currentUnit?: string;
  lastUpdate?: string;
  alertLevel?: 'normal' | 'warning' | 'critical';
}

declare global {
  interface Window {
    L: any;
  }
}

const ParisIoTMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const [sensors, setSensors] = useState<MapSensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<MapSensorData | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [mapLoaded, setMapLoaded] = useState(false);

  // Configuration de la carte centrée sur Paris
  const PARIS_CONFIG = {
    center: [48.8566, 2.3522] as [number, number],
    zoom: 12,
    minZoom: 10,
    maxZoom: 18
  };

  // Icônes pour les différents types de capteurs
  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'air_quality':
      case 'pollution':
        return '🌬️';
      case 'noise':
        return '🔊';
      case 'temperature':
        return '🌡️';
      case 'humidity':
        return '💧';
      case 'traffic':
        return '🚗';
      default:
        return '📡';
    }
  };

  // Fonction API sécurisée - CORRIGÉE
  const apiCall = async (url: string, options: RequestInit = {}) => {
    // 🔧 CORRECTION: Utiliser la même clé que dans Auth.tsx
    const token = localStorage.getItem('userToken'); // Changé de 'token' à 'userToken'
    
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 20)}...` : 'AUCUN TOKEN');
    
    if (!token) {
      setAuthError(true);
      throw new Error('Aucun token d\'authentification trouvé');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      setAuthError(true);
      // Supprimer le token invalide
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      throw new Error('Token d\'authentification invalide ou expiré');
    }

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  // Chargement des capteurs avec gestion d'erreurs robuste
  const loadSensorsData = async () => {
    try {
      setLoading(true);
      setError(null);
      setAuthError(false);
      
      console.log('🔄 Chargement des capteurs...');
      
      // Récupérer les capteurs depuis l'API
      const sensorsData = await apiCall('http://localhost:5000/api/sensors');
      
      console.log('✅ Capteurs récupérés:', sensorsData.length);
      
      // Convertir les données en format local
      const localSensors: MapSensorData[] = sensorsData.map((sensor: any) => ({
        id: sensor.id,
        name: sensor.name || `Capteur ${sensor.id}`,
        type: sensor.type || 'unknown',
        location: sensor.location || 'Localisation inconnue',
        latitude: sensor.latitude,
        longitude: sensor.longitude,
        status: sensor.status || 'inactif',
        installed_at: sensor.installed_at,
        alertLevel: 'normal' as const
      }));

      // Filtrer uniquement les capteurs avec coordonnées valides
      const validSensors = localSensors.filter(
        sensor => sensor.latitude != null && sensor.longitude != null && 
        sensor.latitude !== 0 && sensor.longitude !== 0 &&
        sensor.latitude >= -90 && sensor.latitude <= 90 &&
        sensor.longitude >= -180 && sensor.longitude <= 180
      );
      
      console.log('✅ Capteurs valides avec coordonnées:', validSensors.length);
      
      setSensors(validSensors);
      setLastUpdate(new Date());
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des capteurs:', err);
      
      if (err.message.includes('authentification')) {
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        setAuthError(true);
      } else {
        setError(`Impossible de charger les données: ${err.message}`);
        // En cas d'erreur, utiliser des données fictives pour la démo
        loadMockData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Données fictives pour la démo en cas d'erreur API
  const loadMockData = () => {
    console.log('📊 Chargement des données fictives pour démo...');
    
    const mockSensors: MapSensorData[] = [
      {
        id: 1,
        name: 'Air-Centre-001',
        type: 'air_quality',
        location: 'Place de la République',
        latitude: 48.8670,
        longitude: 2.3630,
        status: 'actif',
        installed_at: '2024-01-15',
        currentValue: 35.4,
        currentUnit: 'µg/m³',
        alertLevel: 'normal'
      },
      {
        id: 2,
        name: 'Bruit-Centre-001',
        type: 'noise',
        location: 'Place de la République',
        latitude: 48.8672,
        longitude: 2.3632,
        status: 'actif',
        installed_at: '2024-01-15',
        currentValue: 65.2,
        currentUnit: 'dB',
        alertLevel: 'normal'
      },
      {
        id: 3,
        name: 'Temp-Centre-001',
        type: 'temperature',
        location: 'Hôtel de Ville',
        latitude: 48.8566,
        longitude: 2.3522,
        status: 'actif',
        installed_at: '2024-01-15',
        currentValue: 22.5,
        currentUnit: '°C',
        alertLevel: 'normal'
      },
      {
        id: 4,
        name: 'Air-Tour-Eiffel',
        type: 'air_quality',
        location: 'Tour Eiffel',
        latitude: 48.8584,
        longitude: 2.2945,
        status: 'actif',
        installed_at: '2024-02-01',
        currentValue: 42.1,
        currentUnit: 'µg/m³',
        alertLevel: 'warning'
      },
      {
        id: 5,
        name: 'Traffic-Champs-Elysées',
        type: 'traffic',
        location: 'Champs-Élysées',
        latitude: 48.8698,
        longitude: 2.3076,
        status: 'actif',
        installed_at: '2024-02-05',
        currentValue: 280,
        currentUnit: 'véh/h',
        alertLevel: 'warning'
      },
      {
        id: 6,
        name: 'Humid-Louvre',
        type: 'humidity',
        location: 'Musée du Louvre',
        latitude: 48.8606,
        longitude: 2.3376,
        status: 'maintenance',
        installed_at: '2024-01-20',
        currentValue: 78.3,
        currentUnit: '%',
        alertLevel: 'normal'
      }
    ];

    setSensors(mockSensors);
    setError('Utilisation des données de démonstration (API non disponible)');
  };

  // Initialisation de la carte Leaflet - VERSION CORRIGÉE
  const initializeMap = async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      console.log('🗺️ Initialisation de la carte Leaflet...');
      
      // Charger Leaflet de manière dynamique et séquentielle
      if (!window.L) {
        // 1. Charger le CSS d'abord
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);

          // Attendre que le CSS soit chargé
          await new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = () => reject(new Error('Erreur chargement CSS'));
            // Timeout après 10 secondes
            setTimeout(() => reject(new Error('Timeout CSS')), 10000);
          });
        }

        // 2. Charger le JavaScript ensuite
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('Erreur chargement Leaflet'));
          // Timeout après 10 secondes
          setTimeout(() => reject(new Error('Timeout Leaflet')), 10000);
        });

        // 3. Attendre que Leaflet soit complètement disponible
        let attempts = 0;
        while (!window.L && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.L) {
          throw new Error('Leaflet non disponible après chargement');
        }
        
        console.log('✅ Leaflet chargé avec succès');
      }

      const L = window.L;
      
      // Créer la carte avec configuration complète
      const map = L.map(mapRef.current, {
        center: PARIS_CONFIG.center,
        zoom: PARIS_CONFIG.zoom,
        minZoom: PARIS_CONFIG.minZoom,
        maxZoom: PARIS_CONFIG.maxZoom,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true
      });

      // Ajouter les tuiles OpenStreetMap avec fallback
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      });

      tileLayer.on('tileerror', function(error: any) {
        console.warn('Erreur de tuile:', error);
      });

      tileLayer.addTo(map);

      // Ajouter une légende personnalisée
      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
        div.style.backgroundColor = 'white';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        div.style.fontSize = '12px';
        div.innerHTML = `
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">Statut des Capteurs</h4>
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #059669; margin-right: 8px;"></div>
            <span>Actif</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #f59e0b; margin-right: 8px;"></div>
            <span>Maintenance</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ef4444; margin-right: 8px;"></div>
            <span>Inactif</span>
          </div>
        `;
        return div;
      };
      legend.addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
      console.log('✅ Carte initialisée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la carte:', error);
      setError('Impossible d\'initialiser la carte. Vérifiez votre connexion internet.');
    }
  };

  // Mise à jour des marqueurs sur la carte - VERSION CORRIGÉE
  const updateMapMarkers = () => {
    if (!mapInstanceRef.current || !sensors.length || !mapLoaded) {
      console.log('⏸️ Marqueurs non mis à jour: carte non prête ou pas de capteurs');
      return;
    }

    const L = window.L;
    const map = mapInstanceRef.current;

    console.log('📍 Mise à jour des marqueurs:', sensors.length, 'capteurs');

    try {
      // Supprimer les anciens marqueurs
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current = [];

      // Filtrer les capteurs selon le type sélectionné
      const filteredSensors = filterType === 'all' 
        ? sensors 
        : sensors.filter(sensor => sensor.type === filterType);

      console.log('📍 Capteurs filtrés:', filteredSensors.length);

      // Créer les nouveaux marqueurs
      const bounds = L.latLngBounds([]);
      let markersAdded = 0;

      filteredSensors.forEach(sensor => {
        if (sensor.latitude == null || sensor.longitude == null) {
          console.warn('⚠️ Capteur sans coordonnées:', sensor.name);
          return;
        }

        const statusColor = sensor.status === 'actif' ? '#059669' : 
                           sensor.status === 'maintenance' ? '#f59e0b' : '#ef4444';
        const icon = getSensorIcon(sensor.type);

        // Créer une icône personnalisée plus robuste
        const customIcon = L.divIcon({
          html: `
            <div style="
              position: relative;
              background: white;
              border: 3px solid ${statusColor};
              border-radius: 50%;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: transform 0.2s ease;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
              ${icon}
              ${sensor.alertLevel === 'critical' ? 
                '<div style="position: absolute; top: -5px; right: -5px; background: #ef4444; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white;"></div>' : 
                sensor.alertLevel === 'warning' ? 
                '<div style="position: absolute; top: -5px; right: -5px; background: #f59e0b; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white;"></div>' : ''
              }
            </div>
          `,
          className: 'custom-sensor-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });

        // Créer le popup avec informations détaillées
        const popupContent = `
          <div style="min-width: 220px; padding: 12px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
              ${sensor.name}
            </h3>
            <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
              <strong>Type:</strong> 
              <span style="text-transform: capitalize;">${sensor.type.replace('_', ' ')}</span>
            </div>
            <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
              <strong>Localisation:</strong> 
              <span>${sensor.location}</span>
            </div>
            <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
              <strong>Statut:</strong> 
              <span style="color: ${statusColor}; font-weight: bold; text-transform: capitalize;">
                ${sensor.status}
              </span>
            </div>
            ${sensor.currentValue !== undefined ? `
              <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
                <strong>Valeur actuelle:</strong> 
                <span style="font-weight: bold; color: #059669;">
                  ${sensor.currentValue} ${sensor.currentUnit || ''}
                </span>
              </div>
            ` : ''}
            <div style="font-size: 11px; color: #6b7280; text-align: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              Installé le: ${sensor.installed_at ? new Date(sensor.installed_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
            </div>
          </div>
        `;

        // Créer le marqueur avec gestion d'erreurs
        try {
          const marker = L.marker([sensor.latitude, sensor.longitude], { 
            icon: customIcon,
            title: sensor.name
          })
          .bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
          })
          .on('click', () => {
            setSelectedSensor(sensor);
            console.log('🖱️ Capteur sélectionné:', sensor.name);
          });

          marker.addTo(map);
          markersRef.current.push(marker);
          bounds.extend([sensor.latitude, sensor.longitude]);
          markersAdded++;

        } catch (markerError) {
          console.error('❌ Erreur création marqueur pour capteur:', sensor.name, markerError);
        }
      });

      // Ajuster la vue pour inclure tous les marqueurs
      if (bounds.isValid() && markersAdded > 0) {
        map.fitBounds(bounds, { 
          padding: [20, 20],
          maxZoom: 15 
        });
      }

      console.log('✅ Marqueurs mis à jour:', markersAdded, 'marqueurs ajoutés');

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des marqueurs:', error);
    }
  };

  // Effet pour initialiser la carte au montage
  useEffect(() => {
    console.log('🚀 Initialisation du composant ParisIoTMap');
    initializeMap();
    
    // Nettoyage au démontage
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          setMapLoaded(false);
          console.log('🧹 Carte nettoyée');
        } catch (error) {
          console.warn('⚠️ Erreur lors du nettoyage de la carte:', error);
        }
      }
    };
  }, []);

  // Effet pour charger les données
  useEffect(() => {
    loadSensorsData();
  }, []);

  // Effet pour mettre à jour les marqueurs quand les données ou filtres changent
  useEffect(() => {
    if (mapLoaded && sensors.length > 0) {
      updateMapMarkers();
    }
  }, [sensors, filterType, mapLoaded]);

  // Types de capteurs disponibles pour le filtre
  const sensorTypes = [
    { value: 'all', label: 'Tous les capteurs', icon: '📡' },
    { value: 'air_quality', label: 'Qualité de l\'air', icon: '🌬️' },
    { value: 'noise', label: 'Niveau sonore', icon: '🔊' },
    { value: 'temperature', label: 'Température', icon: '🌡️' },
    { value: 'humidity', label: 'Humidité', icon: '💧' },
    { value: 'traffic', label: 'Circulation', icon: '🚗' },
    { value: 'pollution', label: 'Pollution', icon: '🏭' }
  ];

  // Statistiques des capteurs
  const stats = {
    total: sensors.length,
    active: sensors.filter(s => s.status === 'actif').length,
    maintenance: sensors.filter(s => s.status === 'maintenance').length,
    inactive: sensors.filter(s => s.status === 'inactif').length,
    critical: sensors.filter(s => s.alertLevel === 'critical').length,
    warning: sensors.filter(s => s.alertLevel === 'warning').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <div className="text-center">
            <span className="text-gray-700 font-medium">Chargement de la carte de Paris...</span>
            <div className="text-xs text-gray-500 mt-1">Initialisation de Leaflet en cours...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec contrôles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <MapPin className="h-6 w-6 mr-2 text-blue-600" />
              Capteurs IoT - Ville de Paris
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Dernière mise à jour: {lastUpdate.toLocaleString('fr-FR')}
            </p>
            {error && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                ⚠️ {error}
              </div>
            )}
            {authError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                🔒 Problème d'authentification - Reconnectez-vous
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {sensorTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={loadSensorsData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
        
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-600">Actifs</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
            <div className="text-xs text-gray-600">Maintenance</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <div className="text-xs text-gray-600">Inactifs</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-xs text-gray-600">Critiques</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded">
            <div className="text-2xl font-bold text-orange-600">{stats.warning}</div>
            <div className="text-xs text-gray-600">Alertes</div>
          </div>
        </div>
      </div>

      {/* Carte */}
      <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div 
          ref={mapRef}
          className="w-full h-[500px]"
          style={{ minHeight: '500px' }}
        />
        
        {/* Indicateur de statut de la carte */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <div className="text-gray-600">Chargement de la carte...</div>
            </div>
          </div>
        )}

        {/* Indicateur de capteurs visibles */}
        {mapLoaded && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm border border-gray-200">
            <div className="font-medium text-gray-900">
              {sensors.filter(s => filterType === 'all' || s.type === filterType).length} capteurs affichés
            </div>
            {filterType !== 'all' && (
              <div className="text-xs text-gray-500 mt-1">
                Filtre: {sensorTypes.find(t => t.value === filterType)?.label}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParisIoTMap;