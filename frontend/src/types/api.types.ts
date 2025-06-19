// Types pour les réponses API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'gestionnaire' | 'citoyen' | 'chercheur';
  organization?: string;
}

export interface Alert {
  id: number;
  type: 'info' | 'warning' | 'critical';
  message: string;
  sensor_id?: number;
  timestamp: string;
  resolved: boolean;
}

export interface Suggestion {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'reviewed' | 'implemented';
  created_at: string;
  admin_response?: string;
}
