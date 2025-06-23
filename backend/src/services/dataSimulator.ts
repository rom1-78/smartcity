// backend/src/services/dataSimulator.ts
import db from '../services/db';
import { RowDataPacket } from 'mysql2';

interface SensorInfo {
    id: number;
    type: string;
    name: string;
    location: string;
}

class IoTDataSimulator {
    private intervals: NodeJS.Timeout[] = [];
    private isRunning = false;

    // Configuration des seuils par type de capteur
    private thresholds = {
        temperature: { min: 15, max: 35, warning: 25, critical: 30, unit: '°C' },
        air_quality: { min: 20, max: 200, warning: 100, critical: 150, unit: 'AQI' },
        noise: { min: 30, max: 80, warning: 60, critical: 70, unit: 'dB' },
        humidity: { min: 30, max: 90, warning: 80, critical: 85, unit: '%' },
        traffic: { min: 50, max: 500, warning: 300, critical: 400, unit: 'véh/h' },
        pollution: { min: 10, max: 150, warning: 80, critical: 120, unit: 'µg/m³' }
    };

    // Patterns temporels pour rendre les données plus réalistes
    private getTimePattern(type: string): number {
        const hour = new Date().getHours();

        switch (type) {
            case 'temperature':
                // Plus chaud l'après-midi
                return Math.sin((hour - 6) * Math.PI / 12) * 0.3 + 1;

            case 'traffic':
                // Pics aux heures de pointe
                if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
                    return 1.5;
                }
                return hour >= 22 || hour <= 6 ? 0.3 : 1;

            case 'noise':
                // Plus calme la nuit
                return hour >= 22 || hour <= 6 ? 0.4 : 1;

            case 'air_quality':
                // Moins bon aux heures de pointe
                if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
                    return 1.3;
                }
                return 1;

