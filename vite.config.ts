import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    rollupOptions: {
      output: {
        // Improved chunking strategy for optimal caching
        manualChunks: (id) => {
          // Vendor chunk for React and related libraries
          if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
          
          // Vendor chunk for UI libraries
          if (id.includes('@headlessui') || id.includes('@heroicons') || id.includes('lucide-react')) return 'ui-vendor';
          
          // Vendor chunk for charting libraries
          if (id.includes('recharts') || id.includes('d3')) return 'charts-vendor';
          
          // Vendor chunk for mapping libraries
          if (id.includes('leaflet')) return 'maps-vendor';
          
          // Vendor chunk for utility libraries
          if (id.includes('uuid') || id.includes('zod')) return 'utils-vendor';
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
    port: 3000,
    host: true,
    // Enable compression
    middlewareMode: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
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
