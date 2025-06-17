// frontend/src/services/reports.ts (CORRIGÉ)
import { getToken } from './auth'; // ✅ Import correct

const API_BASE_URL = 'http://localhost:5000/api'; // ✅ Défini ici

// Interface pour les rapports
export interface Report {
  id: number;
  user_id: number;
  title: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom' | 'predictive';
  content?: string;
  generated_at: string;
  start_date?: string;
  end_date?: string;
  is_public: boolean;
}

export interface ReportRequest {
  title: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom' | 'predictive';
  start_date?: string;
  end_date?: string;
  is_public?: boolean;
  sensors?: number[];
  metrics?: string[];
}

// ============================================
// FONCTION UTILITAIRE POUR LES HEADERS
// ============================================
const getAuthHeaders = () => { // ✅ Défini ici
  const token = getToken();
  
  console.log('🔑 Token pour reports:', token ? `${token.substring(0, 20)}...` : 'NON TROUVÉ');
  
  if (!token) {
    console.error('❌ Aucun token trouvé pour les rapports');
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
// API RAPPORTS
// ============================================

/**
 * Récupérer tous les rapports
 */
export const getReports = async (options: {
  report_type?: string;
  is_public?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<Report[]> => {
  try {
    console.log('📊 Récupération des rapports...');
    
    const params = new URLSearchParams();
    if (options.report_type) params.append('report_type', options.report_type);
    if (options.is_public !== undefined) params.append('is_public', options.is_public.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    
    const url = `${API_BASE_URL}/reports${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    await handleApiError(response, 'la récupération des rapports');
    
    const reports = await response.json();
    console.log('✅ Rapports récupérés:', reports.length);
    return reports;
    
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    throw new Error('Impossible de récupérer les rapports');
  }
};

/**
 * Récupérer un rapport par ID
 */
export const getReportById = async (id: number): Promise<Report> => {
  try {
    console.log(`📊 Récupération du rapport ${id}...`);
    
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    await handleApiError(response, 'la récupération du rapport');
    
    const report = await response.json();
    console.log('✅ Rapport récupéré:', report.title);
    return report;
    
  } catch (error) {
    console.error(`Erreur lors de la récupération du rapport ${id}:`, error);
    throw error;
  }
};

/**
 * Créer un nouveau rapport
 */
export const createReport = async (reportData: ReportRequest): Promise<Report> => {
  try {
    console.log('📊 Création d\'un nouveau rapport:', reportData.title);
    
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportData),
    });
    
    await handleApiError(response, 'la création du rapport');
    
    const result = await response.json();
    console.log('✅ Rapport créé:', result.report?.title || 'Nouveau rapport');
    return result.report || result;
    
  } catch (error) {
    console.error('Erreur lors de la création du rapport:', error);
    throw error;
  }
};

/**
 * Mettre à jour un rapport
 */
export const updateReport = async (id: number, reportData: Partial<ReportRequest>): Promise<Report> => {
  try {
    console.log(`📊 Mise à jour du rapport ${id}...`);
    
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportData),
    });
    
    await handleApiError(response, 'la mise à jour du rapport');
    
    const result = await response.json();
    console.log('✅ Rapport mis à jour:', result.report?.title || `Rapport ${id}`);
    return result.report || result;
    
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du rapport ${id}:`, error);
    throw error;
  }
};

/**
 * Supprimer un rapport
 */
export const deleteReport = async (id: number): Promise<void> => {
  try {
    console.log(`📊 Suppression du rapport ${id}...`);
    
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    await handleApiError(response, 'la suppression du rapport');
    
    console.log('✅ Rapport supprimé:', id);
    
  } catch (error) {
    console.error(`Erreur lors de la suppression du rapport ${id}:`, error);
    throw error;
  }
};

/**
 * Générer un rapport automatique
 */
export const generateReport = async (reportConfig: {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  sensors?: number[];
  metrics?: string[];
  start_date?: string;
  end_date?: string;
}): Promise<Report> => {
  try {
    console.log('📊 Génération d\'un rapport automatique...');
    
    const response = await fetch(`${API_BASE_URL}/reports/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportConfig),
    });
    
    await handleApiError(response, 'la génération du rapport');
    
    const result = await response.json();
    console.log('✅ Rapport généré:', result.report?.title || 'Rapport automatique');
    return result.report || result;
    
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    throw error;
  }
};

/**
 * Exporter un rapport (PDF, CSV, etc.)
 */
export const exportReport = async (id: number, format: 'pdf' | 'csv' | 'json' = 'pdf'): Promise<Blob> => {
  try {
    console.log(`📊 Export du rapport ${id} en ${format.toUpperCase()}...`);
    
    const response = await fetch(`${API_BASE_URL}/reports/${id}/export?format=${format}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('✅ Rapport exporté');
    return blob;
    
  } catch (error) {
    console.error(`Erreur lors de l'export du rapport ${id}:`, error);
    throw error;
  }
};