import { useOptimizedConfig } from './deviceCapabilities';

// Preload components for high-performance devices
export const preloadComponents = (): void => {
  try {
    // Get config outside of the function to avoid hook rules
    const config = (() => {
      try {
        return useOptimizedConfig();
      } catch {
        return {
          performanceConfig: { enablePrefetching: false }
        };
      }
    })();
    
    if (config.performanceConfig.enablePrefetching) {
      // Preload critical components
      Promise.all([
        import('../components/MoodMap'),
        import('../components/pages/MoodLogging'),
      ]).catch(err => console.warn('Component preload failed:', err));
      
      // Preload secondary components after a delay
      setTimeout(() => {
        Promise.all([
          import('../components/pages/Analytics'),
          import('../components/pages/Settings'),
          import('../components/pages/Community'),
        ]).catch(err => console.warn('Secondary component preload failed:', err));
      }, 2000);
    }
  } catch (error) {
    console.warn('Preload setup failed:', error);
  }
};