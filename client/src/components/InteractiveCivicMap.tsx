import { BRICS_COUNTRIES, categoryLabel, countryName } from "@/lib/civic";
import { type MapPriority, type MapRequest } from "@/components/RequestMap";
import React, { useEffect, useRef, useState } from "react";

interface InteractiveCivicMapProps {
  requests?: MapRequest[];
  priorities?: MapPriority[];
  selectedCountry?: string;
  showHeatmap?: boolean;
  showCorridors?: boolean;
  interactive?: boolean;
  onLocationPick?: (point: { lat: number; lng: number; label: string }) => void;
  className?: string;
}

declare global {
  interface Window {
    L?: any;
  }
}

function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("No window");
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    if (document.getElementById("leaflet-js")) {
      const checkInterval = setInterval(() => {
        if (window.L) {
          clearInterval(checkInterval);
          resolve(window.L);
        }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.crossOrigin = "";
    script.async = true;
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error("Leaflet failed to initialize"));
    };
    script.onerror = () => reject(new Error("Failed to load Leaflet script"));
    document.head.appendChild(script);
  });
}

function createPinIcon(L: any, urgency: string, category: string) {
  const isCrit = urgency === "critical";
  const isAgri = category === "agriculture";
  const color = isAgri ? "#10b981" : isCrit ? "#dc2626" : "#d97706";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 38" width="28" height="38">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M 14 0 C 6.27 0 0 6.27 0 14 C 0 24.5 14 38 14 38 C 14 38 28 24.5 28 14 C 28 6.27 21.73 0 14 0 Z" fill="${color}" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
      <circle cx="14" cy="14" r="5" fill="#ffffff"/>
    </svg>
  `;

  return L.divIcon({
    className: "custom-civic-pin",
    html: svg,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -36],
  });
}

function createClusterIcon(L: any, count: number) {
  return L.divIcon({
    className: "custom-cluster-badge",
    html: `
      <div style="
        background: #ffffff;
        color: #111827;
        font-family: 'Space Grotesk', system-ui, sans-serif;
        font-weight: 700;
        font-size: 14px;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid #111827;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      ">
        ${count}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

export function InteractiveCivicMap({
  requests = [],
  priorities = [],
  selectedCountry,
  showHeatmap = true,
  showCorridors = true,
  interactive = false,
  onLocationPick,
  className = "h-[430px] border border-black",
}: InteractiveCivicMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    loadLeaflet().then(L => {
      if (!isMounted || !containerRef.current) return;

      // If already initialized on this container, cleanup first
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(containerRef.current, {
        center: [20, 20],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Voyager tiles (Clean Google Maps / OpenStreetMap style with crisp oceans and country borders)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setMapLoaded(true);

      // Handle interactive location pick
      if (interactive) {
        let pickMarker: any = null;
        map.on("click", (e: any) => {
          const lat = Number(e.latlng.lat.toFixed(4));
          const lng = Number(e.latlng.lng.toFixed(4));

          if (pickMarker) {
            layerGroupRef.current.removeLayer(pickMarker);
          }

          pickMarker = L.marker([lat, lng], {
            icon: createPinIcon(L, "selected", "pick"),
          }).addTo(layerGroupRef.current);

          onLocationPick?.({
            lat,
            lng,
            label: `Selected Location (${lat}°, ${lng}°)`,
          });
        });
      }
    }).catch(err => {
      console.error("[Map] Failed to load Leaflet:", err);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [interactive]);

  // Update Markers, Clusters, Halos, and Corridors
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    const L = window.L;

    if (!map || !layerGroup || !L) return;

    layerGroup.clearLayers();

    const filteredRequests = requests.filter(
      r => !selectedCountry || r.country === selectedCountry
    );

    const countryGroups = new Map<string, MapRequest[]>();

    // 1. Plot Requests & Halos
    filteredRequests.forEach(request => {
      const lat = Number(request.latitude);
      const lng = Number(request.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isCrit = request.urgency === "critical";
      const isAgri = request.category === "agriculture";
      const color = isAgri ? "#10b981" : isCrit ? "#dc2626" : "#d97706";

      // Hotspot Density Halo
      if (showHeatmap) {
        L.circle([lat, lng], {
          radius: isCrit ? 450000 : 300000,
          color: color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 1.5,
        }).addTo(layerGroup);
      }

      // Pin Marker
      const pin = L.marker([lat, lng], {
        icon: createPinIcon(L, request.urgency, request.category),
        title: request.locationLabel,
      });

      // Custom Rich Popup
      const popupHtml = `
        <div style="font-family:'Space Grotesk',system-ui,sans-serif;min-width:220px;padding:4px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
            <span style="background:#f3f4f6;border:1px solid #d1d5db;padding:2px 6px;font-size:10px;font-weight:700;text-transform:uppercase;color:#111827;">
              ${categoryLabel(request.category)}
            </span>
            <span style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;">
              ${request.urgency}
            </span>
          </div>
          <h4 style="font-size:13px;font-weight:700;margin:0 0 4px;color:#111827;">
            ${countryName(request.country)} · ${request.locationLabel}
          </h4>
          <p style="font-size:11px;line-height:1.4;margin:0 0 8px;color:#4b5563;">
            ${request.analysis?.summary ?? "Signal logged into BRICS demand registry."}
          </p>
          <div style="border-top:1px solid #e5e7eb;padding-top:4px;display:flex;justify-content:space-between;font-size:10px;color:#6b7280;font-family:monospace;">
            <span>State: ${request.analysisState}</span>
            <span>AI Confidence: ${request.analysis?.confidence ?? 92}%</span>
          </div>
        </div>
      `;

      pin.bindPopup(popupHtml);
      pin.addTo(layerGroup);

      countryGroups.set(request.country, [
        ...(countryGroups.get(request.country) ?? []),
        request,
      ]);
    });

    // 2. Plot Country Cluster Badges
    countryGroups.forEach((group, countryCode) => {
      const country = BRICS_COUNTRIES.find(item => item.code === countryCode);
      if (!country || group.length < 2) return;

      const clusterMarker = L.marker([country.capital.lat, country.capital.lng], {
        icon: createClusterIcon(L, group.length),
        title: `${group.length} signals in ${country.name}`,
      });

      clusterMarker.on("click", () => {
        map.setView([country.capital.lat, country.capital.lng], 5);
      });

      clusterMarker.addTo(layerGroup);
    });

    // 3. Plot Cross-Border Priority Corridors
    if (showCorridors) {
      priorities.forEach(priority => {
        const codes = (priority.countries as string[]) || [];
        const coords = codes
          .map(code => BRICS_COUNTRIES.find(c => c.code === code)?.capital)
          .filter(Boolean)
          .map(cap => [cap!.lat, cap!.lng]);

        if (coords.length >= 2) {
          L.polyline(coords, {
            color: "#dc2626",
            weight: Math.max(2, Math.round(priority.priorityScore / 30)),
            opacity: 0.75,
            dashArray: "6, 8",
          }).addTo(layerGroup);
        }
      });
    }

    // Auto-fit Bounds
    if (filteredRequests.length > 1) {
      const latLngs = filteredRequests
        .map(r => [Number(r.latitude), Number(r.longitude)])
        .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));
      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } else if (filteredRequests.length === 1) {
      map.setView(
        [Number(filteredRequests[0].latitude), Number(filteredRequests[0].longitude)],
        7
      );
    }
  }, [requests, priorities, selectedCountry, showHeatmap, showCorridors, mapLoaded]);

  return (
    <div className={`relative w-full overflow-hidden bg-[#e5e7eb] ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[400px] z-0" />

      {/* Map Interactive Helper Overlay */}
      {interactive ? (
        <div className="absolute top-3 left-12 z-[1000] bg-white/95 px-3 py-1.5 border border-black text-xs font-bold text-black shadow-md flex items-center gap-2">
          <span>🎯 Click anywhere on the map to pin exact coordinates</span>
        </div>
      ) : null}
    </div>
  );
}
