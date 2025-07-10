import type { MoodEntry, UserSettings } from '../types';
import { authService } from './authService';

// Generate a simple user ID for anonymous users (stored in localStorage)
function getUserId(): string {
  // If authenticated, use the authenticated user's ID
  if (authService.isAuthenticated()) {
    const user = authService.getUser();
    return user?.id || 'anonymous';
  }
  
  // Otherwise, use anonymous ID
  let userId = localStorage.getItem('moodflow-user-id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('moodflow-user-id', userId);
  }
  return userId;
}

// Check if we're in development or production
const API_BASE = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private userId: string;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.userId = getUserId();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Listen for auth changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'moodflow-auth-token' || e.key === 'moodflow-auth-user') {
        this.userId = getUserId();
      }
    });
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authentication header if available
    const token = authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private getStorageKey(type: 'moods' | 'settings'): string {
    // Use authenticated storage keys for logged-in users
    if (authService.isAuthenticated()) {
      const user = authService.getUser();
      return `moodflow-${type}-${user?.id}`;
    }
    // Use anonymous storage keys
    return `moodflow-${type}`;
  }

  // Mood API methods
  async getMoods(): Promise<ApiResponse<MoodEntry[]>> {
    try {
      const storageKey = this.getStorageKey('moods');
      
      if (!this.isOnline) {
        // Fallback to localStorage when offline
        const localMoods = localStorage.getItem(storageKey);
        const moods = localMoods ? JSON.parse(localMoods).map((mood: any) => ({
          ...mood,
          timestamp: new Date(mood.timestamp)
        })) : [];
        return { success: true, data: moods };
      }

      const url = `${API_BASE}/moods`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch moods');
      
      const result = await response.json();
      
      // Update localStorage with server data
      const moods = result.moods.map((mood: any) => ({
        ...mood,
        timestamp: new Date(mood.timestamp)
      }));
      localStorage.setItem(storageKey, JSON.stringify(moods));
      
      return { success: true, data: moods };
    } catch (error) {
      console.error('Error fetching moods:', error);
      
      // Fallback to localStorage on error
      const storageKey = this.getStorageKey('moods');
      const localMoods = localStorage.getItem(storageKey);
      const moods = localMoods ? JSON.parse(localMoods).map((mood: any) => ({
        ...mood,
        timestamp: new Date(mood.timestamp)
      })) : [];
      
      return { success: false, data: moods, error: 'Using offline data' };
    }
  }

  async createMood(moodData: Omit<MoodEntry, 'id' | 'timestamp'>): Promise<ApiResponse<MoodEntry>> {
    try {
      const storageKey = this.getStorageKey('moods');
      
      // Always add to localStorage first (offline-first)
      const newMood: MoodEntry = {
        id: crypto.randomUUID(),
        ...moodData,
        timestamp: new Date()
      };

      const localMoods = localStorage.getItem(storageKey);
      const moods = localMoods ? JSON.parse(localMoods) : [];
      moods.unshift(newMood);
      localStorage.setItem(storageKey, JSON.stringify(moods));

      // Try to sync to server if online
      if (this.isOnline) {
        try {
          const url = `${API_BASE}/moods`;

          const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(moodData)
          });

          if (response.ok) {
            const result = await response.json();
            // Update localStorage with server-generated ID if different
            if (result.mood.id !== newMood.id) {
              const updatedMoods = moods.map((mood: MoodEntry) => 
                mood.id === newMood.id ? result.mood : mood
              );
              localStorage.setItem(storageKey, JSON.stringify(updatedMoods));
              return { success: true, data: result.mood };
            }
          }
        } catch (syncError) {
          console.warn('Failed to sync mood to server:', syncError);
          // Mark for later sync
          this.markForSync('mood', newMood);
        }
      } else {
        // Mark for later sync when online
        this.markForSync('mood', newMood);
      }

      return { success: true, data: newMood };
    } catch (error) {
      console.error('Error creating mood:', error);
      return { success: false, error: 'Failed to create mood' };
    }
  }

  // Settings API methods
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const storageKey = this.getStorageKey('settings');
      
      if (!this.isOnline) {
        // Fallback to localStorage when offline
        const localSettings = localStorage.getItem(storageKey);
        const settings = localSettings ? JSON.parse(localSettings) : {};
        return { success: true, data: settings };
      }

      const url = authService.isAuthenticated() 
        ? `${API_BASE}/settings`
        : `${API_BASE}/settings?userId=${this.userId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const result = await response.json();
      
      // Update localStorage with server data
      localStorage.setItem(storageKey, JSON.stringify(result.settings));
      
      return { success: true, data: result.settings };
    } catch (error) {
      console.error('Error fetching settings:', error);
      
      // Fallback to localStorage on error
      const storageKey = this.getStorageKey('settings');
      const localSettings = localStorage.getItem(storageKey);
      const settings = localSettings ? JSON.parse(localSettings) : {};
      
      return { success: false, data: settings, error: 'Using offline data' };
    }
  }

  async updateSettings(settingsData: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    try {
      const storageKey = this.getStorageKey('settings');
      
      // Always update localStorage first (offline-first)
      const existingSettings = localStorage.getItem(storageKey);
      const currentSettings = existingSettings ? JSON.parse(existingSettings) : {};
      const updatedSettings = { ...currentSettings, ...settingsData };
      localStorage.setItem(storageKey, JSON.stringify(updatedSettings));

      // Try to sync to server if online
      if (this.isOnline) {
        try {
          const url = authService.isAuthenticated() 
            ? `${API_BASE}/settings`
            : `${API_BASE}/settings?userId=${this.userId}`;

          const response = await fetch(url, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(settingsData)
          });

          if (response.ok) {
            const result = await response.json();
            localStorage.setItem(storageKey, JSON.stringify(result.settings));
            return { success: true, data: result.settings };
          }
        } catch (syncError) {
          console.warn('Failed to sync settings to server:', syncError);
          this.markForSync('settings', updatedSettings);
        }
      } else {
        this.markForSync('settings', updatedSettings);
      }

      return { success: true, data: updatedSettings };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  }

  // Sync management
  private markForSync(type: 'mood' | 'settings', data: any) {
    const syncQueue = JSON.parse(localStorage.getItem('moodflow-sync-queue') || '[]');
    syncQueue.push({ type, data, timestamp: Date.now() });
    localStorage.setItem('moodflow-sync-queue', JSON.stringify(syncQueue));
  }

  async syncData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const syncQueue = JSON.parse(localStorage.getItem('moodflow-sync-queue') || '[]');
      
      for (const item of syncQueue) {
        try {
          if (item.type === 'mood') {
            await this.createMood(item.data);
          } else if (item.type === 'settings') {
            await this.updateSettings(item.data);
          }
        } catch (error) {
          console.warn('Failed to sync item:', error);
          break; // Stop syncing on first failure
        }
      }

      // Clear sync queue on successful sync
      localStorage.removeItem('moodflow-sync-queue');
      console.log('✅ Data synced successfully');
    } catch (error) {
      console.error('Error during sync:', error);
    }
  }

  // Check sync status
  getPendingSyncCount(): number {
    const syncQueue = JSON.parse(localStorage.getItem('moodflow-sync-queue') || '[]');
    return syncQueue.length;
  }

  isOffline(): boolean {
    return !this.isOnline;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;