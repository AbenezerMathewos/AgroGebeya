import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';

// Real GPS Coordinates & 3D Altitudes for Ethiopian Agricultural Corridors
const AGRI_HUBS = [
  {
    id: 'addis',
    name: 'Addis Ababa (Ehil Berenda / Merkato)',
    amharic: 'አዲስ አበባ (እህል በረንዳ / መርካቶ)',
    lat: 9.0300,
    lng: 38.7400,
    altitude: 2355,
    type: 'terminal',
    role: 'Central National Terminal Market',
    activeLots: 840,
    dominantCrops: ['All Commodity Inflows', 'Wholesale Distribution'],
    avgPrice: 'Terminal Reference Rate',
    freightStatus: 'Destination Hub (All Routes)',
    icon: '🏢',
    color: '#f59e0b',
  },
  {
    id: 'south',
    name: 'Wolaita Sodo & South Ethiopia',
    amharic: 'ወላይታ ሶዶ እና ደቡብ ኢትዮጵያ',
    lat: 6.8600,
    lng: 37.7500,
    altitude: 2100,
    type: 'production',
    role: 'Central Root & Spice Aggregation Depot',
    activeLots: 168,
    dominantCrops: ['Red Ginger', 'Enset (Kocho)', 'Hass Avocado', 'Boloso-1 Taro'],
    avgPrice: '4,500 – 11,500 ETB/Qtl',
    freightStatus: '24 Return Isuzu Trucks Daily ➔ Addis',
    icon: '🌱',
    color: '#10b981',
  },
  {
    id: 'oromia',
    name: 'Jimma & Oromia Coffee Belt',
    amharic: 'ጅማ እና ኦሮሚያ',
    lat: 7.6700,
    lng: 36.8300,
    altitude: 1780,
    type: 'production',
    role: 'Specialty Washed Coffee & Maize Aggregator',
    activeLots: 245,
    dominantCrops: ['Grade 1 Washed Coffee', 'Yellow Maize', 'Durum Wheat'],
    avgPrice: '3,800 – 14,000 ETB/Qtl',
    freightStatus: '48 FSR & Heavy Trucks Daily ➔ Addis',
    icon: '☕',
    color: '#0ea5e9',
  },
  {
    id: 'amhara',
    name: 'Bahir Dar & Gojjam Grain Plains',
    amharic: 'ባሕር ዳር እና ጎጃም',
    lat: 11.5900,
    lng: 37.3900,
    altitude: 1800,
    type: 'production',
    role: 'Magna Teff & Oilseed Union Pool',
    activeLots: 194,
    dominantCrops: ['Magna White Teff', 'Red Kidney Beans', 'Sesame'],
    avgPrice: '6,200 – 11,800 ETB/Qtl',
    freightStatus: '35 Return Isuzu Trucks Daily ➔ Addis',
    icon: '🌾',
    color: '#d97706',
  },
  {
    id: 'sidama',
    name: 'Hawassa & Sidama Highlands',
    amharic: 'ሐዋሳ እና ሲዳማ',
    lat: 7.0500,
    lng: 38.4700,
    altitude: 1900,
    type: 'production',
    role: 'ECX Certified Specialty Sourcing Depot',
    activeLots: 112,
    dominantCrops: ['Yirgacheffe Arabica Coffee', 'Organic Forest Honey'],
    avgPrice: '9,500 – 16,500 ETB/Qtl',
    freightStatus: '18 Direct Freight Units Daily',
    icon: '🍯',
    color: '#8b5cf6',
  },
  {
    id: 'tigray',
    name: 'Mekelle & Raya Valley',
    amharic: 'መቀሌ እና ራያ',
    lat: 13.4900,
    lng: 39.4700,
    altitude: 2250,
    type: 'production',
    role: 'Northern Cereals & White Honey Corridor',
    activeLots: 86,
    dominantCrops: ['White Sorghum', 'Highland Teff', 'White Honey'],
    avgPrice: '5,100 – 9,800 ETB/Qtl',
    freightStatus: '14 Trucks Daily ➔ Addis & Kombolcha',
    icon: '🌾',
    color: '#059669',
  },
  {
    id: 'harar',
    name: 'Dire Dawa & Harar Corridor',
    amharic: 'ድሬዳዋ እና ሐረር',
    lat: 9.5900,
    lng: 41.8600,
    altitude: 1885,
    type: 'production',
    role: 'Eastern Export Gateway & Transit Depot',
    activeLots: 98,
    dominantCrops: ['Harar Longberry Coffee', 'Export Onion', 'Groundnuts'],
    avgPrice: '4,200 – 13,200 ETB/Qtl',
    freightStatus: '22 Freight Units Daily',
    icon: '☕',
    color: '#0284c7',
  },
];

