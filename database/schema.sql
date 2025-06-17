CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    organization VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
);


CREATE TABLE sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('temperature', 'air_quality', 'noise', 'humidity', 'traffic', 'pollution') NOT NULL,
    location VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    status ENUM('actif', 'inactif', 'maintenance') NOT NULL DEFAULT 'actif',
    installed_at DATE NOT NULL,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_location (location),
    INDEX idx_installed_at (installed_at),
    INDEX idx_name (name)
);


CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    value DECIMAL(10,3) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE,
    INDEX idx_sensor_timestamp (sensor_id, timestamp),
    INDEX idx_timestamp (timestamp),
    INDEX idx_value (value));


CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    alert_type ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
    seuil_value DECIMAL(10,3) NOT NULL,
    current_value DECIMAL(10,3) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE,
    INDEX idx_sensor_alert (sensor_id, created_at),
    INDEX idx_alert_type (alert_type),
    INDEX idx_created_at (created_at)
);


CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    report_type ENUM('daily', 'weekly', 'monthly', 'custom', 'predictive') NOT NULL,
    content LONGTEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date DATE NULL,
    end_date DATE NULL,
    is_public BOOLEAN DEFAULT FALSE,
   
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_report (user_id, generated_at),
    INDEX idx_report_type (report_type),
    INDEX idx_date_range (start_date, end_date),
    INDEX idx_is_public (is_public)
);


CREATE TABLE suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category ENUM('sensor', 'data_quality', 'new_feature', 'location', 'other') DEFAULT 'other',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    admin_response TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_suggestion (user_id, created_at),
    INDEX idx_category (category),
    INDEX idx_priority (priority)
);

-- Table des configurations système
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_config_key (config_key)
);

-- Table des logs d'activité
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_created_at (created_at)
);

-- Création des vues pour faciliter les requêtes

-- Vue pour les données récentes des capteurs
CREATE OR REPLACE VIEW recent_sensor_data AS
SELECT 
    s.id as sensor_id,
    s.name as sensor_name,
    s.type,
    s.location,
    s.latitude,
    s.longitude,
    s.status,
    sd.value,
    sd.unit,
    sd.timestamp
FROM sensors s
LEFT JOIN sensor_data sd ON s.id = sd.sensor_id
WHERE sd.timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
   OR sd.id IN (
       SELECT MAX(id) 
       FROM sensor_data 
       WHERE sensor_id = s.id
   );

-- Vue pour les statistiques par capteur
CREATE OR REPLACE VIEW sensor_statistics AS
SELECT 
    s.id,
    s.name,
    s.type,
    s.location,
    s.latitude,
    s.longitude,
    s.status,
    COUNT(sd.id) as data_count,
    AVG(sd.value) as avg_value,
    MIN(sd.value) as min_value,
    MAX(sd.value) as max_value,
    MAX(sd.timestamp) as last_reading
FROM sensors s
LEFT JOIN sensor_data sd ON s.id = sd.sensor_id
WHERE sd.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY s.id, s.name, s.type, s.location, s.latitude,
    s.longitude, s.status;