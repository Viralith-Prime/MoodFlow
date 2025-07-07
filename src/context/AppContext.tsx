import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, MoodEntry, UserSettings, NavigationTab } from '../types';
import { DEFAULT_LOCATION } from '../constants/moods';

interface AppContextType {
  state: AppState;
  addMood: (mood: Omit<MoodEntry, 'id' | 'timestamp'>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setCurrentTab: (tab: NavigationTab) => void;
  clearError: () => void;
  getMoodsByDateRange: (start: Date, end: Date) => MoodEntry[];
}

type AppAction =
  | { type: 'ADD_MOOD'; payload: MoodEntry }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'SET_CURRENT_TAB'; payload: NavigationTab }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_DATA'; payload: { moods: MoodEntry[]; settings: UserSettings } };

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
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedMoods = localStorage.getItem('moodflow-moods');
      const savedSettings = localStorage.getItem('moodflow-settings');
      
      const moods = savedMoods ? JSON.parse(savedMoods).map((mood: any) => ({
        ...mood,
        timestamp: new Date(mood.timestamp),
      })) : [];
      
      const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
      
      dispatch({ type: 'LOAD_DATA', payload: { moods, settings } });
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load saved data' });
    }
  }, []);

  // Save data to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem('moodflow-moods', JSON.stringify(state.moods));
      localStorage.setItem('moodflow-settings', JSON.stringify(state.userSettings));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }, [state.moods, state.userSettings]);

  const addMood = (moodData: Omit<MoodEntry, 'id' | 'timestamp'>) => {
    const mood: MoodEntry = {
      ...moodData,
      id: uuidv4(),
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MOOD', payload: mood });
  };

  const updateSettings = (settings: Partial<UserSettings>) => {
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

  const value: AppContextType = {
    state,
    addMood,
    updateSettings,
    setCurrentTab,
    clearError,
    getMoodsByDateRange,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};