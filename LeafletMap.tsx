import React, {useEffect, useRef, useState} from 'react';
import {IndianCity} from './indiaGeoData';

interface LeafletMapProps {
  cityA?: IndianCity;
  cityB?: IndianCity;
  actualKm?: number;
  guessKm?: number;
  turnPhase: 'GUESSING' | 'REVEALED';
}

declare global {
  interface Window {
    L: any;
  }
}

export default function LeafletMap({
  cityA,
  cityB,
  actualKm,
  guessKm,
  turnPhase,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const lineRef = useRef<any>(null);
  const tooltipRef = useRef<any>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState<boolean>(() => {
    return typeof window !== 'undefined' && Boolean(window.L);
  });

  // Dynamically load Leaflet library (CSS and JS)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.L) {
      setIsLeafletLoaded(true);
      return;
    }

    const cssId = 'leaflet-core-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    const jsId = 'leaflet-core-js';
    const existingScript = document.getElementById(jsId) as HTMLScriptElement | null;
    if (existingScript) {
      if (window.L) {
        setIsLeafletLoaded(true);
      } else {
        existingScript.addEventListener('load', () => setIsLeafletLoaded(true));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = jsId;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    script.onload = () => setIsLeafletLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isLeafletLoaded || !containerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    // Centered on India with real boundary tiles
    const map = L.map(containerRef.current, {
      center: [22.8, 80.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 10,
      zoomControl: true,
      attributionControl: true,
    });

    // Real-world high-resolution OpenStreetMap / CartoDB Voyager tiles showing accurate state boundaries
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      },
    ).addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size once container settles
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timeout);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isLeafletLoaded]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update Markers and Measurement Line when cities or turnPhase changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window.L;
    if (!map || !L) return;

    // Clear old markers and lines
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (lineRef.current) {
      lineRef.current.remove();
      lineRef.current = null;
    }
    if (tooltipRef.current) {
      tooltipRef.current.remove();
      tooltipRef.current = null;
    }

    if (!cityA || !cityB) return;

    // City A Custom HTML Pin (Teal)
    const iconA = L.divIcon({
      className: 'leaflet-custom-pin-a',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: none;">
          <div style="background: #FFFFFF; border: 1.5px solid #1E7F74; border-radius: 8px; padding: 2px 8px; box-shadow: 0 4px 12px rgba(30,41,59,0.18); display: flex; align-items: center; gap: 4px; white-space: nowrap; margin-bottom: 4px;">
            <span style="background: #1E7F74; color: #FFFFFF; font-weight: 800; font-size: 10px; width: 16px; height: 16px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center;">A</span>
            <span style="color: #1E293B; font-weight: 700; font-size: 11px;">${cityA.name}</span>
          </div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: #1E7F74; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          <div style="width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid rgba(30, 127, 116, 0.4); position: absolute; bottom: -5px; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        </div>
      `,
      iconSize: [0, 0],
    });

    // City B Custom HTML Pin (Dark Ink)
    const iconB = L.divIcon({
      className: 'leaflet-custom-pin-b',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: none;">
          <div style="background: #FFFFFF; border: 1.5px solid #1E293B; border-radius: 8px; padding: 2px 8px; box-shadow: 0 4px 12px rgba(30,41,59,0.18); display: flex; align-items: center; gap: 4px; white-space: nowrap; margin-bottom: 4px;">
            <span style="background: #FFFFFF; color: #1E293B; border: 1.5px solid #1E293B; font-weight: 800; font-size: 10px; width: 16px; height: 16px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center;">B</span>
            <span style="color: #1E293B; font-weight: 700; font-size: 11px;">${cityB.name}</span>
          </div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: #FFFFFF; border: 3px solid #1E293B; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [0, 0],
    });

    const markerA = L.marker([cityA.lat, cityA.lon], {icon: iconA}).addTo(map);
    const markerB = L.marker([cityB.lat, cityB.lon], {icon: iconB}).addTo(map);
    markersRef.current = [markerA, markerB];

    const bounds = L.latLngBounds([
      [cityA.lat, cityA.lon],
      [cityB.lat, cityB.lon],
    ]);

    // Fit map bounds to encompass both cities with comfortable padding
    map.fitBounds(bounds, {
      padding: [70, 70],
      maxZoom: 7,
      animate: true,
    });

    // When answer is revealed: draw straight line and midpoint distance banner
    if (turnPhase === 'REVEALED') {
      const line = L.polyline(
        [
          [cityA.lat, cityA.lon],
          [cityB.lat, cityB.lon],
        ],
        {
          color: '#1E7F74',
          weight: 4,
          opacity: 0.95,
          dashArray: '8, 8',
          lineCap: 'round',
        },
      ).addTo(map);
      lineRef.current = line;

      // Midpoint coordinate
      const midLat = (cityA.lat + cityB.lat) / 2;
      const midLon = (cityA.lon + cityB.lon) / 2;

      const midMarker = L.marker([midLat, midLon], {
        icon: L.divIcon({
          className: 'leaflet-dist-badge',
          html: `
            <div style="transform: translate(-50%, -50%); background: #1E7F74; color: #FFFFFF; font-weight: 800; font-size: 12px; font-family: monospace; padding: 4px 10px; border-radius: 12px; box-shadow: 0 4px 14px rgba(30,127,116,0.35); border: 2px solid #FFFFFF; white-space: nowrap;">
              ${actualKm ? actualKm.toLocaleString() : ''} km
            </div>
          `,
          iconSize: [0, 0],
        }),
      }).addTo(map);

      tooltipRef.current = midMarker;
    }
  }, [cityA, cityB, turnPhase, actualKm]);

  return (
    <div className="relative w-full h-full min-h-0 min-w-0 bg-[#F6F4EF] overflow-hidden">
      {!isLeafletLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F6F4EF] z-10 text-[#1E293B]">
          <div className="w-8 h-8 border-3 border-[#1E7F74] border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-xs font-semibold tracking-wider uppercase text-[#1E293B]/70">
            Loading Real Leaflet Map...
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{zIndex: 1}} />
    </div>
  );
}
