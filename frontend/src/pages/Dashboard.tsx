import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import RealSensorsMap from "../components/RealSensorsMap";  // Nouveau composant
import { isLoggedIn, removeToken, getUserFromToken } from "../services/auth";
import { useNavigate } from "react-router-dom";
import {
  getSensors,
  createSensor,
  updateSensor,
  deleteSensor
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
  PlusCircle,
  FileText
} from 'lucide-react';

// Types pour les données en temps réel
interface SensorData {
  id: string;
  type: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  location: string;
  timestamp: Date;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  location: string;
}

// Obtenir les informations utilisateur
const user = getUserFromToken();
const role = user?.role;

const Dashboard = () => {
  // États principaux
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'overview' | 'map' | 'data'>('overview');

  // États pour les filtres
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
  const [newSuggestion, setNewSuggestion] = useState('');

  const navigate = useNavigate();

  // Protection de route
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth?mode=login");
    }
  }, [navigate]);

  // Génération des données simulées (en attendant l'intégration API complète)
  useEffect(() => {
    const generateSensorData = (): SensorData[] => {
      const sensors = [
        { type: 'temperature', icon: Thermometer, unit: '°C', min: 15, max: 35 },
        { type: 'air_quality', icon: Wind, unit: 'AQI', min: 20, max: 200 },
        { type: 'noise_level', icon: Volume2, unit: 'dB', min: 30, max: 80 },
        { type: 'traffic', icon: Car, unit: 'véh/h', min: 50, max: 500 }
      ];

      const locations = ['Centre-ville', 'Quartier Nord', 'Zone Sud', 'Quartier Est', 'Zone Ouest'];

      return Array.from({ length: 20 }, (_, i) => {
        const sensor = sensors[i % sensors.length];
        const value = sensor.min + Math.random() * (sensor.max - sensor.min);
        let status: 'normal' | 'warning' | 'critical' = 'normal';

        if (sensor.type === 'air_quality' && value > 150) status = 'critical';
        else if (sensor.type === 'air_quality' && value > 100) status = 'warning';
        else if (sensor.type === 'noise_level' && value > 70) status = 'critical';
        else if (sensor.type === 'noise_level' && value > 60) status = 'warning';
        else if (sensor.type === 'temperature' && (value > 30 || value < 10)) status = 'critical';
        else if (sensor.type === 'temperature' && (value > 25 || value < 15)) status = 'warning';
        else if (sensor.type === 'traffic' && value > 400) status = 'critical';
        else if (sensor.type === 'traffic' && value > 300) status = 'warning';

        return {
          id: `sensor-${i + 1}`,
          type: sensor.type,
          value: Math.round(value * 10) / 10,
          unit: sensor.unit,
          status,
          location: locations[i % locations.length],
          timestamp: new Date(Date.now() - Math.random() * 3600000)
        };
      });
    };

    const generateAlerts = (sensors: SensorData[]): Alert[] => {
      return sensors
        .filter(sensor => sensor.status !== 'normal')
        .slice(0, 5)
        .map(sensor => ({
          id: `alert-${sensor.id}`,
          type: sensor.status === 'critical' ? 'critical' : 'warning',
          message: `${sensor.type === 'air_quality' ? 'Qualité de l\'air' :
            sensor.type === 'noise_level' ? 'Niveau sonore' :
              sensor.type === 'temperature' ? 'Température' : 'Trafic'} 
                   ${sensor.status === 'critical' ? 'critique' : 'élevé(e)'} détecté(e) à ${sensor.location}`,
          timestamp: new Date(),
          location: sensor.location
        }));
    };

    const updateData = () => {
      const newSensorData = generateSensorData();
      const newAlerts = generateAlerts(newSensorData);

      setSensorData(newSensorData);
      setAlerts(newAlerts);
      setLastUpdate(new Date());
      setIsLoading(false);
    };

    updateData();
    const interval = setInterval(updateData, 30000); // Mise à jour toutes les 30 secondes

    return () => clearInterval(interval);
  }, [locationFilter, sensorTypeFilter]);

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
      case 'noise_level': return <Volume2 className="h-5 w-5 text-purple-500" />;
      case 'traffic': return <Car className="h-5 w-5 text-gray-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  // Fonctions pour l'export de données
  const exportData = (format: 'csv' | 'json') => {
    const dataToExport = sensorData.map(sensor => ({
      id: sensor.id,
      type: sensor.type,
      location: sensor.location,
      value: sensor.value,
      unit: sensor.unit,
      status: sensor.status,
      timestamp: sensor.timestamp.toISOString()
    }));

    let content: string;
    let fileName: string;

    if (format === 'csv') {
      const headers = 'ID,Type,Location,Value,Unit,Status,Timestamp\n';
      const csvContent = dataToExport.map(row =>
        `${row.id},${row.type},${row.location},${row.value},${row.unit},${row.status},${row.timestamp}`
      ).join('\n');
      content = headers + csvContent;
      fileName = `sensor_data_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      content = JSON.stringify(dataToExport, null, 2);
      fileName = `sensor_data_${new Date().toISOString().split('T')[0]}.json`;
    }

    const blob = new Blob([content], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const submitSuggestion = () => {
    if (newSuggestion.trim()) {
      console.log('Nouvelle suggestion:', newSuggestion);
      setNewSuggestion('');
      setShowSuggestionModal(false);
      // Ici vous ajouteriez l'appel API pour envoyer la suggestion
    }
  };

  // Données pour les statistiques
  const stats = [
    {
      label: 'Capteurs actifs',
      value: sensorData.filter(s => s.status !== 'critical').length.toString(),
      trend: '+2.5%',
      icon: Activity,
      color: 'text-green-500'
    },
    {
      label: 'Alertes actives',
      value: alerts.length.toString(),
      trend: alerts.length > 3 ? '+15%' : '-5%',
      icon: Bell,
      color: alerts.length > 3 ? 'text-red-500' : 'text-yellow-500'
    },
    {
      label: 'Qualité air moyenne',
      value: Math.round(sensorData.filter(s => s.type === 'air_quality').reduce((acc, s) => acc + s.value, 0) / 
             sensorData.filter(s => s.type === 'air_quality').length || 0).toString(),
      trend: '-3.2%',
      icon: Wind,
      color: 'text-blue-500'
    },
    {
      label: 'Température moyenne',
      value: Math.round(sensorData.filter(s => s.type === 'temperature').reduce((acc, s) => acc + s.value, 0) / 
             sensorData.filter(s => s.type === 'temperature').length || 0) + '°C',
      trend: '+1.8%',
      icon: Thermometer,
      color: 'text-orange-500'
    }
  ];

  const locations = [...new Set(sensorData.map(s => s.location))];
  const sensorTypes = [...new Set(sensorData.map(s => s.type))];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête avec navigation */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord TechCity</h1>
              <p className="text-gray-600 mt-1">
                Surveillance en temps réel des capteurs IoT - 
                Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
              </p>
            </div>
            <button
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 1000);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>

          {/* Navigation des vues */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentView('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'overview'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setCurrentView('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'map'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Carte interactive
            </button>
            <button
              onClick={() => setCurrentView('data')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'data'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Données détaillées
            </button>
          </div>
        </div>

        {/* Contenu basé sur la vue sélectionnée */}
        {currentView === 'overview' && (
          <>
            {/* Stats Overview */}
            <div className="mb-8">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Alertes récentes */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-yellow-500" />
                      Alertes récentes
                    </h3>
                  </div>
                  <div className="p-6">
                    {alerts.length > 0 ? (
                      <div className="space-y-4">
                        {alerts.map((alert) => (
                          <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                            {getAlertIcon(alert.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">{alert.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {alert.timestamp.toLocaleTimeString('fr-FR')} - {alert.location}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-600">Aucune alerte active</p>
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
                      {locations.slice(0, 4).map((location) => {
                        const locationSensors = sensorData.filter(s => s.location === location);
                        const criticalCount = locationSensors.filter(s => s.status === 'critical').length;
                        const warningCount = locationSensors.filter(s => s.status === 'warning').length;
                        const normalCount = locationSensors.filter(s => s.status === 'normal').length;

                        return (
                          <div key={location} className="p-4 border border-gray-200 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-3">{location}</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Normal</span>
                                <span className="text-sm font-medium text-green-600">{normalCount}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Attention</span>
                                <span className="text-sm font-medium text-yellow-600">{warningCount}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Critique</span>
                                <span className="text-sm font-medium text-red-600">{criticalCount}</span>
                              </div>
                            </div>

                            <div className="mt-3 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-l-full"
                                style={{ width: `${locationSensors.length > 0 ? (normalCount / locationSensors.length) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {locationSensors.length} capteur(s) total
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides selon le rôle */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(role === 'gestionnaire' || role === 'admin') && (
                  <>
                    <button 
                      onClick={() => setCurrentView('data')}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center justify-center"
                    >
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Analyser tendances
                    </button>
                    <button 
                      onClick={() => setCurrentView('map')}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center"
                    >
                      <MapPin className="h-5 w-5 mr-2" />
                      Carte interactive
                    </button>
                    <button 
                      onClick={() => setShowExportModal(true)}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center justify-center"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Générer rapport
                    </button>
                    <button 
                      onClick={() => setShowAddSensorModal(true)}
                      className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition duration-200 flex items-center justify-center"
                    >
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Ajouter capteur
                    </button>
                  </>
                )}
                {role === 'citoyen' && (
                  <>
                    <button 
                      onClick={() => setCurrentView('map')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                    >
                      <MapPin className="h-5 w-5 mr-2" />
                      Voir la carte
                    </button>
                    <button 
                      onClick={() => setShowSuggestionModal(true)}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center"
                    >
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Faire suggestion
                    </button>
                  </>
                )}
                {(role === 'chercheur') && (
                  <>
                    <button 
                      onClick={() => setShowExportModal(true)}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center justify-center"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Exporter données
                    </button>
                    <button 
                      onClick={() => setCurrentView('data')}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center justify-center"
                    >
                      <Database className="h-5 w-5 mr-2" />
                      Analyser données
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Vue Carte Interactive */}
        {currentView === 'map' && (
          <div>
            <RealSensorsMap />
          </div>
        )}

        {/* Vue Données Détaillées */}
        {currentView === 'data' && (
          <div className="space-y-6">
            {/* Filtres */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres de données</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700">Début:</label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700">Fin:</label>
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
              </div>
            </div>

            {/* Tableau de données détaillées */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Données en temps réel</h3>
                
                <div className="flex space-x-2">
                  {(role === 'chercheur' || role === 'gestionnaire') && (
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Download className="h-4 w-4" />
                      <span>Exporter</span>
                    </button>
                  )}
                  {role === 'citoyen' && (
                    <button
                      onClick={() => setShowSuggestionModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Suggestion</span>
                    </button>
                  )}
                  {(role === 'gestionnaire' || role === 'admin') && (
                    <button
                      onClick={() => setShowAddSensorModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Ajouter</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type de capteur
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
                        Dernière mise à jour
                      </th>
                      {(role === 'gestionnaire' || role === 'admin') && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sensorData.slice(0, 15).map((sensor) => (
                      <tr key={sensor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getSensorIcon(sensor.type)}
                            <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                              {sensor.type.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {sensor.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sensor.value} {sensor.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sensor.status)}`}>
                            {sensor.status === 'normal' ? 'Normal' :
                              sensor.status === 'warning' ? 'Attention' : 'Critique'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sensor.timestamp.toLocaleTimeString('fr-FR')}
                        </td>
                        {(role === 'gestionnaire' || role === 'admin') && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button className="text-indigo-600 hover:text-indigo-900">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="text-yellow-600 hover:text-yellow-900">
                                <Settings className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {/* Modal d'export */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporter les données</h3>
            <p className="text-gray-600 mb-6">Choisissez le format d'export des données des capteurs.</p>
            <div className="flex space-x-4">
              <button
                onClick={() => exportData('csv')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Exporter en CSV
              </button>
              <button
                onClick={() => exportData('json')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Exporter en JSON
              </button>
            </div>
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Modal de suggestion */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Faire une suggestion</h3>
            <textarea
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none"
              placeholder="Décrivez votre suggestion pour améliorer le système..."
            />
            <div className="flex space-x-4 mt-4">
              <button
                onClick={submitSuggestion}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Envoyer
              </button>
              <button
                onClick={() => setShowSuggestionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout de capteur */}
      {showAddSensorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un capteur</h3>
            <p className="text-gray-600 mb-6">Fonctionnalité en cours de développement.</p>
            <button
              onClick={() => setShowAddSensorModal(false)}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;