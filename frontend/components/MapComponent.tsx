"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface EventData {
  id: number;
  title: string;
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  event_date: string;
  organizer_type: string;
  organizer_id: number;
  organizer_name: string;
  organizer_avatar_url?: string;
}

interface MapComponentProps {
  events: EventData[];
  selectedEvent: EventData | null;
  onSelectEvent: (event: EventData) => void;
  isCreating: boolean;
  createCoords: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  routeToEvent: EventData | null;
  onClearRoute: () => void;
}

export default function MapComponent({
  events,
  selectedEvent,
  onSelectEvent,
  isCreating,
  createCoords,
  onMapClick,
  routeToEvent,
  onClearRoute
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const createMarkerRef = useRef<L.Marker | null>(null);
  const routePolylinesRef = useRef<L.Polyline[]>([]);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center of Vietnam as default
    const map = L.map(mapContainerRef.current, {
      zoomControl: false // Position zoom control to top-right later
    }).setView([16.047079, 108.206230], 6);

    // Modern styled TileLayer (dark/anime night vibe representation)
    // We can use standard OpenStreetMap or CartoDB Dark Matter which is beautiful for dark mode
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);
    mapRef.current = map;

    // Handle map click for coordinate selection in creation mode
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isCreating) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    // Try to get user location on load silently
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isCreating, onMapClick]);

  // Update creation coordinate marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (createMarkerRef.current) {
      createMarkerRef.current.remove();
      createMarkerRef.current = null;
    }

    if (isCreating && createCoords) {
      const newEventIcon = L.divIcon({
        className: 'custom-create-marker',
        html: `
          <div class="relative flex flex-col items-center justify-center">
            <div class="absolute w-8 h-8 bg-cyan-500/20 rounded-full animate-ping"></div>
            <div class="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-white rounded-full flex items-center justify-center shadow-[0_0_15px_#22d3ee]">
              <span class="text-white text-[11px] font-bold">📍</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      createMarkerRef.current = L.marker([createCoords.lat, createCoords.lng], { icon: newEventIcon })
        .addTo(map)
        .bindTooltip("Vị trí sự kiện mới", { permanent: true, direction: 'top', offset: [0, -10] });
      
      map.setView([createCoords.lat, createCoords.lng], map.getZoom() < 13 ? 13 : map.getZoom());
    }
  }, [isCreating, createCoords]);

  // Update user location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-6 h-6 bg-cyan-400/30 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-cyan-400 border-2 border-white rounded-full shadow-[0_0_10px_#22d3ee]"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup("Vị trí của bạn");
  }, [userLocation]);

  // Update event markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers
    events.forEach(event => {
      const isSelected = selectedEvent?.id === event.id;
      const eventIcon = L.divIcon({
        className: `custom-event-marker event-${event.id}`,
        html: `
          <div class="relative flex flex-col items-center justify-center transition-all duration-300 ${isSelected ? 'scale-125' : 'hover:scale-110'}">
            <div class="absolute w-8 h-8 ${isSelected ? 'bg-pink-500/40' : 'bg-purple-500/25'} rounded-full ${isSelected ? 'animate-pulse' : 'animate-ping'}" style="animation-duration: 2s"></div>
            <div class="w-6 h-6 bg-gradient-to-br ${isSelected ? 'from-pink-500 to-rose-600' : 'from-purple-500 to-pink-500'} border-2 border-white rounded-full flex items-center justify-center shadow-[0_0_15px_${isSelected ? '#ec4899' : '#a855f7'}]">
              <span class="text-white text-[10px]">${isSelected ? '⭐' : '✨'}</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([event.latitude, event.longitude], { icon: eventIcon })
        .addTo(map)
        .bindTooltip(event.title, { direction: 'top', offset: [0, -10] });

      marker.on('click', () => {
        onSelectEvent(event);
      });

      markersRef.current[event.id] = marker;
    });
  }, [events, selectedEvent, onSelectEvent]);

  // Focus on selected event
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedEvent) return;

    // Center map with smooth transition
    map.setView([selectedEvent.latitude, selectedEvent.longitude], 14, {
      animate: true,
      duration: 1.0
    });
  }, [selectedEvent]);

  // Geolocation trigger function
  const handleLocateMe = () => {
    const map = mapRef.current;
    if (!map) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        map.setView([coords.lat, coords.lng], 15, { animate: true });
        setIsLocating(false);
      },
      (error) => {
        console.error("Lỗi định vị:", error);
        alert("Không thể định vị. Vui lòng cấp quyền vị trí cho trình duyệt của bạn.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Route drawing logic
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old polylines
    routePolylinesRef.current.forEach(p => p.remove());
    routePolylinesRef.current = [];

    if (!routeToEvent) return;

    const drawRouteDetails = async () => {
      // Find starting point (user location or default to first event's coordinate as fallback)
      let startLat = userLocation?.lat;
      let startLng = userLocation?.lng;

      if (!startLat || !startLng) {
        // Prompt user to enable location if not loaded
        setIsLocating(true);
        try {
          const position: any = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
          });
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          startLat = lat;
          startLng = lng;
          setUserLocation({ lat, lng });
        } catch (err) {
          alert("Để vẽ đường đi, vui lòng cấp quyền truy cập vị trí GPS của trình duyệt.");
          setIsLocating(false);
          onClearRoute();
          return;
        } finally {
          setIsLocating(false);
        }
      }

      if (!startLat || !startLng) return;

      try {
        const endLat = routeToEvent.latitude;
        const endLng = routeToEvent.longitude;

        // Fetch routing data from OSRM API (open source free routing)
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates;
          const latlngs = coordinates.map((c: any) => [c[1], c[0]] as [number, number]);

          // Draw dual polylines for glowing effect
          const glowPolyline = L.polyline(latlngs, {
            color: '#a855f7', // Purple glow background
            weight: 8,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          const frontPolyline = L.polyline(latlngs, {
            color: '#ec4899', // Pink sakura foreground path
            weight: 4,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          routePolylinesRef.current = [glowPolyline, frontPolyline];

          // Fit bounds to show start and end
          const bounds = L.latLngBounds([startLat, startLng], [endLat, endLng]);
          map.fitBounds(bounds, { padding: [50, 50], animate: true });
        } else {
          alert("Không thể tìm thấy tuyến đường đường bộ đến sự kiện này.");
          onClearRoute();
        }
      } catch (err) {
        console.error("Lỗi định tuyến đường đi:", err);
        alert("Có lỗi xảy ra khi tính toán đường đi qua OSRM API.");
        onClearRoute();
      }
    };

    drawRouteDetails();

    return () => {
      routePolylinesRef.current.forEach(p => p.remove());
      routePolylinesRef.current = [];
    };
  }, [routeToEvent, userLocation, onClearRoute]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-purple-500/10 shadow-2xl">
      {/* Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Locate Me button floating on Map */}
      <button
        onClick={handleLocateMe}
        disabled={isLocating}
        className="absolute bottom-5 right-5 z-10 w-11 h-11 bg-background/80 hover:bg-background border border-purple-500/20 rounded-full flex items-center justify-center shadow-lg hover:shadow-purple-500/20 text-xl transition-all hover:scale-105 active:scale-95 text-foreground cursor-pointer focus:outline-none"
        title="Định vị tôi"
      >
        {isLocating ? (
          <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
        ) : (
          "🎯"
        )}
      </button>

      {/* Map guide tooltip */}
      {isCreating && (
        <div className="absolute top-4 left-4 z-10 glass-card px-4 py-2 rounded-xl text-xs font-semibold text-accent-cyan shadow-lg border border-cyan-500/20 animate-pulse pointer-events-none">
          ℹ️ Click bất kỳ đâu trên bản đồ để chọn tọa độ sự kiện
        </div>
      )}

      {/* Routing status info */}
      {routeToEvent && (
        <div className="absolute top-4 left-4 z-10 glass-card px-4 py-2.5 rounded-xl text-xs font-bold text-accent-pink shadow-lg border border-pink-500/20 flex items-center gap-2">
          <span>🛣️ Đang hiển thị đường đi từ vị trí của bạn</span>
          <button 
            onClick={onClearRoute}
            className="w-5 h-5 rounded-full bg-pink-500/10 hover:bg-pink-500/30 text-white flex items-center justify-center font-bold text-[10px] cursor-pointer"
            title="Xóa đường đi"
          >
            ❌
          </button>
        </div>
      )}
    </div>
  );
}
