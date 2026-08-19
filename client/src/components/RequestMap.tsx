import { InteractiveCivicMap } from "@/components/InteractiveCivicMap";
import React from "react";

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

export default function RequestMap({
  requests,
  priorities,
  selectedCountry,
  showHeatmap = true,
  showCorridors = true,
  interactive = false,
  onLocationPick,
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
  return (
    <InteractiveCivicMap
      requests={requests}
      priorities={priorities}
      selectedCountry={selectedCountry}
      showHeatmap={showHeatmap}
      showCorridors={showCorridors}
      interactive={interactive}
      onLocationPick={onLocationPick}
      className="h-[430px] border border-black shadow-sm"
    />
  );
}
