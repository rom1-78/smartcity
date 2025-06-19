// Types pour les capteurs IoT
export interface Sensor {
  id: number;
  name: string;
  type: string;
  location: string;
  latitude?: number;
  longitude?: number;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  firmware_version?: string;
}

export interface SensorData {
  id: number;
  sensor_id: number;
  value: number;
  unit: string;
  timestamp: string;
}

export interface SensorWithData extends Sensor {
  currentValue?: number;
  currentUnit?: string;
  lastUpdate?: string;
  alertLevel?: 'normal' | 'warning' | 'critical';
}

export type SensorType = 'air_quality' | 'noise' | 'temperature' | 'humidity' | 'traffic' | 'pollution';
export type SensorStatus = 'actif' | 'inactif' | 'maintenance';
