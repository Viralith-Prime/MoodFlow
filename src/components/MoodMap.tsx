import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import { useApp } from '../context/useApp';
import { MOOD_OPTIONS, DEFAULT_LOCATION } from '../constants/moods';
import type { MoodEntry } from '../types';

// Custom marker component
const createMoodMarker = (mood: MoodEntry): DivIcon => {
  const moodOption = MOOD_OPTIONS.find(option => option.name === mood.name);
  const color = moodOption?.color || '#6b7280';
  
  return new DivIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        opacity: ${0.6 + (mood.intensity * 0.1)};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transform: scale(1);
        transition: transform 0.2s ease;
      ">
        ${mood.emoji}
      </div>
    `,
    className: 'custom-mood-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Component to handle map interactions
const MapController: React.FC<{ center: LatLngExpression }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

interface MoodMapProps {
  className?: string;
}

export const MoodMap: React.FC<MoodMapProps> = ({ className = '' }) => {
  const { state } = useApp();
  const [userLocation, setUserLocation] = useState<LatLngExpression>(DEFAULT_LOCATION);
  const [locationError, setLocationError] = useState<string>('');

  // Get user's location
  useEffect(() => {
    if (state.userSettings.preferences.autoLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationError('');
        },
        (error) => {
          console.warn('Location access denied:', error);
          setLocationError('Location access denied. Using default location.');
          setUserLocation(DEFAULT_LOCATION);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    }
  }, [state.userSettings.preferences.autoLocation]);

  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const headerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    right: '1rem',
    zIndex: 1000,
    pointerEvents: 'none'
  };

  const headerCardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    pointerEvents: 'auto'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 0.25rem 0'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: '0 0 0.75rem 0'
  };

  const statsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '0.75rem',
    color: '#6b7280'
  };

  const errorStyle: React.CSSProperties = {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    right: '1rem',
    zIndex: 1000,
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '0.5rem',
    padding: '0.75rem'
  };

  return (
    <div 
      className={`relative h-full w-full ${className}`}
      style={{ position: 'relative', height: '100%', width: '100%' }}
    >
      {locationError && (
        <div style={errorStyle}>
          <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 0 }}>
            {locationError}
          </p>
        </div>
      )}
      
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapController center={userLocation} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render mood markers */}
        {state.moods
          .filter(mood => mood.isPublic || !state.userSettings.privacy.makePublic)
          .map((mood) => (
            <Marker
              key={mood.id}
              position={[mood.location.lat, mood.location.lng]}
              icon={createMoodMarker(mood)}
            >
              <Popup>
                <div style={{ padding: '0.5rem', minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2rem' }}>{mood.emoji}</span>
                    <div>
                      <h3 style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{mood.name}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        Intensity: {mood.intensity}/5
                      </p>
                    </div>
                  </div>
                  
                  {mood.notes && (
                    <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      {mood.notes}
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
                    <span>{formatTimeAgo(mood.timestamp)}</span>
                    {mood.location.address && (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                        {mood.location.address}
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
      
      {/* Map overlay with app info */}
      <div style={headerStyle}>
        <div style={headerCardStyle}>
          <h1 style={titleStyle}>
            🌊 MoodFlow
          </h1>
          <p style={subtitleStyle}>
            Discover real-time emotions around you and track your mood patterns
          </p>
          
          {state.moods.length > 0 && (
            <div style={statsStyle}>
              <span>{state.moods.length} mood{state.moods.length !== 1 ? 's' : ''} logged</span>
              <span>•</span>
              <span>Tap markers to explore</span>
            </div>
          )}
          
          {state.moods.length === 0 && (
            <div style={statsStyle}>
              <span>🎯 Welcome! Tap "Log Mood" to add your first mood</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};