// frontend/src/components/SensorCRUDModal.tsx - VERSION SIMPLE QUI FONCTIONNE
import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, AlertCircle, Activity } from 'lucide-react';

interface SensorCRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSensorChange?: () => void;
}

// Type simple pour les capteurs
interface SimpleSensor {
  id: number;
  name: string;
  type: string;
  location: string;
  status: string;
  installed_at: string;
  latitude?: number;
  longitude?: number;
}

const SensorCRUDModal: React.FC<SensorCRUDModalProps> = ({
  isOpen,
  onClose,
  onSensorChange
}) => {
  const [sensors, setSensors] = useState<SimpleSensor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingSensor, setEditingSensor] = useState<SimpleSensor | null>(null);
  
  // Formulaire simple
  const [formData, setFormData] = useState({
    name: '',
    type: 'temperature',
    location: '',
    status: 'actif',
    latitude: '',
    longitude: ''
  });

  // Fonction pour charger les capteurs
  const loadSensors = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Token manquant');
      }

      const response = await fetch('http://localhost:5000/api/sensors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setSensors(data || []);
      
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Erreur de chargement');
      setSensors([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les capteurs quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      console.log('📋 Modal ouvert - Chargement des capteurs');
      setShowForm(false);
      setEditingSensor(null);
      setError('');
      loadSensors();
    }
  }, [isOpen]);

  // Fonction pour créer/modifier un capteur
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('userToken');
      const sensorData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        installed_at: new Date().toISOString().split('T')[0]
      };

      const url = editingSensor 
        ? `http://localhost:5000/api/sensors/${editingSensor.id}`
        : 'http://localhost:5000/api/sensors';
      
      const method = editingSensor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sensorData)
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      // Retour à la liste et rechargement
      setShowForm(false);
      setEditingSensor(null);
      setFormData({ name: '', type: 'temperature', location: '', status: 'actif', latitude: '', longitude: '' });
      loadSensors();
      onSensorChange?.();
      
    } catch (err: any) {
      setError(err.message || 'Erreur de sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer un capteur
  const handleDelete = async (sensor: SimpleSensor) => {
    if (!confirm(`Supprimer "${sensor.name}" ?`)) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      
      const response = await fetch(`http://localhost:5000/api/sensors/${sensor.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      loadSensors();
      onSensorChange?.();
      
    } catch (err: any) {
      setError(err.message || 'Erreur de suppression');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour éditer un capteur
  const handleEdit = (sensor: SimpleSensor) => {
    setEditingSensor(sensor);
    setFormData({
      name: sensor.name,
      type: sensor.type,
      location: sensor.location,
      status: sensor.status,
      latitude: sensor.latitude?.toString() || '',
      longitude: sensor.longitude?.toString() || ''
    });
    setShowForm(true);
  };

  // Fonction pour nouveau capteur
  const handleNew = () => {
    setEditingSensor(null);
    setFormData({ name: '', type: 'temperature', location: '', status: 'actif', latitude: '', longitude: '' });
    setShowForm(true);
  };

  // Fonction pour retour à la liste
  const backToList = () => {
    setShowForm(false);
    setEditingSensor(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {showForm ? (editingSensor ? 'Modifier le Capteur' : 'Nouveau Capteur') : 'Liste des Capteurs'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          
          {/* Messages d'erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          {showForm ? (
            // ========== FORMULAIRE ==========
            <div>
              <div className="mb-4">
                <button
                  onClick={backToList}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ← Retour à la liste
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du capteur *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="Nom du capteur"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de capteur *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="temperature">🌡️ Température</option>
                      <option value="air_quality">🌬️ Qualité de l'air</option>
                      <option value="noise">🔊 Niveau sonore</option>
                      <option value="humidity">💧 Humidité</option>
                      <option value="traffic">🚗 Circulation</option>
                      <option value="pollution">🏭 Pollution</option>
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
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="Localisation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
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
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="2.3522"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Sauvegarde...' : (editingSensor ? 'Modifier' : 'Créer')}
                  </button>
                  <button
                    type="button"
                    onClick={backToList}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // ========== LISTE ==========
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Capteurs ({sensors.length})
                </h3>
                <button
                  onClick={handleNew}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouveau</span>
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p>Chargement...</p>
                </div>
              ) : sensors.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Aucun capteur trouvé</p>
                  <button
                    onClick={handleNew}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Créer le premier capteur
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nom</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Localisation</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Statut</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sensors.map((sensor) => (
                        <tr key={sensor.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {sensor.name}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {sensor.type}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {sensor.location}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              sensor.status === 'actif' ? 'bg-green-100 text-green-800' :
                              sensor.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {sensor.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(sensor)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(sensor)}
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SensorCRUDModal;