interface DeviceCapabilities {
  hasGeolocation: boolean;
  hasLocalStorage: boolean;
  hasIndexedDB: boolean;
  hasWebGL: boolean;
  hasCanvas: boolean;
  isTouchDevice: boolean;
  isLowEndDevice: boolean;
  hasServiceWorker: boolean;
  connectionType: string;
  memoryLevel: 'low' | 'medium' | 'high';
  performanceLevel: 'low' | 'medium' | 'high';
  browserSupport: {
    modernJS: boolean;
    flexbox: boolean;
    grid: boolean;
    webp: boolean;
    avif: boolean;
  };
}

class DeviceCapabilityDetector {
  private capabilities: DeviceCapabilities | null = null;

  detect(): DeviceCapabilities {
    if (this.capabilities) {
      return this.capabilities;
    }

    try {
      this.capabilities = {
        hasGeolocation: this.checkGeolocation(),
        hasLocalStorage: this.checkLocalStorage(),
        hasIndexedDB: this.checkIndexedDB(),
        hasWebGL: this.checkWebGL(),
        hasCanvas: this.checkCanvas(),
        isTouchDevice: this.checkTouchDevice(),
        isLowEndDevice: this.checkLowEndDevice(),
        hasServiceWorker: this.checkServiceWorker(),
        connectionType: this.getConnectionType(),
        memoryLevel: this.getMemoryLevel(),
        performanceLevel: this.getPerformanceLevel(),
        browserSupport: this.checkBrowserSupport(),
      };
    } catch (error) {
      console.warn('Device capabilities detection failed, using defaults:', error);
      // Fallback to safe defaults
      this.capabilities = {
        hasGeolocation: false,
        hasLocalStorage: true,
        hasIndexedDB: false,
        hasWebGL: false,
        hasCanvas: true,
        isTouchDevice: false,
        isLowEndDevice: false,
        hasServiceWorker: false,
        connectionType: 'unknown',
        memoryLevel: 'medium',
        performanceLevel: 'medium',
        browserSupport: {
          modernJS: true,
          flexbox: true,
          grid: true,
          webp: false,
          avif: false,
        },
      };
    }

    return this.capabilities;
  }

  private checkGeolocation(): boolean {
    return 'geolocation' in navigator;
  }

  private checkLocalStorage(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private checkIndexedDB(): boolean {
    return 'indexedDB' in window;
  }

  private checkWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  private checkCanvas(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch {
      return false;
    }
  }

  private checkTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private checkLowEndDevice(): boolean {
    // Detect low-end devices based on multiple factors
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;

    let score = 0;

    // Memory check (deviceMemory is in GB)
    if (memory) {
      if (memory < 2) score += 3;
      else if (memory < 4) score += 2;
      else if (memory < 8) score += 1;
    }

    // CPU cores check
    if (cores) {
      if (cores < 2) score += 3;
      else if (cores < 4) score += 2;
      else if (cores < 8) score += 1;
    }

    // Network connection check
    if (connection) {
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') score += 3;
      else if (connection.effectiveType === '3g') score += 2;
    }

    // User agent checks for older devices
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android') && !ua.includes('chrome/')) score += 2;
    if (ua.includes('iphone') && ua.includes('os 9_')) score += 2;

    return score >= 3;
  }

  private checkServiceWorker(): boolean {
    return 'serviceWorker' in navigator;
  }

  private getConnectionType(): string {
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    if (connection) {
      return connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private getMemoryLevel(): 'low' | 'medium' | 'high' {
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (memory) {
      if (memory < 2) return 'low';
      if (memory < 6) return 'medium';
      return 'high';
    }
    
    // Fallback: estimate based on other factors
    const cores = navigator.hardwareConcurrency || 2;
    if (cores < 2) return 'low';
    if (cores < 6) return 'medium';
    return 'high';
  }

  private getPerformanceLevel(): 'low' | 'medium' | 'high' {
    const isLowEnd = this.checkLowEndDevice();
    const memoryLevel = this.getMemoryLevel();
    
    if (isLowEnd || memoryLevel === 'low') return 'low';
    if (memoryLevel === 'medium') return 'medium';
    return 'high';
  }

  private checkBrowserSupport() {
    try {
      const testDiv = document.createElement('div');
      testDiv.style.display = 'flex';
      
      return {
        modernJS: this.checkModernJS(),
        flexbox: testDiv.style.display === 'flex',
        grid: typeof CSS !== 'undefined' && CSS.supports ? CSS.supports('display', 'grid') : false,
        webp: this.checkWebPSupport(),
        avif: this.checkAVIFSupport(),
      };
    } catch {
      return {
        modernJS: true,
        flexbox: true,
        grid: true,
        webp: false,
        avif: false,
      };
    }
  }

  private checkModernJS(): boolean {
    try {
      // Test for ES6+ features
      new Function('(a = 0) => a')();
      return true;
    } catch {
      return false;
    }
  }

  private checkWebPSupport(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('webp') !== -1;
  }

  private checkAVIFSupport(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    try {
      return canvas.toDataURL('image/avif').indexOf('avif') !== -1;
    } catch {
      return false;
    }
  }

  // Get optimized configuration based on device capabilities
  getOptimizedConfig() {
    const caps = this.detect();
    
    return {
      // Map configuration
      mapConfig: {
        enableClustering: caps.performanceLevel !== 'low',
        maxZoom: caps.isLowEndDevice ? 16 : 18,
        enableAnimations: caps.performanceLevel === 'high',
        tileSize: caps.isLowEndDevice ? 256 : 512,
        enableVectorTiles: caps.performanceLevel === 'high',
      },
      
      // UI configuration
      uiConfig: {
        enableTransitions: caps.performanceLevel !== 'low',
        enableShadows: caps.performanceLevel === 'high',
        enableBlur: caps.performanceLevel === 'high',
        reduceMotion: caps.isLowEndDevice,
        useSimpleComponents: caps.performanceLevel === 'low',
      },
      
      // Data configuration
      dataConfig: {
        cacheSize: caps.memoryLevel === 'low' ? 50 : caps.memoryLevel === 'medium' ? 200 : 500,
        enableOfflineSync: caps.hasServiceWorker && caps.hasIndexedDB,
        batchSize: caps.performanceLevel === 'low' ? 10 : 25,
        enablePreloading: caps.performanceLevel === 'high',
      },
      
      // Performance configuration
      performanceConfig: {
        enableLazyLoading: true,
        enableImageOptimization: true,
        enableCodeSplitting: caps.performanceLevel !== 'low',
        enablePrefetching: caps.connectionType === '4g' && caps.performanceLevel === 'high',
        enableCompression: true,
      },
    };
  }

  // Performance monitoring
  measurePerformance() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        ttfb: navigation.responseStart - navigation.requestStart,
      };
    }
    return null;
  }
}

// Singleton instance
export const deviceCapabilities = new DeviceCapabilityDetector();

// Helper functions for components
export const useDeviceCapabilities = () => {
  return deviceCapabilities.detect();
};

export const useOptimizedConfig = () => {
  return deviceCapabilities.getOptimizedConfig();
};

export const reportPerformanceMetrics = () => {
  const metrics = deviceCapabilities.measurePerformance();
  if (metrics) {
    console.log('Performance Metrics:', metrics);
    
    // Send to analytics if needed
    if (metrics.firstContentfulPaint > 3000) {
      console.warn('Slow FCP detected:', metrics.firstContentfulPaint);
    }
  }
};

export default deviceCapabilities;