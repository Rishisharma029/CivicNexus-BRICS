import { BRICS_COUNTRIES, categoryLabel, countryName } from "@/lib/civic";
import { type MapPriority, type MapRequest } from "@/components/RequestMap";
import { ArrowUpRight, Globe, Layers, MapPin, Minus, Navigation, Plus, Sparkles, X } from "lucide-react";
import React, { useMemo, useState } from "react";

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

// Convert Lat/Lng to SVG ViewBox (800x420) coordinates
function projectLatLng(lat: number, lng: number, zoom = 1, pan = { x: 0, y: 0 }) {
  const width = 800;
  const height = 420;
  const rawX = ((lng + 180) / 360) * width;
  const rawY = ((90 - lat) / 180) * height;
  
  const centerX = width / 2;
  const centerY = height / 2;
  
  const x = (rawX - centerX) * zoom + centerX + pan.x;
  const y = (rawY - centerY) * zoom + centerY + pan.y;
  
  return { x, y };
}

// Reverse projection for interactive location picking
function unprojectXY(x: number, y: number, zoom = 1, pan = { x: 0, y: 0 }) {
  const width = 800;
  const height = 420;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const rawX = (x - centerX - pan.x) / zoom + centerX;
  const rawY = (y - centerY - pan.y) / zoom + centerY;
  
  const lng = (rawX / width) * 360 - 180;
  const lat = 90 - (rawY / height) * 180;
  
  return {
    lat: Math.max(-85, Math.min(85, lat)),
    lng: Math.max(-180, Math.min(180, lng)),
  };
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeSignal, setActiveSignal] = useState<MapRequest | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => !selectedCountry || r.country === selectedCountry);
  }, [requests, selectedCountry]);

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 800;
    const svgY = ((e.clientY - rect.top) / rect.height) * 420;
    
    const { lat, lng } = unprojectXY(svgX, svgY, zoom, pan);
    
    // Find closest BRICS country
    let closestCountry = "BRICS Region";
    let minDistance = Infinity;
    BRICS_COUNTRIES.forEach(c => {
      const d = Math.hypot(c.capital.lat - lat, c.capital.lng - lng);
      if (d < minDistance) {
        minDistance = d;
        closestCountry = c.name;
      }
    });

    const point = {
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      label: `${closestCountry} (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
    };
    
    setPickedLocation(point);
    onLocationPick?.(point);
  };

  return (
    <div className={`relative w-full overflow-hidden bg-[#0a0a0c] text-white select-none ${className}`}>
      {/* Map Control Bar */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 bg-black/85 p-1 border border-neutral-700 backdrop-blur-md">
        <button
          onClick={() => setZoom(z => Math.min(3.5, z + 0.35))}
          className="p-1.5 hover:bg-neutral-800 text-neutral-200 transition-colors"
          title="Zoom In"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setZoom(z => Math.max(1, z - 0.35));
            if (zoom <= 1.35) setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 hover:bg-neutral-800 text-neutral-200 transition-colors"
          title="Zoom Out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 hover:bg-neutral-800 text-neutral-200 transition-colors"
          title="Reset View"
        >
          <Navigation className="h-4 w-4" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-4 bg-black/90 px-3 py-2 border border-neutral-800 text-[11px] font-mono tracking-wider backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" /> Critical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> High
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Agriculture
        </span>
        {showCorridors ? (
          <span className="flex items-center gap-1.5 text-neutral-400">
            <span className="h-0.5 w-4 bg-red-500/70" /> BRICS Corridors
          </span>
        ) : null}
      </div>

      {/* Interactive SVG Canvas */}
      <svg
        viewBox="0 0 800 420"
        className={`w-full h-full ${interactive ? "cursor-crosshair" : "cursor-grab"}`}
        onClick={handleMapClick}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f1f23" strokeWidth="0.75" />
          </pattern>
          {/* Pulse Glow Filters */}
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#dc2626" floodOpacity="0.8" />
          </filter>
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Background Grids */}
        <rect width="800" height="420" fill="#0c0c0e" />
        <rect width="800" height="420" fill="url(#grid)" />

        {/* World Base Simplified Continents */}
        <g fill="#16161a" stroke="#26262b" strokeWidth="0.8" opacity="0.85">
          {/* North America */}
          <path d="M 120 70 Q 180 60 220 90 Q 250 140 200 170 Q 150 180 110 140 Z" />
          {/* South America (Brazil) */}
          <path d="M 230 200 Q 290 220 310 290 Q 280 370 240 380 Q 210 320 220 230 Z" fill="#1c201a" stroke="#2f4228" />
          {/* Europe */}
          <path d="M 380 80 Q 450 70 470 120 Q 430 150 380 130 Z" />
          {/* Africa (South Africa) */}
          <path d="M 370 160 Q 460 160 480 230 Q 450 340 400 350 Q 350 260 370 160 Z" fill="#1b1c22" stroke="#2a3346" />
          {/* Eurasia / Russia / China / India */}
          <path d="M 450 60 Q 680 40 730 110 Q 680 180 600 180 Q 560 250 510 240 Q 480 180 450 130 Z" fill="#1f1e1c" stroke="#3d352b" />
          {/* Australia */}
          <path d="M 640 270 Q 720 260 740 310 Q 700 350 640 330 Z" />
        </g>

        {/* BRICS Capital Nodes & Badges */}
        {BRICS_COUNTRIES.map(country => {
          const pt = projectLatLng(country.capital.lat, country.capital.lng, zoom, pan);
          return (
            <g key={country.code} className="transition-transform duration-300">
              <circle cx={pt.x} cy={pt.y} r="3" fill={country.accent} />
              <text
                x={pt.x + 6}
                y={pt.y + 3}
                fill="#8e8e93"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {country.code} · {country.name.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Cross-Border Corridors */}
        {showCorridors ? (
          <g opacity="0.65">
            {priorities.map(p => {
              const codes = (p.countries as string[]) || [];
              const pts = codes
                .map(code => BRICS_COUNTRIES.find(c => c.code === code)?.capital)
                .filter(Boolean)
                .map(cap => projectLatLng(cap!.lat, cap!.lng, zoom, pan));

              if (pts.length < 2) return null;

              const pathData = pts.reduce((acc, curr, idx) => {
                return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
              }, "");

              return (
                <g key={p.id}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth={Math.max(1.5, Math.round(p.priorityScore / 35))}
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                </g>
              );
            })}
          </g>
        ) : null}

        {/* Hotspot Halos */}
        {showHeatmap ? (
          <g opacity="0.75">
            {filteredRequests.map(r => {
              const lat = Number(r.latitude);
              const lng = Number(r.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;
              const pt = projectLatLng(lat, lng, zoom, pan);
              const isCrit = r.urgency === "critical";
              const isAgri = r.category === "agriculture";
              const radius = (isCrit ? 26 : 18) * zoom;
              const color = isAgri ? "#10b981" : isCrit ? "#dc2626" : "#f59e0b";

              return (
                <circle
                  key={`halo-${r.id}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={radius}
                  fill={color}
                  fillOpacity={isCrit ? 0.22 : 0.14}
                  stroke={color}
                  strokeWidth="0.75"
                  strokeOpacity="0.4"
                />
              );
            })}
          </g>
        ) : null}

        {/* Interactive Signal Markers */}
        <g>
          {filteredRequests.map(r => {
            const lat = Number(r.latitude);
            const lng = Number(r.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;
            const pt = projectLatLng(lat, lng, zoom, pan);
            const isAgri = r.category === "agriculture";
            const isCrit = r.urgency === "critical";
            const color = isAgri ? "#10b981" : isCrit ? "#ef4444" : "#f59e0b";

            return (
              <g
                key={`marker-${r.id}`}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={e => {
                  e.stopPropagation();
                  setActiveSignal(r);
                }}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isCrit ? "6" : "5"}
                  fill={color}
                  filter={isCrit ? "url(#glow-red)" : isAgri ? "url(#glow-green)" : undefined}
                />
                <circle cx={pt.x} cy={pt.y} r="2" fill="#ffffff" />
              </g>
            );
          })}
        </g>

        {/* User Picked Pin (Location Picker Mode) */}
        {pickedLocation ? (
          <g>
            {(() => {
              const pt = projectLatLng(pickedLocation.lat, pickedLocation.lng, zoom, pan);
              return (
                <g className="animate-bounce">
                  <circle cx={pt.x} cy={pt.y} r="7" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={pt.x} cy={pt.y} r="2.5" fill="#ffffff" />
                </g>
              );
            })()}
          </g>
        ) : null}
      </svg>

      {/* Selected Signal Inspection Popup */}
      {activeSignal ? (
        <div className="absolute top-3 left-3 z-30 max-w-xs bg-neutral-900 border border-neutral-700 p-4 shadow-2xl backdrop-blur-lg animate-in fade-in zoom-in-95">
          <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2">
            <div>
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                activeSignal.category === "agriculture" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-red-950 text-red-300 border border-red-800"
              }`}>
                {categoryLabel(activeSignal.category)}
              </span>
              <p className="text-xs font-bold mt-1 text-white">
                {countryName(activeSignal.country)} · {activeSignal.locationLabel}
              </p>
            </div>
            <button
              onClick={() => setActiveSignal(null)}
              className="text-neutral-400 hover:text-white p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2.5 text-xs text-neutral-300 leading-5">
            {activeSignal.analysis?.summary ?? "Signal logged into BRICS demand registry."}
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-neutral-800 pt-2 text-[10px] font-mono text-neutral-400">
            <span>Urgency: <strong className="text-red-400 uppercase">{activeSignal.urgency}</strong></span>
            <span>AI Confidence: <strong className="text-emerald-400">{activeSignal.analysis?.confidence ?? 92}%</strong></span>
          </div>
        </div>
      ) : null}

      {/* Interactive Picker Indicator */}
      {interactive ? (
        <div className="absolute top-3 left-3 z-10 bg-black/80 px-3 py-1.5 border border-neutral-700 text-xs text-neutral-300 flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-blue-400" />
          <span>Click anywhere on the map to pin exact coordinates</span>
        </div>
      ) : null}
    </div>
  );
}
