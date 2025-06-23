// frontend/src/components/SensorCRUDModal.tsx
import React, { useState, useEffect } from 'react';
import {
  getSensors,
  createSensor,
  updateSensor,
  deleteSensor,
  Sensor
} from '../services/sensor';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Settings,
  Activity
} from 'lucide-react';

interface SensorCRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSensorChange?: () => void;
}

const SensorCRUDModal: React.FC<SensorCRUDModalProps> = ({
  isOpen,
  onClose,
  onSensorChange
}) => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // États pour le formulaire
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'temperature' as Sensor['type'],
    location: '',
    latitude: '',
    longitude: '',
    status: 'actif' as Sensor['status'],
    installed_at: new Date().toISOString().split('T')[0]
  });

  const sensorTypes = [
    { value: 'temperature', label: 'Température', icon: '🌡️' },
    { value: 'air_quality', label: 'Qualité de l\'air', icon: '🌬️' },
    { value: 'noise', label: 'Niveau sonore', icon: '🔊' },
    { value: 'humidity', label: 'Humidité', icon: '💧' },
    { value: 'traffic', label: 'Trafic', icon: '🚗' },
    { value: 'pollution', label: 'Pollution', icon: '☁️' }
  ];

  const statusOptions = [
    { value: 'actif', label: 'Actif', color: 'text-green-600 bg-green-100' },
    { value: 'inactif', label: 'Inactif', color: 'text-gray-600 bg-gray-100' },
    { value: 'maintenance', label: 'Maintenance', color: 'text-yellow-600 bg-yellow-100' }
  ];

  // Charger les capteurs
  const loadSensors = async () => {
    try {
      setLoading(true);
      const data = await getSensors();
      setSensors(data);
    } catch (err) {
      setError('Erreur lors du chargement des capteurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSensors();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'temperature',
      location: '',
      latitude: '',
      longitude: '',
      status: 'actif',
      installed_at: new Date().toISOString().split('T')[0]
    });
    setEditingSensor(null);
    setIsFormOpen(false);
  };

  const handleEdit = (sensor: Sensor) => {
    setEditingSensor(sensor);
    setFormData({
      name: sensor.name,
      type: sensor.type,
      location: sensor.location,
      latitude: sensor.latitude?.toString() || '',
      longitude: sensor.longitude?.toString() || '',
      status: sensor.status,
      installed_at: sensor.installed_at
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);

      const sensorData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      };

      if (editingSensor) {
        await updateSensor(editingSensor.id!, sensorData);
        setSuccess('Capteur mis à jour avec succès');
      } else {
        await createSensor(sensorData);
        setSuccess('Capteur créé avec succès');
      }

      resetForm();
      loadSensors();
      onSensorChange?.();
    } catch (err) {
      setError(editingSensor ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sensor: Sensor) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le capteur "${sensor.name}" ?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteSensor(sensor.id!);
      setSuccess('Capteur supprimé avec succès');
      loadSensors();
      onSensorChange?.();
    } catch (err) {
      setError('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || 'text-gray-600 bg-gray-100';
  };

  const getSensorTypeIcon = (type: string) => {
    const sensorType = sensorTypes.find(t => t.value === type);
    return sensorType?.icon || '📡';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6" />
              <h2 className="text-xl font-bold">Gestion des Capteurs IoT</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          {/* Bouton d'ajout */}
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Liste des Capteurs ({sensors.length})
            </h3>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Capteur</span>
            </button>
          </div>

          {/* Formulaire */}
          {isFormOpen && (
            <div className="mb-6 bg-gray-50 p-6 rounded-lg border">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {editingSensor ? 'Modifier le Capteur' : 'Nouveau Capteur'}
              </h4>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du capteur *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: Capteur Centre-ville #1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de capteur *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Sensor['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sensorTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localisation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: Centre-ville, Place de la République"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="48.8566"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2.3522"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Sensor['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'installation *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.installed_at}
                    onChange={(e) => setFormData({ ...formData, installed_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingSensor ? 'Mettre à jour' : 'Créer'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des capteurs */}
          {loading && !isFormOpen ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Chargement...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capteur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localisation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coordonnées
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Installation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sensors.map((sensor) => (
                    <tr key={sensor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">{getSensorTypeIcon(sensor.type)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{sensor.name}</div>
                            <div className="text-sm text-gray-500">ID: {sensor.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {sensorTypes.find(t => t.value === sensor.type)?.label || sensor.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{sensor.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sensor.latitude && sensor.longitude ? (
                          <div>
                            <div>Lat: {sensor.latitude.toFixed(4)}</div>
                            <div>Lng: {sensor.longitude.toFixed(4)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Non défini</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sensor.status)}`}>
                          {statusOptions.find(s => s.value === sensor.status)?.label || sensor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sensor.installed_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(sensor)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sensor)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sensors.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun capteur trouvé</p>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Créer le premier capteur
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SensorCRUDModal;