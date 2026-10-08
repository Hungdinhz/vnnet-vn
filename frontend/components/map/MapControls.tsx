'use client';

import React from 'react';
import { MapStyle, MAP_STYLES } from './types';

interface MapControlsProps {
  currentStyle: MapStyle;
  showStylePicker: boolean;
  setShowStylePicker: (show: boolean) => void;
  onStyleChange: (style: MapStyle) => void;
  onLocateMe: () => void;
  isLocating: boolean;
}

export default function MapControls({
  currentStyle,
  showStylePicker,
  setShowStylePicker,
  onStyleChange,
  onLocateMe,
  isLocating,
}: MapControlsProps) {
  return (
    <>
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
                onClick={() => onStyleChange(key)}
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
        onClick={onLocateMe}
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
    </>
  );
}
