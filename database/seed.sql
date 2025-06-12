INSERT INTO users (username, password, role) VALUES
('admin', '$2b$10$abcdefghijklmnopqrstuv', 'admin'),
('citoyen1', '$2b$10$abcdefghijklmnopqrstuv', 'citoyen'),
('manager1', '$2b$10$abcdefghijklmnopqrstuv', 'manager');

INSERT INTO sensors (name, type, location, status, installed_at) VALUES
('Capteur Air A1', 'air_quality', 'Centre-ville', 'actif', '2024-01-01'),
('Capteur Bruit B2', 'noise', 'Quartier Nord', 'actif', '2024-02-15');

INSERT INTO sensor_data (sensor_id, value, unit) VALUES
(1, 35.4, 'µg/m3'),
(2, 78.1, 'dB');
