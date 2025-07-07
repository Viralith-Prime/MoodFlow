import { v4 as uuidv4 } from 'uuid';
import type { MoodEntry } from '../types';
import { MOOD_OPTIONS, DEFAULT_LOCATION } from '../constants/moods';

// Generate random location around a center point
const generateRandomLocation = (centerLat: number, centerLng: number, radiusKm: number = 5) => {
  const radiusInDegrees = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
  
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;
  
  const lat = centerLat + distance * Math.cos(angle);
  const lng = centerLng + distance * Math.sin(angle);
  
  return { lat, lng };
};

// Generate sample addresses
const sampleAddresses = [
  'Central Park, NYC',
  'Times Square, NYC',
  'Brooklyn Bridge, NYC',
  'Washington Square Park',
  'Union Square',
  'High Line Park',
  'Bryant Park',
  'Madison Square Garden',
  'Chelsea Market',
  'Flatiron Building',
];

export const generateSampleMoods = (count: number = 15): MoodEntry[] => {
  const sampleMoods: MoodEntry[] = [];
  
  for (let i = 0; i < count; i++) {
    const moodOption = MOOD_OPTIONS[Math.floor(Math.random() * MOOD_OPTIONS.length)];
    const location = generateRandomLocation(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
    const address = sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)];
    
    // Generate timestamp within the last 7 days
    const now = new Date();
    const randomHours = Math.random() * 24 * 7; // Last 7 days
    const timestamp = new Date(now.getTime() - randomHours * 60 * 60 * 1000);
    
    const intensity = Math.floor(Math.random() * 5) + 1;
    
    const sampleNotes = [
      'Feeling great today!',
      'Work was stressful but manageable',
      'Beautiful weather lifted my spirits',
      'Had a wonderful coffee with friends',
      'Traffic was terrible this morning',
      'Excited about the weekend plans',
      'Meditation session was very calming',
      'Difficult conversation with family',
      'Accomplished a lot at work today',
      undefined, // Some moods have no notes
      undefined,
      undefined,
    ];
    
    const mood: MoodEntry = {
      id: uuidv4(),
      emoji: moodOption.emoji,
      name: moodOption.name,
      intensity,
      notes: sampleNotes[Math.floor(Math.random() * sampleNotes.length)],
      timestamp,
      location: {
        lat: location.lat,
        lng: location.lng,
        address,
      },
      isPublic: Math.random() > 0.3, // 70% public, 30% private
    };
    
    sampleMoods.push(mood);
  }
  
  // Sort by timestamp (newest first)
  return sampleMoods.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Add sample data if none exists
export const initializeSampleData = () => {
  const existingMoods = localStorage.getItem('moodflow-moods');
  if (!existingMoods || JSON.parse(existingMoods).length === 0) {
    const sampleMoods = generateSampleMoods();
    localStorage.setItem('moodflow-moods', JSON.stringify(sampleMoods));
    console.log('Initialized app with sample mood data');
  }
};