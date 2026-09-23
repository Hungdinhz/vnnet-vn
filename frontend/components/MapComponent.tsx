"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapComponentProps {
  accessToken: string;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type: string[];
}

interface DirectionInfo {
  distance: number; // meters
  duration: number; // seconds
  steps: { instruction: string; distance: number }[];
}

type MapStyle = "streets" | "satellite" | "dark" | "outdoors";

const MAP_STYLES: Record<MapStyle, { url: string; label: string; icon: string }> = {
  streets: { url: "mapbox://styles/mapbox/streets-v12", label: "Đường phố", icon: "🗺️" },
  satellite: { url: "mapbox://styles/mapbox/satellite-streets-v12", label: "Vệ tinh", icon: "🛰️" },
  dark: { url: "mapbox://styles/mapbox/dark-v11", label: "Tối", icon: "🌙" },
  outdoors: { url: "mapbox://styles/mapbox/outdoors-v12", label: "Địa hình", icon: "⛰️" },
};

export default function MapComponent({ accessToken }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("streets");
  const [showStylePicker, setShowStylePicker] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Directions
  const [destination, setDestination] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [directionInfo, setDirectionInfo] = useState<DirectionInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [travelMode, setTravelMode] = useState<"driving" | "walking" | "cycling">("driving");

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!accessToken) return;

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[currentStyle].url,
      center: [108.20623, 16.047079], // Vietnam center
      zoom: 5.5,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    // Add navigation control (zoom in/out + compass)
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    // Add scale bar
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 150, unit: "metric" }), "bottom-left");

    // Add attribution
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    // Add 3D buildings on load
    map.on("style.load", () => {
      const layers = map.getStyle()?.layers;
      if (!layers) return;

      // Find the label layer to insert 3D buildings below
      let labelLayerId: string | undefined;
      for (const layer of layers) {
        if (layer.type === "symbol" && (layer.layout as any)?.["text-field"]) {
          labelLayerId = layer.id;
          break;
        }
      }

      // Only add if not satellite style
      if (currentStyle !== "satellite") {
        try {
          if (!map.getSource("composite")) return;
          map.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 14,
              paint: {
                "fill-extrusion-color": currentStyle === "dark" ? "#1e293b" : "#e2e8f0",
                "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.05, ["get", "height"]],
                "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.05, ["get", "min_height"]],
                "fill-extrusion-opacity": 0.6,
              },
            },
            labelLayerId
          );
        } catch {
          // Layer might already exist
        }
      }
    });

    mapRef.current = map;

    // Silently get user location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);

        // Add user marker
        const el = document.createElement("div");
        el.className = "user-location-marker";
        el.innerHTML = `
          <div class="user-marker-pulse"></div>
          <div class="user-marker-dot"></div>
        `;

        userMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([coords.lng, coords.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML("<strong>📍 Vị trí của bạn</strong>"))
          .addTo(map);

        map.flyTo({ center: [coords.lng, coords.lat], zoom: 14, speed: 1.5 });
      },
      () => {
        // Silently fail
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Watch user location
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([coords.lng, coords.lat]);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!userLocation]);

  // Change map style
  const handleStyleChange = useCallback(
    (style: MapStyle) => {
      const map = mapRef.current;
      if (!map) return;
      setCurrentStyle(style);
      map.setStyle(MAP_STYLES[style].url);
      setShowStylePicker(false);
    },
    []
  );

  // Locate me
  const handleLocateMe = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);

        // Update or create user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([coords.lng, coords.lat]);
        } else {
          const el = document.createElement("div");
          el.className = "user-location-marker";
          el.innerHTML = `
            <div class="user-marker-pulse"></div>
            <div class="user-marker-dot"></div>
          `;
          userMarkerRef.current = new mapboxgl.Marker({ element: el })
            .setLngLat([coords.lng, coords.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML("<strong>📍 Vị trí của bạn</strong>"))
            .addTo(map);
        }

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
  }, []);

  // Search places
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (!query.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const proximity = userLocation ? `&proximity=${userLocation.lng},${userLocation.lat}` : "";
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              query
            )}.json?access_token=${accessToken}&language=vi&country=vn&limit=5${proximity}`
          );
          const data = await response.json();

          if (data.features) {
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
          setIsSearching(false);
        }
      }, 400);
    },
    [accessToken, userLocation]
  );

  // Select search result
  const handleSelectPlace = useCallback(
    (result: SearchResult) => {
      const map = mapRef.current;
      if (!map) return;

      setShowSearchResults(false);
      setSearchQuery(result.place_name);

      // Remove old search marker
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
      }

      // Add marker at selected place
      searchMarkerRef.current = new mapboxgl.Marker({ color: "#6366f1" })
        .setLngLat(result.center)
        .setPopup(
          new mapboxgl.Popup({ offset: 25, maxWidth: "300px" }).setHTML(`
            <div style="font-family: 'Outfit', sans-serif; padding: 4px;">
              <strong style="font-size: 14px; color: #1e293b;">📍 ${result.place_name.split(",")[0]}</strong>
              <p style="font-size: 12px; color: #64748b; margin-top: 4px;">${result.place_name}</p>
              <button 
                id="direction-btn-${result.id}" 
                style="
                  margin-top: 8px; 
                  padding: 6px 14px; 
                  background: linear-gradient(135deg, #4F46E5, #6366F1); 
                  color: white; 
                  border: none; 
                  border-radius: 8px; 
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 600;
                "
              >
                🧭 Chỉ đường đến đây
              </button>
            </div>
          `)
        )
        .addTo(map);

      searchMarkerRef.current.togglePopup();

      // Listen for direction button click
      setTimeout(() => {
        const btn = document.getElementById(`direction-btn-${result.id}`);
        if (btn) {
          btn.addEventListener("click", () => {
            setDestination({
              lat: result.center[1],
              lng: result.center[0],
              name: result.place_name.split(",")[0],
            });
          });
        }
      }, 100);

      map.flyTo({ center: result.center, zoom: 15, speed: 1.5 });
    },
    []
  );

  // Fetch directions
  useEffect(() => {
    if (!destination || !userLocation || !mapRef.current) return;

    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      setShowDirections(true);

      try {
        const map = mapRef.current!;
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${travelMode}/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?access_token=${accessToken}&geometries=geojson&steps=true&overview=full&language=vi`
        );
        const data = await response.json();

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

          // Remove old route
          if (map.getSource("route")) {
            map.removeLayer("route-line-bg");
            map.removeLayer("route-line");
            map.removeSource("route");
          }

          // Add route to map
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

          // Background glow line
          map.addLayer({
            id: "route-line-bg",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#6366f1",
              "line-width": 10,
              "line-opacity": 0.3,
            },
          });

          // Main route line
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#818cf8",
              "line-width": 5,
              "line-opacity": 0.9,
            },
          });

          // Add destination marker
          if (destinationMarkerRef.current) {
            destinationMarkerRef.current.remove();
          }
          destinationMarkerRef.current = new mapboxgl.Marker({ color: "#ef4444" })
            .setLngLat([destination.lng, destination.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>🏁 ${destination.name}</strong>`))
            .addTo(map);

          // Fit bounds to show entire route
          const bounds = new mapboxgl.LngLatBounds();
          coords.forEach((coord: [number, number]) => bounds.extend(coord));
          bounds.extend([userLocation.lng, userLocation.lat]);
          map.fitBounds(bounds, { padding: { top: 80, bottom: 80, left: 80, right: 80 }, duration: 1500 });
        } else {
          alert("Không tìm được tuyến đường. Vui lòng thử lại.");
          clearRoute();
        }
      } catch (err) {
        console.error("Lỗi tìm đường:", err);
        alert("Có lỗi xảy ra khi tìm đường đi.");
        clearRoute();
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, travelMode, accessToken]);

  // Clear route
  const clearRoute = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      try {
        if (map.getSource("route")) {
          map.removeLayer("route-line-bg");
          map.removeLayer("route-line");
          map.removeSource("route");
        }
      } catch {}
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
    setDestination(null);
    setDirectionInfo(null);
    setShowDirections(false);
  }, []);

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}p`;
    return `${mins} phút`;
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-indigo-500/10 shadow-2xl">
      {/* Mapbox container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Search bar */}
      <div className="absolute top-4 left-4 z-10 w-80 max-w-[calc(100%-2rem)]">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
            placeholder="🔍 Tìm kiếm địa điểm..."
            className="w-full px-4 py-3 pr-10 bg-background/90 backdrop-blur-xl border border-indigo-500/20 rounded-xl text-sm text-foreground placeholder-muted shadow-lg focus:outline-none focus:border-indigo-500/50 focus:shadow-indigo-500/10 transition-all"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {searchQuery && !isSearching && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowSearchResults(false);
                if (searchMarkerRef.current) {
                  searchMarkerRef.current.remove();
                  searchMarkerRef.current = null;
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="mt-2 bg-background/95 backdrop-blur-xl border border-indigo-500/20 rounded-xl shadow-xl overflow-hidden">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectPlace(result)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-500/10 transition-colors border-b border-indigo-500/5 last:border-b-0 cursor-pointer"
              >
                <div className="text-sm font-medium text-foreground truncate">
                  📍 {result.place_name.split(",")[0]}
                </div>
                <div className="text-xs text-muted mt-0.5 truncate">
                  {result.place_name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Style picker */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowStylePicker(!showStylePicker)}
          className="w-10 h-10 bg-background/90 backdrop-blur-xl border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-lg hover:shadow-indigo-500/20 text-lg transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
          title="Kiểu bản đồ"
        >
          {MAP_STYLES[currentStyle].icon}
        </button>

        {showStylePicker && (
          <div className="absolute top-12 right-0 bg-background/95 backdrop-blur-xl border border-indigo-500/20 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
            {(Object.keys(MAP_STYLES) as MapStyle[]).map((key) => (
              <button
                key={key}
                onClick={() => handleStyleChange(key)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                  currentStyle === key
                    ? "bg-indigo-500/15 text-indigo-400 font-semibold"
                    : "hover:bg-indigo-500/10 text-foreground"
                }`}
              >
                <span>{MAP_STYLES[key].icon}</span>
                <span>{MAP_STYLES[key].label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Locate me button */}
      <button
        onClick={handleLocateMe}
        disabled={isLocating}
        className="absolute bottom-5 right-5 z-10 w-11 h-11 bg-background/90 backdrop-blur-xl hover:bg-background border border-indigo-500/20 rounded-full flex items-center justify-center shadow-lg hover:shadow-indigo-500/20 text-xl transition-all hover:scale-105 active:scale-95 text-foreground cursor-pointer focus:outline-none"
        title="Định vị tôi"
      >
        {isLocating ? (
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          "🎯"
        )}
      </button>

      {/* Direction panel */}
      {showDirections && (
        <div className="absolute bottom-5 left-4 z-10 w-80 max-w-[calc(100%-5rem)] bg-background/95 backdrop-blur-xl border border-indigo-500/20 rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-500/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧭</span>
              <span className="font-semibold text-sm text-foreground">Chỉ đường</span>
            </div>
            <button
              onClick={clearRoute}
              className="w-7 h-7 rounded-full hover:bg-indigo-500/10 flex items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer"
              title="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Travel mode selector */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-indigo-500/10">
            {(["driving", "walking", "cycling"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTravelMode(mode)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  travelMode === mode
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "hover:bg-indigo-500/10 text-muted"
                }`}
              >
                {mode === "driving" ? "🚗 Lái xe" : mode === "walking" ? "🚶 Đi bộ" : "🚴 Xe đạp"}
              </button>
            ))}
          </div>

          {isLoadingRoute ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-muted">Đang tìm đường...</span>
            </div>
          ) : directionInfo ? (
            <>
              {/* Route summary */}
              <div className="px-4 py-3 flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-400">
                    {formatDistance(directionInfo.distance)}
                  </div>
                  <div className="text-xs text-muted">Khoảng cách</div>
                </div>
                <div className="w-px h-8 bg-indigo-500/10" />
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-400">
                    {formatDuration(directionInfo.duration)}
                  </div>
                  <div className="text-xs text-muted">Thời gian</div>
                </div>
                <div className="flex-1" />
                <div className="text-right">
                  <div className="text-xs font-medium text-foreground truncate max-w-[100px]">
                    🏁 {destination?.name}
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="max-h-48 overflow-y-auto px-4 pb-3">
                {directionInfo.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2 border-t border-indigo-500/5 first:border-t-0"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{step.instruction}</p>
                      <p className="text-[10px] text-muted mt-0.5">{formatDistance(step.distance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Custom marker styles */}
      <style jsx global>{`
        .user-location-marker {
          position: relative;
          width: 24px;
          height: 24px;
        }
        .user-marker-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.3);
          animation: user-pulse 2s ease-in-out infinite;
        }
        .user-marker-dot {
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: #6366f1;
          border: 3px solid white;
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
        }
        @keyframes user-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(2); opacity: 0; }
        }
        .mapboxgl-popup-content {
          border-radius: 12px !important;
          padding: 12px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
        }
        .mapboxgl-popup-close-button {
          font-size: 16px !important;
          padding: 4px 8px !important;
        }
      `}</style>
    </div>
  );
}
