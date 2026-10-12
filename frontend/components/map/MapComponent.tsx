"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  SearchResult,
  DirectionInfo,
  SelectedPoint,
  MapStyle,
  MAP_STYLES,
  formatCategory,
} from "./types";
import MapSearchBar from "./MapSearchBar";
import MapControls from "./MapControls";
import MapSidebar from "./MapSidebar";
import MapDirections from "./MapDirections";

export interface MapComponentProps {
  accessToken: string;
}

function isMapReady(map: mapboxgl.Map | null): map is mapboxgl.Map {
  if (!map) return false;
  if ((map as any)._removed) return false;
  try {
    const container = map.getCanvasContainer();
    return Boolean(container && container.isConnected);
  } catch {
    return false;
  }
}

export default function MapComponent({ accessToken }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const selectedPopupRef = useRef<mapboxgl.Popup | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [currentStyle, setCurrentStyle] = useState<MapStyle>("streets");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected point details
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);
  const [copiedAddressToast, setCopiedAddressToast] = useState(false);
  const [copiedCoordsToast, setCopiedCoordsToast] = useState(false);

  // Directions state
  const [destination, setDestination] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [travelMode, setTravelMode] = useState<"driving" | "walking" | "cycling">("driving");
  const [directionInfo, setDirectionInfo] = useState<DirectionInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showDirections, setShowDirections] = useState(false);

  const isMountedRef = useRef(true);
  const watchIdRef = useRef<number | null>(null);
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  const clearRoute = useCallback(() => {
    const map = mapRef.current;
    if (isMapReady(map)) {
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getLayer("route-line-bg")) map.removeLayer("route-line-bg");
      if (map.getSource("route")) map.removeSource("route");
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
    setDestination(null);
    setDirectionInfo(null);
    setShowDirections(false);
  }, []);

  const clearSelectedPoint = useCallback(() => {
    setSelectedPoint(null);
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
    if (selectedPopupRef.current) {
      selectedPopupRef.current.remove();
      selectedPopupRef.current = null;
    }
  }, []);

  const selectPoint = useCallback(
    (
      lat: number,
      lng: number,
      name: string,
      secondaryName?: string,
      category?: string,
      icon?: string,
      address?: string
    ) => {
      const map = mapRef.current;
      if (!isMapReady(map)) return;

      clearRoute();

      setSelectedPoint({
        lat,
        lng,
        name,
        secondaryName,
        category,
        icon,
        address: address || "Đang lấy địa chỉ...",
      });

      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.remove();
      }
      if (selectedPopupRef.current) {
        selectedPopupRef.current.remove();
      }

      selectedMarkerRef.current = new mapboxgl.Marker({ color: "#6366f1" })
        .setLngLat([lng, lat])
        .addTo(map);

      if (!address) {
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&language=vi`
        )
          .then((res) => res.json())
          .then((data) => {
            if (isMountedRef.current && data.features && data.features.length > 0) {
              const fullAddr = data.features[0].place_name;
              setSelectedPoint((prev) => (prev ? { ...prev, address: fullAddr } : null));
            }
          })
          .catch((err) => console.error("Lỗi lấy địa chỉ ngược:", err));
      }
    },
    [accessToken, clearRoute]
  );

  const updateUserMarker = useCallback((coords: { lat: number; lng: number }) => {
    const map = mapRef.current;
    if (!isMapReady(map)) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([coords.lng, coords.lat]);
    } else {
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.innerHTML = '<div class="user-marker-pulse"></div><div class="user-marker-dot"></div>';

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    isMountedRef.current = true;
    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES.streets.url,
      center: [105.854444, 21.028511], // Hà Nội
      zoom: 14,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      const features = map.queryRenderedFeatures(e.point);
      const poiFeature = features.find(
        (f) =>
          f.layer?.id.includes("poi") ||
          f.layer?.id.includes("label") ||
          f.properties?.name ||
          f.properties?.title
      );

      if (poiFeature && (poiFeature.properties?.name || poiFeature.properties?.title)) {
        const rawName = poiFeature.properties.name || poiFeature.properties.title;
        const rawCategory = poiFeature.properties.category || poiFeature.properties.maki;
        const formatted = formatCategory(rawCategory, poiFeature.layer?.id);
        selectPoint(lat, lng, rawName, undefined, formatted.label, formatted.icon);
      } else {
        selectPoint(lat, lng, "Điểm đã chọn", undefined, "Tọa độ bản đồ", "📍");
      }
    });

    // Auto locate user
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current || !isMapReady(mapRef.current)) return;
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        updateUserMarker(coords);
        map.flyTo({ center: [coords.lng, coords.lat], zoom: 15, speed: 1.5 });
      },
      (err) => console.log("Chưa cấp quyền GPS:", err.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );

    return () => {
      isMountedRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (userMarkerRef.current) userMarkerRef.current.remove();
      if (selectedMarkerRef.current) selectedMarkerRef.current.remove();
      if (selectedPopupRef.current) selectedPopupRef.current.remove();
      if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Watch position if user location is known
  useEffect(() => {
    if (!userLocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (!isMountedRef.current || !isMapReady(mapRef.current)) return;
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        updateUserMarker(coords);
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [!!userLocation, updateUserMarker]);

  const handleStyleChange = useCallback((style: MapStyle) => {
    const map = mapRef.current;
    if (!isMapReady(map)) return;
    setCurrentStyle(style);
    map.setStyle(MAP_STYLES[style].url);
    setShowStylePicker(false);
  }, []);

  const handleLocateMe = useCallback(() => {
    const map = mapRef.current;
    if (!isMapReady(map)) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current || !isMapReady(mapRef.current)) return;
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        updateUserMarker(coords);
        map.flyTo({ center: [coords.lng, coords.lat], zoom: 16, speed: 1.8 });
        setIsLocating(false);
      },
      (error) => {
        console.error("Lỗi định vị:", error);
        alert("Không thể định vị. Vui lòng cấp quyền vị trí cho trình duyệt.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [updateUserMarker]);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      if (!query.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const loc = userLocationRef.current;
          const proximity = loc ? `&proximity=${loc.lng},${loc.lat}` : "";
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              query
            )}.json?access_token=${accessToken}&language=vi&country=vn&limit=5${proximity}`
          );
          const data = await response.json();

          if (isMountedRef.current && data.features) {
            setSearchResults(
              data.features.map((f: any) => ({
                id: f.id,
                place_name: f.place_name,
                center: f.center,
                place_type: f.place_type,
              }))
            );
            setShowSearchResults(true);
          }
        } catch (error) {
          console.error("Lỗi tìm kiếm:", error);
        } finally {
          if (isMountedRef.current) setIsSearching(false);
        }
      }, 350);
    },
    [accessToken]
  );

  const handleSelectSearchResult = useCallback(
    (result: SearchResult) => {
      const map = mapRef.current;
      if (!isMapReady(map)) return;

      setShowSearchResults(false);
      setSearchQuery(result.place_name);

      const [lng, lat] = result.center;
      const title = result.place_name.split(",")[0];

      selectPoint(lat, lng, title, undefined, "Tìm kiếm", "🔍", result.place_name);
      map.flyTo({ center: [lng, lat], zoom: 16, speed: 1.5 });
    },
    [selectPoint]
  );

  // Fetch route when destination changes
  useEffect(() => {
    if (!destination || !userLocation) return;
    const map = mapRef.current;
    if (!isMapReady(map)) return;

    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      setShowDirections(true);

      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${travelMode}/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?access_token=${accessToken}&geometries=geojson&steps=true&overview=full&language=vi`
        );
        const data = await response.json();

        if (!isMountedRef.current || !isMapReady(mapRef.current)) return;

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates;

          setDirectionInfo({
            distance: route.distance,
            duration: route.duration,
            steps: route.legs[0].steps.map((s: any) => ({
              instruction: s.maneuver.instruction,
              distance: s.distance,
            })),
          });

          if (map.getLayer("route-line")) map.removeLayer("route-line");
          if (map.getLayer("route-line-bg")) map.removeLayer("route-line-bg");
          if (map.getSource("route")) map.removeSource("route");

          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: coords,
              },
            },
          });

          map.addLayer({
            id: "route-line-bg",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#4F46E5",
              "line-width": 8,
              "line-opacity": 0.4,
            },
          });

          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#818cf8",
              "line-width": 4.5,
              "line-opacity": 0.95,
            },
          });

          if (destinationMarkerRef.current) {
            destinationMarkerRef.current.remove();
          }
          destinationMarkerRef.current = new mapboxgl.Marker({ color: "#ef4444" })
            .setLngLat([destination.lng, destination.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>🏁 ${destination.name}</strong>`))
            .addTo(map);

          const bounds = new mapboxgl.LngLatBounds();
          coords.forEach((coord: [number, number]) => bounds.extend(coord));
          bounds.extend([userLocation.lng, userLocation.lat]);
          map.fitBounds(bounds, { padding: { top: 90, bottom: 90, left: 90, right: 90 }, duration: 1500 });
        } else {
          alert("Không tìm được tuyến đường phù hợp.");
          clearRoute();
        }
      } catch (err) {
        console.error("Lỗi tìm đường:", err);
        alert("Có lỗi xảy ra khi tính đường đi.");
        clearRoute();
      } finally {
        if (isMountedRef.current) setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [destination, travelMode, accessToken, userLocation, clearRoute]);

  const handleCopyAddress = () => {
    if (!selectedPoint) return;
    navigator.clipboard.writeText(selectedPoint.address);
    setCopiedAddressToast(true);
    setTimeout(() => setCopiedAddressToast(false), 2000);
  };

  const handleCopyCoords = () => {
    if (!selectedPoint) return;
    const text = `${selectedPoint.lat.toFixed(6)}, ${selectedPoint.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoordsToast(true);
    setTimeout(() => setCopiedCoordsToast(false), 2000);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      {/* Mapbox Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Search Bar */}
      <MapSearchBar
        searchQuery={searchQuery}
        isSearching={isSearching}
        showSearchResults={showSearchResults}
        searchResults={searchResults}
        onSearchChange={handleSearch}
        onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
        onClear={() => {
          setSearchQuery("");
          setSearchResults([]);
          setShowSearchResults(false);
        }}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Controls: Style Picker & Locate Me */}
      <MapControls
        currentStyle={currentStyle}
        showStylePicker={showStylePicker}
        setShowStylePicker={setShowStylePicker}
        onStyleChange={handleStyleChange}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
      />

      {/* Place Details Sidebar */}
      {selectedPoint && !showDirections && (
        <MapSidebar
          selectedPoint={selectedPoint}
          copiedAddressToast={copiedAddressToast}
          copiedCoordsToast={copiedCoordsToast}
          onClear={clearSelectedPoint}
          onStartDirection={() =>
            setDestination({
              lat: selectedPoint.lat,
              lng: selectedPoint.lng,
              name: selectedPoint.name,
            })
          }
          onCopyAddress={handleCopyAddress}
          onCopyCoords={handleCopyCoords}
        />
      )}

      {/* Directions Guide Panel */}
      {showDirections && (
        <MapDirections
          destination={destination}
          travelMode={travelMode}
          setTravelMode={setTravelMode}
          isLoadingRoute={isLoadingRoute}
          directionInfo={directionInfo}
          onClear={clearRoute}
        />
      )}

      {/* Global CSS for User Marker & Popup */}
      <style jsx global>{`
        .user-location-marker {
          position: relative;
          width: 24px;
          height: 24px;
        }
        .user-marker-pulse {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.35);
          animation: user-marker-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .user-marker-dot {
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: #4f46e5;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
        }
        @keyframes user-marker-ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .mapboxgl-popup-content {
          border-radius: 18px !important;
          padding: 14px 16px !important;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25) !important;
          border: 1px solid rgba(99, 102, 241, 0.25) !important;
          background: #ffffff !important;
          color: #0f172a !important;
        }
        .dark .mapboxgl-popup-content {
          background: #1e293b !important;
          color: #f8fafc !important;
        }
      `}</style>
    </div>
  );
}
