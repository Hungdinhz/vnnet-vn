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

interface SelectedPoint {
  lat: number;
  lng: number;
  name: string;
  secondaryName?: string;
  address: string;
  category?: string;
  icon?: string;
  isLoading?: boolean;
}

type MapStyle = "streets" | "satellite" | "dark" | "outdoors";

const MAP_STYLES: Record<MapStyle, { url: string; label: string; icon: string }> = {
  streets: { url: "mapbox://styles/mapbox/streets-v12", label: "Đường phố", icon: "🗺️" },
  satellite: { url: "mapbox://styles/mapbox/satellite-streets-v12", label: "Vệ tinh", icon: "🛰️" },
  dark: { url: "mapbox://styles/mapbox/dark-v11", label: "Tối", icon: "🌙" },
  outdoors: { url: "mapbox://styles/mapbox/outdoors-v12", label: "Địa hình", icon: "⛰️" },
};

// Safe helper to check if map instance is valid and attached to DOM
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

// Convert Mapbox raw categories into user-friendly Vietnamese labels and icons
function formatCategory(rawCategory?: string, layerId?: string) {
  const cat = (rawCategory || "").toLowerCase();
  const layer = (layerId || "").toLowerCase();

  if (cat.includes("univ") || cat.includes("college") || cat.includes("education") || cat.includes("school")) {
    return { label: "Trường Đại học / Giáo dục", icon: "🎓" };
  }
  if (cat.includes("hosp") || cat.includes("clinic") || cat.includes("health") || cat.includes("pharmacy")) {
    return { label: "Bệnh viện / Y tế", icon: "🏥" };
  }
  if (cat.includes("rest") || cat.includes("cafe") || cat.includes("food") || cat.includes("bar")) {
    return { label: "Nhà hàng / Quán ăn / Cafe", icon: "🍜" };
  }
  if (cat.includes("shop") || cat.includes("store") || cat.includes("market") || cat.includes("mall") || cat.includes("supermarket")) {
    return { label: "Mua sắm / Siêu thị", icon: "🛒" };
  }
  if (cat.includes("worship") || cat.includes("temple") || cat.includes("pagoda") || cat.includes("church")) {
    return { label: "Chùa / Đền / Nhà thờ", icon: "⛩️" };
  }
  if (cat.includes("bank") || cat.includes("atm")) {
    return { label: "Ngân hàng / ATM", icon: "🏦" };
  }
  if (cat.includes("hotel") || cat.includes("lodg") || cat.includes("motel") || cat.includes("guest_house")) {
    return { label: "Khách sạn / Lưu trú", icon: "🏨" };
  }
  if (cat.includes("park") || cat.includes("garden")) {
    return { label: "Công viên / Thư giãn", icon: "🌳" };
  }
  if (cat.includes("tour") || cat.includes("museum") || cat.includes("historic") || cat.includes("monument")) {
    return { label: "Du lịch / Di tích / Bảo tàng", icon: "🏛️" };
  }
  if (cat.includes("gas") || cat.includes("fuel")) {
    return { label: "Cây xăng", icon: "⛽" };
  }
  if (cat.includes("police") || cat.includes("government") || cat.includes("post_office") || cat.includes("embassy")) {
    return { label: "Cơ quan / Hành chính", icon: "🏢" };
  }
  if (cat.includes("transit") || cat.includes("bus") || cat.includes("rail") || cat.includes("station")) {
    return { label: "Giao thông / Trạm dừng", icon: "🚏" };
  }
  if (layer.includes("major")) {
    return { label: "Thành phố / Đô thị", icon: "🏙️" };
  }
  if (layer.includes("minor")) {
    return { label: "Quận / Huyện / Thị trấn", icon: "🏘️" };
  }
  if (layer.includes("subdivision")) {
    return { label: "Phường / Xã / Khu dân cư", icon: "🏡" };
  }
  if (layer.includes("road") || layer.includes("highway") || layer.includes("motorway")) {
    return { label: "Tuyến đường", icon: "🛣️" };
  }
  return { label: rawCategory ? rawCategory.toUpperCase() : "Địa điểm", icon: "📍" };
}