            case 'pollution':
                // Corrélé avec le trafic
                if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
                    return 1.4;
                }
                return 1;

            default:
                return 1;
        }
    }

    // Générer une valeur réaliste pour un capteur
    private generateValue(type: string, lastValue?: number): number {
        const config = this.thresholds[type as keyof typeof this.thresholds];
        if (!config) return 0;

        const timePattern = this.getTimePattern(type);
        const baseRange = config.max - config.min;

        // Variation progressive par rapport à la dernière valeur
        let value: number;
        if (lastValue !== undefined) {
            const maxChange = baseRange * 0.1; // Maximum 10% de changement
            const change = (Math.random() - 0.5) * maxChange;
            value = lastValue + change;
        } else {
            value = Math.random() * baseRange + config.min;
        }

        // Appliquer le pattern temporel
        const adjustedValue = value * timePattern;

        // S'assurer que la valeur reste dans les limites
        return Math.max(config.min, Math.min(config.max, adjustedValue));
    }

    // Vérifier et créer des alertes si nécessaire
    private async checkAndCreateAlert(sensorId: number, value: number, sensorType: string, sensorName: string, location: string) {
        try {
            const config = this.thresholds[sensorType as keyof typeof this.thresholds];
            if (!config) return;

            let alertType: 'warning' | 'critical' | null = null;
            let seuil_value = 0;

            if (value >= config.critical) {
                alertType = 'critical';
                seuil_value = config.critical;
            } else if (value >= config.warning) {
                alertType = 'warning';
                seuil_value = config.warning;
            }

            if (alertType) {
                // Vérifier s'il n'y a pas déjà une alerte non résolue récente
                const [existingAlert] = await db.execute<RowDataPacket[]>(
                    `SELECT id FROM alerts 
           WHERE sensor_id = ? AND alert_type = ? AND resolved_at IS NULL 
           AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
           LIMIT 1`,
                    [sensorId, alertType]
                );

                if (existingAlert.length === 0) {
                    const message = `${alertType === 'critical' ? 'CRITIQUE' : 'ATTENTION'}: ${sensorName} (${location}) - ${sensorType} à ${value.toFixed(1)} ${config.unit} (seuil: ${seuil_value} ${config.unit})`;

                    await db.execute(
                        'INSERT INTO alerts (sensor_id, alert_type, seuil_value, current_value, message) VALUES (?, ?, ?, ?, ?)',
                        [sensorId, alertType, seuil_value, value, message]
                    );

                    console.log(`🚨 Alerte ${alertType}: ${message}`);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des alertes:', error);
        }
    }

    // Simuler les données pour un capteur
    private async simulateSensorData(sensor: SensorInfo) {
        try {
            // Récupérer la dernière valeur pour une progression plus réaliste
            const [lastData] = await db.execute<RowDataPacket[]>(
                'SELECT value FROM sensor_data WHERE sensor_id = ? ORDER BY timestamp DESC LIMIT 1',
                [sensor.id]
            );

            const lastValue = lastData.length > 0 ? lastData[0].value : undefined;
            const value = this.generateValue(sensor.type, lastValue);
            const config = this.thresholds[sensor.type as keyof typeof this.thresholds];

            if (!config) {
                console.warn(`Type de capteur inconnu: ${sensor.type}`);
                return;
            }

            // Insérer les nouvelles données
            await db.execute(
                'INSERT INTO sensor_data (sensor_id, value, unit) VALUES (?, ?, ?)',
                [sensor.id, Number(value.toFixed(2)), config.unit]
            );

            // Vérifier les alertes
            await this.checkAndCreateAlert(sensor.id, value, sensor.type, sensor.name, sensor.location);

            console.log(`📊 ${sensor.name} (${sensor.type}): ${value.toFixed(2)} ${config.unit}`);

        } catch (error) {
            console.error(`Erreur simulation données pour capteur ${sensor.id}:`, error);
        }
    }

    // Démarrer la simulation
    async start(intervalSeconds = 30) {
        if (this.isRunning) {
            console.log('🔄 Simulateur déjà en cours d\'exécution');
            return;
        }

        try {
            // Récupérer tous les capteurs actifs
            const [sensors] = await db.execute<RowDataPacket[]>(
                'SELECT id, type, name, location FROM sensors WHERE status = "actif"'
            );

            if (sensors.length === 0) {
                console.log('⚠️ Aucun capteur actif trouvé pour la simulation');
                return;
            }

            this.isRunning = true;
            console.log(`🚀 Démarrage du simulateur IoT pour ${sensors.length} capteurs`);
            console.log(`⏱️ Intervalle: ${intervalSeconds} secondes`);

            // Créer des intervalles pour chaque capteur avec un léger décalage
            sensors.forEach((sensorRow: RowDataPacket, index: number) => {
                // Conversion explicite du RowDataPacket vers SensorInfo
                const sensorInfo: SensorInfo = {
                    id: sensorRow.id as number,
                    type: sensorRow.type as string,
                    name: sensorRow.name as string,
                    location: sensorRow.location as string
                };
                const delay = index * 1000; // Décalage de 1 seconde entre chaque capteur

                // setTimeout(() => {
                //     // Simulation immédiate
                //     this.simulateSensorData(sensor);

                //     // Puis simulation répétée
                //     const interval = setInterval(() => {
                //         this.simulateSensorData(sensor);
                //     }, intervalSeconds * 1000);

                //     this.intervals.push(interval);
                // }, delay);
            });

            // Log périodique du statut
            const statusInterval = setInterval(() => {
                console.log(`📈 Simulateur actif - ${sensors.length} capteurs en cours de simulation`);
            }, 5 * 60 * 1000); // Toutes les 5 minutes

            this.intervals.push(statusInterval);

        } catch (error) {
            console.error('❌ Erreur lors du démarrage du simulateur:', error);
            this.isRunning = false;
        }
    }

    // Arrêter la simulation
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Simulateur déjà arrêté');
            return;
        }

        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        this.isRunning = false;
        console.log('⏹️ Simulateur IoT arrêté');
    }

    // Statut du simulateur
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeIntervals: this.intervals.length,
            thresholds: this.thresholds
        };
    }

    // Simuler des données historiques (pour tests)
    async generateHistoricalData(days = 7) {
        try {
            console.log(`📅 Génération de données historiques pour ${days} jours...`);

            const [sensors] = await db.execute<RowDataPacket[]>(
                'SELECT id, type, name FROM sensors WHERE status = "actif"'
            );

            const now = new Date();
            const pointsPerDay = 48; // Toutes les 30 minutes
            const totalPoints = days * pointsPerDay;

            for (const sensor of sensors) {
                console.log(`Génération pour ${sensor.name}...`);

                let lastValue: number | undefined;

                for (let i = totalPoints; i >= 0; i--) {
                    const timestamp = new Date(now.getTime() - (i * 30 * 60 * 1000)); // 30 minutes en arrière
                    const value = this.generateValue(sensor.type, lastValue);
                    const config = this.thresholds[sensor.type as keyof typeof this.thresholds];

                    if (config) {
                        await db.execute(
                            'INSERT INTO sensor_data (sensor_id, value, unit, timestamp) VALUES (?, ?, ?, ?)',
                            [sensor.id, Number(value.toFixed(2)), config.unit, timestamp]
                        );

                        lastValue = value;
                    }

                    // Pause pour éviter la surcharge
                    if (i % 100 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                }
            }

            console.log('✅ Génération de données historiques terminée');
        } catch (error) {
            console.error('❌ Erreur génération données historiques:', error);
        }
    }

    // Créer des capteurs de test
    async createTestSensors() {
        try {
            console.log('🏗️ Création de capteurs de test...');

            const testSensors = [
                { name: 'Capteur Température Centre-ville', type: 'temperature', location: 'Place de la République', lat: 48.8566, lng: 2.3522 },
                {
                    name: 'Station Air Quartier Nord', type: 'air_quality', location: 'Avenue des Champs', lat: 48.8848, lng: 2.3504
                },
                { name: 'Mesure noise Zone Sud', type: 'noise', location: 'Rue de la Paix', lat: 48.8322, lng: 2.3509 },
                { name: 'Compteur Trafic Est', type: 'traffic', location: 'Boulevard de l\'Est', lat: 48.8534, lng: 2.3776 },
                { name: 'Humidité Parc Central', type: 'humidity', location: 'Parc Central', lat: 48.8629, lng: 2.3397 },
                { name: 'Pollution Industrielle', type: 'pollution', location: 'Zone Industrielle', lat: 48.8456, lng: 2.3892 }
            ];

            for (const sensor of testSensors) {
                await db.execute(
                    'INSERT INTO sensors (name, type, location, latitude, longitude, status, installed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [sensor.name, sensor.type, sensor.location, sensor.lat, sensor.lng, 'actif', new Date().toISOString().split('T')[0]]
                );
            }

            console.log(`✅ ${testSensors.length} capteurs de test créés`);
        } catch (error) {
            console.error('❌ Erreur création capteurs de test:', error);
        }
    }
}

// Instance singleton
const dataSimulator = new IoTDataSimulator();

export default dataSimulator;