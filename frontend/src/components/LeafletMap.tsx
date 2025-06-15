// frontend/src/components/LeafletMap.tsx - Version corrigée
import React, { useRef, useEffect, useState } from 'react';
import { Sensor } from '../services/sensor';

// Interface locale pour éviter les conflits avec services/sensor.ts
interface MapSensorData {
    id?: number;
    name: string;
    type: string;
    location: string;
    latitude?: number;
    longitude?: number;
    value?: number;
    unit?: string;
    status: 'normal' | 'warning' | 'critical'; // Statut fonctionnel pour la carte
    timestamp?: Date;
    installed_at?: string; // Compatibilité
}

interface LeafletMapProps {
    sensors: MapSensorData[];
    className?: string;
    locationFilter?: string;
    sensorTypeFilter?: string;
    onSensorClick?: (sensor: MapSensorData) => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
    sensors,
    className,
    locationFilter = 'all',
    sensorTypeFilter = 'all',
    onSensorClick
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

    // Charger Leaflet
    useEffect(() => {
        let isMounted = true;

        const loadLeaflet = async () => {
            try {
                // Vérifier si Leaflet est déjà chargé
                if ((window as any).L) {
                    if (isMounted) {
                        await initializeMap();
                    }
                    return;
                }

                // Charger les CSS de Leaflet
                if (!document.querySelector('link[href*="leaflet"]')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
                    link.crossOrigin = '';
                    document.head.appendChild(link);

                    await new Promise((resolve, reject) => {
                        link.onload = resolve;
                        link.onerror = () => reject(new Error('Erreur chargement CSS Leaflet'));
                        setTimeout(() => reject(new Error('Timeout CSS')), 10000);
                    });
                }

                // Charger le JavaScript de Leaflet
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
                script.crossOrigin = '';
                document.head.appendChild(script);

                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Erreur chargement Leaflet'));
                    setTimeout(() => reject(new Error('Timeout Leaflet')), 10000);
                });

                // Attendre que Leaflet soit complètement disponible
                let attempts = 0;
                while (!(window as any).L && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }

                if (!(window as any).L) {
                    throw new Error('Leaflet non disponible après chargement');
                }

                if (isMounted) {
                    await initializeMap();
                }
            } catch (error) {
                console.error('Erreur lors du chargement de Leaflet:', error);
                if (isMounted) {
                    setMapError('Impossible de charger la carte. Vérifiez votre connexion internet.');
                }
            }
        };

        const initializeMap = async () => {
            try {
                const L = (window as any).L;
                if (!L || !mapRef.current || mapInstanceRef.current) {
                    return;
                }

                // Créer la carte
                mapInstanceRef.current = L.map(mapRef.current, {
                    center: [48.8566, 2.3522], // Paris
                    zoom: 12,
                    zoomControl: true,
                    attributionControl: true,
                    preferCanvas: true // Améliore les performances
                });

                // Couches de tuiles
                const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                });

