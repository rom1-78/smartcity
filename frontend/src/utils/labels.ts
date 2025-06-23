export const SENSOR_LABELS = {
  air_quality: "Qualité de l'air",
  noise: "Niveau sonore", 
  temperature: "Température",
  humidity: "Humidité",
  traffic: "Circulation"
} as const;

export const getSensorLabel = (type: string): string => {
  return SENSOR_LABELS[type as keyof typeof SENSOR_LABELS] || type;
};