import React, { useState, useEffect } from 'react';
import { MapIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import { MOOD_OPTIONS, INTENSITY_LABELS, DEFAULT_LOCATION } from '../../constants/moods';
import type { MoodEntry } from '../../types';

interface LocationState {
  lat: number;
  lng: number;
  address?: string;
  isAutoDetected: boolean;
}

export const MoodLogging: React.FC = () => {
  const { addMood, setCurrentTab, state } = useApp();
  
  // Form state
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedMoodName, setSelectedMoodName] = useState<string>('');
  const [intensity, setIntensity] = useState<number>(state.userSettings.preferences.defaultIntensity);
  const [notes, setNotes] = useState<string>('');
  const [location, setLocation] = useState<LocationState>({
    lat: DEFAULT_LOCATION.lat,
    lng: DEFAULT_LOCATION.lng,
    isAutoDetected: false
  });
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Get user location on mount
  useEffect(() => {
    if (state.userSettings.preferences.autoLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            isAutoDetected: true
          });
          setLocationError('');
        },
        (error) => {
          console.warn('Location access denied:', error);
          setLocationError('Location access denied. Using default location.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    }
  }, [state.userSettings.preferences.autoLocation]);

  const handleMoodSelect = (emoji: string, name: string) => {
    setSelectedMood(emoji);
    setSelectedMoodName(name);
  };

  const handleIntensityChange = (value: number) => {
    setIntensity(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood || !selectedMoodName) return;

    setIsSubmitting(true);
    
    try {
      const newMood: Omit<MoodEntry, 'id' | 'timestamp'> = {
        emoji: selectedMood,
        name: selectedMoodName,
        intensity,
        notes: notes.trim() || undefined,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: location.address
        },
        isPublic: state.userSettings.privacy.makePublic
      };

      addMood(newMood);
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form
      setSelectedMood('');
      setSelectedMoodName('');
      setIntensity(state.userSettings.preferences.defaultIntensity);
      setNotes('');
      
      // Navigate to map after short delay
      setTimeout(() => {
        setShowSuccess(false);
        setCurrentTab('home');
      }, 1500);
      
    } catch (error) {
      console.error('Error adding mood:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const intensityColors = ['#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#374151'];
  const intensityColor = intensityColors[intensity - 1];

  const promptSuggestions = [
    "What made you feel this way?",
    "Where are you right now?",
    "What's on your mind?",
    "Describe your current situation",
    "What happened today?"
  ];

  const containerStyle: React.CSSProperties = {
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem',
    overflow: 'auto'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    margin: '0 auto',
    position: 'relative'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '0.5rem',
    textAlign: 'center'
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    marginBottom: '2rem',
    textAlign: 'center',
    fontSize: '0.875rem'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '1.5rem'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.5rem'
  };

  const emojiGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.5rem',
    marginBottom: '1rem'
  };

  const emojiButtonStyle: React.CSSProperties = {
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: '2px solid #e5e7eb',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem'
  };

  const selectedEmojiButtonStyle: React.CSSProperties = {
    ...emojiButtonStyle,
    borderColor: '#2563eb',
    backgroundColor: '#f0f9ff',
    transform: 'scale(1.05)'
  };

  const sliderContainerStyle: React.CSSProperties = {
    position: 'relative',
    marginBottom: '1rem'
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: `linear-gradient(to right, ${intensityColors.join(', ')})`,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none'
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100px',
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1.5rem',
    backgroundColor: selectedMood ? '#2563eb' : '#9ca3af',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: selectedMood ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  };

  const successStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 197, 94, 0.95)',
    borderRadius: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    zIndex: 10
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {showSuccess && (
          <div style={successStyle}>
            <CheckIcon style={{ width: '4rem', height: '4rem', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Mood Logged! 🎉
            </h2>
            <p>Redirecting to map...</p>
          </div>
        )}

        <h1 style={titleStyle}>Log Your Mood</h1>
        <p style={subtitleStyle}>
          How are you feeling right now? Your mood will appear on the map.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Mood Selection */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Choose your mood</label>
            <div style={emojiGridStyle}>
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.name}
                  type="button"
                  onClick={() => handleMoodSelect(mood.emoji, mood.name)}
                  style={selectedMood === mood.emoji ? selectedEmojiButtonStyle : emojiButtonStyle}
                >
                  <span style={{ fontSize: '1.5rem' }}>{mood.emoji}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, textAlign: 'center' }}>
                    {mood.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity Slider */}
          <div style={sectionStyle}>
            <label style={labelStyle}>
              Intensity: {INTENSITY_LABELS[intensity as keyof typeof INTENSITY_LABELS]} ({intensity}/5)
            </label>
            <div style={sliderContainerStyle}>
              <input
                type="range"
                min="1"
                max="5"
                value={intensity}
                onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
                style={sliderStyle}
              />
              <div 
                style={{
                  position: 'absolute',
                  top: '-2rem',
                  left: `${((intensity - 1) / 4) * 100}%`,
                  transform: 'translateX(-50%)',
                  backgroundColor: intensityColor,
                  color: intensity >= 3 ? 'white' : '#111827',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {intensity}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={promptSuggestions[Math.floor(Math.random() * promptSuggestions.length)]}
              style={textareaStyle}
              maxLength={280}
            />
            <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'right', marginTop: '0.25rem' }}>
              {notes.length}/280
            </div>
          </div>

          {/* Location Info */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Location</label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <MapIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
              <span style={{ color: '#374151' }}>
                {location.isAutoDetected ? '📍 Current location' : '🗺️ Default location'}
              </span>
              {location.address && (
                <span style={{ color: '#6b7280' }}>• {location.address}</span>
              )}
            </div>
            {locationError && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                {locationError}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedMood || isSubmitting}
            style={buttonStyle}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin" style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%'
                }}></div>
                Adding Mood...
              </>
            ) : (
              <>
                <CheckIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                Log My Mood
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};