                const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    attribution: '© CARTO © OpenStreetMap contributors',
                    maxZoom: 19
                });

                const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: '© Esri, Maxar, Earthstar Geographics',
                    maxZoom: 19
                });

                // Ajouter la couche par défaut
                cartoLayer.addTo(mapInstanceRef.current);

                // Contrôle des couches
                const baseMaps = {
                    "🗺️ Plan": cartoLayer,
                    "🌍 OpenStreetMap": osmLayer,
                    "🛰️ Satellite": satelliteLayer
                };

                L.control.layers(baseMaps, null, {
                    position: 'topleft',
                    collapsed: false
                }).addTo(mapInstanceRef.current);

                // Contrôle d'échelle
                L.control.scale({
                    position: 'bottomleft',
                    metric: true,
                    imperial: false
                }).addTo(mapInstanceRef.current);

                // Légende
                const legend = L.control({ position: 'bottomright' });
                legend.onAdd = () => {
                    const div = L.DomUtil.create('div', 'map-legend');
                    div.style.cssText = `
                        background: white;
                        padding: 12px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        font-family: Arial, sans-serif;
                        font-size: 12px;
                        line-height: 1.5;
                    `;

                    div.innerHTML = `
                        <div style="font-weight: bold; margin-bottom: 8px; color: #374151;">État des capteurs</div>
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #10b981; margin-right: 8px;"></div>
                            <span>Normal</span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #f59e0b; margin-right: 8px;"></div>
                            <span>Attention</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ef4444; margin-right: 8px;"></div>
                            <span>Critique</span>
                        </div>
                    `;
                    return div;
                };
                legend.addTo(mapInstanceRef.current);

                setIsMapLoaded(true);
                setMapError(null);
            } catch (error) {
                console.error('Erreur lors de l\'initialisation de la carte:', error);
                setMapError('Erreur lors de l\'initialisation de la carte');
            }
        };

        if (mapRef.current) {
            loadLeaflet();
        }

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                try {
                    mapInstanceRef.current.remove();
                } catch (error) {
                    console.warn('Erreur lors du nettoyage de la carte:', error);
                } finally {
                    mapInstanceRef.current = null;
                    setIsMapLoaded(false);
                }
            }
        };
    }, []);

    // Mettre à jour les marqueurs
    useEffect(() => {
        if (!mapInstanceRef.current || !(window as any).L || !isMapLoaded) return;

        const L = (window as any).L;

        try {
            // Supprimer les anciens marqueurs
            markersRef.current.forEach(marker => {
                try {
                    mapInstanceRef.current.removeLayer(marker);
                } catch (error) {
                    console.warn('Erreur suppression marqueur:', error);
                }
            });
            markersRef.current = [];

            // Filtrer les capteurs
            const filteredSensors = sensors.filter(sensor => {
                if (!sensor.latitude || !sensor.longitude) return false;

                const locationMatch = locationFilter === 'all' ||
                    sensor.location.toLowerCase().includes(locationFilter.toLowerCase());
                const typeMatch = sensorTypeFilter === 'all' || sensor.type === sensorTypeFilter;

                return locationMatch && typeMatch;
            });

            // Fonction pour obtenir la couleur selon le statut
            const getStatusColor = (status: string) => {
                switch (status) {
                    case 'normal': return '#10b981';
                    case 'warning': return '#f59e0b';
                    case 'critical': return '#ef4444';
                    default: return '#6b7280';
                }
            };

            // Fonction pour obtenir l'icône selon le type
            const getTypeIcon = (type: string) => {
                switch (type) {
                    case 'air_quality': return '🌬️';
                    case 'temperature': return '🌡️';
                    case 'noise_level':
                    case 'noise': return '🔊';
                    case 'traffic': return '🚗';
                    case 'humidity': return '💧';
                    case 'pollution': return '☁️';
                    default: return '📡';
                }
            };

            // Fonction pour obtenir le nom du type
            const getTypeName = (type: string) => {
                switch (type) {
                    case 'air_quality': return 'Qualité de l\'air';
                    case 'temperature': return 'Température';
                    case 'noise_level':
                    case 'noise': return 'Niveau sonore';
                    case 'traffic': return 'Trafic';
                    case 'humidity': return 'Humidité';
                    case 'pollution': return 'Pollution';
                    default: return type.replace('_', ' ');
                }
            };

            // Ajouter les nouveaux marqueurs
            filteredSensors.forEach(sensor => {
                try {
                    const marker = L.circleMarker([sensor.latitude!, sensor.longitude!], {
                        radius: 10,
                        fillColor: getStatusColor(sensor.status),
                        color: '#ffffff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    });

                    // Animation au survol
                    marker.on('mouseover', function (e: any) {
                        this.setRadius(12);
                        this.setStyle({ weight: 3 });
                    });

                    marker.on('mouseout', function (e: any) {
                        this.setRadius(10);
                        this.setStyle({ weight: 2 });
                    });

                    // Popup amélioré
                    const popupContent = `
                        <div style="font-family: Arial, sans-serif; min-width: 250px; max-width: 300px;">
                            <div style="display: flex; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
                                <span style="font-size: 24px; margin-right: 8px;">${getTypeIcon(sensor.type)}</span>
                                <div>
                                    <h4 style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">
                                        ${sensor.name || `Capteur ${getTypeName(sensor.type)}`}
                                    </h4>
                                    <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                        ${getTypeName(sensor.type)}
                                    </p>
                                </div>
                            </div>
                            
                            <div style="space-y: 8px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <span style="color: #374151; font-weight: 500;">Localisation:</span>
                                    <span style="color: #6b7280;">${sensor.location}</span>
                                </div>
                                
                                ${sensor.value !== undefined ? `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <span style="color: #374151; font-weight: 500;">Valeur:</span>
                                    <span style="color: #111827; font-weight: 600;">${sensor.value} ${sensor.unit || ''}</span>
                                </div>
                                ` : ''}
                                
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <span style="color: #374151; font-weight: 500;">État:</span>
                                    <span style="
                                        color: ${getStatusColor(sensor.status)}; 
                                        font-weight: 600;
                                        padding: 2px 8px;
                                        border-radius: 12px;
                                        background-color: ${getStatusColor(sensor.status)}20;
                                    ">
                                        ${sensor.status === 'normal' ? 'Normal' :
                                            sensor.status === 'warning' ? 'Attention' :
                                                sensor.status === 'critical' ? 'Critique' : sensor.status}
                                    </span>
                                </div>
                                
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: #374151; font-weight: 500;">Coordonnées:</span>
                                    <span style="color: #6b7280; font-size: 11px;">
                                        ${sensor.latitude!.toFixed(4)}, ${sensor.longitude!.toFixed(4)}
                                    </span>
                                </div>
                                
                                ${sensor.id ? `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <span style="color: #374151; font-weight: 500;">ID:</span>
                                    <span style="color: #6b7280; font-size: 11px;">${sensor.id}</span>
                                </div>
                                ` : ''}
                                
                                ${sensor.timestamp ? `
                                <div style="text-align: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                                    <span style="color: #9ca3af; font-size: 11px;">
                                        Dernière mise à jour: ${sensor.timestamp.toLocaleString('fr-FR')}
                                    </span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    `;

                    marker.bindPopup(popupContent, {
                        maxWidth: 300,
                        className: 'custom-popup'
                    });

                    // Événement de clic
                    if (onSensorClick) {
                        marker.on('click', () => {
                            onSensorClick(sensor);
                        });
                    }

                    marker.addTo(mapInstanceRef.current);
                    markersRef.current.push(marker);
                } catch (error) {
                    console.warn('Erreur ajout marqueur pour le capteur:', sensor.id, error);
                }
            });

            // Ajuster la vue pour inclure tous les marqueurs
            if (markersRef.current.length > 0) {
                const group = new L.featureGroup(markersRef.current);
                mapInstanceRef.current.fitBounds(group.getBounds(), {
                    padding: [20, 20],
                    maxZoom: 15
                });
            }

        } catch (error) {
            console.error('Erreur mise à jour marqueurs:', error);
        }
    }, [sensors, locationFilter, sensorTypeFilter, isMapLoaded, onSensorClick]);

    // Affichage d'erreur
    if (mapError) {
        return (
            <div className={`${className} flex items-center justify-center bg-red-50 border border-red-200 rounded-lg`}>
                <div className="text-center p-6">
                    <div className="text-red-500 mb-2">
                        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <p className="text-red-700 font-medium">{mapError}</p>
                    <button
                        onClick={() => {
                            setMapError(null);
                            window.location.reload();
                        }}
                        className="mt-2 text-red-600 hover:text-red-800 underline"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    // Affichage pendant le chargement
    if (!isMapLoaded) {
        return (
            <div className={`${className} flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg`}>
                <div className="text-center p-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement de la carte interactive TechCity...</p>
                    <p className="text-gray-400 text-sm mt-1">Patientez quelques instants</p>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div
                ref={mapRef}
                style={{ height: '100%', width: '100%', borderRadius: '8px' }}
            />

            {/* CSS personnalisé pour les popups */}
            <style>{`
                .custom-popup .leaflet-popup-content {
                    margin: 0;
                }
                .custom-popup .leaflet-popup-tip {
                    background: white;
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .leaflet-control-layers {
                    font-size: 13px;
                }
                .leaflet-control-layers-toggle {
                    background-color: white;
                }
            `}</style>
        </div>
    );
};

export default LeafletMap;