export interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type: string[];
}

export interface DirectionInfo {
  distance: number; // meters
  duration: number; // seconds
  steps: { instruction: string; distance: number }[];
}

export interface SelectedPoint {
  lat: number;
  lng: number;
  name: string;
  secondaryName?: string;
  address: string;
  category?: string;
  icon?: string;
  isLoading?: boolean;
}

export type MapStyle = "streets" | "satellite" | "dark" | "outdoors";

export const MAP_STYLES: Record<MapStyle, { url: string; label: string; icon: string }> = {
  streets: { url: "mapbox://styles/mapbox/streets-v12", label: "Đường phố", icon: "🗺️" },
  satellite: { url: "mapbox://styles/mapbox/satellite-streets-v12", label: "Vệ tinh", icon: "🛰️" },
  dark: { url: "mapbox://styles/mapbox/dark-v11", label: "Tối", icon: "🌙" },
  outdoors: { url: "mapbox://styles/mapbox/outdoors-v12", label: "Địa hình", icon: "⛰️" },
};

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours} giờ ${remainingMins} phút`;
}

export function formatCategory(rawCategory?: string, layerId?: string) {
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
    return { label: "Khu vực / Quận huyện", icon: "🏘️" };
  }
  return { label: "Địa điểm thú vị", icon: "📍" };
}
