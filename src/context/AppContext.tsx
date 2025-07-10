import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, MoodEntry, UserSettings, NavigationTab, AuthState, User } from '../types';
import { apiService } from '../services/api';
import { authService } from '../services/authService';

interface AppContextType {
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
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    syncStatus: {
      isOffline: apiService.isOffline(),
      pendingSyncCount: apiService.getPendingSyncCount(),
    },
    auth: {
      user: authService.getUser(),
      token: authService.getToken(),
      isAuthenticated: authService.isAuthenticated(),
      isLoading: false,
    }
  });

  // Load data from API/localStorage on mount
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Load moods and settings in parallel
        const [moodsResponse, settingsResponse] = await Promise.all([
          apiService.getMoods(),
          apiService.getSettings()
        ]);

        const moods = moodsResponse.data || [];
        const settings = { ...defaultSettings, ...settingsResponse.data };

        // If there's no server data but we have localStorage data, use localStorage
        if (moods.length === 0) {
          const localMoods = localStorage.getItem('moodflow-moods');
          if (localMoods) {
            const parsedMoods = JSON.parse(localMoods).map((mood: any) => ({
              ...mood,
              timestamp: new Date(mood.timestamp),
            }));
            dispatch({ type: 'LOAD_DATA', payload: { moods: parsedMoods, settings } });
          } else {
            dispatch({ type: 'LOAD_DATA', payload: { moods: [], settings } });
          }
        } else {
          dispatch({ type: 'LOAD_DATA', payload: { moods, settings } });
        }

        // Show warning if using offline data
        if (!moodsResponse.success || !settingsResponse.success) {
          dispatch({ type: 'SET_ERROR', payload: 'Working offline - data will sync when connected' });
          setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 5000);
        }

      } catch (error) {
        console.error('Error loading initial data:', error);
        
        // Fallback to localStorage only
        try {
          const savedMoods = localStorage.getItem('moodflow-moods');
          const savedSettings = localStorage.getItem('moodflow-settings');
          
          const moods = savedMoods ? JSON.parse(savedMoods).map((mood: any) => ({
            ...mood,
            timestamp: new Date(mood.timestamp),
          })) : [];
          
          const settings = savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
          
          dispatch({ type: 'LOAD_DATA', payload: { moods, settings } });
          dispatch({ type: 'SET_ERROR', payload: 'Working offline - data will sync when connected' });
          setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 5000);
        } catch (localError) {
          console.error('Error loading from localStorage:', localError);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
        }
      }
    };

    loadInitialData();
  }, []);

  // Update sync status periodically
  useEffect(() => {
    const updateSyncStatus = () => {
      dispatch({
        type: 'UPDATE_SYNC_STATUS',
        payload: {
          isOffline: apiService.isOffline(),
          pendingSyncCount: apiService.getPendingSyncCount(),
          lastSyncTime: state.syncStatus?.lastSyncTime
        }
      });
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const addMood = async (moodData: Omit<MoodEntry, 'id' | 'timestamp'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiService.createMood(moodData);
      
      if (response.success && response.data) {
        dispatch({ type: 'ADD_MOOD', payload: response.data });
        
        // Update sync status
        dispatch({
          type: 'UPDATE_SYNC_STATUS',
          payload: {
            isOffline: apiService.isOffline(),
            pendingSyncCount: apiService.getPendingSyncCount(),
            lastSyncTime: new Date()
          }
        });
      } else {
        // Even if API fails, the mood was still added to localStorage
        const localMood: MoodEntry = {
          id: uuidv4(),
          ...moodData,
          timestamp: new Date(),
        };
        dispatch({ type: 'ADD_MOOD', payload: localMood });
        dispatch({ type: 'SET_ERROR', payload: 'Mood saved locally - will sync when online' });
        setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 3000);
      }
    } catch (error) {
      console.error('Error adding mood:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add mood' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    try {
      const response = await apiService.updateSettings(settings);
      
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: response.data });
        
        // Update sync status
        dispatch({
          type: 'UPDATE_SYNC_STATUS',
          payload: {
            isOffline: apiService.isOffline(),
            pendingSyncCount: apiService.getPendingSyncCount(),
            lastSyncTime: new Date()
          }
        });
      } else {
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        dispatch({ type: 'SET_ERROR', payload: 'Settings saved locally - will sync when online' });
        setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 3000);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update settings' });
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

  const forceSync = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await apiService.syncData();
      
      // Reload data after sync
      const [moodsResponse, settingsResponse] = await Promise.all([
        apiService.getMoods(),
        apiService.getSettings()
      ]);

      if (moodsResponse.success && settingsResponse.success) {
        dispatch({
          type: 'LOAD_DATA',
          payload: {
            moods: moodsResponse.data || [],
            settings: { ...defaultSettings, ...settingsResponse.data }
          }
        });
        
        dispatch({
          type: 'UPDATE_SYNC_STATUS',
          payload: {
            isOffline: apiService.isOffline(),
            pendingSyncCount: apiService.getPendingSyncCount(),
            lastSyncTime: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error during force sync:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Sync failed - please try again' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
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