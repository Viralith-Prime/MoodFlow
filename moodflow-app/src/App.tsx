import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { MoodMap } from './components/MoodMap';
import { MoodLogging } from './components/pages/MoodLogging';
import { Analytics } from './components/pages/Analytics';
import { Settings } from './components/pages/Settings';
import { Community } from './components/pages/Community';

const AppContent: React.FC = () => {
  const { state } = useApp();

  const renderCurrentPage = () => {
    switch (state.currentTab) {
      case 'home':
        return <MoodMap />;
      case 'log':
        return <MoodLogging />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'community':
        return <Community />;
      default:
        return <MoodMap />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Error display */}
      {state.error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 z-50">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="text-gray-700">Loading...</span>
          </div>
        </div>
      )}

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        {renderCurrentPage()}
      </main>

      {/* Bottom navigation */}
      <Navigation />
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