// Safely extract rendered vector tile feature under or near click/hover point
function findFeatureAtPoint(map: mapboxgl.Map, point: mapboxgl.Point) {
  if (!isMapReady(map)) return null;

  try {
    if (!map.isStyleLoaded()) return null;

    const queryRadius = 22; // 22px tolerance for comfortable clicking
    const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
      [point.x - queryRadius, point.y - queryRadius],
      [point.x + queryRadius, point.y + queryRadius],
    ];

    const features = map.queryRenderedFeatures(bbox);
    if (!features || features.length === 0) return null;

    // 1. POI labels (Đại học, trường học, bệnh viện, nhà hàng, siêu thị...)
    const poiFeature = features.find((f) => {
      const lId = (f.layer?.id || "").toLowerCase();
      const isPoi = lId.includes("poi") || lId.includes("transit") || lId.includes("landmark");
      const p = f.properties || {};
      return isPoi && Boolean(p.name_vi || p["name:vi"] || p.name || p["name:latin"] || p.name_en);
    });

    if (poiFeature) {
      const p = poiFeature.properties || {};
      const primaryName = p.name_vi || p["name:vi"] || p.name || p["name:latin"] || p.name_en;
      const secondaryName =
        p.name_en && p.name_en !== primaryName
          ? p.name_en
          : p.name && p.name !== primaryName
          ? p.name
          : undefined;

      let center: [number, number] | null = null;
      if (poiFeature.geometry && poiFeature.geometry.type === "Point") {
        center = (poiFeature.geometry as any).coordinates as [number, number];
      }

      const catInfo = formatCategory(p.class || p.category || p.maki || p.type, poiFeature.layer?.id);
      return {
        name: primaryName,
        secondaryName,
        category: catInfo.label,
        icon: catInfo.icon,
        center,
        feature: poiFeature,
      };
    }

    // 2. Settlement & Place labels (Văn Giang, Như Quỳnh, Yên Mỹ, Khoái Châu, Hà Nội...)
    const settlementFeature = features.find((f) => {
      const lId = (f.layer?.id || "").toLowerCase();
      const isSettlement =
        lId.includes("settlement") ||
        lId.includes("place-") ||
        lId.includes("place_") ||
        lId.includes("place");
      const p = f.properties || {};
      return isSettlement && Boolean(p.name_vi || p["name:vi"] || p.name || p["name:latin"] || p.name_en);
    });

    if (settlementFeature) {
      const p = settlementFeature.properties || {};
      const primaryName = p.name_vi || p["name:vi"] || p.name || p["name:latin"] || p.name_en;
      const secondaryName =
        p.name_en && p.name_en !== primaryName
          ? p.name_en
          : p.name && p.name !== primaryName
          ? p.name
          : undefined;

      let center: [number, number] | null = null;
      if (settlementFeature.geometry && settlementFeature.geometry.type === "Point") {
        center = (settlementFeature.geometry as any).coordinates as [number, number];
      }

      const catInfo = formatCategory(p.type || p.class, settlementFeature.layer?.id);
      return {
        name: primaryName,
        secondaryName,
        category: catInfo.label,
        icon: catInfo.icon,
        center,
        feature: settlementFeature,
      };
    }

    // 3. Sông hồ, thiên nhiên (Sông Hồng, Sông Đuống...)
    const naturalFeature = features.find((f) => {
      const lId = (f.layer?.id || "").toLowerCase();
      const isNat = lId.includes("water") || lId.includes("natural");
      const p = f.properties || {};
      return isNat && Boolean(p.name_vi || p["name:vi"] || p.name);
    });

    if (naturalFeature) {
      const p = naturalFeature.properties || {};
      const name = p.name_vi || p["name:vi"] || p.name;
      return { name, category: "Sông hồ / Thiên nhiên", icon: "🌊", center: null, feature: naturalFeature };
    }

    // 4. Tuyến đường & Biển số cao tốc (CT.01, CT.04, QL.39, QL.38B...)
    const roadFeature = features.find((f) => {
      const lId = (f.layer?.id || "").toLowerCase();
      const isRoad = lId.includes("road") || lId.includes("highway") || lId.includes("motorway");
      const p = f.properties || {};
      return isRoad && Boolean(p.name_vi || p["name:vi"] || p.name || p.ref);
    });

    if (roadFeature) {
      const p = roadFeature.properties || {};
      const name = p.name_vi || p["name:vi"] || p.name || (p.ref ? `Tuyến đường ${p.ref}` : null);
      if (name) {
        return { name, category: "Tuyến đường", icon: "🛣️", center: null, feature: roadFeature };
      }
    }

    // 5. Bất kỳ feature nào có thuộc tính tên
    const anyNamed = features.find((f) => {
      const p = f.properties || {};
      return Boolean(p.name_vi || p["name:vi"] || p.name);
    });

    if (anyNamed) {
      const p = anyNamed.properties || {};
      const name = p.name_vi || p["name:vi"] || p.name;
      return { name, category: "Địa điểm", icon: "📍", center: null, feature: anyNamed };
    }

    return null;
  } catch {
    return null;
  }
}

