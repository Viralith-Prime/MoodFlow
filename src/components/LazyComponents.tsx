import React, { Suspense, lazy } from 'react';
import { ArrowPathIcon, MapIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useOptimizedConfig } from '../utils/deviceCapabilities';
import { preloadComponents } from '../utils/componentPreloader';

// Loading fallback component
const LoadingFallback: React.FC<{ 
  component: string; 
  height?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = ({ component, height = "h-full", icon: Icon = ArrowPathIcon }) => (
  <div className={`${height} flex items-center justify-center bg-gray-50`}>
    <div className="text-center">
      <Icon className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
      <p className="text-gray-600 text-sm">Loading {component}...</p>
      <div className="mt-2 w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Lazy loaded components with chunk names for better debugging
const LazyMap = lazy(() => 
  import('./MoodMap').then(module => ({ 
    default: module.MoodMap 
  }))
);

const LazyAnalytics = lazy(() => 
  import('./pages/Analytics').then(module => ({ 
    default: module.Analytics 
  }))
);

const LazyMoodLogging = lazy(() => 
  import('./pages/MoodLogging').then(module => ({ 
    default: module.MoodLogging 
  }))
);

const LazySettings = lazy(() => 
  import('./pages/Settings').then(module => ({ 
    default: module.Settings 
  }))
);

const LazyCommunity = lazy(() => 
  import('./pages/Community').then(module => ({ 
    default: module.Community 
  }))
);

// Simple fallback components for low-end devices
const SimpleMapFallback: React.FC = () => {
  const config = useOptimizedConfig();
  
  if (config.uiConfig.useSimpleComponents) {
    return (
      <div className="h-full bg-gradient-to-b from-blue-100 to-green-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-sm mx-4">
          <MapIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Interactive Map</h3>
          <p className="text-gray-600 text-sm mb-4">
            Your mood locations are being optimized for your device. 
            The map will load momentarily with enhanced performance.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }
  
  return <LoadingFallback component="Interactive Map" icon={MapIcon} />;
};

const SimpleAnalyticsFallback: React.FC = () => {
  const config = useOptimizedConfig();
  
  if (config.uiConfig.useSimpleComponents) {
    return (
      <div className="h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-sm mx-4">
          <ChartBarIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Analytics Dashboard</h3>
          <p className="text-gray-600 text-sm mb-4">
            Preparing your personalized mood insights and charts for optimal viewing.
          </p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-1 h-8 bg-purple-500 rounded animate-pulse"></div>
            <div className="w-1 h-6 bg-purple-400 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-10 bg-purple-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-4 bg-purple-400 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <div className="w-1 h-7 bg-purple-500 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }
  
  return <LoadingFallback component="Analytics Dashboard" icon={ChartBarIcon} />;
};

// Optimized wrapper components with error boundaries and performance monitoring
export const OptimizedHome: React.FC = () => {
  return (
    <LazyErrorBoundary fallback={<SimpleMapFallback />}>
      <Suspense fallback={<SimpleMapFallback />}>
        <LazyMap />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export const OptimizedAnalytics: React.FC = () => {
  return (
    <LazyErrorBoundary fallback={<SimpleAnalyticsFallback />}>
      <Suspense fallback={<SimpleAnalyticsFallback />}>
        <LazyAnalytics />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export const OptimizedMoodLogging: React.FC = () => {
  return (
    <LazyErrorBoundary fallback={<LoadingFallback component="Mood Logger" />}>
      <Suspense fallback={<LoadingFallback component="Mood Logger" />}>
        <LazyMoodLogging />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export const OptimizedSettings: React.FC = () => {
  return (
    <LazyErrorBoundary fallback={<LoadingFallback component="Settings" />}>
      <Suspense fallback={<LoadingFallback component="Settings" />}>
        <LazySettings />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export const OptimizedCommunity: React.FC = () => {
  return (
    <LazyErrorBoundary fallback={<LoadingFallback component="Community" />}>
      <Suspense fallback={<LoadingFallback component="Community" />}>
        <LazyCommunity />
      </Suspense>
    </LazyErrorBoundary>
  );
};

