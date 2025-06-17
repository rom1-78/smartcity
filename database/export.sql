-- --------------------------------------------------------
-- Hôte:                         127.0.0.1
-- Version du serveur:           8.0.30 - MySQL Community Server - GPL
-- SE du serveur:                Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Listage de la structure de la base pour smartcity
DROP DATABASE IF EXISTS `smartcity`;
CREATE DATABASE IF NOT EXISTS `smartcity` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `smartcity`;

-- Listage de la structure de table smartcity. activity_logs
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `table_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `record_id` int DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_action` (`user_id`,`action`),
  KEY `idx_table_record` (`table_name`,`record_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Listage des données de la table smartcity.activity_logs : ~0 rows (environ)

-- Listage de la structure de table smartcity. alerts
DROP TABLE IF EXISTS `alerts`;
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sensor_id` int DEFAULT NULL,
  `threshold` float DEFAULT NULL,
  `message` text COLLATE utf8mb4_general_ci,
  `triggered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sensor_id` (`sensor_id`),
  CONSTRAINT `alerts_ibfk_1` FOREIGN KEY (`sensor_id`) REFERENCES `sensors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Listage des données de la table smartcity.alerts : ~0 rows (environ)

-- Listage de la structure de vue smartcity. recent_sensor_data
DROP VIEW IF EXISTS `recent_sensor_data`;
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `recent_sensor_data` (
	`sensor_id` INT(10) NOT NULL,
	`sensor_name` VARCHAR(100) NULL COLLATE 'utf8mb4_general_ci',
	`type` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`location` VARCHAR(100) NULL COLLATE 'utf8mb4_general_ci',
	`status` VARCHAR(20) NULL COLLATE 'utf8mb4_general_ci',
	`value` FLOAT NULL,
	`unit` VARCHAR(10) NULL COLLATE 'utf8mb4_general_ci',
	`timestamp` TIMESTAMP NULL
) ENGINE=MyISAM;

-- Listage de la structure de table smartcity. reports
DROP TABLE IF EXISTS `reports`;
CREATE TABLE IF NOT EXISTS `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `content` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Listage des données de la table smartcity.reports : ~0 rows (environ)

-- Listage de la structure de table smartcity. sensors
DROP TABLE IF EXISTS `sensors`;
CREATE TABLE IF NOT EXISTS `sensors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `location` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `installed_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Listage des données de la table smartcity.sensors : ~74 rows (environ)
INSERT INTO `sensors` (`id`, `name`, `type`, `location`, `latitude`, `longitude`, `status`, `installed_at`) VALUES
	(1, 'Capteur Air A1', 'air_quality', 'Centre-ville', 48.85660000, 2.35220000, 'actif', '2024-01-01'),
	(2, 'Capteur Bruit B2', 'noise', 'Quartier Nord', 48.87000000, 2.35000000, 'actif', '2024-02-15'),
	(3, 'Air-Centre-001', 'air_quality', 'Place de la République', 48.86700000, 2.36300000, 'actif', '2024-01-15'),
	(4, 'Air-Nord-002', 'air_quality', 'Avenue du Général de Gaulle', 48.86800000, 2.34200000, 'actif', '2024-01-20'),
	(5, 'Air-Sud-003', 'air_quality', 'Zone Industrielle Sud', 48.84200000, 2.36500000, 'maintenance', '2024-01-25'),
	(6, 'Air-Est-004', 'air_quality', 'Quartier Résidentiel Est', 48.85900000, 2.37800000, 'actif', '2024-02-01'),
	(7, 'Air-Ouest-005', 'air_quality', 'Centre Commercial Ouest', 48.85400000, 2.32000000, 'actif', '2024-02-05'),
	(8, 'Bruit-Centre-001', 'noise', 'Place de la République', 48.86700000, 2.36300000, 'actif', '2024-01-15'),
	(9, 'Bruit-Ecole-002', 'noise', 'École Primaire Nord', 48.86500000, 2.34500000, 'actif', '2024-01-22'),
	(10, 'Bruit-Autoroute-003', 'noise', 'Proximité A86', 48.83200000, 2.38000000, 'actif', '2024-01-28'),
	(11, 'Bruit-Hopital-004', 'noise', 'Hôpital Central', 48.86100000, 2.33500000, 'inactif', '2024-02-03'),
	(12, 'Bruit-Parc-005', 'noise', 'Parc Municipal', 48.85800000, 2.36800000, 'actif', '2024-02-08'),
	(13, 'Temp-Centre-001', 'temperature', 'Hôtel de Ville', 48.85660000, 2.35220000, 'actif', '2024-01-15'),
	(14, 'Temp-Parc-002', 'temperature', 'Parc Central', 48.86000000, 2.35800000, 'actif', '2024-01-18'),
	(15, 'Temp-Industrie-003', 'temperature', 'Zone Industrielle', 48.84200000, 2.36500000, 'actif', '2024-01-25'),
	(16, 'Temp-Residentiel-004', 'temperature', 'Quartier Pavillonnaire', 48.85200000, 2.37500000, 'maintenance', '2024-02-02'),
	(17, 'Humid-Parc-001', 'humidity', 'Parc des Sports', 48.86300000, 2.37200000, 'actif', '2024-01-20'),
	(18, 'Humid-Riviere-002', 'humidity', 'Berges de la Seine', 48.84800000, 2.34000000, 'actif', '2024-01-26'),
	(19, 'Humid-Foret-003', 'humidity', 'Forêt Urbaine', 48.87200000, 2.38500000, 'actif', '2024-02-01'),
	(20, 'Traffic-A1-001', 'traffic', 'Avenue Principale', 48.85500000, 2.35000000, 'actif', '2024-02-05'),
	(21, 'Traffic-Rond-002', 'traffic', 'Rond-Point Central', 48.85660000, 2.35220000, 'actif', '2024-02-08'),
	(22, 'Traffic-Pont-003', 'traffic', 'Pont de TechCity', 48.84900000, 2.34300000, 'actif', '2024-02-12'),
	(23, 'Traffic-Sortie-004', 'traffic', 'Sortie Autoroute', 48.83400000, 2.38200000, 'maintenance', '2024-02-15'),
	(24, 'Pollution-Usine-001', 'pollution', 'Zone Industrielle Nord', 48.87200000, 2.33000000, 'actif', '2024-02-10'),
	(25, 'Pollution-Port-002', 'pollution', 'Port Fluvial', 48.84400000, 2.33800000, 'actif', '2024-02-18'),
	(26, 'Pollution-Gare-003', 'pollution', 'Gare Centrale', 48.85800000, 2.35400000, 'inactif', '2024-02-22'),
	(27, 'Air-Centre-001', 'air_quality', 'Place de la République', 48.85660000, 2.35220000, 'actif', '2024-01-15'),
	(28, 'Air-Nord-002', 'air_quality', 'Avenue du Général de Gaulle', 48.86800000, 2.34200000, 'actif', '2024-01-20'),
	(29, 'Air-Sud-003', 'air_quality', 'Zone Industrielle Sud', 48.84200000, 2.36500000, 'maintenance', '2024-01-25'),
	(30, 'Air-Est-004', 'air_quality', 'Quartier Résidentiel Est', 48.85900000, 2.37800000, 'actif', '2024-02-01'),
	(31, 'Air-Ouest-005', 'air_quality', 'Centre Commercial Ouest', 48.85400000, 2.32000000, 'actif', '2024-02-05'),
	(32, 'Bruit-Centre-001', 'noise', 'Place de la République', 48.85660000, 2.35220000, 'actif', '2024-01-15'),
	(33, 'Bruit-Ecole-002', 'noise', 'École Primaire Nord', 48.86500000, 2.34500000, 'actif', '2024-01-22'),
	(34, 'Bruit-Autoroute-003', 'noise', 'Proximité A86', 48.83200000, 2.38000000, 'actif', '2024-01-28'),
	(35, 'Bruit-Hopital-004', 'noise', 'Hôpital Central', 48.86100000, 2.33500000, 'inactif', '2024-02-03'),
	(36, 'Bruit-Parc-005', 'noise', 'Parc Municipal', 48.85800000, 2.36800000, 'actif', '2024-02-08'),
	(37, 'Temp-Centre-001', 'temperature', 'Hôtel de Ville', 48.85660000, 2.35220000, 'actif', '2024-01-15'),
	(38, 'Temp-Parc-002', 'temperature', 'Parc Central', 48.86000000, 2.35800000, 'actif', '2024-01-18'),
	(39, 'Temp-Industrie-003', 'temperature', 'Zone Industrielle', 48.84200000, 2.36500000, 'actif', '2024-01-25'),
	(40, 'Temp-Residentiel-004', 'temperature', 'Quartier Pavillonnaire', 48.85200000, 2.37500000, 'maintenance', '2024-02-02'),
	(41, 'Humid-Parc-001', 'humidity', 'Parc des Sports', 48.86300000, 2.37200000, 'actif', '2024-01-20'),
	(42, 'Humid-Riviere-002', 'humidity', 'Berges de la Seine', 48.84800000, 2.34000000, 'actif', '2024-01-26'),
	(43, 'Humid-Foret-003', 'humidity', 'Forêt Urbaine', 48.87200000, 2.38500000, 'actif', '2024-02-01'),
	(44, 'Traffic-A1-001', 'traffic', 'Avenue Principale', 48.85500000, 2.35000000, 'actif', '2024-02-05'),
	(45, 'Traffic-Rond-002', 'traffic', 'Rond-Point Central', 48.85660000, 2.35220000, 'actif', '2024-02-08'),
	(46, 'Traffic-Pont-003', 'traffic', 'Pont de TechCity', 48.84900000, 2.34300000, 'actif', '2024-02-12'),
	(47, 'Traffic-Sortie-004', 'traffic', 'Sortie Autoroute', 48.83400000, 2.38200000, 'maintenance', '2024-02-15'),
	(48, 'Pollution-Usine-001', 'pollution', 'Zone Industrielle Nord', 48.87200000, 2.33000000, 'actif', '2024-02-10'),
	(49, 'Pollution-Port-002', 'pollution', 'Port Fluvial', 48.84400000, 2.33800000, 'actif', '2024-02-18'),
	(50, 'Pollution-Gare-003', 'pollution', 'Gare Centrale', 48.85800000, 2.35400000, 'inactif', '2024-02-22'),
	(51, 'Air-Centre-001', 'air_quality', 'Place de la République', 48.85660000, 2.35220000, 'actif', '2024-01-15'),
	(52, 'Air-Nord-002', 'air_quality', 'Avenue du Général de Gaulle', 48.86800000, 2.34200000, 'actif', '2024-01-20'),
	(53, 'Air-Sud-003', 'air_quality', 'Zone Industrielle Sud', 48.84200000, 2.36500000, 'maintenance', '2024-01-25'),
	(54, 'Air-Est-004', 'air_quality', 'Quartier Résidentiel Est', 48.85900000, 2.37800000, 'actif', '2024-02-01'),
	(55, 'Air-Ouest-005', 'air_quality', 'Centre Commercial Ouest', 48.85400000, 2.32000000, 'actif', '2024-02-05'),
	(56, 'Bruit-Centre-001', 'noise', 'Place de la République', 48.85660000, 2.35220000, 'actif', '2024-01-15'),
	(57, 'Bruit-Ecole-002', 'noise', 'École Primaire Nord', 48.86500000, 2.34500000, 'actif', '2024-01-22'),
	(58, 'Bruit-Autoroute-003', 'noise', 'Proximité A86', 48.83200000, 2.38000000, 'actif', '2024-01-28'),
	(59, 'Bruit-Hopital-004', 'noise', 'Hôpital Central', 48.86100000, 2.33500000, 'inactif', '2024-02-03'),
	(60, 'Bruit-Parc-005', 'noise', 'Parc Municipal', 48.85800000, 2.36800000, 'actif', '2024-02-08'),
	(61, 'Temp-Centre-001', 'temperature', 'Hôtel de Ville', 48.85660000, 2.35220000, 'actif', '2024-01-15'),
	(62, 'Temp-Parc-002', 'temperature', 'Parc Central', 48.86000000, 2.35800000, 'actif', '2024-01-18'),
	(63, 'Temp-Industrie-003', 'temperature', 'Zone Industrielle', 48.84200000, 2.36500000, 'actif', '2024-01-25'),
	(64, 'Temp-Residentiel-004', 'temperature', 'Quartier Pavillonnaire', 48.85200000, 2.37500000, 'maintenance', '2024-02-02'),
	(65, 'Humid-Parc-001', 'humidity', 'Parc des Sports', 48.86300000, 2.37200000, 'actif', '2024-01-20'),
	(66, 'Humid-Riviere-002', 'humidity', 'Berges de la Seine', 48.84800000, 2.34000000, 'actif', '2024-01-26'),
	(67, 'Humid-Foret-003', 'humidity', 'Forêt Urbaine', 48.87200000, 2.38500000, 'actif', '2024-02-01'),
	(68, 'Traffic-A1-001', 'traffic', 'Avenue Principale', 48.85500000, 2.35000000, 'actif', '2024-02-05'),
	(69, 'Traffic-Rond-002', 'traffic', 'Rond-Point Central', 48.85660000, 2.35220000, 'actif', '2024-02-08'),
	(70, 'Traffic-Pont-003', 'traffic', 'Pont de TechCity', 48.84900000, 2.34300000, 'actif', '2024-02-12'),
	(71, 'Traffic-Sortie-004', 'traffic', 'Sortie Autoroute', 48.83400000, 2.38200000, 'maintenance', '2024-02-15'),
	(72, 'Pollution-Usine-001', 'pollution', 'Zone Industrielle Nord', 48.87200000, 2.33000000, 'actif', '2024-02-10'),
	(73, 'Pollution-Port-002', 'pollution', 'Port Fluvial', 48.84400000, 2.33800000, 'actif', '2024-02-18'),
	(74, 'Pollution-Gare-003', 'pollution', 'Gare Centrale', 48.85800000, 2.35400000, 'inactif', '2024-02-22');

-- Listage de la structure de table smartcity. sensor_data
DROP TABLE IF EXISTS `sensor_data`;
CREATE TABLE IF NOT EXISTS `sensor_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sensor_id` int DEFAULT NULL,
  `value` float DEFAULT NULL,
  `unit` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sensor_id` (`sensor_id`),
  CONSTRAINT `sensor_data_ibfk_1` FOREIGN KEY (`sensor_id`) REFERENCES `sensors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Listage des données de la table smartcity.sensor_data : ~102 rows (environ)
INSERT INTO `sensor_data` (`id`, `sensor_id`, `value`, `unit`, `timestamp`) VALUES
	(1, 1, 35.4, 'µg/m3', '2025-06-09 23:26:08'),
	(2, 2, 78.1, 'dB', '2025-06-09 23:26:08'),
	(3, 3, 28.5, 'µg/m³', '2025-06-16 22:00:00'),
	(4, 3, 32.1, 'µg/m³', '2025-06-16 23:00:00'),
	(5, 3, 35.7, 'µg/m³', '2025-06-17 00:00:00'),
	(6, 3, 42.3, 'µg/m³', '2025-06-17 01:00:00'),
	(7, 3, 38.9, 'µg/m³', '2025-06-17 02:00:00'),
	(8, 3, 31.2, 'µg/m³', '2025-06-17 03:00:00'),
	(9, 3, 45.8, 'µg/m³', '2025-06-17 04:00:00'),
	(10, 3, 52.4, 'µg/m³', '2025-06-17 05:00:00'),
	(11, 3, 48.1, 'µg/m³', '2025-06-17 06:00:00'),
	(12, 3, 41.5, 'µg/m³', '2025-06-17 07:00:00'),
	(13, 4, 25.3, 'µg/m³', '2025-06-16 22:00:00'),
	(14, 4, 29.7, 'µg/m³', '2025-06-16 23:00:00'),
	(15, 4, 33.2, 'µg/m³', '2025-06-17 00:00:00'),
	(16, 4, 37.8, 'µg/m³', '2025-06-17 01:00:00'),
	(17, 4, 34.5, 'µg/m³', '2025-06-17 02:00:00'),
	(18, 4, 28.9, 'µg/m³', '2025-06-17 03:00:00'),
	(19, 4, 42.1, 'µg/m³', '2025-06-17 04:00:00'),
	(20, 4, 46.7, 'µg/m³', '2025-06-17 05:00:00'),
	(21, 4, 44.3, 'µg/m³', '2025-06-17 06:00:00'),
	(22, 4, 39.6, 'µg/m³', '2025-06-17 07:00:00'),
	(23, 8, 65.2, 'dB', '2025-06-16 22:00:00'),
	(24, 8, 58.7, 'dB', '2025-06-16 23:00:00'),
	(25, 8, 52.4, 'dB', '2025-06-17 00:00:00'),
	(26, 8, 48.9, 'dB', '2025-06-17 01:00:00'),
	(27, 8, 51.3, 'dB', '2025-06-17 02:00:00'),
	(28, 8, 55.8, 'dB', '2025-06-17 03:00:00'),
	(29, 8, 72.5, 'dB', '2025-06-17 04:00:00'),
	(30, 8, 78.9, 'dB', '2025-06-17 05:00:00'),
	(31, 8, 75.3, 'dB', '2025-06-17 06:00:00'),
	(32, 8, 68.7, 'dB', '2025-06-17 07:00:00'),
	(33, 9, 45.2, 'dB', '2025-06-16 22:00:00'),
	(34, 9, 42.8, 'dB', '2025-06-16 23:00:00'),
	(35, 9, 39.5, 'dB', '2025-06-17 00:00:00'),
	(36, 9, 37.1, 'dB', '2025-06-17 01:00:00'),
	(37, 9, 40.3, 'dB', '2025-06-17 02:00:00'),
	(38, 9, 48.7, 'dB', '2025-06-17 03:00:00'),
	(39, 9, 62.4, 'dB', '2025-06-17 04:00:00'),
	(40, 9, 69.8, 'dB', '2025-06-17 05:00:00'),
	(41, 9, 58.2, 'dB', '2025-06-17 06:00:00'),
	(42, 9, 52.6, 'dB', '2025-06-17 07:00:00'),
	(43, 13, 18.5, '°C', '2025-06-16 22:00:00'),
	(44, 13, 17.2, '°C', '2025-06-16 23:00:00'),
	(45, 13, 16.8, '°C', '2025-06-17 00:00:00'),
	(46, 13, 16.1, '°C', '2025-06-17 01:00:00'),
	(47, 13, 15.9, '°C', '2025-06-17 02:00:00'),
	(48, 13, 16.3, '°C', '2025-06-17 03:00:00'),
	(49, 13, 17.8, '°C', '2025-06-17 04:00:00'),
	(50, 13, 19.5, '°C', '2025-06-17 05:00:00'),
	(51, 13, 21.2, '°C', '2025-06-17 06:00:00'),
	(52, 13, 23.1, '°C', '2025-06-17 07:00:00'),
	(53, 14, 17.8, '°C', '2025-06-16 22:00:00'),
	(54, 14, 16.4, '°C', '2025-06-16 23:00:00'),
	(55, 14, 15.9, '°C', '2025-06-17 00:00:00'),
	(56, 14, 15.2, '°C', '2025-06-17 01:00:00'),
	(57, 14, 14.8, '°C', '2025-06-17 02:00:00'),
	(58, 14, 15.5, '°C', '2025-06-17 03:00:00'),
	(59, 14, 17.1, '°C', '2025-06-17 04:00:00'),
	(60, 14, 18.9, '°C', '2025-06-17 05:00:00'),
	(61, 14, 20.8, '°C', '2025-06-17 06:00:00'),
	(62, 14, 22.5, '°C', '2025-06-17 07:00:00'),
	(63, 17, 68.5, '%', '2025-06-16 22:00:00'),
	(64, 17, 71.2, '%', '2025-06-16 23:00:00'),
	(65, 17, 73.8, '%', '2025-06-17 00:00:00'),
	(66, 17, 75.4, '%', '2025-06-17 01:00:00'),
	(67, 17, 76.9, '%', '2025-06-17 02:00:00'),
	(68, 17, 74.3, '%', '2025-06-17 03:00:00'),
	(69, 17, 69.7, '%', '2025-06-17 04:00:00'),
	(70, 17, 65.2, '%', '2025-06-17 05:00:00'),
	(71, 17, 61.8, '%', '2025-06-17 06:00:00'),
	(72, 17, 58.4, '%', '2025-06-17 07:00:00'),
	(73, 20, 145, 'véh/h', '2025-06-16 22:00:00'),
	(74, 20, 98, 'véh/h', '2025-06-16 23:00:00'),
	(75, 20, 67, 'véh/h', '2025-06-17 00:00:00'),
	(76, 20, 42, 'véh/h', '2025-06-17 01:00:00'),
	(77, 20, 38, 'véh/h', '2025-06-17 02:00:00'),
	(78, 20, 58, 'véh/h', '2025-06-17 03:00:00'),
	(79, 20, 189, 'véh/h', '2025-06-17 04:00:00'),
	(80, 20, 267, 'véh/h', '2025-06-17 05:00:00'),
	(81, 20, 298, 'véh/h', '2025-06-17 06:00:00'),
	(82, 20, 245, 'véh/h', '2025-06-17 07:00:00'),
	(83, 21, 167, 'véh/h', '2025-06-16 22:00:00'),
	(84, 21, 112, 'véh/h', '2025-06-16 23:00:00'),
	(85, 21, 78, 'véh/h', '2025-06-17 00:00:00'),
	(86, 21, 51, 'véh/h', '2025-06-17 01:00:00'),
	(87, 21, 45, 'véh/h', '2025-06-17 02:00:00'),
	(88, 21, 73, 'véh/h', '2025-06-17 03:00:00'),
	(89, 21, 234, 'véh/h', '2025-06-17 04:00:00'),
	(90, 21, 312, 'véh/h', '2025-06-17 05:00:00'),
	(91, 21, 345, 'véh/h', '2025-06-17 06:00:00'),
	(92, 21, 287, 'véh/h', '2025-06-17 07:00:00'),
	(93, 24, 0.045, 'ppm', '2025-06-16 22:00:00'),
	(94, 24, 0.052, 'ppm', '2025-06-16 23:00:00'),
	(95, 24, 0.048, 'ppm', '2025-06-17 00:00:00'),
	(96, 24, 0.041, 'ppm', '2025-06-17 01:00:00'),
	(97, 24, 0.039, 'ppm', '2025-06-17 02:00:00'),
	(98, 24, 0.043, 'ppm', '2025-06-17 03:00:00'),
	(99, 24, 0.067, 'ppm', '2025-06-17 04:00:00'),
	(100, 24, 0.089, 'ppm', '2025-06-17 05:00:00'),
	(101, 24, 0.078, 'ppm', '2025-06-17 06:00:00'),
	(102, 24, 0.061, 'ppm', '2025-06-17 07:00:00');

-- Listage de la structure de vue smartcity. sensor_statistics
DROP VIEW IF EXISTS `sensor_statistics`;
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `sensor_statistics` (
	`id` INT(10) NOT NULL,
	`name` VARCHAR(100) NULL COLLATE 'utf8mb4_general_ci',
	`type` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`location` VARCHAR(100) NULL COLLATE 'utf8mb4_general_ci',
	`status` VARCHAR(20) NULL COLLATE 'utf8mb4_general_ci',
	`data_count` BIGINT(19) NOT NULL,
	`avg_value` DOUBLE NULL,
	`min_value` FLOAT NULL,
	`max_value` FLOAT NULL,
	`last_reading` TIMESTAMP NULL
) ENGINE=MyISAM;

-- Listage de la structure de table smartcity. suggestions
DROP TABLE IF EXISTS `suggestions`;
CREATE TABLE IF NOT EXISTS `suggestions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `message` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `suggestions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Listage des données de la table smartcity.suggestions : ~0 rows (environ)

-- Listage de la structure de table smartcity. system_config
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE IF NOT EXISTS `system_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `config_value` text COLLATE utf8mb4_general_ci,
  `description` text COLLATE utf8mb4_general_ci,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_config_key` (`config_key`),
  CONSTRAINT `system_config_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Listage des données de la table smartcity.system_config : ~0 rows (environ)

-- Listage de la structure de table smartcity. users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `organization` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Listage des données de la table smartcity.users : ~6 rows (environ)
INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `role`, `organization`, `created_at`) VALUES
	(1, '', '', 'admin@techcity.fr', '$2b$10$abcdefghijklmnopqrstuv', 'admin', NULL, '2025-06-09 23:26:08'),
	(2, '', '', 'citoyen@techcity.fr', '$2b$10$abcdefghijklmnopqrstuv', 'citoyen', NULL, '2025-06-09 23:26:08'),
	(3, '', '', 'gestionnaire@techcity.fr', '$2b$10$abcdefghijklmnopqrstuv', 'gestionnaire', NULL, '2025-06-09 23:26:08'),
	(4, 'gzrteg', 'greger', 'grezqg@gmail.com', '$2b$10$.ppXmmg/Enlrjb.d4yqbjuVuIm1cc8U77lJvdo0we55q8msN6nKa6', 'citoyen', '', '2025-06-10 20:19:27'),
	(5, 'jcvrbehjvof', 'pibvreihbv', 'impbvfrekhzbvkrtfebzskv@mail.com', '$2b$10$VcDPlzBz/tICXyZd619W1etGrN1l4QXepQ4vIlLdwyuMdX27HLc6u', 'chercheur', '', '2025-06-11 17:10:22'),
	(6, 'greg', 'zadv', 'vrefagrtea@goma.com', '$2b$10$RUWgQO7hj3NPGn.lBNWLl.jIdR8JEu8s32Kx0zPED2Pl3Me8/.QdW', 'gestionnaire', 'tetete', '2025-06-12 23:12:02'),
	(8, 'zegerz', 'jyutrze', 'chercheur@techcity.fr', '$2b$10$j.k3B86uJGvREalcY3kKuOP/rn0.vsofCO6Ls8A6MRNcvjTzgNzJe', 'chercheur', 'azyyyy', '2025-06-13 20:58:47'),
	(25, 'Sophie', 'Martin', 'sophie.martin@techcity.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'admin', 'Direction IT', '2024-01-15 08:30:00'),
	(26, 'Jean', 'Dupont', 'jean.dupont@techcity.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'gestionnaire', 'Service Environnement', '2024-01-20 09:00:00'),
	(27, 'Marie', 'Leroy', 'marie.leroy@techcity.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'gestionnaire', 'Service Urbanisme', '2024-01-25 10:15:00'),
	(28, 'Pierre', 'Bernard', 'pierre.bernard@techcity.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'gestionnaire', 'Service Circulation', '2024-02-01 13:30:00'),
	(29, 'Claire', 'Dubois', 'claire.dubois@techcity.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'gestionnaire', 'Service Environnement', '2024-02-10 07:45:00'),
	(30, 'Dr. Antoine', 'Moreau', 'antoine.moreau@univ-tech.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'chercheur', 'Université TechCity', '2024-02-15 15:20:00'),
	(31, 'Dr. Isabelle', 'Rousseau', 'isabelle.rousseau@cnrs.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'chercheur', 'CNRS', '2024-02-20 08:10:00'),
	(32, 'Dr. François', 'Petit', 'francois.petit@inria.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'chercheur', 'INRIA', '2024-03-01 12:25:00'),
	(33, 'Paul', 'Lemoine', 'paul.lemoine@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-03-05 17:30:00'),
	(34, 'Lucie', 'Garnier', 'lucie.garnier@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-03-10 19:45:00'),
	(35, 'Marc', 'Roux', 'marc.roux@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-03-15 11:15:00'),
	(36, 'Amélie', 'Simon', 'amelie.simon@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-03-20 14:50:00'),
	(37, 'Thomas', 'Laurent', 'thomas.laurent@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-03-25 18:20:00'),
	(38, 'Julie', 'Blanc', 'julie.blanc@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-04-01 09:40:00'),
	(39, 'Nicolas', 'Guerin', 'nicolas.guerin@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-04-05 14:10:00');

-- Listage de la structure de vue smartcity. recent_sensor_data
DROP VIEW IF EXISTS `recent_sensor_data`;
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `recent_sensor_data`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `recent_sensor_data` AS select `s`.`id` AS `sensor_id`,`s`.`name` AS `sensor_name`,`s`.`type` AS `type`,`s`.`location` AS `location`,`s`.`status` AS `status`,`sd`.`value` AS `value`,`sd`.`unit` AS `unit`,`sd`.`timestamp` AS `timestamp` from (`sensors` `s` left join `sensor_data` `sd` on((`s`.`id` = `sd`.`sensor_id`))) where ((`sd`.`timestamp` >= (now() - interval 1 hour)) or `sd`.`id` in (select max(`sensor_data`.`id`) from `sensor_data` where (`sensor_data`.`sensor_id` = `s`.`id`)));

-- Listage de la structure de vue smartcity. sensor_statistics
DROP VIEW IF EXISTS `sensor_statistics`;
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `sensor_statistics`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `sensor_statistics` AS select `s`.`id` AS `id`,`s`.`name` AS `name`,`s`.`type` AS `type`,`s`.`location` AS `location`,`s`.`status` AS `status`,count(`sd`.`id`) AS `data_count`,avg(`sd`.`value`) AS `avg_value`,min(`sd`.`value`) AS `min_value`,max(`sd`.`value`) AS `max_value`,max(`sd`.`timestamp`) AS `last_reading` from (`sensors` `s` left join `sensor_data` `sd` on((`s`.`id` = `sd`.`sensor_id`))) where (`sd`.`timestamp` >= (now() - interval 24 hour)) group by `s`.`id`,`s`.`name`,`s`.`type`,`s`.`location`,`s`.`status`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
