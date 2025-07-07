import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import { useApp } from '../context/AppContext';
import { MOOD_OPTIONS, DEFAULT_LOCATION } from '../constants/moods';
import type { MoodEntry } from '../types';

// Custom marker component
const createMoodMarker = (mood: MoodEntry): DivIcon => {
  const moodOption = MOOD_OPTIONS.find(option => option.name === mood.name);
  const color = moodOption?.color || '#6b7280';
  
  return new DivIcon({
    html: `
      <div class="mood-marker" style="
        background-color: ${color};
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        opacity: ${0.6 + (mood.intensity * 0.1)};
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

  return (
    <div className={`relative h-full w-full ${className}`}>
      {locationError && (
        <div className="absolute top-4 left-4 right-4 z-10 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">{locationError}</p>
        </div>
      )}
      
      <MapContainer
        center={userLocation}
        zoom={13}
        className="h-full w-full"
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
              <Popup className="mood-popup">
                <div className="p-2 min-w-48">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{mood.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{mood.name}</h3>
                      <p className="text-sm text-gray-500">
                        Intensity: {mood.intensity}/5
                      </p>
                    </div>
                  </div>
                  
                  {mood.notes && (
                    <p className="text-sm text-gray-700 mb-2">{mood.notes}</p>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{formatTimeAgo(mood.timestamp)}</span>
                    {mood.location.address && (
                      <span className="truncate ml-2">{mood.location.address}</span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
      
      {/* Map overlay with app info */}
      <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 pointer-events-auto">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            MoodFlow
          </h1>
          <p className="text-sm text-gray-600">
            Discover real-time emotions around you and track your mood patterns
          </p>
          
          {state.moods.length > 0 && (
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
              <span>{state.moods.length} mood{state.moods.length !== 1 ? 's' : ''} logged</span>
              <span>•</span>
              <span>Tap markers to explore</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};