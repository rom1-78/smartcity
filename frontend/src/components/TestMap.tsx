import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    L: any;
  }
}

const TestMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initMap = async () => {
      try {
        console.log(' Test map init...');

        // Charger CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Charger JS
        if (!window.L) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          document.head.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });

          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!window.L) {
          throw new Error('Leaflet pas chargé');
        }

        if (!mapRef.current) {
          throw new Error('Div map pas trouvée');
        }

        // Créer carte simple
        const map = window.L.map(mapRef.current).setView([48.8566, 2.3522], 13);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        // Marqueur simple
        window.L.marker([48.8566, 2.3522])
          .addTo(map)
          .bindPopup('Test Paris!')
          .openPopup();

        setLoaded(true);
        console.log(' Carte test OK');

      } catch (err: any) {
        console.error(' Erreur test:', err);
        setError(err.message);
      }
    };

    initMap();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Test Carte Leaflet</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          Erreur: {error}
        </div>
      )}

      {!loaded && !error && (
        <div className="bg-blue-100 text-blue-700 p-3 rounded mb-4">
          Chargement...
        </div>
      )}

      {loaded && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          Carte chargée avec succès!
        </div>
      )}

      <div
        ref={mapRef}
        style={{
          height: '400px',
          width: '100%',
          border: '2px solid #ccc',
          borderRadius: '8px'
        }}
      />
    </div>
  );
};

export default TestMap;