import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React chunks
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-core';
          }
          
          // UI libraries
          if (id.includes('@headlessui') || id.includes('@heroicons') || id.includes('lucide-react')) {
            return 'ui-libs';
          }
          
          // Heavy chart library - separate chunk
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts';
          }
          
          // Map library - separate chunk
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'maps';
          }
          
          // Auth and utilities
          if (id.includes('bcryptjs') || id.includes('jose') || id.includes('zod') || id.includes('validator')) {
            return 'auth-utils';
          }
          
          // UUID and other utilities
          if (id.includes('uuid')) {
            return 'utils';
          }
          
          // Feature-based chunks for better caching
          if (id.includes('components/pages/Analytics')) return 'analytics';
          if (id.includes('components/pages/Settings')) return 'settings';
          if (id.includes('components/pages/Community')) return 'community';
          if (id.includes('components/pages/MoodLogging')) return 'mood-logging';
          if (id.includes('components/MoodMap')) return 'mood-map';
          
          // Services and context
          if (id.includes('services/') || id.includes('context/')) {
            return 'app-core';
          }
        },
        // Optimize file naming for better caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
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
      'uuid',
    ],
    exclude: [
      // Large deps that benefit from chunking
      'recharts',
      'leaflet',
      'react-leaflet',
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
