// frontend/src/pages/Dashboard.tsx - Corrections des types
import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { isLoggedIn, removeToken, getUserFromToken } from "../services/auth";
import { useNavigate } from "react-router-dom";
import {
  getSensors,
  createSensor,
  updateSensor,
  deleteSensor,
  getSensorData,
  getAlerts,
  getSensorStatistics,
  Sensor,
  Alert,
  AlertResponse
} from "../services/sensor";

// Import des nouveaux composants
import LeafletMap from "../components/LeafletMap";
import SensorCRUDModal from "../components/SensorCRUDModal";

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
  MessageSquare
} from 'lucide-react';

// Types locaux corrigés pour éviter les conflits
interface LocalSensorData {
  id: string;
  type: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  location: string;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
}

// Interface pour les alertes locales (simulation)
interface LocalAlert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  location: string;
}

// Interface pour les données de la carte (compatible avec LeafletMap)
interface MapSensorData {
  id?: number;
  name: string;
  type: 'temperature' | 'air_quality' | 'noise' | 'humidity' | 'traffic' | 'pollution';
  location: string;
  latitude?: number;
  longitude?: number;
  status: 'normal' | 'warning' | 'critical'; // Status fonctionnel
  value?: number;
  unit?: string;
  timestamp?: Date;
  installed_at?: string; // Ajouté pour la compatibilité
}

interface Statistics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  recentData: Record<string, { count: number; average: string }>;
}

const user = getUserFromToken();
const role = user?.role;

