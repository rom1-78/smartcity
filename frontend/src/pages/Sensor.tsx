import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Save,
  MapPin,
  Activity,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface Sensor {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
}

interface SensorFormData {
  name: string;
  type: string;
  location: string;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
}

const SensorManagement: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [viewingSensor, setViewingSensor] = useState<Sensor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SensorFormData>({
    name: '',
    type: 'temperature',
    location: '',
    status: 'actif',
    installed_at: new Date().toISOString().split('T')[0]
  });

  const sensorTypes = [
    { value: 'temperature', label: 'Température' },
    { value: 'air_quality', label: 'Qualité de l\'air' },
    { value: 'noise', label: 'Niveau sonore' },
    { value: 'humidity', label: 'Humidité' },
    { value: 'traffic', label: 'Circulation' },
    { value: 'pollution', label: 'Pollution' }
  ];

  // Simulation de données - remplacer par des appels API
  useEffect(() => {
    fetchSensors();
  }, []);

  const fetchSensors = async () => {
    setIsLoading(true);
    try {
      // Remplacer par votre appel API
      const response = await fetch('/api/sensors');
      if (response.ok) {
        const data = await response.json();
        setSensors(data);
      } else {
        // Données de test si l'API n'est pas disponible
        setSensors([
          {
            id: 1,
            name: 'Capteur Air Centre-ville',
            type: 'air_quality',
            location: 'Place de la République',
            status: 'actif',
            installed_at: '2024-01-15'
          },
          {
            id: 2,
            name: 'Capteur Bruit Nord',
            type: 'noise',
            location: 'Quartier Nord',
            status: 'actif',
            installed_at: '2024-02-01'
          },
          {
            id: 3,
            name: 'Capteur Température Sud',
            type: 'temperature',
            location: 'Zone industrielle Sud',
            status: 'maintenance',
            installed_at: '2024-01-20'
          }
        ]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des capteurs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingSensor ? `/api/sensors/${editingSensor.id}` : '/api/sensors';
      const method = editingSensor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchSensors();
        resetForm();
        setIsModalOpen(false);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (sensor: Sensor) => {
    setEditingSensor(sensor);
    setFormData({
      name: sensor.name,
      type: sensor.type,
      location: sensor.location,
      status: sensor.status,
      installed_at: sensor.installed_at
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce capteur ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sensors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await fetchSensors();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

  const handleView = (sensor: Sensor) => {
    setViewingSensor(sensor);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'temperature',
      location: '',
      status: 'actif',
      installed_at: new Date().toISOString().split('T')[0]
    });
    setEditingSensor(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'actif': 'bg-green-100 text-green-800',
      'inactif': 'bg-red-100 text-red-800',
      'maintenance': 'bg-yellow-100 text-yellow-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getSensorTypeLabel = (type: string) => {
    const typeObj = sensorTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">Gestion des Capteurs</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un capteur</span>
        </button>
      </div>

      {/* Tableau des capteurs */}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sensors.map((sensor) => (
              <tr key={sensor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {sensor.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getSensorTypeLabel(sensor.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    {sensor.location}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(sensor.status)}`}>
                    {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(sensor.installed_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(sensor)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(sensor)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sensor.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sensors.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun capteur trouvé. Ajoutez votre premier capteur.</p>
        </div>
      )}

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingSensor ? 'Modifier le capteur' : 'Ajouter un capteur'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du capteur
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Capteur Air Centre-ville"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de capteur
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {sensorTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Place de la République"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'installation
                </label>
                <input
                  type="date"
                  name="installed_at"
                  value={formData.installed_at}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isLoading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de visualisation */}
      {isViewModalOpen && viewingSensor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Détails du capteur</h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500">Nom</p>
                  <p className="font-medium">{viewingSensor.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{getSensorTypeLabel(viewingSensor.type)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500">Localisation</p>
                  <p className="font-medium">{viewingSensor.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 flex items-center justify-center">
                  <div className={`h-3 w-3 rounded-full ${viewingSensor.status === 'actif' ? 'bg-green-500' : viewingSensor.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <p className="font-medium">{viewingSensor.status.charAt(0).toUpperCase() + viewingSensor.status.slice(1)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500">Date d'installation</p>
                  <p className="font-medium">{new Date(viewingSensor.installed_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SensorManagement;