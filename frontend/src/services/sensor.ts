// frontend/src/services/sensor.ts (VERSION CORRIGÉE)
const API_BASE_URL = 'http://localhost:5000/api';

// ============================================
// INTERFACES POUR TYPAGE
// ============================================
export interface RealSensor {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  firmware_version?: string;
}

export interface RealSensorData {
  id: number;
  sensor_id: number;
  value: number;
  unit: string;
  timestamp: string;
  quality_index?: number;
  calibration_status?: string;
}

export interface RealAlert {
  id: number;
  sensor_id: number;
  alert_type: 'info' | 'warning' | 'critical';
  message: string;
  threshold_value?: number;
  current_value?: number;
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
  sensor_name?: string;
  sensor_location?: string;
}

// ============================================
// FONCTION UTILITAIRE POUR LES HEADERS
// ============================================
const getAuthHeaders = () => {
  // 🔧 CORRECTION: Utiliser la même clé que dans Auth.tsx
  const token = localStorage.getItem('userToken'); // Changé de 'token' à 'userToken'
  
  console.log('🔑 Token récupéré:', token ? `${token.substring(0, 20)}...` : 'NON TROUVÉ');
  
  if (!token) {
    console.error('❌ Aucun token trouvé dans localStorage');
    throw new Error('Token d\'authentification manquant');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// ============================================
// FONCTION UTILITAIRE POUR GÉRER LES ERREURS
// ============================================
const handleApiError = async (response: Response, operation: string) => {
  if (!response.ok) {
    let errorMessage = `Erreur HTTP: ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Si on ne peut pas parser le JSON, on garde le message par défaut
    }
    
    console.error(`❌ Erreur lors de ${operation}:`, {
      status: response.status,
      statusText: response.statusText,
      message: errorMessage
    });
    
    throw new Error(errorMessage);
  }
};

// ============================================
// API CAPTEURS
// ============================================

/**
 * Récupérer tous les capteurs
 */
export const getSensors = async (): Promise<RealSensor[]> => {
  try {
    console.log('📡 Récupération des capteurs...');
    
    const response = await fetch(`${API_BASE_URL}/sensors`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    await handleApiError(response, 'la récupération des capteurs');
    
    const sensors = await response.json();
    console.log('✅ Capteurs récupérés:', sensors.length);
    return sensors;
    
  } catch (error) {
    console.error('Erreur lors de la récupération des capteurs:', error);
    throw new Error('Impossible de récupérer les capteurs');
  }
};

/**
 * Récupérer un capteur par ID
 */
export const getSensorById = async (id: number): Promise<RealSensor> => {
  try {
    console.log(`📡 Récupération du capteur ${id}...`);
    
    const response = await fetch(`${API_BASE_URL}/sensors/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    await handleApiError(response, 'la récupération du capteur');
    
    const sensor = await response.json();
    console.log('✅ Capteur récupéré:', sensor.name);
    return sensor;
    
  } catch (error) {
    console.error(`Erreur lors de la récupération du capteur ${id}:`, error);
    throw error;
  }
};

/**
 * Créer un nouveau capteur
 */
export const createSensor = async (sensorData: Omit<RealSensor, 'id' | 'created_at' | 'updated_at'>): Promise<RealSensor> => {
  try {
    console.log('📡 Création du capteur:', sensorData.name);
    
    const response = await fetch(`${API_BASE_URL}/sensors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(sensorData),
    });
    
    await handleApiError(response, 'la création du capteur');
    
    const result = await response.json();
    console.log('✅ Capteur créé:', result.sensor?.name || 'Nouveau capteur');
    return result.sensor || result;
    
  } catch (error) {
    console.error('Erreur lors de la création du capteur:', error);
    throw error;
  }
};

/**
 * Mettre à jour un capteur
 */
export const updateSensor = async (id: number, sensorData: Partial<RealSensor>): Promise<RealSensor> => {
  try {
    console.log(`📡 Mise à jour du capteur ${id}...`);
    
    const response = await fetch(`${API_BASE_URL}/sensors/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(sensorData),
    });
    
    await handleApiError(response, 'la mise à jour du capteur');
    
    const result = await response.json();
    console.log('✅ Capteur mis à jour:', result.sensor?.name || `Capteur ${id}`);
    return result.sensor || result;
    
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du capteur ${id}:`, error);
    throw error;
  }
};

/**
 * Supprimer un capteur
 */
export const deleteSensor = async (id: number): Promise<void> => {
  try {
    console.log(`📡 Suppression du capteur ${id}...`);
    
    const response = await fetch(`${API_BASE_URL}/sensors/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    await handleApiError(response, 'la suppression du capteur');
    
    console.log('✅ Capteur supprimé:', id);
    
  } catch (error) {
    console.error(`Erreur lors de la suppression du capteur ${id}:`, error);
    throw error;
  }
};

// ============================================
// API DONNÉES DES CAPTEURS
// ============================================

/**
 * Récupérer les données d'un capteur
 */
export const getSensorData = async (
  sensorId: number, 
  options: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data: RealSensorData[]; pagination?: any }> => {
  try {
    console.log(`📊 Récupération des données du capteur ${sensorId}...`);
    
    const params = new URLSearchParams();
    if (options.start_date) params.append('start_date', options.start_date);
    if (options.end_date) params.append('end_date', options.end_date);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    
    const url = `${API_BASE_URL}/sensors/${sensorId}/data${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    await handleApiError(response, 'la récupération des données du capteur');
    
    const result = await response.json();
    console.log('✅ Données récupérées:', result.data?.length || 0, 'entrées');
    return result;
    
  } catch (error) {
    console.error(`Erreur lors de la récupération des données du capteur ${sensorId}:`, error);
    throw error;
  }
};

// ============================================
// API ALERTES
// ============================================

/**
 * Récupérer les alertes
 */
export const getAlerts = async (options: {
  sensor_id?: number;
  alert_type?: string;
  resolved?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<RealAlert[]> => {
  try {
    console.log('🚨 Récupération des alertes...');
    
    const params = new URLSearchParams();
    if (options.sensor_id) params.append('sensor_id', options.sensor_id.toString());
    if (options.alert_type) params.append('alert_type', options.alert_type);
    if (options.resolved !== undefined) params.append('resolved', options.resolved.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    
    const url = `${API_BASE_URL}/alerts${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    await handleApiError(response, 'la récupération des alertes');
    
    const alerts = await response.json();
    console.log('✅ Alertes récupérées:', alerts.length);
    return alerts;
    
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    // Ne pas faire échouer tout le dashboard pour les alertes
    console.warn('⚠️ Continuing without alerts...');
    return [];
  }
};

/**
 * Marquer une alerte comme résolue
 */
export const resolveAlert = async (alertId: number): Promise<void> => {
  try {
    console.log(`🚨 Résolution de l'alerte ${alertId}...`);
    
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    
    await handleApiError(response, 'la résolution de l\'alerte');
    
    console.log('✅ Alerte résolue:', alertId);
    
  } catch (error) {
    console.error(`Erreur lors de la résolution de l'alerte ${alertId}:`, error);
    throw error;
  }
};

// ============================================
// API STATISTIQUES
// ============================================

/**
 * Récupérer les statistiques des capteurs
 */
export const getSensorStatistics = async (): Promise<any> => {
  try {
    console.log('📈 Récupération des statistiques...');
    
    const response = await fetch(`${API_BASE_URL}/sensors/statistics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    await handleApiError(response, 'la récupération des statistiques');
    
    const stats = await response.json();
    console.log('✅ Statistiques récupérées');
    return stats;
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
};

// ============================================
// FONCTION DE TEST DE CONNECTIVITÉ
// ============================================

/**
 * Tester la connexion à l'API
 */
export const testApiConnection = async (): Promise<boolean> => {
  try {
    console.log('🔗 Test de connexion à l\'API...');
    
    const response = await fetch(`${API_BASE_URL}/sensors`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (response.ok) {
      console.log('✅ Connexion API réussie');
      return true;
    } else {
      console.error('❌ Échec de la connexion API:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur de connexion API:', error);
    return false;
  }
};