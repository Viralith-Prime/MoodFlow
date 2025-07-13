import { createContext } from 'react';
import type { AppState, MoodEntry, UserSettings, NavigationTab, AuthState, User } from '../types';

export interface AppContextType {
  state: AppState;
  addMood: (mood: Omit<MoodEntry, 'id' | 'timestamp'>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setCurrentTab: (tab: NavigationTab) => void;
  clearError: () => void;
  getMoodsByDateRange: (start: Date, end: Date) => MoodEntry[];
  syncStatus: {
    isOffline: boolean;
    pendingSyncCount: number;
    lastSyncTime?: Date;
  };
  forceSync: () => Promise<void>;
  // Authentication methods
  setAuthState: (authState: AuthState) => void;
  updateUser: (user: User | null) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);