const Dashboard = () => {
  // États existants conservés avec types corrigés
  const [sensorData, setSensorData] = useState<LocalSensorData[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<LocalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Nouveaux états pour l'intégration API
  const [realAlerts, setRealAlerts] = useState<Alert[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Fonctions de navigation conservées
  const handleLogin = () => navigate("/auth?mode=login");
  const logged = isLoggedIn();
  const handleRegister = () => navigate("/auth?mode=register");
  const handleDashboard = () => navigate("/dashboard");
  const handleHome = () => navigate("/");
  const handleViewPublicData = () => navigate("/donnees-publiques");
  const handleLogout = () => {
    removeToken();
    navigate("/auth?mode=login");
  };

  // États pour les filtres (conservés)
  const [dateFilter, setDateFilter] = useState({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sensorTypeFilter, setSensorTypeFilter] = useState<string>('all');

  // États pour les modales
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showAddSensorModal, setShowAddSensorModal] = useState(false);
  const [showSensorModal, setShowSensorModal] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState('');

  // PROTECTION DE ROUTE
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth?mode=login");
    }
  }, [navigate]);

  // Nouvelle fonction pour charger les vraies données depuis l'API
  const loadRealData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les données depuis l'API
      const [sensorsData, statsData, alertsResponse] = await Promise.all([
        getSensors(),
        getSensorStatistics().catch(() => null),
        getAlerts({ limit: 10, resolved: false }).catch(() => ({ alerts: [] }))
      ]);

      setSensors(sensorsData);

      if (statsData) {
        setStatistics(statsData);
      }

      // Gestion des alertes API
      const alertsArray = Array.isArray(alertsResponse)
        ? alertsResponse
        : (alertsResponse as AlertResponse).alerts || [];

      const validAlerts: Alert[] = alertsArray.filter((alert: any) => alert.id !== undefined);
      setRealAlerts(validAlerts);

      // Générer des données simulées à partir des vrais capteurs
      const simulatedData = generateSensorDataFromReal(sensorsData);
      setSensorData(simulatedData);

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erreur chargement données API:', err);
      setError('Impossible de charger les données depuis l\'API. Mode simulation activé.');
      generateSimulatedData();
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  // Fonction pour générer des données à partir des vrais capteurs
  const generateSensorDataFromReal = (realSensors: Sensor[]): LocalSensorData[] => {
    const sensorTypeConfigs = {
      temperature: { min: 15, max: 35, unit: '°C', warning: 25, critical: 30 },
      air_quality: { min: 20, max: 200, unit: 'AQI', warning: 100, critical: 150 },
      noise: { min: 30, max: 80, unit: 'dB', warning: 60, critical: 70 },
      humidity: { min: 30, max: 90, unit: '%', warning: 80, critical: 85 },
      traffic: { min: 50, max: 500, unit: 'véh/h', warning: 300, critical: 400 },
      pollution: { min: 10, max: 150, unit: 'µg/m³', warning: 80, critical: 120 }
    };

    return realSensors.map(sensor => {
      const config = sensorTypeConfigs[sensor.type as keyof typeof sensorTypeConfigs];
      if (!config) return {
        id: sensor.id?.toString() || 'unknown',
        type: sensor.type,
        value: 0,
        unit: '',
        status: 'normal' as const,
        location: sensor.location,
        timestamp: new Date(),
        latitude: sensor.latitude,
        longitude: sensor.longitude
      };

      const value = Math.round((Math.random() * (config.max - config.min) + config.min) * 10) / 10;

      let status: 'normal' | 'warning' | 'critical';
      if (value >= config.critical) {
        status = 'critical';
      } else if (value >= config.warning) {
        status = 'warning';
      } else {
        status = 'normal';
      }

      return {
        id: sensor.id?.toString() || 'unknown',
        type: sensor.type,
        value,
        unit: config.unit,
        status,
        location: sensor.location,
        timestamp: new Date(),
        latitude: sensor.latitude,
        longitude: sensor.longitude
      };
    });
  };

  // Fonction de simulation de fallback
  const generateSimulatedData = () => {
    const sensorsConfig = [
      { type: 'temperature', icon: Thermometer, unit: '°C', min: 15, max: 35 },
      { type: 'air_quality', icon: Wind, unit: 'AQI', min: 20, max: 200 },
      { type: 'noise_level', icon: Volume2, unit: 'dB', min: 30, max: 80 },
      { type: 'traffic', icon: Car, unit: 'véh/h', min: 50, max: 500 }
    ];

    const locations = ['Centre-ville', 'Quartier Nord', 'Zone Sud', 'Périphérie Est', 'Ouest Résidentiel'];

    let allSensors = sensorsConfig.flatMap(sensor =>
      locations.map((location, index) => {
        const value = Math.random() * (sensor.max - sensor.min) + sensor.min;
        let status: 'normal' | 'warning' | 'critical' = 'normal';

        if (sensor.type === 'air_quality' && value > 100) status = 'warning';
        if (sensor.type === 'air_quality' && value > 150) status = 'critical';
        if (sensor.type === 'noise_level' && value > 65) status = 'warning';
        if (sensor.type === 'noise_level' && value > 75) status = 'critical';
        if (sensor.type === 'temperature' && (value < 18 || value > 30)) status = 'warning';

        const baseCoords = [
          { lat: 48.8566, lng: 2.3522 },
          { lat: 48.8848, lng: 2.3504 },
          { lat: 48.8322, lng: 2.3509 },
          { lat: 48.8534, lng: 2.3776 },
          { lat: 48.8556, lng: 2.3152 }
        ];

        const coords = baseCoords[index] || baseCoords[0];

        return {
          id: `${sensor.type}-${location}`,
          type: sensor.type,
          value: Math.round(value * 10) / 10,
          unit: sensor.unit,
          status,
          location,
          timestamp: new Date(),
          latitude: coords.lat + (Math.random() - 0.5) * 0.01,
          longitude: coords.lng + (Math.random() - 0.5) * 0.01
        };
      })
    );

    // Appliquer les filtres
    if (locationFilter !== 'all') {
      allSensors = allSensors.filter(s => s.location === locationFilter);
    }
    if (sensorTypeFilter !== 'all') {
      allSensors = allSensors.filter(s => s.type === sensorTypeFilter);
    }

    setSensorData(allSensors);

    // CORRECTION : Générer les alertes avec le bon type
    const newAlerts: LocalAlert[] = allSensors
      .filter(sensor => sensor.status !== 'normal')
      .slice(0, 5)
      .map((sensor, index) => ({
        id: `alert-${index}`,
        type: sensor.status as 'warning' | 'critical', // Cast explicite
        message: `${sensor.type === 'air_quality' ? 'Qualité de l\'air' :
          sensor.type === 'noise_level' ? 'Niveau sonore' :
            sensor.type === 'temperature' ? 'Température' : 'Trafic'} 
                 ${sensor.status === 'critical' ? 'critique' : 'élevé(e)'} détecté(e) à ${sensor.location}`,
        timestamp: new Date(),
        location: sensor.location
      }));

    setAlerts(newAlerts);
  };

  // Effet principal pour charger les données
  useEffect(() => {
    if (sensors.length === 0) {
      loadRealData();
    } else {
      const simulatedData = generateSensorDataFromReal(sensors);
      setSensorData(simulatedData);
    }

    const interval = setInterval(() => {
      if (sensors.length > 0) {
        const simulatedData = generateSensorDataFromReal(sensors);
        setSensorData(simulatedData);
        setLastUpdate(new Date());
      } else {
        generateSimulatedData();
        setLastUpdate(new Date());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [locationFilter, sensorTypeFilter, sensors]);

  // Fonctions utilitaires
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-500 bg-red-100';
      case 'warning': return 'text-yellow-500 bg-yellow-100';
      default: return 'text-green-500 bg-green-100';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <Bell className="h-5 w-5 text-yellow-500" />;
      default: return <CheckCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="h-5 w-5 text-orange-500" />;
      case 'air_quality': return <Wind className="h-5 w-5 text-blue-500" />;
      case 'noise_level':
      case 'noise': return <Volume2 className="h-5 w-5 text-purple-500" />;
      case 'traffic': return <Car className="h-5 w-5 text-gray-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  // Fonction export
  const exportData = (format: 'csv' | 'json') => {
    const dataToExport = sensorData.map(sensor => ({
      id: sensor.id,
      type: sensor.type,
      location: sensor.location,
      value: sensor.value,
      unit: sensor.unit,
      status: sensor.status,
      latitude: sensor.latitude,
      longitude: sensor.longitude,
      timestamp: sensor.timestamp.toISOString()
    }));

    let content: string;
    let fileName: string;

    if (format === 'csv') {
      const headers = 'ID,Type,Location,Value,Unit,Status,Latitude,Longitude,Timestamp\n';
      const csvContent = dataToExport.map(row =>
        `${row.id},${row.type},${row.location},${row.value},${row.unit},${row.status},${row.latitude},${row.longitude},${row.timestamp}`
      ).join('\n');
      content = headers + csvContent;
      fileName = `techcity_sensor_data_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      content = JSON.stringify(dataToExport, null, 2);
      fileName = `techcity_sensor_data_${new Date().toISOString().split('T')[0]}.json`;
    }

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    setShowExportModal(false);
  };

  const submitSuggestion = () => {
    console.log('Suggestion envoyée:', newSuggestion);
    alert('Suggestion envoyée avec succès !');
    setNewSuggestion('');
    setShowSuggestionModal(false);
  };

  // CORRECTION : Fonction pour gérer les clics sur la carte avec le bon type
  const handleSensorClick = (sensor: MapSensorData) => {
    console.log('Capteur sélectionné:', sensor);
  };

  const handleSensorChange = () => {
    loadRealData();
  };

  // Calculs statistiques
  const totalSensors = sensorData.length;
  const activeSensors = sensorData.filter(s => s.status !== 'critical').length;
  const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
  const avgTemperature = sensorData
    .filter(s => s.type === 'temperature')
    .reduce((acc, s) => acc + s.value, 0) / sensorData.filter(s => s.type === 'temperature').length || 0;

  const locations = ['Centre-ville', 'Quartier Nord', 'Zone Sud', 'Périphérie Est', 'Ouest Résidentiel'];
  const sensorTypes = ['temperature', 'air_quality', 'noise_level', 'noise', 'traffic', 'humidity', 'pollution'];

  const stats = [
    {
      label: 'Capteurs actifs',
      value: `${activeSensors}/${totalSensors}`,
      icon: MapPin,
      color: 'text-blue-500',
      trend: `${Math.round((activeSensors / totalSensors) * 100)}% opérationnels`
    },
    {
      label: 'Température moyenne',
      value: `${Math.round(avgTemperature * 10) / 10}°C`,
      icon: Thermometer,
      color: 'text-orange-500',
      trend: avgTemperature > 25 ? 'Élevée' : 'Normale'
    },
    {
      label: 'Alertes critiques',
      value: criticalAlerts.toString(),
      icon: AlertTriangle,
      color: criticalAlerts > 0 ? 'text-red-500' : 'text-green-500',
      trend: criticalAlerts > 0 ? 'Attention requise' : 'Situation normale'
    },
    {
      label: 'Qualité de l\'air',
      value: 'Modérée',
      icon: Wind,
      color: 'text-green-500',
      trend: 'Stable'
    }
  ];

  // CORRECTION : Conversion des données pour la carte avec tous les champs requis
  const sensorDataForMap: MapSensorData[] = sensorData
    .filter(sensor => sensor.latitude && sensor.longitude)
    .map(sensor => ({
      id: parseInt(sensor.id) || 0,
      name: `Capteur ${sensor.type.replace('_', ' ')} ${sensor.location}`,
      type: sensor.type as 'temperature' | 'air_quality' | 'noise' | 'humidity' | 'traffic' | 'pollution',
      location: sensor.location,
      latitude: sensor.latitude!,
      longitude: sensor.longitude!,
      status: sensor.status,
      value: sensor.value,
      unit: sensor.unit,
      timestamp: sensor.timestamp,
      installed_at: new Date().toISOString().split('T')[0] // Valeur par défaut
    }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord TechCity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')} title="Retour à l'accueil">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">TechCity IoT Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Temps réel</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">
                Dernière maj: {lastUpdate.toLocaleTimeString('fr-FR')}
              </span>
              {error && (
                <>
                  <div className="h-6 w-px bg-gray-300"></div>
                  <span className="text-xs text-orange-500">Mode simulation</span>
                </>
              )}
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="hidden md:flex items-center space-x-6">
                {logged ? (
                  <>
                    <span className="text-sm font-medium text-indigo-600 capitalize">
                      {user?.role} - {user?.first_name} {user?.last_name}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 mr-2"
                  >
                    Se connecter
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
              <button onClick={loadRealData} className="ml-auto text-orange-600 hover:text-orange-800">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Période:</label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              />
              <span className="text-gray-500">à</span>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Zone:</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">Toutes les zones</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={sensorTypeFilter}
                onChange={(e) => setSensorTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">Tous les types</option>
                {sensorTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setIsLoading(true);
                loadRealData();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Vue d'ensemble</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">{stat.trend}</span>
                    </div>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carte Interactive */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                    Carte Interactive des Capteurs IoT
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {sensorDataForMap.length} capteur(s) affiché(s) • Cliquez sur un marqueur pour plus d'infos
                  </p>
                </div>

                {(role === 'gestionnaire' || role === 'admin') && (
                  <button
                    onClick={() => setShowSensorModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Gérer Capteurs</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              <LeafletMap
                sensors={sensorDataForMap}
                className="h-96 w-full"
                locationFilter={locationFilter}
                sensorTypeFilter={sensorTypeFilter}
                onSensorClick={handleSensorClick}
              />
            </div>
          </div>
        </div>

        {/* Reste du contenu identique... */}
        {/* Je garde le reste de votre code pour éviter la répétition */}
      </div>

      {/* Modal CRUD Capteurs */}
      <SensorCRUDModal
        isOpen={showSensorModal}
        onClose={() => setShowSensorModal(false)}
        onSensorChange={handleSensorChange}
      />

      {/* Vos autres modales existantes... */}
    </div>
  );
};

export default Dashboard;