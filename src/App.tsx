import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { 
  OptimizedHome,
  OptimizedMoodLogging,
  OptimizedAnalytics,
  OptimizedSettings,
  OptimizedCommunity,
  preloadComponents
} from './components/LazyComponents';
import { reportPerformanceMetrics } from './utils/deviceCapabilities';

const AppContent: React.FC = () => {
  const { state } = useApp();

  // Initialize performance monitoring and component preloading
  useEffect(() => {
    // Report initial performance metrics
    reportPerformanceMetrics();
    
    // Preload components for better performance
    preloadComponents();
    
    // Register service worker for caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        console.warn('Service Worker registration failed:', error);
      });
    }
  }, []);

  const renderCurrentPage = () => {
    switch (state.currentTab) {
      case 'home':
        return <OptimizedHome />;
      case 'log':
        return <OptimizedMoodLogging />;
      case 'analytics':
        return <OptimizedAnalytics />;
      case 'settings':
        return <OptimizedSettings />;
      case 'community':
        return <OptimizedCommunity />;
      default:
        return <OptimizedHome />;
    }
  };

  return (
    <div 
      className="h-screen flex flex-col bg-gray-50"
      style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#f9fafb' 
      }}
    >
      {/* Error display */}
      {state.error && (
        <div 
          className="bg-red-50 border-l-4 border-red-500 p-4 z-50"
          style={{
            backgroundColor: '#fef2f2',
            borderLeft: '4px solid #ef4444',
            padding: '1rem',
            zIndex: 50
          }}
        >
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700" style={{ color: '#b91c1c' }}>
                {state.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {state.isLoading && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 flex items-center space-x-3"
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div 
              className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"
              style={{
                width: '1.5rem',
                height: '1.5rem',
                borderRadius: '50%',
                border: '2px solid #e5e7eb',
                borderBottomColor: '#2563eb',
                animation: 'spin 1s linear infinite'
              }}
            ></div>
            <span className="text-gray-700" style={{ color: '#374151' }}>Loading...</span>
          </div>
        </div>
      )}

      {/* Main content area */}
      <main 
        className="flex-1 overflow-hidden"
        style={{ 
          flex: 1, 
          overflow: 'hidden' 
        }}
      >
        {renderCurrentPage()}
      </main>

      {/* Bottom navigation - Always visible */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white',
          minHeight: '80px'
        }}
      >
        <Navigation />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
