import React, { Suspense, lazy } from 'react';

// Simple loading fallback
const LoadingFallback: React.FC<{ component: string }> = ({ component }) => (
  <div className="h-full flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">Loading {component}...</p>
    </div>
  </div>
);

// Lazy loaded components
const LazyMap = lazy(() => import('./MoodMap').then(module => ({ default: module.MoodMap })));
const LazyAnalytics = lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })));
const LazyMoodLogging = lazy(() => import('./pages/MoodLogging').then(module => ({ default: module.MoodLogging })));
const LazySettings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const LazyCommunity = lazy(() => import('./pages/Community').then(module => ({ default: module.Community })));

// Simple wrapper components
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

