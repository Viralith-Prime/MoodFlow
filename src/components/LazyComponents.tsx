import React, { Suspense, lazy } from 'react';

// Simple loading fallback with better UX
const LoadingFallback: React.FC<{ component: string }> = ({ component }) => (
  <div className="h-full flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">Loading {component}...</p>
      <div className="mt-2 w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

// Preload components for better performance
const preloadComponent = (importFn: () => Promise<any>) => {
  const promise = importFn();
  return {
    promise,
    preload: () => promise
  };
};

// Lazy loaded components with preloading
const LazyMap = lazy(() => import('./MoodMap').then(module => ({ default: module.MoodMap })));
const LazyAnalytics = lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })));
const LazyMoodLogging = lazy(() => import('./pages/MoodLogging').then(module => ({ default: module.MoodLogging })));
const LazySettings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const LazyCommunity = lazy(() => import('./pages/Community').then(module => ({ default: module.Community })));

// Preload components when app starts
const preloadedComponents = {
  map: preloadComponent(() => import('./MoodMap')),
  analytics: preloadComponent(() => import('./pages/Analytics')),
  moodLogging: preloadComponent(() => import('./pages/MoodLogging')),
  settings: preloadComponent(() => import('./pages/Settings')),
  community: preloadComponent(() => import('./pages/Community'))
};

// Preload critical components on app start
const preloadCriticalComponents = () => {
  // Preload map and mood logging (most commonly used)
  preloadedComponents.map.preload();
  preloadedComponents.moodLogging.preload();
  
  // Preload others after a delay
  setTimeout(() => {
    preloadedComponents.analytics.preload();
    preloadedComponents.settings.preload();
  }, 2000);
  
  setTimeout(() => {
    preloadedComponents.community.preload();
  }, 5000);
};

// Start preloading
preloadCriticalComponents();

// Optimized wrapper components with preloading
export const OptimizedHome: React.FC = () => (
  <Suspense fallback={<LoadingFallback component="Map" />}>
    <LazyMap />
  </Suspense>
);

export const OptimizedAnalytics: React.FC = () => (
  <Suspense fallback={<LoadingFallback component="Analytics" />}>
    <LazyAnalytics />
  </Suspense>
);

export const OptimizedMoodLogging: React.FC = () => (
  <Suspense fallback={<LoadingFallback component="Mood Logger" />}>
    <LazyMoodLogging />
  </Suspense>
);

export const OptimizedSettings: React.FC = () => (
  <Suspense fallback={<LoadingFallback component="Settings" />}>
    <LazySettings />
  </Suspense>
);

export const OptimizedCommunity: React.FC = () => (
  <Suspense fallback={<LoadingFallback component="Community" />}>
    <LazyCommunity />
  </Suspense>
);

