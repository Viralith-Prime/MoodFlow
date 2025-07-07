export interface Mood {
  id: string;
  emoji: string;
  name: string;
  intensity: number; // 1-5 scale
  notes?: string;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  userId?: string;
}

export interface MoodEntry extends Mood {
  isPublic: boolean;
}

export interface UserSettings {
  notifications: {
    enabled: boolean;
    dailyReminder: boolean;
    reminderTime: string;
    weeklyReport: boolean;
  };
  privacy: {
    shareLocation: boolean;
    makePublic: boolean;
    allowAnalytics: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    defaultIntensity: number;
    autoLocation: boolean;
  };
  account: {
    username?: string;
    email?: string;
  };
}

export interface MoodStats {
  totalEntries: number;
  averageIntensity: number;
  mostCommonMood: string;
  longestStreak: number;
  currentStreak: number;
  moodFrequency: Record<string, number>;
  weeklyTrend: Array<{
    date: string;
    averageIntensity: number;
    moodCount: number;
  }>;
  monthlyPatterns: Record<string, number>;
}

export interface Filter {
  dateRange: {
    start?: Date;
    end?: Date;
  };
  moods: string[];
  intensityRange: {
    min: number;
    max: number;
  };
  location?: {
    lat: number;
    lng: number;
    radius: number; // in km
  };
}

export type NavigationTab = 'home' | 'log' | 'analytics' | 'settings' | 'community';

export interface AppState {
  moods: MoodEntry[];
  userSettings: UserSettings;
  currentTab: NavigationTab;
  isLoading: boolean;
  error?: string;
}