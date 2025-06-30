// frontend/src/services/alerts.ts (CORRIGÉ)
import { getToken } from './auth'; //  Correction: getToken au lieu de getAuthToken

const API_BASE_URL = 'http://localhost:5000/api';

// Interface pour les alertes
export interface Alert {
  id: number;
  sensor_id: number;
  alert_type: 'info' | 'warning' | 'critical';
  seuil_value?: number;
  current_value?: number;
  message: string;
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
  const token = getToken(); //  Utilise getToken() du service auth

  console.log('🔑 Token pour alerts:', token ? `${token.substring(0, 20)}...` : 'NON TROUVÉ');

  if (!token) {
    console.error(' Aucun token trouvé pour les alertes');
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

    console.error(` Erreur lors de ${operation}:`, {
      status: response.status,
      statusText: response.statusText,
      message: errorMessage
    });

    throw new Error(errorMessage);
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
} = {}): Promise<Alert[]> => {
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
    console.log(' Alertes récupérées:', alerts.length);
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

    console.log(' Alerte résolue:', alertId);

  } catch (error) {
    console.error(`Erreur lors de la résolution de l'alerte ${alertId}:`, error);
    throw error;
  }
};

/**
 * Créer une nouvelle alerte (pour les administrateurs)
 */
export const createAlert = async (alertData: {
  sensor_id: number;
  alert_type: 'info' | 'warning' | 'critical';
  seuil_value?: number;
  current_value?: number;
  message: string;
}): Promise<Alert> => {
  try {
    console.log('🚨 Création d\'une nouvelle alerte...');

    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(alertData),
    });

    await handleApiError(response, 'la création de l\'alerte');

    const result = await response.json();
    console.log(' Alerte créée:', result.alert?.id || 'Nouvelle alerte');
    return result.alert || result;

  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte:', error);
    throw error;
  }
};

/**
 * Supprimer une alerte
 */
export const deleteAlert = async (alertId: number): Promise<void> => {
  try {
    console.log(`🚨 Suppression de l'alerte ${alertId}...`);

    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    await handleApiError(response, 'la suppression de l\'alerte');

    console.log(' Alerte supprimée:', alertId);

  } catch (error) {
    console.error(`Erreur lors de la suppression de l'alerte ${alertId}:`, error);
    throw error;
  }
};