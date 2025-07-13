import React from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { Navigation } from './components/Navigation';
import { 
  OptimizedHome,
  OptimizedMoodLogging,
  OptimizedAnalytics,
  OptimizedSettings,
  OptimizedCommunity
} from './components/LazyComponents';

const AppContent: React.FC = () => {
  const { state } = useApp();

  const renderCurrentPage = () => {
    try {
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
    } catch (error) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800 mb-2">Error Loading Page</h1>
            <p className="text-gray-600">Please try refreshing the app.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <main className="flex-1 overflow-hidden">
        {renderCurrentPage()}
      </main>
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
