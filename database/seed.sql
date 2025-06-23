-- ============================================
-- 1. UTILISATEURS
-- ============================================
INSERT INTO users (first_name, last_name, email, password, role, organization, created_at) VALUES
-- Administrateurs
('Admin', 'Système', 'admin@techcity.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'admin', 'Mairie de TechCity', '2024-01-01 08:00:00'),
('Sophie', 'Martin', 'sophie.martin@techcity.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'admin', 'Direction IT', '2024-01-15 09:30:00'),

-- Gestionnaires urbains
('Jean', 'Dupont', 'jean.dupont@techcity.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'gestionnaire', 'Service Environnement', '2024-01-20 10:00:00'),
('Marie', 'Leroy', 'marie.leroy@techcity.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'gestionnaire', 'Service Urbanisme', '2024-01-25 11:15:00'),
('Pierre', 'Bernard', 'pierre.bernard@techcity.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'gestionnaire', 'Service Circulation', '2024-02-01 14:30:00'),
('Claire', 'Dubois', 'claire.dubois@techcity.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'gestionnaire', 'Service Environnement', '2024-02-10 08:45:00'),

-- Chercheurs
('Dr. Antoine', 'Moreau', 'antoine.moreau@univ-tech.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'chercheur', 'Université TechCity', '2024-02-15 16:20:00'),
('Dr. Isabelle', 'Rousseau', 'isabelle.rousseau@cnrs.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'chercheur', 'CNRS', '2024-02-20 09:10:00'),
('Dr. François', 'Petit', 'francois.petit@inria.fr', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'chercheur', 'INRIA', '2024-03-01 13:25:00'),

-- Citoyens
('Paul', 'Lemoine', 'paul.lemoine@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-03-05 18:30:00'),
('Lucie', 'Garnier', 'lucie.garnier@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-03-10 20:45:00'),
('Marc', 'Roux', 'marc.roux@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-03-15 12:15:00'),
('Amélie', 'Simon', 'amelie.simon@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-03-20 15:50:00'),
('Thomas', 'Laurent', 'thomas.laurent@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-03-25 19:20:00'),
('Julie', 'Blanc', 'julie.blanc@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-04-01 11:40:00'),
('Nicolas', 'Guerin', 'nicolas.guerin@email.com', '$2b$10$rqK8zX9jKzY5kL6mN2oP3eQwRtYuIoPaS', 'citoyen', NULL, '2024-04-05 16:10:00');

-- ============================================
-- 2. CAPTEURS
-- ============================================
INSERT INTO sensors (name, type, location, latitude, longitude, status, installed_at) VALUES
-- Capteurs de air_quality
('Air-Centre-001', 'air_quality', 'Place de la République', 48.8566, 2.3522, 'actif', '2024-01-15'),
('Air-Nord-002', 'air_quality', 'Avenue du Général de Gaulle', 48.8680, 2.3420, 'actif', '2024-01-20'),
('Air-Sud-003', 'air_quality', 'Zone Industrielle Sud', 48.8420, 2.3650, 'maintenance', '2024-01-25'),
('Air-Est-004', 'air_quality', 'Quartier Résidentiel Est', 48.8590, 2.3780, 'actif', '2024-02-01'),
('Air-Ouest-005', 'air_quality', 'Centre Commercial Ouest', 48.8540, 2.3200, 'actif', '2024-02-05'),

-- Capteurs de noise
('noise-Centre-001', 'noise', 'Place de la République', 48.8566, 2.3522, 'actif', '2024-01-15'),
('noise-Ecole-002', 'noise', 'École Primaire Nord', 48.8650, 2.3450, 'actif', '2024-01-22'),
('noise-Autoroute-003', 'noise', 'Proximité A86', 48.8320, 2.3800, 'actif', '2024-01-28'),
('noise-Hopital-004', 'noise', 'Hôpital Central', 48.8610, 2.3350, 'inactif', '2024-02-03'),
('noise-Parc-005', 'noise', 'Parc Municipal', 48.8580, 2.3680, 'actif', '2024-02-08'),

-- Capteurs de température
('Temp-Centre-001', 'temperature', 'Hôtel de Ville', 48.8566, 2.3522, 'actif', '2024-01-15'),
('Temp-Parc-002', 'temperature', 'Parc Central', 48.8600, 2.3580, 'actif', '2024-01-18'),
('Temp-Industrie-003', 'temperature', 'Zone Industrielle', 48.8420, 2.3650, 'actif', '2024-01-25'),
('Temp-Residentiel-004', 'temperature', 'Quartier Pavillonnaire', 48.8520, 2.3750, 'maintenance', '2024-02-02'),

-- Capteurs d'humidité
('Humid-Parc-001', 'humidity', 'Parc des Sports', 48.8630, 2.3720, 'actif', '2024-01-20'),
('Humid-Riviere-002', 'humidity', 'Berges de la Seine', 48.8480, 2.3400, 'actif', '2024-01-26'),
('Humid-Foret-003', 'humidity', 'Forêt Urbaine', 48.8720, 2.3850, 'actif', '2024-02-01'),

-- Capteurs de circulation
('Traffic-A1-001', 'traffic', 'Avenue Principale', 48.8550, 2.3500, 'actif', '2024-02-05'),
('Traffic-Rond-002', 'traffic', 'Rond-Point Central', 48.8566, 2.3522, 'actif', '2024-02-08'),
('Traffic-Pont-003', 'traffic', 'Pont de TechCity', 48.8490, 2.3430, 'actif', '2024-02-12'),
('Traffic-Sortie-004', 'traffic', 'Sortie Autoroute', 48.8340, 2.3820, 'maintenance', '2024-02-15'),

-- Capteurs de pollution générale
('Pollution-Usine-001', 'pollution', 'Zone Industrielle Nord', 48.8720, 2.3300, 'actif', '2024-02-10'),
('Pollution-Port-002', 'pollution', 'Port Fluvial', 48.8440, 2.3380, 'actif', '2024-02-18'),
('Pollution-Gare-003', 'pollution', 'Gare Centrale', 48.8580, 2.3540, 'inactif', '2024-02-22');

-- ============================================
-- 3. DONNÉES DES CAPTEURS (sensor_data)
-- ============================================

-- Données pour les capteurs de air_quality (PM2.5 en µg/m³)
INSERT INTO sensor_data (sensor_id, value, unit, timestamp) VALUES
-- Capteur Air-Centre-001
(1, 28.5, 'µg/m³', '2025-06-17 00:00:00'),
(1, 32.1, 'µg/m³', '2025-06-17 01:00:00'),
(1, 35.7, 'µg/m³', '2025-06-17 02:00:00'),
(1, 42.3, 'µg/m³', '2025-06-17 03:00:00'),
(1, 38.9, 'µg/m³', '2025-06-17 04:00:00'),
(1, 31.2, 'µg/m³', '2025-06-17 05:00:00'),
(1, 45.8, 'µg/m³', '2025-06-17 06:00:00'),
(1, 52.4, 'µg/m³', '2025-06-17 07:00:00'),
(1, 48.1, 'µg/m³', '2025-06-17 08:00:00'),
(1, 41.5, 'µg/m³', '2025-06-17 09:00:00'),

-- Capteur Air-Nord-002
(2, 25.3, 'µg/m³', '2025-06-17 00:00:00'),
(2, 29.7, 'µg/m³', '2025-06-17 01:00:00'),
(2, 33.2, 'µg/m³', '2025-06-17 02:00:00'),
(2, 37.8, 'µg/m³', '2025-06-17 03:00:00'),
(2, 34.5, 'µg/m³', '2025-06-17 04:00:00'),
(2, 28.9, 'µg/m³', '2025-06-17 05:00:00'),
(2, 42.1, 'µg/m³', '2025-06-17 06:00:00'),
(2, 46.7, 'µg/m³', '2025-06-17 07:00:00'),
(2, 44.3, 'µg/m³', '2025-06-17 08:00:00'),
(2, 39.6, 'µg/m³', '2025-06-17 09:00:00'),

-- Données pour les capteurs de noise (en dB)
-- Capteur noise-Centre-001
(6, 65.2, 'dB', '2025-06-17 00:00:00'),
(6, 58.7, 'dB', '2025-06-17 01:00:00'),
(6, 52.4, 'dB', '2025-06-17 02:00:00'),
(6, 48.9, 'dB', '2025-06-17 03:00:00'),
(6, 51.3, 'dB', '2025-06-17 04:00:00'),
(6, 55.8, 'dB', '2025-06-17 05:00:00'),
(6, 72.5, 'dB', '2025-06-17 06:00:00'),
(6, 78.9, 'dB', '2025-06-17 07:00:00'),
(6, 75.3, 'dB', '2025-06-17 08:00:00'),
(6, 68.7, 'dB', '2025-06-17 09:00:00'),

-- Capteur noise-Ecole-002
(7, 45.2, 'dB', '2025-06-17 00:00:00'),
(7, 42.8, 'dB', '2025-06-17 01:00:00'),
(7, 39.5, 'dB', '2025-06-17 02:00:00'),
(7, 37.1, 'dB', '2025-06-17 03:00:00'),
(7, 40.3, 'dB', '2025-06-17 04:00:00'),
(7, 48.7, 'dB', '2025-06-17 05:00:00'),
(7, 62.4, 'dB', '2025-06-17 06:00:00'),
(7, 69.8, 'dB', '2025-06-17 07:00:00'),
(7, 58.2, 'dB', '2025-06-17 08:00:00'),
(7, 52.6, 'dB', '2025-06-17 09:00:00'),

-- Données pour les capteurs de température (en °C)
-- Capteur Temp-Centre-001
(11, 18.5, '°C', '2025-06-17 00:00:00'),
(11, 17.2, '°C', '2025-06-17 01:00:00'),
(11, 16.8, '°C', '2025-06-17 02:00:00'),
(11, 16.1, '°C', '2025-06-17 03:00:00'),
(11, 15.9, '°C', '2025-06-17 04:00:00'),
(11, 16.3, '°C', '2025-06-17 05:00:00'),
(11, 17.8, '°C', '2025-06-17 06:00:00'),
(11, 19.5, '°C', '2025-06-17 07:00:00'),
(11, 21.2, '°C', '2025-06-17 08:00:00'),
(11, 23.1, '°C', '2025-06-17 09:00:00'),

-- Capteur Temp-Parc-002
(12, 17.8, '°C', '2025-06-17 00:00:00'),
(12, 16.4, '°C', '2025-06-17 01:00:00'),
(12, 15.9, '°C', '2025-06-17 02:00:00'),
(12, 15.2, '°C', '2025-06-17 03:00:00'),
(12, 14.8, '°C', '2025-06-17 04:00:00'),
(12, 15.5, '°C', '2025-06-17 05:00:00'),
(12, 17.1, '°C', '2025-06-17 06:00:00'),
(12, 18.9, '°C', '2025-06-17 07:00:00'),
(12, 20.8, '°C', '2025-06-17 08:00:00'),
(12, 22.5, '°C', '2025-06-17 09:00:00'),

-- Données pour les capteurs d'humidité (en %)
-- Capteur Humid-Parc-001
(15, 68.5, '%', '2025-06-17 00:00:00'),
(15, 71.2, '%', '2025-06-17 01:00:00'),
(15, 73.8, '%', '2025-06-17 02:00:00'),
(15, 75.4, '%', '2025-06-17 03:00:00'),
(15, 76.9, '%'، '2025-06-17 04:00:00'),
(15, 74.3, '%', '2025-06-17 05:00:00'),
(15, 69.7, '%', '2025-06-17 06:00:00'),
(15, 65.2, '%', '2025-06-17 07:00:00'),
(15, 61.8, '%', '2025-06-17 08:00:00'),
(15, 58.4, '%', '2025-06-17 09:00:00'),

-- Données pour les capteurs de circulation (véhicules/heure)
-- Capteur Traffic-A1-001
(18, 145, 'véh/h', '2025-06-17 00:00:00'),
(18, 98, 'véh/h', '2025-06-17 01:00:00'),
(18, 67, 'véh/h', '2025-06-17 02:00:00'),
(18, 42, 'véh/h', '2025-06-17 03:00:00'),
(18, 38, 'véh/h', '2025-06-17 04:00:00'),
(18, 58, 'véh/h', '2025-06-17 05:00:00'),
(18, 189, 'véh/h', '2025-06-17 06:00:00'),
(18, 267, 'véh/h', '2025-06-17 07:00:00'),
(18, 298, 'véh/h', '2025-06-17 08:00:00'),
(18, 245, 'véh/h', '2025-06-17 09:00:00'),

-- Capteur Traffic-Rond-002
(19, 167, 'véh/h', '2025-06-17 00:00:00'),
(19, 112, 'véh/h', '2025-06-17 01:00:00'),
(19, 78, 'véh/h', '2025-06-17 02:00:00'),
(19, 51, 'véh/h', '2025-06-17 03:00:00'),
(19, 45, 'véh/h', '2025-06-17 04:00:00'),
(19, 73, 'véh/h', '2025-06-17 05:00:00'),
(19, 234, 'véh/h', '2025-06-17 06:00:00'),
(19, 312, 'véh/h', '2025-06-17 07:00:00'),
(19, 345, 'véh/h', '2025-06-17 08:00:00'),
(19, 287, 'véh/h', '2025-06-17 09:00:00'),

-- Données pour les capteurs de pollution générale (en ppm)
-- Capteur Pollution-Usine-001
(22, 0.045, 'ppm', '2025-06-17 00:00:00'),
(22, 0.052, 'ppm', '2025-06-17 01:00:00'),
(22, 0.048, 'ppm', '2025-06-17 02:00:00'),
(22, 0.041, 'ppm', '2025-06-17 03:00:00'),
(22, 0.039, 'ppm', '2025-06-17 04:00:00'),
(22, 0.043, 'ppm', '2025-06-17 05:00:00'),
(22, 0.067, 'ppm', '2025-06-17 06:00:00'),
(22, 0.089, 'ppm', '2025-06-17 07:00:00'),
(22, 0.078, 'ppm', '2025-06-17 08:00:00'),
(22, 0.061, 'ppm', '2025-06-17 09:00:00');

-- ============================================
-- 4. ALERTES
-- ============================================
INSERT INTO alerts (sensor_id, alert_type, seuil_value, current_value, message, created_at, resolved_at) VALUES
-- Alertes critiques
(1, 'critical', 50.0, 52.4, 'Niveau de pollution PM2.5 critique détecté au centre-ville. Recommandations : éviter les activités extérieures prolongées.', '2025-06-17 07:00:00', NULL),
(6, 'critical', 75.0, 78.9, 'Niveau sonore excessif détecté Place de la République. Intervention des services techniques requise.', '2025-06-17 07:00:00', '2025-06-17 08:30:00'),
(19, 'warning', 300.0, 345.0, 'Trafic dense détecté au rond-point central. Risque d\'embouteillages.', '2025-06-17 08:00:00', NULL),

-- Alertes d'avertissement
(2, 'warning', 40.0, 46.7, 'Qualité de l\'air dégradée dans le quartier Nord. Surveillance renforcée recommandée.', '2025-06-17 07:00:00', '2025-06-17 09:15:00'),
(18, 'warning', 250.0, 298.0, 'Circulation intense sur l\'Avenue Principale. Temps de trajet rallongés.', '2025-06-17 08:00:00', NULL),
(22, 'warning', 0.08, 0.089, 'Pic de pollution industrielle détecté. Contrôle des émissions requis.', '2025-06-17 07:00:00', NULL),

-- Alertes informatives
(11, 'info', 25.0, 23.1, 'Température agréable enregistrée au centre-ville.', '2025-06-17 09:00:00', NULL),
(15, 'info', 60.0, 58.4, 'Humidité optimale dans le parc des sports.', '2025-06-17 09:00:00', NULL),

-- Alertes historiques (résolues)
(1, 'warning', 40.0, 45.8, 'Qualité de l\'air temporairement dégradée.', '2025-06-17 06:00:00', '2025-06-17 06:45:00'),
(7, 'info', 65.0, 69.8, 'Niveau sonore élevé près de l\'école pendant les heures de pointe.', '2025-06-17 07:00:00', '2025-06-17 07:30:00');

-- ============================================
-- 5. RAPPORTS
-- ============================================
INSERT INTO reports (user_id, title, report_type, content, generated_at, start_date, end_date, is_public) VALUES
-- Rapports des gestionnaires
(3, 'Rapport Quotidien Qualité de l\'Air - 17 Juin 2025', 'daily', 
'{"summary": "Analyse de la qualité de l\'air pour la journée du 17 juin 2025", "avg_pm25": 38.7, "max_pm25": 52.4, "locations_affected": ["Centre-ville", "Quartier Nord"], "recommendations": ["Surveillance renforcée zone centre", "Information citoyens", "Contrôle trafic"]}', 
'2025-06-17 09:30:00', '2025-06-17', '2025-06-17', true),

(4, 'Analyse Hebdomadaire du Trafic', 'weekly', 
'{"period": "10-17 juin 2025", "avg_traffic": 187, "peak_hours": ["07:00-09:00", "17:00-19:00"], "congestion_points": ["Rond-Point Central", "Avenue Principale"], "improvement_suggestions": ["Optimisation feux tricolores", "Voies supplémentaires aux heures de pointe"]}', 
'2025-06-17 10:00:00', '2025-06-10', '2025-06-17', true),

(5, 'Rapport Mensuel Pollution Industrielle', 'monthly', 
'{"period": "Mai 2025", "avg_pollution": 0.052, "trend": "stable", "compliance_status": "conforme", "actions_taken": ["Contrôles renforcés", "Optimisation filtration"], "next_steps": ["Audit trimestriel", "Formation équipes"]}', 
'2025-06-01 16:00:00', '2025-05-01', '2025-05-31', false),

(6, 'Étude d\'Impact Environnemental - Zone Nord', 'custom', 
'{"study_area": "Quartier Nord", "parameters": ["air_quality", "noise", "temperature"], "duration": "3 mois", "findings": "Amélioration notable de la qualité de l\'air", "data_points": 2847, "recommendations": ["Maintenir mesures actuelles", "Extension zone verte"]}', 
'2025-06-15 14:20:00', '2025-03-15', '2025-06-15', true),

-- Rapports prédictifs
(3, 'Prévisions Qualité Air - Semaine 25', 'predictive', 
'{"model": "LSTM_v2.1", "prediction_period": "18-24 juin 2025", "expected_avg": 35.2, "risk_days": ["20 juin", "22 juin"], "confidence": 87.5, "factors": ["météo", "trafic_prévu", "activité_industrielle"], "alerts_expected": 3}', 
'2025-06-17 11:00:00', '2025-06-18', '2025-06-24', true),

-- Rapports de chercheurs
(7, 'Corrélation Trafic-Pollution Urbaine', 'custom', 
'{"research_title": "Impact du trafic automobile sur la qualité de l\'air urbain", "methodology": "Analyse multivariée", "sample_size": 15000, "correlation_coefficient": 0.78, "p_value": 0.001, "conclusions": "Corrélation significative confirmée", "publication_target": "Journal Environmental Science"}', 
'2025-06-16 09:45:00', '2025-01-01', '2025-06-15', false),

(8, 'Efficacité des Capteurs IoT - Étude Comparative', 'custom', 
'{"study_type": "Performance analysis", "sensors_tested": 24, "accuracy_rate": 94.2, "uptime": 98.7, "maintenance_frequency": "mensuelle", "cost_effectiveness": "élevée", "recommendations": ["Calibration trimestrielle", "Algorithmes ML pour prédiction pannes"]}', 
'2025-06-10 15:30:00', '2025-03-01', '2025-06-01', false),

-- Rapports publics pour citoyens
(1, 'Bulletin Environnemental Citoyen - Juin 2025', 'monthly', 
'{"citizen_summary": true, "air_quality_trend": "stable", "noise_hotspots": ["Centre-ville matin", "Zone industrielle"], "green_initiatives": ["Nouveau parc urbain", "Pistes cyclables"], "citizen_actions": ["Covoiturage", "Transport public", "Vélo électrique"]}', 
'2025-06-01 08:00:00', '2025-06-01', '2025-06-30', true);

-- ============================================
-- 6. SUGGESTIONS
-- ============================================
INSERT INTO suggestions (user_id, title, message, category, priority, admin_response, created_at, updated_at) VALUES
-- Suggestions des citoyens
(10, 'Capteur manquant Quartier Résidentiel', 
'Bonjour, je habite dans le quartier résidentiel près de la rue des Acacias et nous n\'avons aucun capteur de qualité de l\'air dans notre zone. Pourtant, nous sommes proches de l\'autoroute et ressentons souvent des odeurs de pollution. Serait-il possible d\'installer un capteur dans notre secteur ?', 
'location', 'high', 
'Votre demande a été transmise au service technique. Une étude de faisabilité sera menée dans les 2 prochaines semaines. Nous vous tiendrons informé des résultats.', 
'2025-06-15 14:30:00', '2025-06-16 09:15:00'),

(11, 'Fausses alertes capteur noise école', 
'Le capteur de noise près de l\'école primaire Nord semble dysfonctionner. Il envoie des alertes même pendant les weekends et vacances scolaires quand il n\'y a personne. Pourriez-vous vérifier son calibrage ?', 
'sensor', 'medium', 
'Merci pour votre signalement. Une équipe technique interviendra demain pour vérifier le capteur. Le problème semble lié à la sensibilité aux vibrations du bâtiment.', 
'2025-06-14 16:45:00', '2025-06-15 10:30:00'),

(12, 'Application mobile pour alertes', 
'Il serait très pratique d\'avoir une application mobile pour recevoir les alertes directement sur notre téléphone, surtout pour les alertes de pollution quand on fait du sport en extérieur.', 
'new_feature', 'medium', 
NULL, 
'2025-06-13 18:20:00', '2025-06-13 18:20:00'),

(13, 'Données historiques plus détaillées', 
'Serait-il possible d\'accéder aux données historiques avec une granularité plus fine ? Actuellement on ne peut voir que par jour, mais j\'aimerais analyser les variations par heure pour mon mémoire de master.', 
'data_quality', 'low', 
'Cette fonctionnalité est en cours de développement. Elle sera disponible dans la prochaine mise à jour prévue fin juillet. Vous serez notifié par email lors du déploiement.', 
'2025-06-12 11:10:00', '2025-06-14 14:45:00'),

(14, 'Capteur pollution près de la crèche', 
'Je suis parent d\'élève à la crèche municipale et je m\'inquiète de la qualité de l\'air pour nos enfants. N\'y aurait-il pas moyen d\'installer un capteur de pollution spécifiquement près de la crèche ?', 
'location', 'high', 
'Votre préoccupation est justifiée. Un capteur multi-paramètres (air, noise, température) sera installé près de la crèche avant la rentrée de septembre. Installation prévue courant août.', 
'2025-06-10 09:30:00', '2025-06-11 15:20:00'),

(15, 'Interface plus intuitive pour seniors', 
'L\'interface actuelle est un peu compliquée pour les personnes âgées. Pourriez-vous créer une version simplifiée avec de plus gros boutons et des explications plus claires ?', 
'new_feature', 'medium', 
NULL, 
'2025-06-08 20:15:00', '2025-06-08 20:15:00'),

(16, 'Partage sur réseaux sociaux', 
'Il serait bien de pouvoir partager facilement les données environnementales sur les réseaux sociaux pour sensibiliser nos amis et famille à la qualité de l\'air de notre ville.', 
'new_feature', 'low', 
'Fonctionnalité intéressante ! Nous l\'ajoutons à notre roadmap produit. Implementation prévue pour Q4 2025.', 
'2025-06-07 13:25:00', '2025-06-09 11:40:00'),

-- Suggestions des chercheurs
(7, 'API pour accès données recherche', 
'Dans le cadre de mes recherches sur la pollution urbaine, j\'aurais besoin d\'un accès API pour récupérer automatiquement les données des capteurs. Cela faciliterait grandement mes analyses statistiques.', 
'data_quality', 'high', 
'Un accès API recherche est effectivement prévu. Nous vous contacterons dans les prochains jours pour définir vos besoins spécifiques et les modalités d\'accès.', 
'2025-06-16 10:00:00', '2025-06-17 08:30:00'),

(8, 'Calibration inter-capteurs', 
'J\'ai remarqué des écarts significatifs entre certains capteurs du même type. Une procédure de calibration croisée pourrait améliorer la cohérence des mesures.', 
'sensor', 'high', 
'Excellente observation ! Une campagne de recalibration est planifiée pour juillet. Vos recommandations techniques sont les bienvenues pour optimiser le processus.', 
'2025-06-14 14:15:00', '2025-06-15 16:45:00'),

(9, 'Modèle prédictif pollution', 
'Je travaille sur un modèle de machine learning pour prédire les pics de pollution. Serait-il possible d\'intégrer ce modèle dans votre plateforme après validation ?', 
'new_feature', 'high', 
NULL, 
'2025-06-12 16:30:00', '2025-06-12 16:30:00'),

-- Suggestions des gestionnaires
(3, 'Seuils d\'alerte personnalisables', 
'Il serait utile de pouvoir personnaliser les seuils d\'alerte selon les zones (par exemple, seuils plus stricts près des écoles et hôpitaux).', 
'new_feature', 'high', 
'Fonctionnalité en cours de développement ! Les seuils adaptatifs par zone seront disponibles dans la version 2.1 prévue pour septembre.', 
'2025-06-11 08:45:00', '2025-06-12 10:20:00'),

(4, 'Intégration données météo', 
'L\'ajout de données météorologiques (vent, pression, précipitations) améliorerait la compréhension des variations de pollution et permettrait de meilleures prédictions.', 
'data_quality', 'medium', 
'Intégration en cours avec Météo-France. Les données météo seront disponibles dans l\'interface d\'ici fin juin.', 
'2025-06-09 11:20:00', '2025-06-10 14:10:00'),

(5, 'Rapport automatique incidents', 
'Génération automatique de rapports d\'incident lorsque plusieurs capteurs dépassent les seuils simultanément, avec recommandations d\'actions prédéfinies.', 
'new_feature', 'medium', 
NULL, 
'2025-06-08 15:40:00', '2025-06-08 15:40:00'),

(6, 'Formation utilisateurs citoyens', 
'Organisation de sessions de formation pour aider les citoyens à mieux comprendre et utiliser les données environnementales.', 
'other', 'low', 
'Excellente idée ! Planning de formations citoyennes en cours d\'élaboration avec le service communication. Première session prévue en juillet.', 
'2025-06-05 12:30:00', '2025-06-07 09:15:00'),

-- Suggestions diverses
(10, 'Capteur qualité eau fontaines', 
'Ajout de capteurs pour surveiller la qualité de l\'eau des fontaines publiques, particulièrement importante en été.', 
'location', 'medium', 
NULL, 
'2025-06-04 17:20:00', '2025-06-04 17:20:00'),

(13, 'Gamification engagement citoyen', 
'Système de points/badges pour encourager la participation citoyenne (signalements, suggestions, consultation régulière des données).', 
'new_feature', 'low', 
NULL, 
'2025-06-03 19:45:00', '2025-06-03 19:45:00'),

(11, 'Mode sombre interface', 
'Ajout d\'un mode sombre pour l\'interface, plus agréable pour les consultations en soirée.', 
'new_feature', 'low', 
'Fonctionnalité simple à implémenter. Sera disponible dans la prochaine mise à jour mineure prévue fin juin.', 
'2025-06-02 21:30:00', '2025-06-03 08:45:00');

-- ============================================
-- 7. DONNÉES SUPPLÉMENTAIRES POUR TESTS
-- ============================================

-- Ajout de plus de données historiques pour les graphiques
INSERT INTO sensor_data (sensor_id, value, unit, timestamp) VALUES
-- Données de la semaine dernière pour tendances
-- air_quality données (sensor_id = 1)
(1, 22.3, 'µg/m³', '2025-06-10 08:00:00'),
(1, 26.7, 'µg/m³', '2025-06-10 14:00:00'),
(1, 31.2, 'µg/m³', '2025-06-10 18:00:00'),
(1, 19.8, 'µg/m³', '2025-06-11 08:00:00'),
(1, 34.5, 'µg/m³', '2025-06-11 14:00:00'),
(1, 28.9, 'µg/m³', '2025-06-11 18:00:00'),
(1, 25.1, 'µg/m³', '2025-06-12 08:00:00'),
(1, 29.7, 'µg/m³', '2025-06-12 14:00:00'),
(1, 33.4, 'µg/m³', '2025-06-12 18:00:00'),
(1, 27.6, 'µg/m³', '2025-06-13 08:00:00'),
(1, 32.8, 'µg/m³', '2025-06-13 14:00:00'),
(1, 36.2, 'µg/m³', '2025-06-13 18:00:00'),

-- Traffic données (sensor_id = 18)
(18, 234, 'véh/h', '2025-06-10 08:00:00'),
(18, 178, 'véh/h', '2025-06-10 14:00:00'),
(18, 156, 'véh/h', '2025-06-10 18:00:00'),
(18, 289, 'véh/h', '2025-06-11 08:00:00'),
(18, 201, 'véh/h', '2025-06-11 14:00:00'),
(18, 187, 'véh/h', '2025-06-11 18:00:00'),
(18, 276, 'véh/h', '2025-06-12 08:00:00'),
(18, 195, 'véh/h', '2025-06-12 14:00:00'),
(18, 167, 'véh/h', '2025-06-12 18:00:00'),

-- Temperature données (sensor_id = 11)
(11, 20.5, '°C', '2025-06-10 08:00:00'),
(11, 24.8, '°C', '2025-06-10 14:00:00'),
(11, 22.1, '°C', '2025-06-10 18:00:00'),
(11, 19.3, '°C', '2025-06-11 08:00:00'),
(11, 23.7, '°C', '2025-06-11 14:00:00'),
(11, 21.4, '°C', '2025-06-11 18:00:00'),
(11, 18.9, '°C', '2025-06-12 08:00:00'),
(11, 22.6, '°C', '2025-06-12 14:00:00'),
(11, 20.8, '°C', '2025-06-12 18:00:00');

-- ============================================
-- 8. VÉRIFICATION DES DONNÉES
-- ============================================

-- Comptage des enregistrements créés
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Sensors', COUNT(*) FROM sensors
UNION ALL
SELECT 'Sensor Data', COUNT(*) FROM sensor_data
UNION ALL
SELECT 'Alerts', COUNT(*) FROM alerts
UNION ALL
SELECT 'Reports', COUNT(*) FROM reports
UNION ALL
SELECT 'Suggestions', COUNT(*) FROM suggestions;

-- Vue d'ensemble des capteurs par type et statut
SELECT type, status, COUNT(*) as count 
FROM sensors 
GROUP BY type, status 
ORDER BY type, status;

-- Dernières données par capteur
SELECT s.name, s.type, s.location, 
       sd.value, sd.unit, sd.timestamp
FROM sensors s
LEFT JOIN sensor_data sd ON s.id = sd.sensor_id
WHERE sd.timestamp = (
    SELECT MAX(timestamp) 
    FROM sensor_data sd2 
    WHERE sd2.sensor_id = s.id
)
ORDER BY s.type, s.name;

-- Statistiques des alertes
SELECT alert_type, COUNT(*) as count,
       COUNT(CASE WHEN resolved_at IS NULL THEN 1 END) as active_count
FROM alerts 
GROUP BY alert_type;
