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
  `status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `installed_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Listage des données de la table smartcity.sensors : ~2 rows (environ)
INSERT INTO `sensors` (`id`, `name`, `type`, `location`, `status`, `installed_at`) VALUES
	(1, 'Capteur Air A1', 'air_quality', 'Centre-ville', 'actif', '2024-01-01'),
	(2, 'Capteur Bruit B2', 'noise', 'Quartier Nord', 'actif', '2024-02-15');

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Listage des données de la table smartcity.sensor_data : ~2 rows (environ)
INSERT INTO `sensor_data` (`id`, `sensor_id`, `value`, `unit`, `timestamp`) VALUES
	(1, 1, 35.4, 'µg/m3', '2025-06-09 23:26:08'),
	(2, 2, 78.1, 'dB', '2025-06-09 23:26:08');

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Listage des données de la table smartcity.users : ~3 rows (environ)
INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `role`, `organization`, `created_at`) VALUES
	(1, '', '', 'admin', '$2b$10$abcdefghijklmnopqrstuv', 'admin', NULL, '2025-06-09 23:26:08'),
	(2, '', '', 'citoyen1', '$2b$10$abcdefghijklmnopqrstuv', 'citoyen', NULL, '2025-06-09 23:26:08'),
	(3, '', '', 'gestionnaire1', '$2b$10$abcdefghijklmnopqrstuv', 'gestionnaire', NULL, '2025-06-09 23:26:08'),
	(4, 'gzrteg', 'greger', 'grezqg@gmail.com', '$2b$10$.ppXmmg/Enlrjb.d4yqbjuVuIm1cc8U77lJvdo0we55q8msN6nKa6', 'citoyen', '', '2025-06-10 20:19:27'),
	(5, 'jcvrbehjvof', 'pibvreihbv', 'impbvfrekhzbvkrtfebzskv@mail.com', '$2b$10$VcDPlzBz/tICXyZd619W1etGrN1l4QXepQ4vIlLdwyuMdX27HLc6u', 'citoyen', '', '2025-06-11 17:10:22');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
