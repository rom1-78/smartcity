import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { isLoggedIn, removeToken, getUserFromToken } from "../services/auth";
import { useNavigate } from "react-router-dom";


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

// Types existants + nouveaux types pour la base de données
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

const user = getUserFromToken();
const role = user?.role;


const Dashboard = () => {
  // États existants
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
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

  // Nouveaux états pour les fonctionnalités avancées
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

  // Simulation de l'utilisateur connecté
  const user = getUserFromToken();
  const role = user?.role;


  // PROTECTION DE ROUTE (votre code existant)
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth?mode=login");
    }
  }, [navigate]);

  // Génération des données (votre code existant amélioré)
  useEffect(() => {
    const generateSensorData = (): SensorData[] => {
      const sensors = [
        { type: 'temperature', icon: Thermometer, unit: '°C', min: 15, max: 35 },
        { type: 'air_quality', icon: Wind, unit: 'AQI', min: 20, max: 200 },
        { type: 'noise_level', icon: Volume2, unit: 'dB', min: 30, max: 80 },
        { type: 'traffic', icon: Car, unit: 'véh/h', min: 50, max: 500 }
      ];

      const locations = ['Centre-ville', 'Quartier Nord', 'Zone Sud', 'Périphérie Est', 'Ouest Résidentiel'];

      let allSensors = sensors.flatMap(sensor =>
        locations.map(location => {
          const value = Math.random() * (sensor.max - sensor.min) + sensor.min;
          let status: 'normal' | 'warning' | 'critical' = 'normal';

          if (sensor.type === 'air_quality' && value > 100) status = 'warning';
          if (sensor.type === 'air_quality' && value > 150) status = 'critical';
          if (sensor.type === 'noise_level' && value > 65) status = 'warning';
          if (sensor.type === 'noise_level' && value > 75) status = 'critical';
          if (sensor.type === 'temperature' && (value < 18 || value > 30)) status = 'warning';

          return {
            id: `${sensor.type}-${location}`,
            type: sensor.type,
            value: Math.round(value * 10) / 10,
            unit: sensor.unit,
            status,
            location,
            timestamp: new Date()
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

      return allSensors;
    };

    const generateAlerts = (sensors: SensorData[]): Alert[] => {
      return sensors
        .filter(sensor => sensor.status !== 'normal')
        .slice(0, 5)
        .map((sensor, index) => ({
          id: `alert-${index}`,
          type: sensor.status === 'warning' ? 'warning' : 'critical',
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
    const interval = setInterval(updateData, 5000);

    return () => clearInterval(interval);
  }, [locationFilter, sensorTypeFilter]); // Relancer quand les filtres changent

  // Fonctions utilitaires (votre code existant)
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

  // Nouvelles fonctions pour les fonctionnalités avancées
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
    // Ici vous pourrez ajouter l'appel API plus tard
    console.log('Suggestion envoyée:', newSuggestion);
    alert('Suggestion envoyée avec succès !');
    setNewSuggestion('');
    setShowSuggestionModal(false);
  };


  // Calculs statistiques (votre code existant)
  const totalSensors = sensorData.length;
  const activeSensors = sensorData.filter(s => s.status !== 'critical').length;
  const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
  const avgTemperature = sensorData
    .filter(s => s.type === 'temperature')
    .reduce((acc, s) => acc + s.value, 0) / sensorData.filter(s => s.type === 'temperature').length || 0;

  const locations = ['Centre-ville', 'Quartier Nord', 'Zone Sud', 'Périphérie Est', 'Ouest Résidentiel'];
  const sensorTypes = ['temperature', 'air_quality', 'noise_level', 'traffic'];

  const stats = [
    {
      label: 'Capteurs actifs',
      value: `${activeSensors}/${totalSensors}`,
      icon: MapPin,
      color: 'text-blue-500',
      trend: '+2.5%'
    },
    {
      label: 'Température moyenne',
      value: `${Math.round(avgTemperature * 10) / 10}°C`,
      icon: Thermometer,
      color: 'text-orange-500',
      trend: '+1.2°C'
    },
    {
      label: 'Alertes critiques',
      value: criticalAlerts.toString(),
      icon: AlertTriangle,
      color: 'text-red-500',
      trend: criticalAlerts > 0 ? `+${criticalAlerts}` : '0'
    },
    {
      label: 'Qualité de l\'air',
      value: 'Modérée',
      icon: Wind,
      color: 'text-green-500',
      trend: 'Stable'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header amélioré */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')} title="Retour à l'accueil" >
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">TechCity Dashboard</span>
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
                  <>
                    <button
                      onClick={handleLogin}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 mr-2"
                    >
                      Se connecter
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Nouveaux filtres */}
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
                // Force le recalcul des données
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 500);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Stats Overview (votre code existant) */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Alertes récentes (votre code existant) */}
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

          {/* État des capteurs par zone (votre code existant) */}
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

        {/* Données détaillées avec nouveaux boutons */}
        <div className="mt-8">
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
                {(role === 'admin' || role === 'gestionnaire') && (
                  <button
                    onClick={() => setShowAddSensorModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Gérer capteurs</span>
                  </button>
                )}
              </div>
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
                  {sensorData.slice(0, 10).map((sensor) => (
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

        {/* Actions rapides selon le rôle */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(role === 'gestionnaire' || role === 'admin') && (
              <>
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analyser tendances
                </button>
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Carte interactive
                </button>
                <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center justify-center">
                  <Database className="h-5 w-5 mr-2" />
                  Générer rapport
                </button>
                <button className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition duration-200 flex items-center justify-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Config. alertes
                </button>
              </>
            )}

            {role === 'citoyen' && (
              <>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Mon quartier
                </button>
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Mes alertes
                </button>
                <button
                  onClick={() => setShowSuggestionModal(true)}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center justify-center"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Faire suggestion
                </button>
                <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition duration-200 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Voir statistiques
                </button>
              </>
            )}

            {role === 'chercheur' && (
              <>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Exporter données
                </button>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analyse avancée
                </button>
                <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center justify-center">
                  <Database className="h-5 w-5 mr-2" />
                  Données brutes
                </button>
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center justify-center">
                  <Users className="h-5 w-5 mr-2" />
                  Collaboration
                </button>
              </>
            )}

            {/* Actions communes pour tous */}
            <button className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition duration-200 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Voir les analyses
            </button>
          </div>
        </div>
      </div>

      {/* Modal d'export des données */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporter les données</h3>
            <p className="text-sm text-gray-600 mb-6">
              Choisissez le format d'export pour les données de la période sélectionnée.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => exportData('csv')}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                <Download className="h-4 w-4 inline mr-2" />
                CSV
              </button>
              <button
                onClick={() => exportData('json')}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <Download className="h-4 w-4 inline mr-2" />
                JSON
              </button>
            </div>
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-4 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Modal de suggestion */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Envoyer une suggestion</h3>
            <textarea
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              placeholder="Votre suggestion pour améliorer le système..."
              className="w-full h-32 border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
            />
            <div className="flex space-x-4 mt-4">
              <button
                onClick={submitSuggestion}
                disabled={!newSuggestion.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Envoyer
              </button>
              <button
                onClick={() => {
                  setShowSuggestionModal(false);
                  setNewSuggestion('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout de capteur (pour gestionnaires/admin) */}
      {showAddSensorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gérer les capteurs</h3>
            <div className="space-y-4">
              <button className="w-full bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 flex items-center justify-center">
                <Settings className="h-5 w-5 mr-2" />
                Ajouter un nouveau capteur
              </button>
              <button className="w-full bg-yellow-600 text-white px-4 py-3 rounded-md hover:bg-yellow-700 flex items-center justify-center">
                <Settings className="h-5 w-5 mr-2" />
                Configurer seuils d'alerte
              </button>
              <button className="w-full bg-red-600 text-white px-4 py-3 rounded-md hover:bg-red-700 flex items-center justify-center">
                <Settings className="h-5 w-5 mr-2" />
                Maintenance capteurs
              </button>
            </div>
            <button
              onClick={() => setShowAddSensorModal(false)}
              className="w-full mt-4 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
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