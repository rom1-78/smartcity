import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import ParisIoTMap from "../components/ParisIoTMap.tsx";  // NOUVEAU COMPOSANT
// import TestMap from "../components/TestMap.tsx";
import { isLoggedIn, removeToken, getUserFromToken } from "../services/auth";
import SensorCRUDModal from "../components/SensorCRUDModal";

import { useNavigate } from "react-router-dom";
import {
  getSensors,
  createSensor,
  updateSensor,
  deleteSensor
} from "../services/sensor";

// IMPORT DES LABELS FRANÇAIS
import { getSensorLabel } from '../utils/labels';
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
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  MapPin as SensorIcon,
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
  const [error, setError] = useState<string | null>(null);

  // États de l'interface
  const [currentView, setCurrentView] = useState<'overview' | 'map' | 'data' | 'analytics' | 'sensors'>('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showAddSensorModal, setShowAddSensorModal] = useState(false);
  const [showSensorCRUDModal, setShowSensorCRUDModal] = useState(false);

  const [newSuggestion, setNewSuggestion] = useState('');

  // États pour les filtres
  const [dateFilter, setDateFilter] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [locationFilter, setLocationFilter] = useState('all');
  const [sensorTypeFilter, setSensorTypeFilter] = useState('all');

  const navigate = useNavigate();

  // Vérification de l'authentification
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/auth?mode=login');
      return;
    }
  }, [navigate]);

  // Fonction pour obtenir l'icône d'un capteur
  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      case 'air_quality':
      case 'pollution':
        return <Wind className="h-4 w-4" />;
      case 'noise':
        return <Volume2 className="h-4 w-4" />;
      case 'traffic':
        return <Car className="h-4 w-4" />;
      case 'humidity':
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Simulation de données de capteurs
  useEffect(() => {
    const generateMockData = () => {
      const types = ['temperature', 'air_quality', 'noise', 'traffic', 'humidity'];
      const locations = ['Centre-ville', 'Quartier Nord', 'Zone Sud', 'Secteur Est', 'Banlieue Ouest'];
      const units = {
        temperature: '°C', air_quality: 'µg/m³', noise: 'dB', traffic: 'véh/h', humidity: '%'
      };

      const mockSensors: SensorData[] = [];
      for (let i = 1; i <= 74; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];

        let value: number;
        let status: 'normal' | 'warning' | 'critical' = 'normal';

        switch (type) {
          case 'temperature':
            value = Math.random() * 40 + 5; // 5-45°C
            if (value > 35) status = 'critical';
            else if (value > 30) status = 'warning';
            break;
          case 'air_quality':
            value = Math.random() * 80 + 10; // 10-90 µg/m³
            if (value > 60) status = 'critical';
            else if (value > 40) status = 'warning';
            break;
          case 'noise':
            value = Math.random() * 50 + 40; // 40-90 dB
            if (value > 80) status = 'critical';
            else if (value > 70) status = 'warning';
            break;
          case 'traffic':
            value = Math.random() * 400 + 50; // 50-450 véh/h
            if (value > 350) status = 'critical';
            else if (value > 250) status = 'warning';
            break;
          case 'humidity':
            value = Math.random() * 60 + 30; // 30-90%
            if (value > 80) status = 'critical';
            else if (value > 70) status = 'warning';
            break;
          default:
            value = Math.random() * 100;
        }

        mockSensors.push({
          id: i.toString(),
          type,
          value: Math.round(value * 10) / 10,
          unit: units[type as keyof typeof units] || '',
          status,
          location,
          timestamp: new Date()
        });
      }

      setSensorData(mockSensors);

      // Générer quelques alertes - MODIFIÉ AVEC LABELS FRANÇAIS
      const criticalSensors = mockSensors.filter(s => s.status === 'critical');
      const mockAlerts: Alert[] = criticalSensors.slice(0, 3).map((sensor, index) => ({
        id: (index + 1).toString(),
        type: 'critical' as const,
        message: `Niveau ${getSensorLabel(sensor.type).toLowerCase()} critique détecté`,
        timestamp: new Date(),
        location: sensor.location
      }));

      setAlerts(mockAlerts);
    };

    generateMockData();
    setIsLoading(false);

    // Mise à jour périodique
    const interval = setInterval(generateMockData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fonctions d'actions
  const exportData = (format: 'csv' | 'json') => {
    const data = sensorData.map(sensor => ({
      id: sensor.id,
      type: sensor.type,
      value: sensor.value,
      unit: sensor.unit,
      status: sensor.status,
      location: sensor.location,
      timestamp: sensor.timestamp.toISOString()
    }));

    if (format === 'csv') {
      const csv = [
        'ID,Type,Valeur,Unité,Statut,Localisation,Horodatage',
        ...data.map(row => `${row.id},${row.type},${row.value},${row.unit},${row.status},${row.location},${row.timestamp}`)
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `capteurs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `capteurs_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }

    setShowExportModal(false);
  };

  const submitSuggestion = () => {
    if (newSuggestion.trim()) {
      // Ici, vous ajouteriez la logique pour envoyer la suggestion
      console.log('Suggestion envoyée:', newSuggestion);
      setNewSuggestion('');
      setShowSuggestionModal(false);
      // Afficher une notification de succès
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/auth?mode=login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Navigation des vues */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            {[
              { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { key: 'map', label: 'Carte Interactive', icon: MapPin },
              { key: 'data', label: 'Données Détaillées', icon: Database },
              { key: 'analytics', label: 'Analyses', icon: TrendingUp },
              ...(role === 'gestionnaire' || role === 'admin' ? [{ key: 'sensors', label: 'Gestion Capteurs', icon: Settings }] : [])
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCurrentView(key as any)}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition duration-200 ${currentView === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Vue d'ensemble */}
        {currentView === 'overview' && (
          <>
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Capteurs Actifs</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {sensorData.filter(s => s.status === 'normal').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Alertes</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {sensorData.filter(s => s.status !== 'normal').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Thermometer className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Temp. Moyenne</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {(sensorData
                        .filter(s => s.type === 'temperature')
                        .reduce((acc, s) => acc + s.value, 0) /
                        sensorData.filter(s => s.type === 'temperature').length || 0
                      ).toFixed(1)}°C
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Wind className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Qualité Air</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {(sensorData
                        .filter(s => s.type === 'air_quality')
                        .reduce((acc, s) => acc + s.value, 0) /
                        sensorData.filter(s => s.type === 'air_quality').length || 0
                      ).toFixed(0)} µg/m³
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu des capteurs récents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Aperçu des Capteurs</h3>
                  <button
                    onClick={() => setCurrentView('data')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    Voir tout
                    <Eye className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type de Capteur
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
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {getSensorLabel(sensor.type)}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
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

            {/* Actions rapides selon le rôle */}
            <div className="mb-8">
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
                      onClick={() => setShowSensorCRUDModal(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                    >
                      <Settings className="h-5 w-5 mr-2" />
                      Gérer capteurs
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Vue Carte Interactive */}
        {currentView === 'map' && (
          <div className="space-y-6">


            {/* Composant carte principal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <ParisIoTMap />
              {/* <TestMap /> */}
            </div>

            {/* Panneau d'informations complémentaires */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Alertes récentes sur la carte */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  Alertes Géographiques
                </h3>
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">
                            {alert.message}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            {alert.location} • {new Date(alert.timestamp).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aucune alerte active</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistiques par zone */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                  Répartition par Zone
                </h3>
                <div className="space-y-3">
                  {/* Calcul dynamique des zones basé sur les données réelles */}
                  {Object.entries(
                    sensorData.reduce((acc, sensor) => {
                      const zone = sensor.location.split(',')[0] || sensor.location;
                      acc[zone] = (acc[zone] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).slice(0, 5).map(([zone, count]) => (
                    <div key={zone} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{zone}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(count / sensorData.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capteurs nécessitant une attention */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-orange-500" />
                  Maintenance Requise
                </h3>
                <div className="space-y-3">
                  {sensorData
                    .filter(sensor => sensor.status === 'warning' || sensor.status === 'critical')
                    .slice(0, 4)
                    .map((sensor) => (
                      <div key={sensor.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getSensorIcon(sensor.type)}
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                {getSensorLabel(sensor.type)}
                              </p>
                              <p className="text-xs text-yellow-600">{sensor.location}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${sensor.status === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {sensor.status === 'critical' ? 'Critique' : 'Attention'}
                          </span>
                        </div>
                      </div>
                    ))}
                  {sensorData.filter(s => s.status === 'warning' || s.status === 'critical').length === 0 && (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Tous les capteurs fonctionnent normalement</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions rapides contextuelles */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setCurrentView('data')}
                  className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition duration-200 text-left"
                >
                  <Database className="h-6 w-6 text-blue-600 mb-2" />
                  <div className="font-medium text-gray-900">Analyser les Données</div>
                  <div className="text-sm text-gray-600">Accéder aux données détaillées</div>
                </button>

                <button
                  onClick={() => setShowExportModal(true)}
                  className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition duration-200 text-left"
                >
                  <Download className="h-6 w-6 text-green-600 mb-2" />
                  <div className="font-medium text-gray-900">Exporter</div>
                  <div className="text-sm text-gray-600">Télécharger les données</div>
                </button>

                {(role === 'gestionnaire' || role === 'admin') && (
                  <button
                    onClick={() => {/* Fonction pour ouvrir le panneau de gestion des alertes */ }}
                    className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition duration-200 text-left"
                  >
                    <Bell className="h-6 w-6 text-orange-600 mb-2" />
                    <div className="font-medium text-gray-900">Gérer les Alertes</div>
                    <div className="text-sm text-gray-600">Configurer les seuils</div>
                  </button>
                )}
              </div>
            </div>
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
                  <Filter className="h-5 w-5 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700">Zone:</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="all">Toutes les zones</option>
                    <option value="Centre-ville">Centre-ville</option>
                    <option value="Quartier Nord">Quartier Nord</option>
                    <option value="Zone Sud">Zone Sud</option>
                    <option value="Secteur Est">Secteur Est</option>
                    <option value="Banlieue Ouest">Banlieue Ouest</option>
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
                    <option value="temperature">{getSensorLabel('temperature')}</option>
                    <option value="air_quality">{getSensorLabel('air_quality')}</option>
                    <option value="noise">{getSensorLabel('noise')}</option>
                    <option value="traffic">{getSensorLabel('traffic')}</option>
                    <option value="humidity">{getSensorLabel('humidity')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tableau de données complet */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Données Complètes des Capteurs</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </button>
                    {role === 'citoyen' && (
                      <button
                        onClick={() => setShowSuggestionModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Suggérer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
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
                    {sensorData
                      .filter(sensor =>
                        (locationFilter === 'all' || sensor.location === locationFilter) &&
                        (sensorTypeFilter === 'all' || sensor.type === sensorTypeFilter)
                      )
                      .map((sensor) => (
                        <tr key={sensor.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sensor.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getSensorIcon(sensor.type)}
                              <span className="ml-2 text-sm font-medium text-gray-900">
                                {getSensorLabel(sensor.type)}
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
                            {sensor.timestamp.toLocaleString('fr-FR')}
                          </td>
                          {(role === 'gestionnaire' || role === 'admin') && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-900">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="text-gray-600 hover:text-gray-900">
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

        {/* Vue Analytics */}
        {currentView === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyses et Tendances</h3>
              <p className="text-gray-600">Cette section sera bientôt disponible avec des graphiques et analyses avancées.</p>

              {/* Statistiques par type de capteur */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {['temperature', 'air_quality', 'noise', 'traffic', 'humidity'].map(type => {
                  const typeSensors = sensorData.filter(s => s.type === type);
                  const avgValue = typeSensors.length > 0
                    ? typeSensors.reduce((acc, s) => acc + s.value, 0) / typeSensors.length
                    : 0;

                  return (
                    <div key={type} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        {getSensorIcon(type)}
                        <span className="ml-2 font-medium text-gray-900">
                          {getSensorLabel(type)}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {avgValue.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {typeSensors.length} capteurs actifs
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vue Gestion des Capteurs */}
      {currentView === 'sensors' && (role === 'gestionnaire' || role === 'admin') && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gestion des Capteurs IoT</h3>
                <p className="text-gray-600">Gérez les capteurs de la smart city</p>
              </div>
              <button
                onClick={() => setShowSensorCRUDModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Ouvrir la gestion
              </button>
            </div>
          </div>
        </div>
      )}

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
      {/* Modal CRUD des capteurs */}
      <SensorCRUDModal
        isOpen={showSensorCRUDModal}
        onClose={() => setShowSensorCRUDModal(false)}
        onSensorChange={() => {
          // Rafraîchir les données si nécessaire
          console.log('Capteurs mis à jour');
        }}
      />
    </div>
  );
};

export default Dashboard;