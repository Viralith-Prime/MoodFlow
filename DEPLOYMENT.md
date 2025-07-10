# MoodFlow Deployment Guide

## 🚀 Full-Stack Architecture

MoodFlow is now a complete full-stack application with:
- **Frontend**: React 18 + TypeScript + Vite (built by cursor agent)
- **Backend**: Vercel Edge Functions + KV Storage (zero-cost)
- **Database**: Vercel KV (Redis-based, free tier)
- **Deployment**: Vercel (free hosting)
- **Offline Support**: Progressive Web App with localStorage fallback

## 📋 Prerequisites

1. **Vercel Account** (free)
2. **GitHub Repository** (already connected)
3. **Node.js 18+** (for local development)

## 🎯 One-Click Deployment

### Step 1: Deploy to Vercel
```bash
# The app is already configured for Vercel deployment
# Simply connect your GitHub repo to Vercel:

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repo: Viralith-Prime/MoodFlow
4. Vercel will auto-detect it's a Vite app
5. Click "Deploy"
```

### Step 2: Add Free Database (Vercel KV)
```bash
# In your Vercel dashboard:
1. Go to your deployed project
2. Click "Storage" tab
3. Click "Create Database"
4. Select "KV" (Redis)
5. Choose "Free" plan
6. Create database
```

### Step 3: Configure Environment Variables
```bash
# In Vercel Dashboard > Settings > Environment Variables:
# These will be auto-populated after creating KV database:

KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Optional (app works without these):
VITE_APP_NAME=MoodFlow
VITE_APP_VERSION=1.0.0
```

### Step 4: Redeploy
```bash
# After adding environment variables:
1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"
# OR simply push any change to GitHub - auto-deploys
```

## 🏗 Local Development

### Setup
```bash
# Clone and install
git clone https://github.com/Viralith-Prime/MoodFlow.git
cd MoodFlow
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

### Development URLs
- **Frontend**: http://localhost:5173
- **API**: Uses production API or falls back to localStorage

### Build & Preview
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔄 Data Flow Architecture

### Offline-First Design
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Edge Functions │    │   Vercel KV     │
│   (React App)   │◄──►│   (/api/*)       │◄──►│   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  localStorage   │  ← Offline fallback & cache
│  (Browser)      │
└─────────────────┘
```

### API Endpoints
```
GET    /api/moods?userId=xxx     # Get user's moods
POST   /api/moods?userId=xxx     # Create new mood
PUT    /api/moods?userId=xxx&id=xxx # Update mood
DELETE /api/moods?userId=xxx&id=xxx # Delete mood

GET    /api/settings?userId=xxx  # Get user settings
PUT    /api/settings?userId=xxx  # Update settings
```

## 📊 Features & Capabilities

### ✅ Completed Features
- **Interactive Mood Map** with real-time markers
- **Mood Logging** with emoji picker and intensity slider
- **Analytics Dashboard** with charts and insights
- **Settings Management** with privacy controls
- **Offline Support** with automatic sync
- **Mobile-Responsive** design
- **Data Persistence** with cloud backup

### 🔄 Data Synchronization
- **Offline-First**: All actions work offline
- **Auto-Sync**: Syncs when connection restored
- **Conflict Resolution**: Last-write-wins strategy
- **Error Handling**: Graceful fallbacks

### 🛡 Security & Privacy
- **Anonymous Users**: No account required
- **Client-Side Encryption**: User data stays private
- **Rate Limiting**: API protection
- **CORS Protection**: Secure cross-origin requests

## 🎛 Configuration Options

### Frontend Configuration
```typescript
// vite.config.ts - Build optimization
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          maps: ['leaflet', 'react-leaflet'],
          charts: ['recharts']
        }
      }
    }
  }
})
```

### API Configuration
```typescript
// api/moods.js - Edge Function
export const runtime = 'edge'; // Uses Edge Runtime
// Supports: GET, POST, PUT, DELETE
// Auto-handles CORS, rate limiting, errors
```

## 📱 Progressive Web App

### Offline Capabilities
- ✅ **Mood Logging**: Works completely offline
- ✅ **Map Viewing**: Cached map tiles
- ✅ **Settings**: Local storage persistence
- ✅ **Analytics**: Historical data analysis
- 🔄 **Auto-Sync**: When connection restored

### Performance Metrics
```
Lighthouse Scores (Target):
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 85+
```

## 🔧 Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**API Not Working:**
```bash
# Check environment variables in Vercel dashboard
# Ensure KV database is created and connected
# Check function logs in Vercel dashboard
```

**Offline Issues:**
```bash
# App automatically falls back to localStorage
# Check browser console for sync errors
# Data will sync when connection restored
```

## 📈 Scaling & Maintenance

### Free Tier Limits
- **Vercel KV**: 30K requests/month
- **Edge Functions**: 100K invocations/month
- **Bandwidth**: 100GB/month
- **Storage**: 1GB total

### Upgrade Paths
1. **More Users**: Upgrade Vercel plan
2. **More Data**: Add database sharding
3. **Advanced Features**: Add authentication
4. **Analytics**: Add usage tracking

## 🚀 Production Checklist

- ✅ Frontend builds successfully
- ✅ API endpoints working
- ✅ Database connected
- ✅ Environment variables set
- ✅ Domain configured (optional)
- ✅ Analytics setup (optional)
- ✅ Error monitoring (built-in)

## 📞 Support

The application is fully self-contained and documented. For issues:
1. Check browser console for errors
2. Verify Vercel deployment logs
3. Test API endpoints manually
4. Check localStorage data integrity

---

**🎉 Your MoodFlow app is now deployed and ready for users!**

Visit your live app at: `https://your-project-name.vercel.app`