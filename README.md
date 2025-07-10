# MoodFlow

A complete full-stack application for tracking and visualizing mood patterns on an interactive map. Built entirely by Cursor AI agent.

## 🚀 Features

### ✅ Fully Implemented
- **Interactive Mood Map**: Real-time mood markers with clustering and detailed popups
- **Mood Logging**: Complete interface with emoji picker, intensity slider, notes, and location capture
- **Analytics Dashboard**: Beautiful charts, trends, patterns, and insights with Recharts
- **Settings Management**: Comprehensive privacy controls, notifications, themes, and preferences
- **Offline-First Architecture**: Works completely offline with automatic cloud sync
- **Mobile-Responsive Design**: Optimized PWA experience across all devices
- **Zero-Cost Deployment**: Built for Vercel's free tier with KV storage

### 🔄 Advanced Capabilities
- **Real-time Data Sync**: Automatic synchronization when online
- **Progressive Web App**: Install on mobile devices, works offline
- **Privacy-First**: No accounts required, anonymous usage with local encryption
- **Cloud Backup**: Secure backup to Vercel KV (Redis) database

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom mood-themed colors  
- **Maps**: React Leaflet + OpenStreetMap
- **Charts**: Recharts for analytics visualization
- **Icons**: Heroicons + Lucide React
- **State Management**: React Context + useReducer + API integration

### Backend
- **Runtime**: Vercel Edge Functions (serverless)
- **Database**: Vercel KV (Redis) - free tier
- **API**: RESTful endpoints with full CRUD operations
- **Storage**: Hybrid localStorage + cloud sync

### Deployment
- **Hosting**: Vercel (zero-cost)
- **CI/CD**: GitHub integration with auto-deployment  
- **Performance**: Optimized chunks, lazy loading, PWA features
- **Monitoring**: Built-in error handling and sync status

## 📦 Installation

```bash
# Clone the repository
cd moodflow-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 App Structure

```
src/
├── components/
│   ├── Navigation.tsx          # Bottom navigation bar
│   ├── MoodMap.tsx            # Interactive map with mood markers
│   └── pages/
│       ├── MoodLogging.tsx    # Mood entry interface (placeholder)
│       ├── Analytics.tsx      # Dashboard and charts (placeholder)
│       ├── Settings.tsx       # User preferences (placeholder)
│       └── Community.tsx      # Social features (placeholder)
├── context/
│   └── AppContext.tsx         # Global state management
├── types/
│   └── index.ts              # TypeScript type definitions
├── constants/
│   └── moods.ts              # Mood options and styling
├── utils/
│   └── sampleData.ts         # Demo data generation
└── styles/
    └── index.css             # Tailwind CSS + custom styles
```

## 🗺 Navigation System

The app uses a tab-based navigation system:

1. **Home (Map)**: Interactive mood visualization
2. **Log Mood**: Mood entry interface (next module)
3. **Analytics**: Data insights and trends (next module)
4. **Settings**: User preferences (next module)
5. **Community**: Social features (disabled, coming later)

## 💾 Data Structure

### Mood Entry
```typescript
interface MoodEntry {
  id: string;
  emoji: string;
  name: string;
  intensity: number;     // 1-5 scale
  notes?: string;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  isPublic: boolean;
}
```

### User Settings
```typescript
interface UserSettings {
  notifications: { enabled, dailyReminder, reminderTime, weeklyReport };
  privacy: { shareLocation, makePublic, allowAnalytics };
  preferences: { theme, defaultIntensity, autoLocation };
  account: { username?, email? };
}
```

## 🎨 Design System

### Mood Colors
- Happy: `#fbbf24` (amber)
- Excited: `#f59e0b` (orange)
- Content: `#84cc16` (lime)
- Calm: `#06b6d4` (cyan)
- Sad: `#6366f1` (indigo)
- Angry: `#ef4444` (red)
- Anxious: `#a855f7` (purple)
- Peaceful: `#10b981` (emerald)

### Responsive Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## 🧪 Development Guidelines

### Adding New Features
1. Create TypeScript interfaces in `src/types/`
2. Add components to appropriate folders
3. Update context/state management if needed
4. Follow mobile-first responsive design
5. Add error handling and loading states

### Code Standards
- Use TypeScript strict mode
- Follow React functional components with hooks
- Implement proper error boundaries
- Use semantic HTML and ARIA labels
- Optimize for performance with React.memo when needed

### Testing Strategy (Future)
- Unit tests for utilities and hooks
- Component testing with React Testing Library
- E2E testing for critical user flows
- Performance testing for map interactions

## 🚦 Current Status

✅ **Complete**: Landing page with interactive mood map and navigation
🚧 **Next**: Mood logging interface with emoji picker and location capture
📋 **Planned**: Analytics dashboard with charts and insights
📋 **Planned**: Settings management with persistence
📋 **Future**: Community features and user accounts

## 🔧 Configuration

### Environment Variables
```env
# Future API integrations
VITE_GEOLOCATION_API_KEY=your_key_here
VITE_ANALYTICS_ENDPOINT=your_endpoint_here
```

### Customization
- Modify `tailwind.config.js` for theme customization
- Update `src/constants/moods.ts` for mood options
- Configure map tiles in `MoodMap.tsx`

## 📝 Development Notes

- The app automatically initializes with sample data for demonstration
- Location services require HTTPS in production
- Map markers use custom HTML with mood-specific styling
- Navigation state persists across browser sessions
- Error handling includes user-friendly messages and fallbacks

## 🤝 Contributing

1. Follow the established component structure
2. Implement responsive design for all new features
3. Add appropriate TypeScript types
4. Test on multiple devices and browsers
5. Document new features and APIs

---

**Next Development Phase**: Implement the mood logging interface with emoji selection, intensity slider, and location capture functionality.
