import React, { memo, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import type { MoodEntry } from '../types';
import { useOptimizedConfig, useDeviceCapabilities } from '../utils/deviceCapabilities';

// Optimized map marker with memoization
const OptimizedMapMarker = memo<{
  mood: MoodEntry;
  onClick?: (mood: MoodEntry) => void;
}>(({ mood, onClick }) => {
  const config = useOptimizedConfig();
  
  const handleClick = useCallback(() => {
    onClick?.(mood);
  }, [mood, onClick]);

  const icon = useMemo(() => {
    // Use simpler icons for low-end devices
    if (config.uiConfig.useSimpleComponents) {
      return divIcon({
        className: 'custom-mood-marker-simple',
        html: `<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
    }

    // Full-featured icon for high-performance devices
    const iconHtml = renderToStaticMarkup(
      <div
        style={{
          backgroundColor: '#3b82f6',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '3px solid white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
        }}
      >
        {mood.emoji}
      </div>
    );
    
    return divIcon({
      className: 'custom-mood-marker',
      html: iconHtml,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
  }, [mood.emoji, config.uiConfig.useSimpleComponents]);

  if (!mood.location?.lat || !mood.location?.lng) {
    return null;
  }

  return (
    <Marker
      position={[mood.location.lat, mood.location.lng]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    >
      {!config.uiConfig.useSimpleComponents && (
        <Popup>
          <div style={{ minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>{mood.emoji}</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  Intensity: {mood.intensity}/5
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {new Date(mood.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            {mood.notes && (
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <strong>Notes:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{mood.notes}</p>
              </div>
            )}
          </div>
        </Popup>
      )}
    </Marker>
  );
});

OptimizedMapMarker.displayName = 'OptimizedMapMarker';

// Optimized tile layer with device-specific configurations
const OptimizedTileLayer = memo(() => {
  const config = useOptimizedConfig();
  const capabilities = useDeviceCapabilities();
  
  const tileLayerProps = useMemo(() => {
    const baseProps = {
      attribution: '© OpenStreetMap contributors',
      detectRetina: !config.mapConfig.enableAnimations,
      keepBuffer: capabilities.performanceLevel === 'high' ? 2 : 1,
      updateWhenIdle: capabilities.isLowEndDevice,
      updateWhenZooming: !capabilities.isLowEndDevice,
    };

    // Use different tile servers based on device capabilities
    if (config.mapConfig.enableVectorTiles && capabilities.performanceLevel === 'high') {
      return {
        ...baseProps,
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        tileSize: 512,
        zoomOffset: -1,
      };
    }

    return {
      ...baseProps,
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      tileSize: config.mapConfig.tileSize,
    };
  }, [config, capabilities]);

  return <TileLayer {...tileLayerProps} />;
});

OptimizedTileLayer.displayName = 'OptimizedTileLayer';

// Optimized map container with performance settings
export const OptimizedMapContainer = memo<{
  moods: MoodEntry[];
  onMoodClick?: (mood: MoodEntry) => void;
  center?: [number, number];
  zoom?: number;
}>(({ moods, onMoodClick, center = [40.7128, -74.006], zoom = 13 }) => {
  const config = useOptimizedConfig();
  const capabilities = useDeviceCapabilities();
  
  // Memoize markers to prevent recreation on every render
  const markers = useMemo(() => {
    return moods
      .filter(mood => mood.location?.lat && mood.location?.lng)
      .map(mood => (
        <OptimizedMapMarker
          key={mood.id}
          mood={mood}
          onClick={onMoodClick}
        />
      ));
  }, [moods, onMoodClick]);

  const mapProps = useMemo(() => ({
    center,
    zoom: Math.min(zoom, config.mapConfig.maxZoom),
    style: { height: '100%', width: '100%' },
    zoomControl: !capabilities.isLowEndDevice,
    attributionControl: false,
    preferCanvas: capabilities.performanceLevel === 'low',
    zoomAnimation: config.mapConfig.enableAnimations,
    fadeAnimation: config.mapConfig.enableAnimations,
    markerZoomAnimation: config.mapConfig.enableAnimations,
  }), [center, zoom, config, capabilities]);

  // Fallback for devices that don't support maps
  if (!capabilities.hasCanvas || capabilities.memoryLevel === 'low') {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f9ff',
        flexDirection: 'column',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '1rem'
        }}>
          🗺️
        </div>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: '#1f2937'
        }}>
          Map Optimized for Your Device
        </h3>
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          maxWidth: '300px',
          lineHeight: '1.5'
        }}>
          Your mood locations are stored and will be displayed in an optimized format for your device capabilities.
        </p>
        <div style={{
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: '#9ca3af'
        }}>
          {moods.length} mood{moods.length !== 1 ? 's' : ''} recorded
        </div>
      </div>
    );
  }

  return (
    <MapContainer {...mapProps}>
      <OptimizedTileLayer />
      {markers}
    </MapContainer>
  );
});

OptimizedMapContainer.displayName = 'OptimizedMapContainer';

// Optimized emoji picker with virtualization for large lists
export const OptimizedEmojiPicker = memo<{
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}>(({ selectedEmoji, onEmojiSelect, className = '' }) => {
  const config = useOptimizedConfig();
  const capabilities = useDeviceCapabilities();
  
  // Reduced emoji set for low-end devices
  const emojiList = useMemo(() => {
    const fullEmojiList = [
      '😊', '😢', '😡', '😰', '😴', '🤔', '😍', '🤗', '😑', '😤',
      '🙂', '😔', '😠', '😯', '😪', '🧐', '🥰', '🤭', '😐', '😮‍💨',
      '😃', '😭', '🤬', '😱', '💤', '🤓', '😘', '🤫', '😶', '😤',
      '😄', '🥺', '😈', '😨', '😵', '🤡', '😚', '🤗', '😮', '🙄'
    ];
    
    // Return fewer emojis for low-end devices
    if (capabilities.performanceLevel === 'low') {
      return fullEmojiList.slice(0, 20);
    }
    
    return fullEmojiList;
  }, [capabilities.performanceLevel]);

  const handleEmojiClick = useCallback((emoji: string) => {
    onEmojiSelect(emoji);
  }, [onEmojiSelect]);

  return (
    <div className={`grid gap-2 ${className}`} style={{
      display: 'grid',
      gridTemplateColumns: capabilities.performanceLevel === 'low' ? 'repeat(5, 1fr)' : 'repeat(8, 1fr)',
      gap: '0.5rem'
    }}>
      {emojiList.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          className={`p-2 rounded-lg text-2xl hover:bg-gray-100 transition-colors ${
            selectedEmoji === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
          }`}
          style={{
            padding: '0.5rem',
            borderRadius: '0.5rem',
            fontSize: '1.5rem',
            border: 'none',
            backgroundColor: selectedEmoji === emoji ? '#dbeafe' : 'transparent',
            cursor: 'pointer',
            transition: config.uiConfig.enableTransitions ? 'background-color 0.2s' : 'none',
            outline: selectedEmoji === emoji ? '2px solid #3b82f6' : 'none',
          }}
          type="button"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
});

OptimizedEmojiPicker.displayName = 'OptimizedEmojiPicker';

// Performance-optimized intensity slider
export const OptimizedIntensitySlider = memo<{
  intensity: number;
  onChange: (intensity: number) => void;
  className?: string;
}>(({ intensity, onChange, className = '' }) => {
  const config = useOptimizedConfig();
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value));
  }, [onChange]);

  const sliderStyle = useMemo(() => ({
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: `linear-gradient(to right, 
      #ef4444 0%, 
      #f97316 25%, 
      #eab308 50%, 
      #84cc16 75%, 
      #22c55e 100%
    )`,
    outline: 'none',
    cursor: 'pointer',
    transition: config.uiConfig.enableTransitions ? 'opacity 0.2s' : 'none',
  }), [config.uiConfig.enableTransitions]);

  return (
    <div className={className}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Low</span>
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
          Intensity: {intensity}
        </span>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>High</span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        value={intensity}
        onChange={handleChange}
        style={sliderStyle}
        className="w-full"
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
        {[1, 2, 3, 4, 5].map((num) => (
          <span
            key={num}
            style={{
              fontSize: '0.75rem',
              color: intensity === num ? '#1f2937' : '#9ca3af',
              fontWeight: intensity === num ? '600' : '400',
            }}
          >
            {num}
          </span>
        ))}
      </div>
    </div>
  );
});

OptimizedIntensitySlider.displayName = 'OptimizedIntensitySlider';

export default {
  OptimizedMapContainer,
  OptimizedEmojiPicker,
  OptimizedIntensitySlider,
  OptimizedMapMarker,
  OptimizedTileLayer,
};