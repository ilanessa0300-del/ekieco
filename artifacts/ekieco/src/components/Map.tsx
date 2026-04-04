import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MarkerData {
  id: string | number;
  lat: number;
  lng: number;
  type: "sale" | "purchase";
  popupContent?: React.ReactNode;
}

interface MapProps {
  markers?: MarkerData[];
  center?: [number, number];
  zoom?: number;
  onMapClick?: (e: L.LeafletMouseEvent) => void;
  className?: string;
  interactive?: boolean;
}

const EKIBASTUZ_CENTER: [number, number] = [51.7237, 75.3229];

// Custom icons
const createMarkerIcon = (colorClass: string) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div class="w-4 h-4 rounded-full border-2 border-white shadow-md ${colorClass}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const greenIcon = createMarkerIcon("bg-primary");
const orangeIcon = createMarkerIcon("bg-accent");

export function Map({
  markers = [],
  center = EKIBASTUZ_CENTER,
  zoom = 13,
  onMapClick,
  className = "h-[400px] w-full rounded-lg border border-border overflow-hidden z-0",
  interactive = true,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive ? "center" : false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(leafletMapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(leafletMapRef.current);

      if (onMapClick && interactive) {
        leafletMapRef.current.on("click", onMapClick);
      }
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((marker) => {
      const icon = marker.type === "sale" ? greenIcon : orangeIcon;
      const m = L.marker([marker.lat, marker.lng], { icon });
      
      // if (marker.popupContent) {
      //   m.bindPopup("<div>popup content</div>"); // For real React popups, we'd use portals, but keep it simple for now
      // }
      
      m.addTo(markersLayerRef.current!);
    });
  }, [markers]);

  return <div ref={mapRef} className={`relative ${className}`} />;
}
