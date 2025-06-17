// frontend/src/pages/Dashboard.tsx (VERSION COMPLÈTE CORRIGÉE ! 🗺️)
import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { isLoggedIn, removeToken, getUserFromToken } from "../services/auth";
import { useNavigate } from "react-router-dom";
import {
  getSensors,
  getSensorData,
  getAlerts,
  createSensor,
  updateSensor,
  deleteSensor,
  RealSensor,
  RealSensorData,
  RealAlert
} from "../services/sensor";

import {
  MapPin,
  Thermometer,
  Wind,
  Volume2,
  Car,
  Users,
  BarChart3,
  Bell,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  Settings,
  UserPlus,
  Database,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  MessageSquare,
  Maximize2,
  Minimize2
} from 'lucide-react';

// ============================================
// INTERFACES POUR LES DONNÉES TRAITÉES
// ============================================
interface ProcessedSensorData {
  id: string;
  sensor_id: number;
  type: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  location: string;
  timestamp: Date;
  sensor_name: string;
  // Coordonnées par défaut pour la carte (vous pourrez les ajuster)
  latitude: number;
  longitude: number;
}

interface ProcessedAlert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  location: string;
  sensor_name?: string;
}

// Coordonnées par défaut pour TechCity (vous pouvez les ajuster selon votre ville)
const DEFAULT_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  'Place de la République': { lat: 48.8566, lng: 2.3522 },
  'Avenue du Général de Gaulle': { lat: 48.8680, lng: 2.3420 },
  'Zone Industrielle Sud': { lat: 48.8420, lng: 2.3650 },
  'Quartier Résidentiel Est': { lat: 48.8590, lng: 2.3780 },
  'Centre Commercial Ouest': { lat: 48.8540, lng: 2.3200 },
  'École Primaire Nord': { lat: 48.8650, lng: 2.3450 },
  'Proximité A86': { lat: 48.8320, lng: 2.3800 },
  'Hôpital Central': { lat: 48.8610, lng: 2.3350 },
  'Parc Municipal': { lat: 48.8580, lng: 2.3680 },
  'Hôtel de Ville': { lat: 48.8566, lng: 2.3522 },
  'Parc Central': { lat: 48.8600, lng: 2.3580 },
  'Zone Industrielle': { lat: 48.8420, lng: 2.3650 },
  'Quartier Pavillonnaire': { lat: 48.8520, lng: 2.3750 },
  'Parc des Sports': { lat: 48.8630, lng: 2.3720 },
  'Berges de la Seine': { lat: 48.8480, lng: 2.3400 },
  'Forêt Urbaine': { lat: 48.8720, lng: 2.3850 },
  'Avenue Principale': { lat: 48.8550, lng: 2.3500 },
  'Rond-Point Central': { lat: 48.8566, lng: 2.3522 },
  'Pont de TechCity': { lat: 48.8490, lng: 2.3430 },
  'Sortie Autoroute': { lat: 48.8340, lng: 2.3820 },
  'Zone Industrielle Nord': { lat: 48.8720, lng: 2.3300 },
  'Port Fluvial': { lat: 48.8440, lng: 2.3380 },
  'Gare Centrale': { lat: 48.8580, lng: 2.3540 }
};

