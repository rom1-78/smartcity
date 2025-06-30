import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import Map from "../components/Map.tsx";
import { isLoggedIn, removeToken, getUserFromToken } from "../services/auth";
import { useNavigate } from "react-router-dom";
import SuggestionForm from '../components/SuggestionForm';

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

// ===============================
// TYPES
// ===============================

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

// Types pour les données historiques des graphiques
interface HistoricalData {
  timestamp: string;
  temperature: number;
  air_quality: number;
  noise: number;
  traffic: number;
  humidity: number;
  pollution: number;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  location: string;
}

// Type pour les capteurs réels de la BDD
interface RealSensor {
  id?: number;
  name: string;
  type: string;
  location: string;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
  latitude?: number;
  longitude?: number;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  firmware_version?: string;
}

// ===============================
// COMPOSANTS CRUD INTÉGRÉS
// ===============================

// Composant Modal CRUD
interface SensorCRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensor?: RealSensor;
  mode: 'add' | 'edit';
  onSensorChange: () => void;
}

const SensorCRUDModal: React.FC<SensorCRUDModalProps> = ({
  isOpen,
  onClose,
  sensor,
  mode,
  onSensorChange
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // État du formulaire
  const [formData, setFormData] = useState<RealSensor>({
    name: '',
    type: 'temperature',
    location: '',
    status: 'actif',
    installed_at: new Date().toISOString().split('T')[0], // Date actuelle par défaut
    latitude: 48.8566,
    longitude: 2.3522,
    serial_number: '',
    manufacturer: '',
    model: '',
    firmware_version: ''
  });

  // Types de capteurs disponibles
  const sensorTypes = [
    { value: 'temperature', label: '🌡️ Température' },
    { value: 'air_quality', label: '🌬️ Qualité de l\'air' },
    { value: 'noise', label: '🔊 Niveau sonore' },
    { value: 'humidity', label: '💧 Humidité' },
    { value: 'traffic', label: '🚗 Circulation' },
    { value: 'pollution', label: '🏭 Pollution' }
  ];

  // Statuts disponibles
  const statusOptions = [
    { value: 'actif', label: 'Actif' },
    { value: 'inactif', label: 'Inactif' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  // Initialiser le formulaire si mode édition
  useEffect(() => {
    if (mode === 'edit' && sensor) {
      setFormData({
        ...sensor,
        installed_at: sensor.installed_at.split('T')[0],
        latitude: sensor.latitude ?? 48.8566,
        longitude: sensor.longitude ?? 2.3522
      });
    } else {
      // Réinitialiser le formulaire en mode ajout avec date actuelle
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        name: '',
        type: 'temperature',
        location: '',
        status: 'actif',
        installed_at: today,
        latitude: 48.8566,
        longitude: 2.3522,
        serial_number: '',
        manufacturer: '',
        model: '',
        firmware_version: ''
      });
    }
    setError('');
    setSuccess('');
  }, [sensor, mode, isOpen]);

  // Fonction API
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
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }

    return response.json();
  };

  // Gérer les changements du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) || 0 : value
    }));
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'edit' && sensor?.id) {
        await apiCall(`http://localhost:5000/api/sensors/${sensor.id}`, 'PUT', formData);
        setSuccess('Capteur mis à jour avec succès !');
      } else {
        await apiCall('http://localhost:5000/api/sensors', 'POST', formData);
        setSuccess('Capteur créé avec succès !');
      }

      onSensorChange();

      // Fermer la modal après 1.5 secondes
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un capteur
  const handleDelete = async () => {
    if (!sensor?.id) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le capteur "${sensor.name}" ?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiCall(`http://localhost:5000/api/sensors/${sensor.id}`, 'DELETE');
      setSuccess('Capteur supprimé avec succès !');

      onSensorChange();

      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'edit' ? '✏️ Modifier le capteur' : '📡 Ajouter un capteur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              📋 Informations du capteur
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du capteur *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Capteur Température Centre-ville"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de capteur *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sensorTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Localisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Centre-ville, Quartier Nord..."
                />
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude *
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="0.000001"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="48.8566"
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude *
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="0.000001"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2.3522"
                />
              </div>
            </div>

            {/* Date d'installation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'installation
              </label>
              <input
                type="date"
                name="installed_at"
                value={formData.installed_at}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                readOnly={mode === 'add'}
              />
              {mode === 'add' && (
                <p className="text-xs text-gray-500 mt-1">
                  La date d'installation sera automatiquement définie à aujourd'hui
                </p>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-between pt-6 border-t">
            {/* Bouton supprimer (seulement en mode édition) */}
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Supprimer
              </button>
            )}

            {/* Boutons principaux */}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {mode === 'edit' ? 'Mise à jour...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {mode === 'edit' ? 'Mettre à jour' : 'Créer le capteur'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant Menu d'actions pour les capteurs
interface SensorActionsMenuProps {
  sensor: RealSensor;
  onEdit: (sensor: RealSensor) => void;
  onViewDetails?: (sensor: RealSensor) => void;
}

const SensorActionsMenu: React.FC<SensorActionsMenuProps> = ({
  sensor,
  onEdit,
  onViewDetails
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Settings size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-50">
          <div className="py-1">
            <button
              onClick={() => {
                onEdit(sensor);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Edit size={14} />
              Modifier
            </button>
            {onViewDetails && (
              <button
                onClick={() => {
                  onViewDetails(sensor);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Eye size={14} />
                Détails
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ===============================
// COMPOSANT PRINCIPAL DASHBOARD
// ===============================

const user = getUserFromToken();
const role = user?.role;

const Dashboard = () => {
  // États principaux
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [realSensors, setRealSensors] = useState<RealSensor[]>([]);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // États de l'interface
  const [currentView, setCurrentView] = useState<'overview' | 'map' | 'analytics' | 'sensors'>('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showSensorCRUDModal, setShowSensorCRUDModal] = useState(false);

  // États pour le CRUD
  const [crudMode, setCrudMode] = useState<'add' | 'edit'>('add');
  const [selectedSensor, setSelectedSensor] = useState<RealSensor | undefined>();

  const [newSuggestion, setNewSuggestion] = useState('');
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);


  const navigate = useNavigate();

  // Vérification de l'authentification
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/auth?mode=login');
      return;
    }
  }, [navigate]);

  // Fonction pour charger les capteurs réels depuis l'API
  const loadRealSensors = async () => {
    try {
      setLoading(true);
      const sensorsData = await getSensors();
      setRealSensors(sensorsData);
      console.log(' Capteurs réels chargés:', sensorsData.length);
    } catch (error) {
      console.error(' Erreur chargement capteurs:', error);
      setError('Erreur lors du chargement des capteurs');
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial des capteurs réels
  useEffect(() => {
    loadRealSensors();
  }, []);

  // Callbacks pour le CRUD
  const handleAddSensor = () => {
    setCrudMode('add');
    setSelectedSensor(undefined);
    setShowSensorCRUDModal(true);
  };

  const handleEditSensor = (sensor: RealSensor) => {
    setCrudMode('edit');
    setSelectedSensor(sensor);
    setShowSensorCRUDModal(true);
  };

  const handleSensorChange = () => {
    console.log('🔄 Rafraîchissement des capteurs...');
    loadRealSensors();
  };

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
      case 'actif':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
      case 'inactif':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Simulation de données de capteurs (gardé pour compatibilité)
  useEffect(() => {
    const generateMockData = () => {
      const types = ['temperature', 'air_quality', 'noise', 'traffic', 'humidity', 'pollution'];
      const locations = ['Centre-ville', 'Quartier Nord', 'Zone Sud', 'Secteur Est', 'Banlieue Ouest'];
      const units = {
        temperature: '°C', air_quality: 'µg/m³', noise: 'dB', traffic: 'véh/h', humidity: '%', pollution: 'µg/m³'
      };

      const mockSensors: SensorData[] = [];
      for (let i = 1; i <= 74; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];

        let value: number;
        let status: 'normal' | 'warning' | 'critical' = 'normal';

        switch (type) {
          case 'temperature':
            value = Math.random() * 40 + 5;
            if (value > 35) status = 'critical';
            else if (value > 30) status = 'warning';
            break;
          case 'air_quality':
            value = Math.random() * 80 + 10;
            if (value > 60) status = 'critical';
            else if (value > 40) status = 'warning';
            break;
          case 'noise':
            value = Math.random() * 50 + 40;
            if (value > 80) status = 'critical';
            else if (value > 70) status = 'warning';
            break;
          case 'traffic':
            value = Math.random() * 400 + 50;
            if (value > 350) status = 'critical';
            else if (value > 250) status = 'warning';
            break;
          case 'humidity':
            value = Math.random() * 60 + 30;
            if (value > 80) status = 'critical';
            else if (value > 70) status = 'warning';
            break;
          case 'pollution':
            value = Math.random() * 100 + 20;
            if (value > 80) status = 'critical';
            else if (value > 60) status = 'warning';
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

      // Générer quelques alertes
      const criticalSensors = mockSensors.filter(s => s.status === 'critical');
      const mockAlerts: Alert[] = criticalSensors.slice(0, 3).map((sensor, index) => ({
        id: (index + 1).toString(),
        type: 'critical' as const,
        message: `Niveau ${getSensorLabel(sensor.type).toLowerCase()} critique détecté`,
        timestamp: new Date(),
        location: sensor.location
      }));

      setAlerts(mockAlerts);

      // Générer des données historiques pour les graphiques
      generateHistoricalData(mockSensors);
    };

    const generateHistoricalData = (currentSensors: SensorData[]) => {
      const now = new Date();

      // Calculer les moyennes actuelles par type
      const averages = {
        temperature: currentSensors.filter(s => s.type === 'temperature').reduce((acc, s) => acc + s.value, 0) / Math.max(1, currentSensors.filter(s => s.type === 'temperature').length),
        air_quality: currentSensors.filter(s => s.type === 'air_quality').reduce((acc, s) => acc + s.value, 0) / Math.max(1, currentSensors.filter(s => s.type === 'air_quality').length),
        noise: currentSensors.filter(s => s.type === 'noise').reduce((acc, s) => acc + s.value, 0) / Math.max(1, currentSensors.filter(s => s.type === 'noise').length),
        traffic: currentSensors.filter(s => s.type === 'traffic').reduce((acc, s) => acc + s.value, 0) / Math.max(1, currentSensors.filter(s => s.type === 'traffic').length),
        humidity: currentSensors.filter(s => s.type === 'humidity').reduce((acc, s) => acc + s.value, 0) / Math.max(1, currentSensors.filter(s => s.type === 'humidity').length),
        pollution: currentSensors.filter(s => s.type === 'pollution').reduce((acc, s) => acc + s.value, 0) / Math.max(1, currentSensors.filter(s => s.type === 'pollution').length)
      };

      // Ajouter un nouveau point de données avec variation
      const newDataPoint: HistoricalData = {
        timestamp: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        temperature: Math.round((averages.temperature + (Math.random() - 0.5) * 5) * 10) / 10,
        air_quality: Math.round((averages.air_quality + (Math.random() - 0.5) * 10) * 10) / 10,
        noise: Math.round((averages.noise + (Math.random() - 0.5) * 8) * 10) / 10,
        traffic: Math.round((averages.traffic + (Math.random() - 0.5) * 50) * 10) / 10,
        humidity: Math.round((averages.humidity + (Math.random() - 0.5) * 10) * 10) / 10,
        pollution: Math.round((averages.pollution + (Math.random() - 0.5) * 15) * 10) / 10
      };

      setHistoricalData(prev => {
        const updated = [...prev, newDataPoint];
        // Garder seulement les 20 derniers points pour éviter une surcharge
        return updated.slice(-20);
      });
    };

    // Initialisation avec quelques points historiques
    const initializeHistoricalData = () => {
      const initialData: HistoricalData[] = [];
      const baseTime = new Date();

      for (let i = 19; i >= 0; i--) {
        const time = new Date(baseTime.getTime() - i * 30000); // Points toutes les 30 secondes
        initialData.push({
          timestamp: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          temperature: Math.round((20 + Math.random() * 15) * 10) / 10,
          air_quality: Math.round((30 + Math.random() * 40) * 10) / 10,
          noise: Math.round((50 + Math.random() * 30) * 10) / 10,
          traffic: Math.round((100 + Math.random() * 200) * 10) / 10,
          humidity: Math.round((40 + Math.random() * 40) * 10) / 10,
          pollution: Math.round((25 + Math.random() * 50) * 10) / 10
        });
      }
      setHistoricalData(initialData);
    };

    // Initialisation
    initializeHistoricalData();
    generateMockData();
    setIsLoading(false);

    // Mise à jour périodique toutes les 30 secondes
    const interval = setInterval(generateMockData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'map', 'analytics', 'sensors'].includes(tab)) {
      setCurrentView(tab as any);
    }
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
      console.log('Suggestion envoyée:', newSuggestion);
      setNewSuggestion('');
      setShowSuggestionModal(false);
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
              ...(role === 'gestionnaire' || role === 'admin' ? [{ key: 'sensors', label: 'Gestion Capteurs', icon: Settings }] : []),
              { key: 'analytics', label: 'Analyses', icon: TrendingUp }
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


            {/* Actions rapides */}

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(role === 'gestionnaire' || role === 'admin') && (
                  <>
                    <button
                      onClick={handleAddSensor}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Ajouter capteur
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
                      onClick={() => setCurrentView('sensors')}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center justify-center"
                    >
                      <Settings className="h-5 w-5 mr-2" />
                      Gérer capteurs
                    </button>
                  </>
                )}
                {/* NOUVEAU BOUTON POUR LES CITOYENS */}
                {role === 'citoyen' && (
                  <div className="col-span-full">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Une idée pour améliorer notre ville ?
                          </h4>
                          <p className="text-sm text-gray-600">
                            Partagez vos suggestions avec les gestionnaires de la ville intelligente
                          </p>
                        </div>
                        <button
                          onClick={() => setShowSuggestionForm(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Faire une suggestion</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Aperçu des capteurs récents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Aperçu des Capteurs</h3>
                  <button
                    onClick={() => setCurrentView('sensors')}
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
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localisation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date d'installation
                      </th>
                      {(role === 'gestionnaire' || role === 'admin') && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {realSensors.slice(0, 10).map((sensor) => (
                      <tr key={sensor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sensor.name}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sensor.status)}`}>
                            {sensor.status === 'actif' ? 'Actif' :
                              sensor.status === 'maintenance' ? 'Maintenance' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(sensor.installed_at).toLocaleDateString('fr-FR')}
                        </td>
                        {(role === 'gestionnaire' || role === 'admin') && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <SensorActionsMenu
                              sensor={sensor}
                              onEdit={handleEditSensor}
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
        }

        {/* Vue Carte Interactive */}
        {
          currentView === 'map' && (
            <div className="space-y-6">
              {/* Composant carte principal avec le bouton d'ajout intégré */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <Map
                  onAddSensor={role === 'gestionnaire' || role === 'admin' ? handleAddSensor : undefined}
                  onSensorChange={handleSensorChange}
                />
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
                    {Object.entries(
                      realSensors.reduce((acc, sensor) => {
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
                              style={{ width: `${(count / realSensors.length) * 100}%` }}
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
                    {realSensors
                      .filter(sensor => sensor.status === 'maintenance' || sensor.status === 'inactif')
                      .slice(0, 4)
                      .map((sensor) => (
                        <div key={sensor.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getSensorIcon(sensor.type)}
                              <div>
                                <p className="text-sm font-medium text-yellow-800">
                                  {sensor.name}
                                </p>
                                <p className="text-xs text-yellow-600">{sensor.location}</p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${sensor.status === 'inactif'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {sensor.status === 'inactif' ? 'Hors service' : 'Maintenance'}
                            </span>
                          </div>
                        </div>
                      ))}
                    {realSensors.filter(s => s.status === 'maintenance' || s.status === 'inactif').length === 0 && (
                      <div className="text-center py-4">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Tous les capteurs fonctionnent normalement</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Vue Analytics */}
        {
          currentView === 'analytics' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">📊 Analyses et Tendances en Temps Réel</h3>
                    <p className="text-gray-600">Évolution des moyennes par type de capteur</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Mise à jour automatique toutes les 30s
                  </div>
                </div>
              </div>

              {/* Graphiques principaux */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Graphique Température */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Thermometer className="h-5 w-5 text-orange-500" />
                    <h4 className="text-lg font-semibold text-gray-900">Température Moyenne</h4>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-1 border-b border-l border-gray-200 pl-8 pb-8">
                    {historicalData.slice(-10).map((data, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className="bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-md w-full transition-all duration-300"
                          style={{
                            height: `${Math.max(10, (data.temperature / 40) * 200)}px`
                          }}
                          title={`${data.temperature}°C à ${data.timestamp}`}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                          {data.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-2xl font-bold text-orange-600">
                      {historicalData.length > 0 ? historicalData[historicalData.length - 1]?.temperature : '--'}°C
                    </span>
                    <span className="text-sm text-gray-500 ml-2">Moyenne actuelle</span>
                  </div>
                </div>

                {/* Graphique Qualité de l'air */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Wind className="h-5 w-5 text-blue-500" />
                    <h4 className="text-lg font-semibold text-gray-900">Qualité de l'Air</h4>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-1 border-b border-l border-gray-200 pl-8 pb-8">
                    {historicalData.slice(-10).map((data, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-md w-full transition-all duration-300"
                          style={{
                            height: `${Math.max(10, (data.air_quality / 100) * 200)}px`
                          }}
                          title={`${data.air_quality} µg/m³ à ${data.timestamp}`}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                          {data.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {historicalData.length > 0 ? historicalData[historicalData.length - 1]?.air_quality : '--'} µg/m³
                    </span>
                    <span className="text-sm text-gray-500 ml-2">Moyenne actuelle</span>
                  </div>
                </div>

                {/* Graphique Niveau sonore */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Volume2 className="h-5 w-5 text-purple-500" />
                    <h4 className="text-lg font-semibold text-gray-900">Niveau Sonore</h4>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-1 border-b border-l border-gray-200 pl-8 pb-8">
                    {historicalData.slice(-10).map((data, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className="bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-md w-full transition-all duration-300"
                          style={{
                            height: `${Math.max(10, (data.noise / 100) * 200)}px`
                          }}
                          title={`${data.noise} dB à ${data.timestamp}`}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                          {data.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-2xl font-bold text-purple-600">
                      {historicalData.length > 0 ? historicalData[historicalData.length - 1]?.noise : '--'} dB
                    </span>
                    <span className="text-sm text-gray-500 ml-2">Moyenne actuelle</span>
                  </div>
                </div>

                {/* Graphique Circulation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Car className="h-5 w-5 text-green-500" />
                    <h4 className="text-lg font-semibold text-gray-900">Circulation</h4>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-1 border-b border-l border-gray-200 pl-8 pb-8">
                    {historicalData.slice(-10).map((data, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className="bg-gradient-to-t from-green-500 to-green-300 rounded-t-md w-full transition-all duration-300"
                          style={{
                            height: `${Math.max(10, (data.traffic / 500) * 200)}px`
                          }}
                          title={`${data.traffic} véh/h à ${data.timestamp}`}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                          {data.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-2xl font-bold text-green-600">
                      {historicalData.length > 0 ? historicalData[historicalData.length - 1]?.traffic : '--'} véh/h
                    </span>
                    <span className="text-sm text-gray-500 ml-2">Moyenne actuelle</span>
                  </div>
                </div>
              </div>

              {/* Statistiques par type de capteur */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-6">📈 Statistiques des Capteurs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {['temperature', 'air_quality', 'noise', 'traffic', 'humidity', 'pollution'].map(type => {
                    const typeSensors = realSensors.filter(s => s.type === type);
                    const currentData = sensorData.filter(s => s.type === type);
                    const average = currentData.length > 0
                      ? (currentData.reduce((acc, s) => acc + s.value, 0) / currentData.length).toFixed(1)
                      : '0.0';

                    return (
                      <div key={type} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center mb-3">
                          {getSensorIcon(type)}
                          <span className="ml-2 font-medium text-gray-900">
                            {getSensorLabel(type)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Capteurs installés:</span>
                            <span className="font-semibold text-gray-900">{typeSensors.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Moyenne actuelle:</span>
                            <span className="font-semibold text-blue-600">
                              {average} {currentData[0]?.unit || ''}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Capteurs actifs:</span>
                            <span className="font-semibold text-green-600">
                              {typeSensors.filter(s => s.status === 'actif').length}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tendances et insights */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">🔍 Insights Temps Réel</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h5 className="font-medium text-gray-900 mb-2">État Global</h5>
                    <div className="text-sm text-gray-600">
                      <p>• {realSensors.filter(s => s.status === 'actif').length} capteurs actifs sur {realSensors.length}</p>
                      <p>• {alerts.length} alertes critiques en cours</p>
                      <p>• Données mises à jour il y a {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h5 className="font-medium text-gray-900 mb-2">Prochaine Mise à Jour</h5>
                    <div className="text-sm text-gray-600">
                      <p>• Les graphiques se mettent à jour automatiquement</p>
                      <p>• Nouvelles données toutes les 30 secondes</p>
                      <p>• Historique conservé sur 20 points</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Vue Gestion des Capteurs */}
        {
          currentView === 'sensors' && (role === 'gestionnaire' || role === 'admin') && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Gestion des Capteurs IoT</h3>
                    <p className="text-gray-600">Gérez les capteurs de la smart city</p>
                  </div>
                  <button
                    onClick={handleAddSensor}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un capteur
                  </button>
                </div>

                {/* Statistiques rapides */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-blue-600 text-sm font-medium">Total</div>
                    <div className="text-2xl font-bold text-blue-900">{realSensors.length}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-green-600 text-sm font-medium">Actifs</div>
                    <div className="text-2xl font-bold text-green-900">
                      {realSensors.filter(s => s.status === 'actif').length}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-yellow-600 text-sm font-medium">Maintenance</div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {realSensors.filter(s => s.status === 'maintenance').length}
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-red-600 text-sm font-medium">Inactifs</div>
                    <div className="text-2xl font-bold text-red-900">
                      {realSensors.filter(s => s.status === 'inactif').length}
                    </div>
                  </div>
                </div>

                {/* Liste des capteurs avec actions */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Liste des Capteurs</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {realSensors.slice(0, 10).map((sensor) => (
                      <div key={sensor.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {getSensorIcon(sensor.type)}
                              <div>
                                <div className="font-medium text-gray-900">{sensor.name}</div>
                                <div className="text-sm text-gray-500">
                                  {getSensorLabel(sensor.type)} • {sensor.location}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sensor.status)}`}>
                              {sensor.status === 'actif' ? 'Actif' :
                                sensor.status === 'maintenance' ? 'Maintenance' : 'Inactif'}
                            </span>
                            <SensorActionsMenu
                              sensor={sensor}
                              onEdit={handleEditSensor}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {realSensors.length > 10 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setCurrentView('sensors')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Voir tous les capteurs ({realSensors.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }
      </div >

      {/* Modal d'export */}
      {
        showExportModal && (
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
        )
      }

      {/* Modal de suggestion - NOUVEAU */}
      {showSuggestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <SuggestionForm
              onClose={() => setShowSuggestionForm(false)}
              onSubmitSuccess={() => {
                setShowSuggestionForm(false);
                // Optionnel: afficher un message de succès
              }}
            />
          </div>
        </div>
      )}
      {/* Modal CRUD des capteurs - INTÉGRÉ */}
      <SensorCRUDModal
        isOpen={showSensorCRUDModal}
        onClose={() => setShowSensorCRUDModal(false)}
        sensor={selectedSensor}
        mode={crudMode}
        onSensorChange={handleSensorChange}
      />

    </div >
  );
};

export default Dashboard;