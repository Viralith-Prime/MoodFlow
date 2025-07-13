import type { MoodEntry, UserSettings } from '../types';
import { authService } from './authService';

// Check if we're in development or production
const API_BASE = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const defaultSettings: UserSettings = {
  notifications: {
    enabled: true,
    dailyReminder: true,
    reminderTime: '20:00',
    weeklyReport: true,
  },
  privacy: {
    shareLocation: true,
    makePublic: false,
    allowAnalytics: true,
  },
  preferences: {
    theme: 'auto',
    defaultIntensity: 3,
    autoLocation: true,
  },
  account: {},
};

class ApiService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private getStorageKey(type: 'moods' | 'settings'): string {
    if (authService.isAuthenticated()) {
      const user = authService.getUser();
      return `moodflow-${type}-${user?.id}`;
    }
    return `moodflow-${type}`;
  }

  // Mood API methods
  async getMoods(): Promise<ApiResponse<MoodEntry[]>> {
    try {
      const storageKey = this.getStorageKey('moods');
      const localMoods = localStorage.getItem(storageKey);
      const moods = localMoods ? JSON.parse(localMoods).map((mood: Record<string, unknown>) => ({
        ...mood,
        timestamp: new Date(mood.timestamp as string)
      })) : [];
      return { success: true, data: moods };
    } catch (error) {
      return { success: false, data: [], error: 'Failed to load moods' };
    }
  }

  async createMood(moodData: Omit<MoodEntry, 'id' | 'timestamp'>): Promise<ApiResponse<MoodEntry>> {
    try {
      const storageKey = this.getStorageKey('moods');
      
      const newMood: MoodEntry = {
        id: crypto.randomUUID(),
        ...moodData,
        timestamp: new Date()
      };

      const localMoods = localStorage.getItem(storageKey);
      const moods = localMoods ? JSON.parse(localMoods) as MoodEntry[] : [];
      moods.unshift(newMood);
      localStorage.setItem(storageKey, JSON.stringify(moods));

      return { success: true, data: newMood };
    } catch (error) {
      return { success: false, error: 'Failed to create mood' };
    }
  }

  // Settings API methods
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const storageKey = this.getStorageKey('settings');
      const localSettings = localStorage.getItem(storageKey);
      const settings = localSettings ? { ...defaultSettings, ...JSON.parse(localSettings) } : defaultSettings;
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, data: defaultSettings, error: 'Failed to load settings' };
    }
  }

  async updateSettings(settingsData: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    try {
      const storageKey = this.getStorageKey('settings');
      
      const existingSettings = localStorage.getItem(storageKey);
      const currentSettings = existingSettings ? { ...defaultSettings, ...JSON.parse(existingSettings) } : defaultSettings;
      const updatedSettings = { ...currentSettings, ...settingsData };
      localStorage.setItem(storageKey, JSON.stringify(updatedSettings));

      return { success: true, data: updatedSettings };
    } catch (error) {
      return { success: false, error: 'Failed to update settings' };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;