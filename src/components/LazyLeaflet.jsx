"use client";
import dynamic from "next/dynamic";

// ✅ Lazy load react-leaflet components to reduce initial bundle size
// Maps are typically not needed on initial page load

// Import Leaflet CSS immediately (needed for proper rendering)
import "leaflet/dist/leaflet.css";

// Export leaflet for icon configuration (needed synchronously)
export { default as L } from "leaflet";

// useMapEvents is a hook, import it normally (it's small)
export { useMapEvents } from "react-leaflet";

export const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f0f0'
      }}>
        <div>Loading map...</div>
      </div>
    ),
  }
);

export const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

export const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

export const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);
