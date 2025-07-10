import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    minify: 'terser',
    rollupOptions: {
      output: {
        // Improved chunking strategy for optimal caching
        manualChunks: (id) => {
          // Vendor chunks - stable, cacheable
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('leaflet')) return 'maps-vendor';
            if (id.includes('recharts') || id.includes('d3')) return 'charts-vendor';
            if (id.includes('@heroicons') || id.includes('lucide')) return 'icons-vendor';
            if (id.includes('@headlessui')) return 'ui-vendor';
            if (id.includes('bcryptjs') || id.includes('jose') || id.includes('zod')) return 'auth-vendor';
            return 'vendor';
          }
          
          // Feature-based chunks - lazy loaded
          if (id.includes('components/pages/Analytics')) return 'analytics-page';
          if (id.includes('components/pages/Settings')) return 'settings-page';
          if (id.includes('components/pages/Community')) return 'community-page';
          if (id.includes('components/pages/MoodLogging')) return 'logging-page';
          if (id.includes('components/MoodMap')) return 'map-page';
          if (id.includes('services/')) return 'services';
          if (id.includes('utils/')) return 'utils';
        },
        // Optimize file naming for caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      // Optimize external dependencies
      external: [],
    },
    // Target modern browsers for smaller bundles
    target: ['es2020', 'chrome80', 'firefox80', 'safari13'],
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize asset handling
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5173,
    host: true,
    // Enable compression
    middlewareMode: false,
  },
  preview: {
    port: 4173,
    host: true,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'leaflet',
      'react-leaflet',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      'lucide-react',
      'uuid',
    ],
    exclude: [
      // Large deps that benefit from chunking
      'recharts',
      '@headlessui/react',
    ],
  },
  // Enable esbuild for faster builds
  esbuild: {
    // Remove console logs in production
    drop: ['console', 'debugger'],
    // Enable legal comments removal
    legalComments: 'none',
    // Target modern syntax
    target: 'es2020',
  },
})
