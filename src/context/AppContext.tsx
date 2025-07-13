import React, { useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
    auth: {
      user: authService.getUser(),
      token: authService.getToken(),
      isAuthenticated: authService.isAuthenticated(),
      isLoading: false,
    }
  });

  // Load data from localStorage
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const savedMoods = localStorage.getItem('moodflow-moods');
        const savedSettings = localStorage.getItem('moodflow-settings');
        
        const localMoods = savedMoods ? JSON.parse(savedMoods).map((mood: Record<string, unknown>) => ({
          ...mood,
          timestamp: new Date(mood.timestamp as string),
        })) : [];
        
        const localSettings = savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
        
        dispatch({ type: 'LOAD_DATA', payload: { moods: localMoods, settings: localSettings } });
      } catch (error) {
        dispatch({ type: 'LOAD_DATA', payload: { moods: [], settings: defaultSettings } });
      }
    };

    loadInitialData();
  }, []);

  const addMood = async (moodData: Omit<MoodEntry, 'id' | 'timestamp'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiService.createMood(moodData);
      
      if (response.success && response.data) {
        dispatch({ type: 'ADD_MOOD', payload: response.data });
      } else {
        const localMood: MoodEntry = {
          id: uuidv4(),
          ...moodData,
          timestamp: new Date(),
        };
        dispatch({ type: 'ADD_MOOD', payload: localMood });
      }
    } catch (error) {
      const localMood: MoodEntry = {
        id: uuidv4(),
        ...moodData,
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_MOOD', payload: localMood });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    try {
      const response = await apiService.updateSettings(settings);
      
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: response.data });
      } else {
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
      }
    } catch (error) {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    }
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
    syncStatus: {
      isOffline: false,
      pendingSyncCount: 0,
    },
    forceSync: async () => {},
    setAuthState,
    updateUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};