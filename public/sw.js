// MoodFlow Service Worker - Optimized for Performance
const CACHE_NAME = 'moodflow-v1.2.0';
const STATIC_CACHE = 'moodflow-static-v1.2.0';
const DYNAMIC_CACHE = 'moodflow-dynamic-v1.2.0';
const API_CACHE = 'moodflow-api-v1.2.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Core CSS and JS will be added dynamically
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/moods',
  '/api/settings',
  '/api/auth/verify'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets: Cache first, network fallback
  static: 'cache-first',
  // API calls: Network first, cache fallback
  api: 'network-first',
  // Dynamic content: Stale while revalidate
  dynamic: 'stale-while-revalidate'
};

// Performance optimization: Preload critical resources
const CRITICAL_RESOURCES = [
  '/assets/index-*.js',
  '/assets/index-*.css',
  '/assets/react-vendor-*.js'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing MoodFlow Service Worker v1.2.0');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Initialize other caches
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE)
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    }).catch(error => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating MoodFlow Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      // Take control of all clients immediately
      self.clients.claim(),
      // Warm up critical caches
      warmupCriticalCaches()
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Route to appropriate strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Performance: Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network failed for API request, checking cache:', error);
    
    // Fall back to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API failures
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Request failed and no cached version available' 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Performance: Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Check cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', error);
    
    // Return offline fallback for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return cache.match('/index.html');
    }
    
    throw error;
  }
}

// Performance: Handle dynamic content with stale-while-revalidate
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  // Return cached version immediately if available
  const cachedResponse = await cache.match(request);
  
  // Fetch fresh version in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached version or wait for network
  return cachedResponse || await networkPromise || await cache.match('/index.html');
}

// Utility: Check if request is for static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp')
  );
}

// Cleanup: Remove old caches
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  await Promise.all(
    cacheNames
      .filter(name => !validCaches.includes(name))
      .map(name => caches.delete(name))
  );
}

// Performance: Preload critical resources
async function warmupCriticalCaches() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    
    // Get all cached requests to find critical resources
    const requests = await cache.keys();
    const criticalRequests = requests.filter(request => 
      CRITICAL_RESOURCES.some(pattern => 
        new RegExp(pattern.replace('*', '.*')).test(request.url)
      )
    );
    
    // Preload critical resources
    await Promise.all(
      criticalRequests.map(request => cache.match(request))
    );
    
    console.log('[SW] Critical caches warmed up');
  } catch (error) {
    console.warn('[SW] Failed to warm up critical caches:', error);
  }
}

// Performance: Background sync for data persistence
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-moods') {
    event.waitUntil(syncMoodData());
  }
});

async function syncMoodData() {
  try {
    // Get pending sync data from IndexedDB or localStorage
    const pendingData = await getPendingSyncData();
    
    if (pendingData.length > 0) {
      // Sync each pending item
      for (const item of pendingData) {
        try {
          await fetch('/api/moods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
          // Remove from pending after successful sync
          await removePendingSyncData(item.id);
        } catch (error) {
          console.warn('[SW] Failed to sync item:', item.id, error);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Mock functions for sync data management
async function getPendingSyncData() {
  // This would integrate with your actual data layer
  return [];
}

async function removePendingSyncData(id) {
  // This would remove from your actual pending sync storage
  console.log('[SW] Removing synced data:', id);
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERFORMANCE_METRICS') {
    // Handle performance metrics from the app
    console.log('[SW] Performance metrics received:', event.data.metrics);
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', (error) => {
  console.error('[SW] Service Worker error:', error);
});

self.addEventListener('unhandledrejection', (error) => {
  console.error('[SW] Unhandled promise rejection:', error);
});

console.log('[SW] MoodFlow Service Worker loaded successfully');