export default function MapComponent({ accessToken }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const selectedPopupRef = useRef<mapboxgl.Popup | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  const [isLocating, setIsLocating] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("streets");
  const [showStylePicker, setShowStylePicker] = useState(false);

  // Selected Point (Google Maps style)
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);
  const [copiedAddressToast, setCopiedAddressToast] = useState(false);
  const [copiedCoordsToast, setCopiedCoordsToast] = useState(false);

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

  // Format helpers
  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}p`;
    return `${mins} phút`;
  };

  // Update user marker
  const updateUserMarker = useCallback((coords: { lat: number; lng: number }) => {
    const map = mapRef.current;
    if (!isMapReady(map)) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([coords.lng, coords.lat]);
    } else {
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.innerHTML = `
        <div class="user-marker-pulse"></div>
        <div class="user-marker-dot"></div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; color: #1e293b;">📍 Vị trí hiện tại của bạn</div>`
      );

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(popup)
        .addTo(map);
    }
  }, []);

  // Clear route
  const clearRoute = useCallback(() => {
    const map = mapRef.current;
    if (isMapReady(map)) {
      try {
        if (map.getLayer("route-line")) map.removeLayer("route-line");
        if (map.getLayer("route-line-bg")) map.removeLayer("route-line-bg");
        if (map.getSource("route")) map.removeSource("route");
      } catch (err) {
        console.error("Lỗi khi xóa route:", err);
      }
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
    setDestination(null);
    setDirectionInfo(null);
    setShowDirections(false);
  }, []);

  // Clear selected point marker & popup
  const clearSelectedPoint = useCallback(() => {
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
    if (selectedPopupRef.current) {
      selectedPopupRef.current.remove();
      selectedPopupRef.current = null;
    }
    setSelectedPoint(null);
  }, []);

  // Start navigation towards a selected point
  const startDirection = useCallback(
    (point: { lat: number; lng: number; name: string }) => {
      // Clear temporary selected marker & popup so only the clean route is shown
      clearSelectedPoint();

      const currentLoc = userLocationRef.current;
      if (!currentLoc) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMountedRef.current) return;
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(coords);
            updateUserMarker(coords);
            setIsLocating(false);
            setDestination(point);
          },
          () => {
            setIsLocating(false);
            alert("Để tìm đường, bạn vui lòng cho phép trình duyệt truy cập vị trí hiện tại.");
          },
          { enableHighAccuracy: true }
        );
      } else {
        setDestination(point);
      }
    },
    [updateUserMarker, clearSelectedPoint]
  );

  const startDirectionRef = useRef(startDirection);
  useEffect(() => {
    startDirectionRef.current = startDirection;
  }, [startDirection]);

  // Handle point selection: uses Mapbox native marker anchored rigidly to the map
  const selectPoint = useCallback(
    async (
      lat: number,
      lng: number,
      immediateName?: string,
      secondaryName?: string,
      immediateCategory?: string,
      icon?: string,
      prefilledAddress?: string
    ) => {
      const map = mapRef.current;
      if (!isMapReady(map)) return;

      const initialName = immediateName || "Địa điểm đã chọn";
      const initialAddress = prefilledAddress || `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      // 1. Update React state immediately (Opens Google Maps style side panel)
      setSelectedPoint({
        lat,
        lng,
        name: initialName,
        secondaryName,
        address: initialAddress,
        category: immediateCategory,
        icon: icon || "📍",
        isLoading: !prefilledAddress,
      });

      // 2. Remove old popup if any
      if (selectedPopupRef.current) {
        selectedPopupRef.current.remove();
        selectedPopupRef.current = null;
      }

      // 3. Update or create Native Mapbox Marker (Locked 100% to coordinates)
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setLngLat([lng, lat]);
      } else {
        selectedMarkerRef.current = new mapboxgl.Marker({
          color: "#ef4444", // Clean, standard red pin
        })
          .setLngLat([lng, lat])
          .addTo(map);
      }

      // 4. Create and attach popup with High-Contrast dark/light mode classes
      const popupContainer = document.createElement("div");
      popupContainer.className = "selected-marker-popup-content";
      popupContainer.innerHTML = `
        <div style="font-family: 'Outfit', sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <div style="font-size: 15px; font-weight: 700; line-height: 1.3;" class="popup-title">
              ${icon || "📍"} ${initialName}
            </div>
            ${
              immediateCategory
                ? `<span style="font-size: 10px; background: rgba(99, 102, 241, 0.15); color: #6366f1; padding: 2px 7px; border-radius: 999px; font-weight: 600; white-space: nowrap; flex-shrink: 0;">${immediateCategory.split(" / ")[0]}</span>`
                : ""
            }
          </div>
          ${
            secondaryName
              ? `<div style="font-size: 11px; margin-bottom: 4px; font-style: italic;" class="popup-secondary">${secondaryName}</div>`
              : ""
          }
          <div style="font-size: 11px; line-height: 1.4; margin-bottom: 6px;" class="popup-address">
            ${initialAddress}
          </div>
          <div style="font-size: 10px; margin-bottom: 8px; font-family: monospace;" class="popup-coords">
            ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </div>
          <button id="popup-direction-btn" style="
            width: 100%;
            padding: 8px 12px;
            background: linear-gradient(135deg, #4F46E5, #6366F1);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            box-shadow: 0 2px 10px rgba(99, 102, 241, 0.35);
          ">
            🧭 Chỉ đường tới đây
          </button>
        </div>
      `;

      const dirBtn = popupContainer.querySelector("#popup-direction-btn");
      if (dirBtn) {
        dirBtn.addEventListener("click", () => {
          startDirectionRef.current({ lat, lng, name: initialName });
        });
      }

      const popup = new mapboxgl.Popup({ offset: 35, closeButton: true, maxWidth: "340px" })
        .setDOMContent(popupContainer)
        .setLngLat([lng, lat])
        .addTo(map);

      // When user clicks the close 'X' on popup, also remove the red pin
      popup.on("close", () => {
        if (selectedMarkerRef.current) {
          selectedMarkerRef.current.remove();
          selectedMarkerRef.current = null;
        }
        setSelectedPoint(null);
      });

      selectedPopupRef.current = popup;

      // 5. Background reverse geocoding to enrich full address
      if (!prefilledAddress) {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&language=vi`
          );
          const data = await res.json();

          if (isMountedRef.current && data.features && data.features.length > 0) {
            const first = data.features[0];
            const geocodedFullAddress = first.place_name;
            const resolvedName = immediateName || first.text || first.place_name.split(",")[0];

            setSelectedPoint((prev) => {
              if (!prev || prev.lat !== lat || prev.lng !== lng) return prev;
              return {
                ...prev,
                name: resolvedName,
                address: geocodedFullAddress,
                isLoading: false,
              };
            });

            // Update popup address in-place without flickering
            const addrEl = popupContainer.querySelector(".popup-address");
            if (addrEl) {
              addrEl.textContent = geocodedFullAddress;
            }
            const titleEl = popupContainer.querySelector(".popup-title");
            if (titleEl && !immediateName) {
              titleEl.textContent = `${icon || "📍"} ${resolvedName}`;
            }
          } else if (isMountedRef.current) {
            setSelectedPoint((prev) => (prev ? { ...prev, isLoading: false } : null));
          }
        } catch (err) {
          console.error("Lỗi lấy địa chỉ ngược:", err);
          if (isMountedRef.current) {
            setSelectedPoint((prev) => (prev ? { ...prev, isLoading: false } : null));
          }
        }
      }
    },
    [accessToken]
  );

  const selectPointRef = useRef(selectPoint);
  useEffect(() => {
    selectPointRef.current = selectPoint;
  }, [selectPoint]);

  // Initialize Map ONCE on mount
  useEffect(() => {
    isMountedRef.current = true;
    if (!mapContainerRef.current || mapRef.current) return;
    if (!accessToken) return;

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[currentStyle].url,
      center: [105.807, 20.995], // Centered near Thanh Xuan / Hanoi
      zoom: 13,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    mapRef.current = map;

    // Controls
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 150, unit: "metric" }), "bottom-left");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    // Click handler: detects landmarks, POIs, universities, hospitals, etc.
    map.on("click", (e) => {
      // Don't select if user clicked a marker, popup or control
      const target = e.originalEvent.target as HTMLElement;
      if (
        target &&
        (target.closest(".mapboxgl-marker") ||
          target.closest(".mapboxgl-popup") ||
          target.closest(".mapboxgl-ctrl") ||
          target.closest("button"))
      ) {
        return;
      }

      // Detect place label or POI under the click point
      const detected = findFeatureAtPoint(map, e.point);

      if (detected) {
        // If the landmark has a center coordinate (e.g. University icon, hospital icon), snap to it!
        const targetLng = detected.center ? detected.center[0] : e.lngLat.lng;
        const targetLat = detected.center ? detected.center[1] : e.lngLat.lat;

        selectPointRef.current(
          targetLat,
          targetLng,
          detected.name,
          detected.secondaryName,
          detected.category,
          detected.icon
        );
      } else {
        selectPointRef.current(e.lngLat.lat, e.lngLat.lng);
      }
    });

    // Throttled hover handler: Change cursor to pointer over place names and labels
    let hoverThrottle = false;
    map.on("mousemove", (e) => {
      if (hoverThrottle) return;
      hoverThrottle = true;
      setTimeout(() => {
        hoverThrottle = false;
        if (!isMapReady(map) || !map.isStyleLoaded()) return;
        const detected = findFeatureAtPoint(map, e.point);
        map.getCanvas().style.cursor = detected ? "pointer" : "crosshair";
      }, 50);
    });

    // When map finishes loading
    map.on("load", () => {
      if (!isMountedRef.current || !isMapReady(map)) return;

      // Try silent geolocation once map is fully loaded
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMountedRef.current || !isMapReady(mapRef.current)) return;
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          updateUserMarker(coords);
        },
        () => {
          // Silently ignore if blocked
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

    // 3D buildings setup on style load
    map.on("style.load", () => {
      if (!isMountedRef.current || !isMapReady(map)) return;

      const layers = map.getStyle()?.layers;
      if (!layers) return;

      let labelLayerId: string | undefined;
      for (const layer of layers) {
        if (layer.type === "symbol" && (layer.layout as any)?.["text-field"]) {
          labelLayerId = layer.id;
          break;
        }
      }

      if (currentStyle !== "satellite") {
        try {
          if (map.getSource("composite") && !map.getLayer("3d-buildings")) {
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
          }
        } catch {}
      }
    });

    return () => {
      isMountedRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.remove();
        selectedMarkerRef.current = null;
      }
      if (selectedPopupRef.current) {
        selectedPopupRef.current.remove();
        selectedPopupRef.current = null;
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
        destinationMarkerRef.current = null;
      }
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

  // Change map style
  const handleStyleChange = useCallback(
    (style: MapStyle) => {
      const map = mapRef.current;
      if (!isMapReady(map)) return;
      setCurrentStyle(style);
      map.setStyle(MAP_STYLES[style].url);
      setShowStylePicker(false);
    },
    []
  );

  // Manual locate me button
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

  // Select place from search result
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

          // Safely remove existing route
          if (map.getLayer("route-line")) map.removeLayer("route-line");
          if (map.getLayer("route-line-bg")) map.removeLayer("route-line-bg");
          if (map.getSource("route")) map.removeSource("route");

          // Add route line
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

          // Glow outline
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

          // Main line
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

          // Destination marker
          if (destinationMarkerRef.current) {
            destinationMarkerRef.current.remove();
          }
          destinationMarkerRef.current = new mapboxgl.Marker({ color: "#ef4444" })
            .setLngLat([destination.lng, destination.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>🏁 ${destination.name}</strong>`))
            .addTo(map);

          // Fit bounds
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

  // Copy helpers
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
      <div className="absolute top-4 left-4 z-20 w-96 max-w-[calc(100%-6rem)]">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
            placeholder="🔍 Tìm địa điểm, trường học, bệnh viện..."
            className="w-full px-4 py-3 pr-10 bg-background/95 backdrop-blur-xl border border-indigo-500/20 rounded-2xl text-sm text-foreground placeholder:text-muted shadow-xl focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
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
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="mt-2 bg-background/95 backdrop-blur-xl border border-indigo-500/20 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectSearchResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-500/10 transition-colors border-b border-indigo-500/5 last:border-b-0 cursor-pointer"
              >
                <div className="text-sm font-semibold text-foreground truncate">
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

      {/* Style Picker */}
      <div className="absolute top-4 right-14 z-10">
        <button
          onClick={() => setShowStylePicker(!showStylePicker)}
          className="w-10 h-10 bg-background/90 backdrop-blur-xl border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-lg hover:shadow-indigo-500/20 text-lg transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
          title="Đổi kiểu bản đồ"
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

      {/* Locate Me Floating Button */}
      <button
        onClick={handleLocateMe}
        disabled={isLocating}
        className="absolute bottom-6 right-5 z-10 w-11 h-11 bg-background/90 backdrop-blur-xl hover:bg-background border border-indigo-500/20 rounded-full flex items-center justify-center shadow-lg hover:shadow-indigo-500/20 text-xl transition-all hover:scale-105 active:scale-95 text-foreground cursor-pointer focus:outline-none"
        title="Định vị vị trí của tôi"
      >
        {isLocating ? (
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          "🎯"
        )}
      </button>

      {/* Google Maps Style Place Details Panel (Sidebar on Left) */}
      {selectedPoint && !showDirections && (
        <div className="absolute top-20 left-4 z-20 w-96 max-w-[calc(100%-2rem)] bg-background/95 backdrop-blur-xl border border-indigo-500/25 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[calc(100vh-10rem)]">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent px-5 py-4 border-b border-indigo-500/15 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">{selectedPoint.icon || "📍"}</span>
                {selectedPoint.category && (
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {selectedPoint.category}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-foreground leading-snug line-clamp-2">
                {selectedPoint.name}
              </h2>
              {selectedPoint.secondaryName && (
                <p className="text-xs text-muted font-medium mt-0.5 line-clamp-1 italic">
                  {selectedPoint.secondaryName}
                </p>
              )}
            </div>

            <button
              onClick={clearSelectedPoint}
              className="w-8 h-8 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-muted hover:text-foreground text-sm cursor-pointer transition-colors shrink-0 -mt-1 -mr-1"
              title="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Quick Action Button */}
          <div className="p-4 border-b border-indigo-500/10">
            <button
              onClick={() =>
                startDirection({
                  lat: selectedPoint.lat,
                  lng: selectedPoint.lng,
                  name: selectedPoint.name,
                })
              }
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span className="text-base">🧭</span>
              <span>Chỉ đường tới đây</span>
            </button>
          </div>

          {/* Place Info List */}
          <div className="p-4 space-y-3.5 overflow-y-auto">
            {/* Address */}
            <div className="flex items-start gap-3">
              <span className="text-base text-indigo-400 shrink-0 mt-0.5">📍</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-muted mb-0.5">Địa chỉ</div>
                <div className="text-xs text-foreground font-medium leading-relaxed">
                  {selectedPoint.address}
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="text-[11px] text-indigo-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer font-semibold"
                >
                  {copiedAddressToast ? "✅ Đã sao chép địa chỉ" : "📋 Sao chép địa chỉ"}
                </button>
              </div>
            </div>

            {/* Coordinates */}
            <div className="flex items-start gap-3 pt-3 border-t border-indigo-500/10">
              <span className="text-base text-indigo-400 shrink-0 mt-0.5">🌐</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-muted mb-0.5">Tọa độ GPS</div>
                <div className="text-xs font-mono text-foreground font-medium">
                  {selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}
                </div>
                <button
                  onClick={handleCopyCoords}
                  className="text-[11px] text-indigo-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer font-semibold"
                >
                  {copiedCoordsToast ? "✅ Đã chép tọa độ" : "📋 Sao chép tọa độ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direction Guide Panel */}
      {showDirections && (
        <div className="absolute top-20 left-4 z-20 w-96 max-w-[calc(100%-2rem)] bg-background/95 backdrop-blur-xl border border-indigo-500/25 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[calc(100vh-10rem)]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-indigo-500/15 bg-gradient-to-r from-indigo-500/15 via-indigo-500/5 to-transparent">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl">🧭</span>
              <div className="min-w-0">
                <div className="text-[10px] text-muted font-bold uppercase tracking-wider">Đường đi đến</div>
                <div className="font-bold text-sm text-foreground truncate">
                  {destination?.name}
                </div>
              </div>
            </div>
            <button
              onClick={clearRoute}
              className="w-8 h-8 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-muted hover:text-foreground text-sm transition-colors cursor-pointer shrink-0"
              title="Đóng chỉ đường"
            >
              ✕
            </button>
          </div>

          {/* Travel Mode Selector */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-indigo-500/10">
            {(["driving", "walking", "cycling"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTravelMode(mode)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  travelMode === mode
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                    : "hover:bg-indigo-500/10 text-muted hover:text-foreground"
                }`}
              >
                <span>{mode === "driving" ? "🚗" : mode === "walking" ? "🚶" : "🚴"}</span>
                <span>{mode === "driving" ? "Lái xe" : mode === "walking" ? "Đi bộ" : "Xe đạp"}</span>
              </button>
            ))}
          </div>

          {isLoadingRoute ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-xs text-muted font-medium">Đang tìm tuyến đường tối ưu...</span>
            </div>
          ) : directionInfo ? (
            <>
              {/* Summary */}
              <div className="px-5 py-3.5 flex items-center justify-around border-b border-indigo-500/10 bg-indigo-500/5">
                <div className="text-center">
                  <div className="text-xl font-black text-indigo-400">
                    {formatDistance(directionInfo.distance)}
                  </div>
                  <div className="text-[11px] text-muted font-medium">Khoảng cách</div>
                </div>
                <div className="w-px h-8 bg-indigo-500/20" />
                <div className="text-center">
                  <div className="text-xl font-black text-indigo-400">
                    {formatDuration(directionInfo.duration)}
                  </div>
                  <div className="text-[11px] text-muted font-medium">Thời gian ước tính</div>
                </div>
              </div>

              {/* Turn-by-turn steps */}
              <div className="overflow-y-auto px-4 py-2 max-h-72">
                {directionInfo.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2.5 border-t border-indigo-500/5 first:border-t-0"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-medium leading-relaxed">{step.instruction}</p>
                      <p className="text-[10px] text-muted mt-0.5">{formatDistance(step.distance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Global CSS for User Marker & Popup */}
      <style jsx global>{`
        /* User location pulsing dot */
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

        /* Popup styling overrides: HIGH CONTRAST IN LIGHT & DARK MODE */
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

        .popup-title {
          color: #0f172a !important;
        }
        .dark .popup-title {
          color: #f8fafc !important;
        }

        .popup-secondary {
          color: #64748b !important;
        }
        .dark .popup-secondary {
          color: #94a3b8 !important;
        }

        .popup-address {
          color: #334155 !important;
        }
        .dark .popup-address {
          color: #cbd5e1 !important;
        }

        .popup-coords {
          color: #94a3b8 !important;
        }
        .dark .popup-coords {
          color: #64748b !important;
        }

        .mapboxgl-popup-close-button {
          font-size: 16px !important;
          color: #94a3b8 !important;
          padding: 8px 10px !important;
          outline: none !important;
        }
        .mapboxgl-popup-close-button:hover {
          color: #ef4444 !important;
          background: transparent !important;
        }
        .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
          border-top-color: #ffffff !important;
        }
        .dark .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
          border-top-color: #1e293b !important;
        }
      `}</style>
    </div>
  );
}