const Dashboard = () => {
  // ============================================
  // ÉTATS POUR LES DONNÉES
  // ============================================
  const [sensors, setSensors] = useState<RealSensor[]>([]);
  const [sensorData, setSensorData] = useState<ProcessedSensorData[]>([]);
  const [alerts, setAlerts] = useState<ProcessedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // États pour les filtres
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sensorTypeFilter, setSensorTypeFilter] = useState<string>('all');

  // États pour les modales et affichage
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [mapExpanded, setMapExpanded] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<ProcessedSensorData | null>(null);

  const navigate = useNavigate();
  const user = getUserFromToken();
  const role = user?.role;

  // ============================================
  // FONCTION POUR DÉTERMINER LE STATUT
  // ============================================
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

  // ============================================
  // FONCTION POUR CHARGER LES DONNÉES RÉELLES (CORRIGÉE)
  // ============================================
  const loadRealData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('🔄 Chargement des données depuis votre base MySQL...');
      
      // 🔧 DEBUG - Vérifier le token
      const token = localStorage.getItem('userToken');
      console.log('🔑 Token trouvé:', token ? `${token.substring(0, 20)}...` : 'NON TROUVÉ');
      
      if (!token) {
        throw new Error('Token d\'authentification manquant - veuillez vous reconnecter');
      }
      
      // 1. Test de connexion direct d'abord
      console.log('📡 Test de connexion à l\'API...');
      const testResponse = await fetch('http://localhost:5000/api/sensors', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Réponse du serveur:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        headers: Object.fromEntries(testResponse.headers.entries())
      });
      
      if (!testResponse.ok) {
        const errorData = await testResponse.json().catch(() => ({}));
        console.error('❌ Erreur API:', errorData);
        throw new Error(`Erreur ${testResponse.status}: ${errorData.message || testResponse.statusText}`);
      }
      
      // Si on arrive ici, la connexion fonctionne !
      console.log('✅ Connexion API réussie, récupération des capteurs...');
      
      // 1. Charger tous les capteurs avec le service corrigé
      const sensorsData = await getSensors();
      console.log('📡 Capteurs chargés:', sensorsData.length);
      setSensors(sensorsData);

      // 2. Charger les données récentes de chaque capteur
      const allSensorData: ProcessedSensorData[] = [];
      
      for (const sensor of sensorsData) {
        try {
          const response = await getSensorData(sensor.id, { limit: 1 });
          
          if (response.data && response.data.length > 0) {
            const latestData = response.data[0];
            const status = determineStatus(sensor.type, latestData.value);
            
            // Obtenir les coordonnées pour la carte
            const coordinates = DEFAULT_COORDINATES[sensor.location] || { lat: 48.8566, lng: 2.3522 };
            
            allSensorData.push({
              id: `${sensor.id}-${latestData.id}`,
              sensor_id: sensor.id,
              type: sensor.type,
              value: latestData.value,
              unit: latestData.unit,
              status,
              location: sensor.location,
              timestamp: new Date(latestData.timestamp),
              sensor_name: sensor.name,
              latitude: coordinates.lat,
              longitude: coordinates.lng
            });
          }
        } catch (sensorError) {
          console.warn(`⚠️ Pas de données pour le capteur ${sensor.name}:`, sensorError);
          
          // Ajouter un capteur sans données mais visible sur la carte
          const coordinates = DEFAULT_COORDINATES[sensor.location] || { lat: 48.8566, lng: 2.3522 };
          allSensorData.push({
            id: `${sensor.id}-no-data`,
            sensor_id: sensor.id,
            type: sensor.type,
            value: 0,
            unit: getUnitForType(sensor.type),
            status: 'normal',
            location: sensor.location,
            timestamp: new Date(),
            sensor_name: sensor.name,
            latitude: coordinates.lat,
            longitude: coordinates.lng
          });
        }
      }

      console.log('📊 Données capteurs traitées:', allSensorData.length);
      setSensorData(allSensorData);

      // 3. Charger les alertes actives
      try {
        const alertsData = await getAlerts({ limit: 10, resolved: false });
        console.log('🚨 Alertes chargées:', alertsData.length);
        
        const processedAlerts: ProcessedAlert[] = alertsData.map((alert: RealAlert) => {
          const sensor = sensorsData.find(s => s.id === alert.sensor_id);
          return {
            id: alert.id.toString(),
            type: alert.alert_type,
            message: alert.message,
            timestamp: new Date(alert.created_at),
            location: sensor?.location || alert.sensor_location || 'Lieu inconnu',
            sensor_name: sensor?.name || alert.sensor_name || 'Capteur inconnu'
          };
        });
        
        setAlerts(processedAlerts);
      } catch (alertError) {
        console.warn('⚠️ Alertes non disponibles:', alertError);
        setAlerts([]);
      }

      setLastUpdate(new Date());
      setLoading(false);
      console.log('✅ Données chargées avec succès !');
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement des données:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion aux données');
      setLoading(false);
      
      // Si c'est une erreur d'authentification, rediriger vers login
      if (err instanceof Error && (err.message.includes('403') || err.message.includes('401'))) {
        console.log('🔄 Token invalide, redirection vers login...');
        removeToken();
        navigate("/auth?mode=login");
      }
    }
  };

  // ============================================
  // FONCTION UTILITAIRE POUR LES UNITÉS
  // ============================================
  const getUnitForType = (type: string): string => {
    switch (type) {
      case 'temperature': return '°C';
      case 'air_quality': return 'AQI';
      case 'noise': return 'dB';
      case 'humidity': return '%';
      case 'traffic': return 'véh/h';
      case 'pollution': return 'ppm';
      default: return '';
    }
  };

  // ============================================
  // PROTECTION DE ROUTE ET INITIALISATION
  // ============================================
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth?mode=login");
      return;
    }
    
    loadRealData();
    const interval = setInterval(loadRealData, 30000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  // ============================================
  // GESTION DES FILTRES
  // ============================================
  const filteredSensorData = sensorData.filter(sensor => {
    const locationMatch = locationFilter === 'all' || sensor.location === locationFilter;
    const typeMatch = sensorTypeFilter === 'all' || sensor.type === sensorTypeFilter;
    return locationMatch && typeMatch;
  });

  // ============================================
  // CALCULS STATISTIQUES
  // ============================================
  const totalSensors = sensors.length;
  const activeSensors = sensors.filter(s => s.status === 'actif').length;
  const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
  const avgTemperature = filteredSensorData
    .filter(s => s.type === 'temperature')
    .reduce((acc, s) => acc + s.value, 0) / 
    filteredSensorData.filter(s => s.type === 'temperature').length || 0;

  const locations = Array.from(new Set(sensors.map(s => s.location)));
  const sensorTypes = ['temperature', 'air_quality', 'noise', 'humidity', 'traffic', 'pollution'];

  const stats = [
    {
      label: 'Capteurs actifs',
      value: `${activeSensors}/${totalSensors}`,
      icon: MapPin,
      color: 'text-blue-500',
      trend: activeSensors === totalSensors ? '100% opérationnels' : `${Math.round((activeSensors/totalSensors)*100)}% actifs`
    },
    {
      label: 'Température moyenne',
      value: avgTemperature > 0 ? `${Math.round(avgTemperature * 10) / 10}°C` : 'N/A',
      icon: Thermometer,
      color: 'text-orange-500',
      trend: avgTemperature > 20 ? 'Au-dessus normale' : avgTemperature < 15 ? 'En dessous normale' : 'Normale'
    },
    {
      label: 'Alertes critiques',
      value: criticalAlerts.toString(),
      icon: AlertTriangle,
      color: 'text-red-500',
      trend: criticalAlerts === 0 ? 'Aucune alerte' : `${criticalAlerts} active${criticalAlerts > 1 ? 's' : ''}`
    },
    {
      label: 'Données temps réel',
      value: filteredSensorData.length.toString(),
      icon: Activity,
      color: 'text-green-500',
      trend: `Mis à jour: ${lastUpdate.toLocaleTimeString('fr-FR')}`
    }
  ];

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-500 bg-red-100';
      case 'warning': return 'text-yellow-500 bg-yellow-100';
      default: return 'text-green-500 bg-green-100';
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'critical': return '#ef4444'; // rouge
      case 'warning': return '#f59e0b'; // orange
      default: return '#22c55e'; // vert
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="h-5 w-5 text-orange-500" />;
      case 'air_quality': return <Wind className="h-5 w-5 text-blue-500" />;
      case 'noise': return <Volume2 className="h-5 w-5 text-purple-500" />;
      case 'traffic': return <Car className="h-5 w-5 text-gray-500" />;
      case 'humidity': return <Activity className="h-5 w-5 text-cyan-500" />;
      case 'pollution': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSensorTypeLabel = (type: string) => {
    switch (type) {
      case 'air_quality': return 'Qualité de l\'air';
      case 'temperature': return 'Température';
      case 'noise': return 'Bruit';
      case 'humidity': return 'Humidité';
      case 'traffic': return 'Circulation';
      case 'pollution': return 'Pollution';
      default: return type;
    }
  };

  // ============================================
  // COMPOSANT CARTE INTERACTIVE
  // ============================================
  const InteractiveMap = () => {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${mapExpanded ? 'fixed inset-4 z-50' : ''}`}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            🗺️ Carte interactive des capteurs TechCity
          </h3>
          <button
            onClick={() => setMapExpanded(!mapExpanded)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mapExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
        
        <div className={`relative ${mapExpanded ? 'h-full' : 'h-96'} bg-gradient-to-br from-blue-50 to-green-50`}>
          {/* Fond de carte stylisé */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Simulation d'une carte avec des routes */}
            <svg className="w-full h-full opacity-20">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Routes simulées */}
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#d1d5db" strokeWidth="3"/>
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#d1d5db" strokeWidth="3"/>
              <line x1="25%" y1="0" x2="75%" y2="100%" stroke="#e5e7eb" strokeWidth="2"/>
              <line x1="75%" y1="0" x2="25%" y2="100%" stroke="#e5e7eb" strokeWidth="2"/>
            </svg>
          </div>
          
          {/* Marqueurs des capteurs */}
          <div className="absolute inset-0 p-4">
            {filteredSensorData.map((sensor, index) => {
              // Calculer la position sur la carte (simulation)
              const xPercent = 20 + (index % 6) * 12;
              const yPercent = 15 + Math.floor(index / 6) * 15;
              
              return (
                <div
                  key={sensor.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ 
                    left: `${xPercent}%`, 
                    top: `${yPercent}%` 
                  }}
                  onClick={() => setSelectedSensor(sensor)}
                >
                  {/* Marqueur du capteur */}
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center transform group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: getMarkerColor(sensor.status) }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  
                  {/* Tooltip au survol */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    <div className="font-medium">{sensor.sensor_name}</div>
                    <div>{sensor.value} {sensor.unit}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Légende */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">État des capteurs</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span>Normal ({filteredSensorData.filter(s => s.status === 'normal').length})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span>Attention ({filteredSensorData.filter(s => s.status === 'warning').length})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span>Critique ({filteredSensorData.filter(s => s.status === 'critical').length})</span>
              </div>
            </div>
          </div>
          
          {/* Info zone */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900">TechCity Smart Sensors</div>
              <div className="text-gray-600">{filteredSensorData.length} capteurs actifs</div>
              <div className="text-xs text-gray-500 mt-1">
                Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // GESTION DES ERREURS
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erreur de connexion aux données
                </h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={loadRealData}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                  >
                    🔄 Réessayer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🏙️ Dashboard Smart City TechCity
            </h1>
            <p className="text-gray-600 mt-1">
              Données en temps réel avec carte interactive • Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
              {loading && <span className="ml-2 text-blue-500">• Actualisation en cours...</span>}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadRealData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.trend}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* CARTE INTERACTIVE */}
        <div className="mb-8">
          <InteractiveMap />
        </div>

        {/* Filtres */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les zones ({locations.length})</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de capteur</label>
              <select
                value={sensorTypeFilter}
                onChange={(e) => setSensorTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les types</option>
                {sensorTypes.map(type => (
                  <option key={type} value={type}>
                    {getSensorTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <div className="ml-auto">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                📊 {filteredSensorData.length} capteur{filteredSensorData.length > 1 ? 's' : ''} affiché{filteredSensorData.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Alertes actives */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-yellow-500" />
                  Alertes actives ({alerts.length})
                </h3>
              </div>
              <div className="p-6">
                {alerts.length > 0 ? (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {alert.timestamp.toLocaleTimeString('fr-FR')} - {alert.location}
                          </p>
                          {alert.sensor_name && (
                            <p className="text-xs text-blue-600 mt-1">📡 {alert.sensor_name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-600">Aucune alerte active</p>
                    <p className="text-xs text-gray-500 mt-1">Tous les systèmes fonctionnent normalement</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* État des capteurs par zone */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                  État des capteurs par zone
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {locations.slice(0, 6).map((location) => {
                    const locationSensors = filteredSensorData.filter(s => s.location === location);
                    const criticalCount = locationSensors.filter(s => s.status === 'critical').length;
                    const warningCount = locationSensors.filter(s => s.status === 'warning').length;
                    const normalCount = locationSensors.filter(s => s.status === 'normal').length;
                    const totalCount = locationSensors.length;

                    return (
                      <div key={location} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          {location}
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-600 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Normal
                            </span>
                            <span className="text-sm font-medium">{normalCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-yellow-600 flex items-center">
                              <Bell className="h-3 w-3 mr-1" />
                              Attention
                            </span>
                            <span className="text-sm font-medium">{warningCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-red-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Critique
                            </span>
                            <span className="text-sm font-medium">{criticalCount}</span>
                          </div>
                          <div className="pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-500">
                              Total: {totalCount} capteur{totalCount > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des données récentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Database className="h-5 w-5 mr-2 text-green-500" />
              Données récentes des capteurs ({filteredSensorData.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Dernières mesures de vos capteurs IoT en temps réel
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capteur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière mesure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSensorData.slice(0, 15).map((sensor) => (
                  <tr key={sensor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getSensorIcon(sensor.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {sensor.sensor_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getSensorTypeLabel(sensor.type)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {sensor.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className="bg-blue-50 px-2 py-1 rounded text-blue-800">
                        {sensor.value} {sensor.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sensor.status)}`}>
                        {sensor.status === 'normal' ? '✅ Normal' :
                         sensor.status === 'warning' ? '⚠️ Attention' : '🚨 Critique'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {sensor.timestamp.toLocaleString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setSelectedSensor(sensor)}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir sur carte
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredSensorData.length === 0 && !loading && (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucune donnée disponible avec les filtres actuels</p>
                <p className="text-sm text-gray-500 mt-1">
                  Vérifiez que vos capteurs sont configurés dans la base MySQL
                </p>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 text-blue-500 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600">Chargement des données depuis MySQL...</p>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="mt-6 flex justify-center space-x-4">
          {role === 'citoyen' && (
            <button
              onClick={() => setShowSuggestionModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              💡 Faire une suggestion
            </button>
          )}
          
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            📊 Exporter les données
          </button>
        </div>
      </div>

      {/* Modal d'export */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">📊 Exporter les données</h3>
              <p className="text-sm text-gray-600 mb-4">
                {filteredSensorData.length} capteur{filteredSensorData.length > 1 ? 's' : ''} sélectionné{filteredSensorData.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Export CSV logic
                    const dataToExport = filteredSensorData.map(sensor => ({
                      id: sensor.id,
                      sensor_name: sensor.sensor_name,
                      type: sensor.type,
                      location: sensor.location,
                      value: sensor.value,
                      unit: sensor.unit,
                      status: sensor.status,
                      timestamp: sensor.timestamp.toISOString()
                    }));
                    
                    const headers = 'ID,Nom Capteur,Type,Localisation,Valeur,Unité,Statut,Horodatage\n';
                    const csvContent = dataToExport.map(row =>
                      `${row.id},${row.sensor_name},${row.type},${row.location},${row.value},${row.unit},${row.status},${row.timestamp}`
                    ).join('\n');
                    const content = headers + csvContent;
                    
                    const blob = new Blob([content], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `donnees_capteurs_techcity_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    setShowExportModal(false);
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  📊 Exporter en CSV (Excel)
                </button>
                <button
                  onClick={() => {
                    // Export JSON logic
                    const dataToExport = filteredSensorData.map(sensor => ({
                      id: sensor.id,
                      sensor_name: sensor.sensor_name,
                      type: sensor.type,
                      location: sensor.location,
                      value: sensor.value,
                      unit: sensor.unit,
                      status: sensor.status,
                      timestamp: sensor.timestamp.toISOString()
                    }));
                    
                    const content = JSON.stringify(dataToExport, null, 2);
                    const blob = new Blob([content], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `donnees_capteurs_techcity_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    setShowExportModal(false);
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  📄 Exporter en JSON (Développeurs)
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suggestion */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                💡 Faire une suggestion
              </h3>
              <textarea
                value={newSuggestion}
                onChange={(e) => setNewSuggestion(e.target.value)}
                placeholder="Décrivez votre suggestion pour améliorer le système Smart City TechCity..."
                className="w-full p-3 border border-gray-300 rounded-md resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="mt-4 space-y-2">
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('userToken');
                      const response = await fetch('http://localhost:5000/api/suggestions', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          title: 'Suggestion depuis le Dashboard',
                          message: newSuggestion,
                          category: 'other',
                          priority: 'medium'
                        })
                      });

                      if (response.ok) {
                        alert('Suggestion envoyée avec succès !');
                        setNewSuggestion('');
                        setShowSuggestionModal(false);
                      } else {
                        throw new Error('Erreur lors de l\'envoi');
                      }
                    } catch (error) {
                      console.error('Erreur:', error);
                      alert('Erreur lors de l\'envoi de la suggestion');
                    }
                  }}
                  disabled={!newSuggestion.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  📝 Envoyer la suggestion
                </button>
                <button
                  onClick={() => {
                    setShowSuggestionModal(false);
                    setNewSuggestion('');
                  }}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détail du capteur sélectionné */}
      {selectedSensor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                {getSensorIcon(selectedSensor.type)}
                <span className="ml-2">Détails du capteur</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nom</label>
                  <p className="text-sm text-gray-900">{selectedSensor.sensor_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{getSensorTypeLabel(selectedSensor.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Localisation</label>
                  <p className="text-sm text-gray-900">{selectedSensor.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Valeur actuelle</label>
                  <p className="text-lg font-bold text-blue-600">
                    {selectedSensor.value} {selectedSensor.unit}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Statut</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedSensor.status)}`}>
                    {selectedSensor.status === 'normal' ? '✅ Normal' :
                     selectedSensor.status === 'warning' ? '⚠️ Attention' : '🚨 Critique'}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Dernière mesure</label>
                  <p className="text-sm text-gray-900">{selectedSensor.timestamp.toLocaleString('fr-FR')}</p>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => setSelectedSensor(null)}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;