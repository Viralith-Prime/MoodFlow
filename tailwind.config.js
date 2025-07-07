/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        mood: {
          happy: '#fbbf24',
          excited: '#f59e0b',
          content: '#84cc16',
          calm: '#06b6d4',
          sad: '#6366f1',
          angry: '#ef4444',
          anxious: '#a855f7',
          peaceful: '#10b981',
        }
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      }
    },
  },
  plugins: [],
}