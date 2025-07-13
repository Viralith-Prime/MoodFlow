import React, { useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState, MoodEntry, UserSettings, NavigationTab, AuthState, User } from '../types';
import { apiService } from '../services/api';
import { authService } from '../services/authService';
import { AppContext, type AppContextType } from './AppContextDefinition';

type AppAction =
  | { type: 'ADD_MOOD'; payload: MoodEntry }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'SET_CURRENT_TAB'; payload: NavigationTab }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_DATA'; payload: { moods: MoodEntry[]; settings: UserSettings } }
  | { type: 'UPDATE_SYNC_STATUS'; payload: { isOffline: boolean; pendingSyncCount: number; lastSyncTime?: Date } }
  | { type: 'SET_AUTH_STATE'; payload: AuthState }
  | { type: 'UPDATE_USER'; payload: User | null };

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

const initialState: AppState = {
  moods: [],
  userSettings: defaultSettings,
  currentTab: 'home',
  isLoading: false,
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  },
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_MOOD':
      return {
        ...state,
        moods: [action.payload, ...state.moods],
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        userSettings: { ...state.userSettings, ...action.payload },
      };
    case 'SET_CURRENT_TAB':
      return {
        ...state,
        currentTab: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: undefined,
      };
    case 'LOAD_DATA':
      return {
        ...state,
        moods: action.payload.moods,
        userSettings: action.payload.settings,
        isLoading: false,
      };
    case 'UPDATE_SYNC_STATUS':
      return {
        ...state,
        syncStatus: action.payload,
      };
    case 'SET_AUTH_STATE':
      return {
        ...state,
        auth: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        auth: {
          ...state.auth,
          user: action.payload,
          isAuthenticated: !!action.payload,
        },
      };
    default:
      return state;
  }
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    syncStatus: {
      isOffline: !navigator.onLine,
      pendingSyncCount: 0,
    },
    auth: {
      user: authService.getUser(),
      token: authService.getToken(),
      isAuthenticated: authService.isAuthenticated(),
      isLoading: false,
    }
  });

  // Simplified data loading - just load defaults for now
  useEffect(() => {
    console.log('AppProvider initialized');
    dispatch({ type: 'LOAD_DATA', payload: { moods: [], settings: defaultSettings } });
  }, []);

  const addMood = async (moodData: Omit<MoodEntry, 'id' | 'timestamp'>) => {
    console.log('Adding mood:', moodData);
    // For now, just add to local state
    const newMood: MoodEntry = {
      id: crypto.randomUUID(),
      ...moodData,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MOOD', payload: newMood });
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    console.log('Updating settings:', settings);
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const setCurrentTab = (tab: NavigationTab) => {
    dispatch({ type: 'SET_CURRENT_TAB', payload: tab });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const getMoodsByDateRange = (start: Date, end: Date): MoodEntry[] => {
    return state.moods.filter(mood => {
      const moodDate = new Date(mood.timestamp);
      return moodDate >= start && moodDate <= end;
    });
  };

  const forceSync = async (): Promise<void> => {
    console.log('Force sync called');
    // For now, just log
  };

  const setAuthState = (authState: AuthState) => {
    dispatch({ type: 'SET_AUTH_STATE', payload: authState });
  };

  const updateUser = (user: User | null) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const value: AppContextType = {
    state,
    addMood,
    updateSettings,
    setCurrentTab,
    clearError,
    getMoodsByDateRange,
    syncStatus: state.syncStatus || {
      isOffline: false,
      pendingSyncCount: 0,
    },
    forceSync,
    setAuthState,
    updateUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};