// Freight Route Corridors connecting to Addis Ababa
const FREIGHT_CORRIDORS = [
  { from: [6.8600, 37.7500], to: [9.0300, 38.7400], label: 'Sodo ➔ Addis Corridor (330 km)' },
  { from: [7.6700, 36.8300], to: [9.0300, 38.7400], label: 'Jimma ➔ Addis Corridor (350 km)' },
  { from: [11.5900, 37.3900], to: [9.0300, 38.7400], label: 'Bahir Dar ➔ Addis Corridor (490 km)' },
  { from: [7.0500, 38.4700], to: [9.0300, 38.7400], label: 'Hawassa ➔ Addis Expressway (275 km)' },
  { from: [13.4900, 39.4700], to: [9.0300, 38.7400], label: 'Mekelle ➔ Addis Corridor (780 km)' },
  { from: [9.5900, 41.8600], to: [9.0300, 38.7400], label: 'Dire Dawa ➔ Addis Corridor (450 km)' },
];

export default function EthiopiaAgriMap() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const tileLayerRef = useRef(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [selectedHub, setSelectedHub] = useState(AGRI_HUBS[0]); // Default Addis Ababa Central Terminal
  const [mapStyle, setMapStyle] = useState('streets'); // 'streets' | 'satellite' | 'earth3d' | 'dark'

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapStyle === 'earth3d') return; // Do not initialize Leaflet when 3D Google Earth is active

    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [selectedHub.lat, selectedHub.lng],
        zoom: 6.8,
        minZoom: 5.5,
        maxZoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);

      // Invalidate size after layout stabilization
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapStyle]);

  // Update Tile Layer when mapStyle or isDark changes
  useEffect(() => {
    if (mapStyle === 'earth3d') return;
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // 100% Free, open tile providers — zero API keys required, zero watermarks
    let tileUrl;
    let tileOptions = { maxZoom: 16 };

    if (mapStyle === 'satellite') {
      // ESRI World Imagery — high-resolution global satellite photography
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      tileOptions = {
        maxZoom: 19,
        maxNativeZoom: 18,
      };
    } else if (mapStyle === 'dark') {
      // ESRI World Dark Gray Canvas — dedicated dark-mode radar / logistics basemap
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      tileOptions = {
        maxZoom: 16,
        maxNativeZoom: 16,
        className: 'night-radar-tiles',
      };
    } else {
      // OpenStreetMap — standard global vector road map with full Ethiopia regional coverage
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      tileOptions = {
        maxZoom: 19,
        subdomains: 'abc',
      };
    }

    tileLayerRef.current = L.tileLayer(tileUrl, tileOptions).addTo(map);

    map.invalidateSize();
  }, [mapStyle, isDark]);

  // Render Markers and Corridors
  useEffect(() => {
    if (mapStyle === 'earth3d') return;
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // 1. Draw Freight Route Polyline Corridors
    FREIGHT_CORRIDORS.forEach((corridor) => {
      L.polyline([corridor.from, corridor.to], {
        color: '#10b981',
        weight: 3,
        opacity: 0.8,
        dashArray: '6, 8',
        lineCap: 'round',
      }).addTo(layerGroup);
    });

    // 2. Draw Interactive GPS Markers
    AGRI_HUBS.forEach((hub) => {
      const isSelected = selectedHub.id === hub.id;
      const isTerminal = hub.type === 'terminal';

      const customIcon = L.divIcon({
        className: 'leaflet-custom-agri-marker',
        html: `
          <div class="real-map-pin ${isSelected ? 'selected' : ''} ${isTerminal ? 'terminal-pin' : ''}">
            <span class="pin-halo" style="background: ${hub.color}40;"></span>
            <div class="pin-core" style="background: ${hub.color};">
              <span>${hub.icon}</span>
            </div>
            <span class="pin-badge-name">${hub.name.split(' ')[0]}</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([hub.lat, hub.lng], { icon: customIcon }).addTo(layerGroup);

      marker.on('click', () => {
        setSelectedHub(hub);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([hub.lat, hub.lng], 9.5, {
            duration: 1.2,
            easeLinearity: 0.25,
          });
        }
      });
    });
  }, [selectedHub, mapStyle]);

  // Fly to Hub handler
  const handleSelectHub = (hub) => {
    setSelectedHub(hub);
    if (mapStyle !== 'earth3d' && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hub.lat, hub.lng], 9.5, {
        duration: 1.2,
      });
    }
  };

  // Reset to National Overview
  const handleResetNationalView = () => {
    if (mapStyle !== 'earth3d' && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([9.1450, 39.0000], 6.5, {
        duration: 1.2,
      });
    }
  };

  // Google Earth 3D Web Direct URL
  const googleEarth3DUrl = `https://earth.google.com/web/@${selectedHub.lat},${selectedHub.lng},${selectedHub.altitude}a,18000d,35y,0h,60t,0r`;

  // Real Google Maps 3D Satellite Embed URL
  const googleMaps3dEmbedUrl = `https://maps.google.com/maps?q=${selectedHub.lat},${selectedHub.lng}&t=k&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="agri-map-card real-leaflet-card">
      <div className="agri-map-header">
        <div>
          <div className="agri-map-badge-row">
            <span className="eyebrow">Real GIS Map System & Logistics Radar</span>
            <span className="badge badge-discount">🛰️ Live GPS & Google Earth 3D Network</span>
          </div>
          <h2>Ethiopian Live Agricultural Trade Map</h2>
          <p className="agri-map-subtitle">
            Explore live farmgate-to-terminal trade corridors, active Isuzu freight routes, and smallholder aggregation depots across Ethiopia in real-time.
          </p>
        </div>

        {/* Map Style Controls */}
        <div className="map-style-toggles">
          <button
            className={`map-style-btn ${mapStyle === 'streets' ? 'active' : ''}`}
            onClick={() => setMapStyle('streets')}
          >
            🗺️ Vector
          </button>
          <button
            className={`map-style-btn ${mapStyle === 'satellite' ? 'active' : ''}`}
            onClick={() => setMapStyle('satellite')}
          >
            🛰️ Satellite
          </button>
          <button
            className={`map-style-btn ${mapStyle === 'earth3d' ? 'active' : ''}`}
            onClick={() => setMapStyle('earth3d')}
          >
            🌍 3D Google Earth
          </button>
          <button
            className={`map-style-btn ${mapStyle === 'dark' ? 'active' : ''}`}
            onClick={() => setMapStyle('dark')}
          >
            🌙 Night Radar
          </button>
          <button
            className="map-style-btn reset-btn"
            onClick={handleResetNationalView}
            title="Reset to National Overview"
          >
            🇪🇹 National View
          </button>
        </div>
      </div>

      <div className="agri-map-grid">
        {/* Real Leaflet Map or Google Earth 3D Container */}
        <div className="real-map-view-container">
          {mapStyle === 'earth3d' ? (
            <div className="google-earth-3d-wrapper">
              <iframe
                title="Google Earth 3D Agricultural View"
                src={googleMaps3dEmbedUrl}
                className="google-earth-iframe"
                loading="lazy"
                allowFullScreen
              />
              <div className="earth-3d-floating-overlay">
                <div className="earth-3d-info">
                  <span className="earth-3d-badge">🌍 Google Earth 3D Elevation</span>
                  <strong>{selectedHub.name} ({selectedHub.altitude}m Altitude)</strong>
                </div>
                <a
                  href={googleEarth3DUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm earth-launch-btn"
                >
                  🚀 Launch in Google Earth Web (3D Globe) &rarr;
                </a>
              </div>
            </div>
          ) : (
            <>
              <div ref={mapContainerRef} className="leaflet-map-canvas" />

              {/* Map Overlay Legend */}
              <div className="real-map-legend">
                <span className="legend-chip"><span className="legend-dot green"></span> Farmgate Hubs</span>
                <span className="legend-chip"><span className="legend-dot amber"></span> Terminal Market</span>
                <span className="legend-chip"><span className="legend-route-line"></span> Return Freight Corridor</span>
              </div>
            </>
          )}
        </div>

        {/* Live Regional Hub Intelligence Card */}
        <div className="agri-zone-details-panel">
          <div className="zone-details-header">
            <div className="zone-title-stack">
              <div className="zone-badge-row">
                <span className="zone-icon-lg">{selectedHub.icon}</span>
                <span
                  className="zone-status-badge"
                  style={{ background: `${selectedHub.color}20`, color: selectedHub.color, borderColor: `${selectedHub.color}40` }}
                >
                  ● {selectedHub.role}
                </span>
              </div>
              <h3>{selectedHub.name}</h3>
              <p className="zone-amharic">{selectedHub.amharic}</p>
            </div>
            <div className="zone-lots-count">
              <strong>{selectedHub.activeLots}</strong>
              <small>Live Lots</small>
            </div>
          </div>

          <div className="zone-metrics-grid">
            <div className="zone-metric-box">
              <span className="zone-metric-label">📍 GPS Coordinates</span>
              <strong>{selectedHub.lat.toFixed(4)}° N, {selectedHub.lng.toFixed(4)}° E</strong>
            </div>
            <div className="zone-metric-box">
              <span className="zone-metric-label">🏔️ Elevation Altitude</span>
              <strong>{selectedHub.altitude.toLocaleString()} meters ASL</strong>
            </div>
            <div className="zone-metric-box">
              <span className="zone-metric-label">💰 Farmgate Price Spread</span>
              <strong className="text-gain">{selectedHub.avgPrice}</strong>
            </div>
            <div className="zone-metric-box">
              <span className="zone-metric-label">🚚 Freight Route Capacity</span>
              <strong>{selectedHub.freightStatus}</strong>
            </div>
          </div>

          <div className="zone-specialties-section">
            <span className="specialties-heading">Top Sourced Crops in this Corridor:</span>
            <div className="zone-specialties-tags">
              {selectedHub.dominantCrops.map((item) => (
                <span key={item} className="zone-specialty-tag">
                  🌾 {item}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Hub Navigator Buttons */}
          <div className="quick-hub-list-row">
            <span className="specialties-heading">Quick Zoom to Trade Corridor:</span>
            <div className="map-pills-row">
              {AGRI_HUBS.map((hub) => (
                <button
                  key={hub.id}
                  className={`map-quick-pill ${selectedHub.id === hub.id ? 'active' : ''}`}
                  onClick={() => handleSelectHub(hub)}
                >
                  <span>{hub.icon}</span>
                  <span>{hub.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="zone-actions-row">
            <button
              className="btn btn-primary btn-block"
              onClick={() => navigate(`/products?search=${encodeURIComponent(selectedHub.name.split(' ')[0])}`)}
            >
              Browse {selectedHub.name.split(' ')[0]} Harvests ({selectedHub.activeLots} Lots) &rarr;
            </button>
            <a
              href={googleEarth3DUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-block text-center"
            >
              🌍 Explore {selectedHub.name.split(' ')[0]} in Google Earth 3D
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
