import { MapView } from "@/components/Map";
import { BRICS_COUNTRIES, categoryLabel, countryName } from "@/lib/civic";
import { useEffect, useMemo, useRef } from "react";

export type MapRequest = {
  id: number;
  country: string;
  category: string;
  urgency: string;
  locationLabel: string;
  latitude: string;
  longitude: string;
  analysisState: string;
  analysis: null | {
    summary: string;
    urgencyScore: number;
    confidence: number;
  };
};

export type MapPriority = {
  id: number;
  title: string;
  countries: unknown;
  priorityScore: number;
  category?: string;
  contextScore?: number;
};

type MapOverlay = google.maps.marker.AdvancedMarkerElement | google.maps.MVCObject;

function detachOverlay(overlay: MapOverlay) {
  if ("map" in overlay) {
    overlay.map = null;
    return;
  }
  if ("setMap" in overlay && typeof overlay.setMap === "function") overlay.setMap(null);
}

function markerElement(urgency: string) {
  const marker = document.createElement("div");
  marker.className = "map-request-marker";
  marker.dataset.urgency = urgency;
  marker.setAttribute("aria-label", `Citizen request marked ${urgency} urgency`);
  return marker;
}

function clusterElement(count: number) {
  const marker = document.createElement("div");
  marker.className = "map-cluster-marker";
  marker.textContent = String(count);
  marker.setAttribute("aria-label", `${count} requests in this country`);
  return marker;
}

export default function RequestMap({
  requests,
  priorities,
  selectedCountry,
  showHeatmap = true,
  showCorridors = true,
  interactive = false,
  onLocationPick,
  onMapError,
}: {
  requests?: MapRequest[];
  priorities?: MapPriority[];
  selectedCountry?: string;
  showHeatmap?: boolean;
  showCorridors?: boolean;
  interactive?: boolean;
  onLocationPick?: (point: { lat: number; lng: number; label: string }) => void;
  onMapError?: () => void;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<MapOverlay[]>([]);
  const filteredRequests = useMemo(() => (requests ?? []).filter(request => !selectedCountry || request.country === selectedCountry), [requests, selectedCountry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google || interactive) return;
    overlayRef.current.forEach(detachOverlay);
    overlayRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    const info = new google.maps.InfoWindow();
    const countryGroups = new Map<string, MapRequest[]>();
    filteredRequests.forEach(request => {
      const lat = Number(request.latitude);
      const lng = Number(request.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const position = { lat, lng };
      bounds.extend(position);
      const matchedContextScores = (priorities ?? []).filter(priority => priority.category === request.category && (priority.countries as string[]).includes(request.country)).map(priority => priority.contextScore ?? 50);
      const contextScore = matchedContextScores.length ? Math.round(matchedContextScores.reduce((total, score) => total + score, 0) / matchedContextScores.length) : 50;
      const contextWeight = 0.72 + contextScore / 250;
      const marker = new google.maps.marker.AdvancedMarkerElement({ map, position, content: markerElement(request.urgency), title: request.locationLabel });
      marker.addListener("click", () => {
        info.setContent(`<div style="max-width:240px;font-family:Arial,sans-serif"><strong>${categoryLabel(request.category)}</strong><br/>${countryName(request.country)} · ${request.locationLabel}<br/><span style="font-size:12px">${request.analysis?.summary ?? "AI review pending"}</span><br/><span style="font-size:11px;color:#666">National-context contribution: ${contextScore}/100</span></div>`);
        info.open({ map, anchor: marker });
      });
      overlayRef.current.push(marker);
      const densityHalo = new google.maps.Circle({
        map,
        center: position,
        radius: (request.urgency === "critical" ? 10500 : request.urgency === "high" ? 7500 : request.urgency === "medium" ? 5000 : 3000) * contextWeight,
        fillColor: "#D52029",
        fillOpacity: showHeatmap ? 0.06 + contextScore / 1900 : 0,
        strokeOpacity: 0,
      });
      overlayRef.current.push(densityHalo);
      countryGroups.set(request.country, [...(countryGroups.get(request.country) ?? []), request]);
    });

    countryGroups.forEach((group, countryCode) => {
      const country = BRICS_COUNTRIES.find(item => item.code === countryCode);
      if (!country || group.length < 2) return;
      const cluster = new google.maps.marker.AdvancedMarkerElement({ map, position: country.capital, content: clusterElement(group.length), title: `${group.length} requests in ${country.name}` });
      cluster.addListener("click", () => map.setZoom(5));
      overlayRef.current.push(cluster);
    });

    if (showCorridors) {
      (priorities ?? []).forEach(priority => {
        const codes = (priority.countries as string[]).map(code => BRICS_COUNTRIES.find(country => country.code === code)?.capital).filter(Boolean) as google.maps.LatLngLiteral[];
        if (codes.length < 2) return;
        const corridor = new google.maps.Polyline({ path: codes, geodesic: true, strokeColor: "#D52029", strokeOpacity: 0.65, strokeWeight: Math.max(2, Math.round(priority.priorityScore / 35)) });
        corridor.setMap(map);
        overlayRef.current.push(corridor);
      });
    }

    if (!filteredRequests.length) {
      map.setCenter({ lat: 14, lng: 48 });
      map.setZoom(2);
    } else if (filteredRequests.length === 1) {
      map.setCenter({ lat: Number(filteredRequests[0].latitude), lng: Number(filteredRequests[0].longitude) });
      map.setZoom(9);
    } else {
      map.fitBounds(bounds, 70);
    }
    return () => overlayRef.current.forEach(detachOverlay);
  }, [filteredRequests, priorities, showCorridors, showHeatmap, interactive]);

  return (
    <MapView
      className="h-[430px] border border-black"
      initialCenter={{ lat: 14, lng: 48 }}
      initialZoom={2}
      onMapReady={map => {
        mapRef.current = map;
        map.setOptions({ gestureHandling: "cooperative", mapTypeControl: false, streetViewControl: false });
        if (interactive) {
          let picker: google.maps.marker.AdvancedMarkerElement | null = null;
          map.addListener("click", (event: google.maps.MapMouseEvent) => {
            const lat = event.latLng?.lat();
            const lng = event.latLng?.lng();
            if (lat === undefined || lng === undefined) return;
            if (picker) picker.map = null;
            picker = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat, lng }, content: markerElement("selected"), title: "Selected location" });
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, results => onLocationPick?.({ lat, lng, label: results?.[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
          });
        }
      }}
      onMapError={onMapError}
    />
  );
}
