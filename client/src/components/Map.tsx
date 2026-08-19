import { InteractiveCivicMap } from "@/components/InteractiveCivicMap";
import { cn } from "@/lib/utils";
import React from "react";

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: any) => void;
  onMapError?: () => void;
}

export function MapView({
  className,
  onMapReady,
}: MapViewProps) {
  return (
    <div className={cn("relative w-full h-[500px]", className)}>
      <InteractiveCivicMap
        interactive
        className="w-full h-full"
      />
    </div>
  );
}
