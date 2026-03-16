'use client'
import React, { useEffect, useRef, useState } from "react";
// ✅ Lazy loaded react-leaflet for better performance
import { MapContainer, Marker, TileLayer, L } from "@/components/LazyLeaflet";

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const Map = (props) => {
    const [isMobile, setIsMobile] = useState(false);
    const containerStyle = {
        width: "100%",
        height: "200px",
        touchAction: isMobile ? "pan-y pinch-zoom" : "auto", // Allow vertical scrolling on mobile
    };

    const mapRef = useRef();
    const center = {
        lat: parseFloat(props.latitude) || 0,
        lng: parseFloat(props.longitude) || 0,
    };

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (mapRef.current && center.lat && center.lng) {
            mapRef.current.flyTo([center.lat, center.lng], 14);
        }
    }, [center.lat, center.lng]);

    // Disable map interactions on mobile after map is created
    useEffect(() => {
        if (mapRef.current && isMobile) {
            mapRef.current.dragging.disable();
            mapRef.current.touchZoom.disable();
            mapRef.current.doubleClickZoom.disable();
            mapRef.current.scrollWheelZoom.disable();
            mapRef.current.boxZoom.disable();
            mapRef.current.keyboard.disable();
        }
    }, [isMobile, center.lat, center.lng]);

    if (!center.lat || !center.lng) {
        return null;
    }

    return (
        <div 
            style={{ 
                position: 'relative', 
                width: '100%', 
                height: '200px',
                ...(isMobile && { pointerEvents: 'none' }) // Allow touch events to pass through on mobile
            }}
        >
            <MapContainer
                style={containerStyle}
                center={[center.lat, center.lng]}
                zoom={14}
                ref={(mapInstance) => {
                    if (mapInstance) {
                        mapRef.current = mapInstance;
                    }
                }}
                dragging={!isMobile}
                touchZoom={!isMobile}
                doubleClickZoom={!isMobile}
                scrollWheelZoom={!isMobile}
                boxZoom={!isMobile}
                keyboard={!isMobile}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[center.lat, center.lng]} />
            </MapContainer>
        </div>
    );
};

export default Map;

