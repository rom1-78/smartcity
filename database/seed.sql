INSERT INTO users (username, password, role) VALUES
('admin', '$2b$10$abcdefghijklmnopqrstuv', 'admin'),
('citoyen1', '$2b$10$abcdefghijklmnopqrstuv', 'citoyen'),
('gestionnaire1', '$2b$10$abcdefghijklmnopqrstuv', 'gestionnaire');

-- Insertion de capteurs d'exemple
INSERT IGNORE INTO sensors (name, type, location, status, installed_at, latitude, longitude) VALUES
('Capteur Air Centre-ville A1', 'air_quality', 'Place de la République', 'actif', '2024-01-15', 48.8566, 2.3522),
('Capteur Bruit Nord B1', 'noise', 'Quartier Nord - Rue des Lilas', 'actif', '2024-01-20', 48.8606, 2.3376),
('Capteur Température Sud T1', 'temperature', 'Zone industrielle Sud', 'maintenance', '2024-01-25', 48.8496, 2.3700),
('Capteur Humidité Est H1', 'humidity', 'Parc de l\'Est', 'actif', '2024-02-01', 48.8656, 2.3850),
('Capteur Circulation Ouest C1', 'traffic', 'Avenue de l\'Ouest', 'actif', '2024-02-05', 48.8576, 2.3200),
('Capteur Pollution P1', 'pollution', 'Zone industrielle', 'inactif', '2024-02-10', 48.8456, 2.3900);

-- Insertion de données de capteurs d'exemple
INSERT IGNORE INTO sensor_data (sensor_id, value, unit) VALUES
(1, 35.5, 'µg/m³'),
(1, 42.1, 'µg/m³'),
(1, 38.7, 'µg/m³'),
(2, 65.2, 'dB'),
(2, 72.8, 'dB'),
(2, 58.9, 'dB'),
(3, 22.5, '°C'),
(3, 24.1, '°C'),
(4, 68.5, '%'),
(4, 71.2, '%'),
(5, 145, 'véh/h'),
(5, 198, 'véh/h');

-- Insertion d'alertes d'exemple
INSERT IGNORE INTO alerts (sensor_id, alert_type, threshold_value, current_value, message) VALUES
(1, 'warning', 40.0, 42.1, 'Qualité de l\'air dégradée - seuil d\'alerte dépassé'),
(2, 'critical', 70.0, 72.8, 'Niveau sonore critique détecté - intervention requise'),
(5, 'info', 200.0, 198.0, 'Trafic dense mais dans les limites acceptables');

-- Insertion de configurations système
INSERT IGNORE INTO system_config (config_key, config_value, description) VALUES
('alert_email_enabled', 'true', 'Activation des alertes par email'),
('data_retention_days', '365', 'Nombre de jours de rétention des données'),
('max_sensors_per_user', '50', 'Nombre maximum de capteurs par utilisateur'),
('api_rate_limit', '1000', 'Limite de requêtes API par heure'),
('maintenance_mode', 'false', 'Mode maintenance du système');
