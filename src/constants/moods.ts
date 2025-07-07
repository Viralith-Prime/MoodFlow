export const MOOD_OPTIONS = [
  { emoji: '😊', name: 'Happy', color: '#fbbf24' },
  { emoji: '🤗', name: 'Excited', color: '#f59e0b' },
  { emoji: '😌', name: 'Content', color: '#84cc16' },
  { emoji: '😴', name: 'Calm', color: '#06b6d4' },
  { emoji: '😢', name: 'Sad', color: '#6366f1' },
  { emoji: '😠', name: 'Angry', color: '#ef4444' },
  { emoji: '😰', name: 'Anxious', color: '#a855f7' },
  { emoji: '🧘', name: 'Peaceful', color: '#10b981' },
  { emoji: '😕', name: 'Confused', color: '#6b7280' },
  { emoji: '🥳', name: 'Euphoric', color: '#f97316' },
  { emoji: '😑', name: 'Neutral', color: '#9ca3af' },
  { emoji: '😭', name: 'Overwhelmed', color: '#8b5cf6' },
] as const;

export const INTENSITY_LABELS = {
  1: 'Very Low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Very High',
} as const;

export const INTENSITY_COLORS = {
  1: '#e5e7eb',
  2: '#d1d5db',
  3: '#9ca3af',
  4: '#6b7280',
  5: '#374151',
} as const;

export const DEFAULT_LOCATION = {
  lat: 40.7128,
  lng: -74.0060, // New York City as default
};