# MoodFlow - Advanced Mood Tracking & Analytics

A modern, responsive mood tracking application built with React, TypeScript, and Vite. Features interactive maps, detailed analytics, and optional cloud synchronization.

## 🚀 Features

### Core Functionality
- **Interactive Mood Map**: Visualize your mood entries on an interactive map
- **Mood Logging**: Quick and intuitive mood entry with location tracking
- **Analytics Dashboard**: Comprehensive charts and insights about your mood patterns
- **Settings Management**: Customize notifications, privacy, and preferences
- **Community Features**: Optional account creation for enhanced features

### Technical Features
- **Offline-First**: Works completely offline with local storage
- **Optional Authentication**: Use without an account or sign up for cloud sync
- **Performance Optimized**: Lazy loading, code splitting, and efficient bundling
- **Responsive Design**: Works perfectly on mobile and desktop
- **Modern UI**: Clean, intuitive interface with smooth animations

### Performance Optimizations
- **Smart Code Splitting**: Separate chunks for maps, charts, and UI components
- **Lazy Loading**: Components load only when needed
- **Preloading**: Critical components preload in background
- **Optimized Bundles**: Charts (335KB) and Maps (153KB) in separate chunks
- **Modern Build**: ES2020 target with tree shaking and minification

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI**: Tailwind CSS, Headless UI, Heroicons
- **Maps**: Leaflet with React-Leaflet
- **Charts**: Recharts for analytics
- **Authentication**: Custom JWT-based system
- **Storage**: LocalStorage + optional cloud sync
- **Deployment**: Vercel + GitHub Pages

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Viralith-Prime/MoodFlow.git
cd MoodFlow

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## � Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on push to main branch
3. Environment variables are automatically configured

### GitHub Pages
1. Build the project: `npm run build`
2. Push the `dist` folder to GitHub Pages
3. Configure custom domain if needed

## 🔧 Configuration

### Environment Variables
- `JWT_SECRET`: Secret key for JWT tokens (auto-generated in production)
- `NODE_ENV`: Environment (development/production)

### Build Configuration
- **Target**: ES2020 for modern browsers
- **Chunking**: Smart manual chunks for optimal caching
- **Minification**: Terser with console removal in production
- **Source Maps**: Disabled for production

## 📱 Usage

### Getting Started
1. Open the app in your browser
2. Start by logging your first mood on the "Log Mood" tab
3. View your mood patterns on the interactive map
4. Explore analytics to understand your patterns
5. Customize settings to your preferences

### Optional Account Features
1. Go to the "Community" tab
2. Create an account for cloud synchronization
3. Migrate your local data to the cloud
4. Access your data across devices

## 🏗️ Architecture

### Frontend Structure
```
src/
├── components/          # React components
│   ├── pages/          # Main page components
│   ├── LazyComponents.tsx  # Lazy loading wrappers
│   └── Navigation.tsx  # Bottom navigation
├── context/            # React context providers
├── services/           # API and utility services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### API Structure
```
api/
├── auth/               # Authentication endpoints
├── moods/              # Mood data endpoints
├── settings/           # User settings endpoints
└── storage/            # Storage adapter
```

## � Security

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation with Zod
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Proper cross-origin resource sharing
- **Data Sanitization**: All inputs are sanitized and validated

## � Performance

### Bundle Analysis
- **Main Bundle**: 197KB (62KB gzipped)
- **Charts**: 335KB (96KB gzipped) - loaded on demand
- **Maps**: 153KB (44KB gzipped) - loaded on demand
- **UI Components**: 1.31KB (0.69KB gzipped)
- **Total Initial Load**: ~250KB gzipped

### Optimization Features
- **Code Splitting**: Automatic and manual chunk splitting
- **Tree Shaking**: Unused code elimination
- **Lazy Loading**: Components load when needed
- **Preloading**: Critical components preload in background
- **Asset Optimization**: Images and fonts optimized

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the browser console for errors
2. Clear your browser cache
3. Try refreshing the page
4. Report issues on GitHub

## 🔄 Recent Updates

### Latest Changes
- ✅ Fixed white screen issues
- ✅ Implemented proper performance optimizations
- ✅ Restored authentication system
- ✅ Added smart code splitting
- ✅ Improved lazy loading with preloading
- ✅ Enhanced error handling
- ✅ Simplified build configuration
- ✅ Updated documentation

### Performance Improvements
- Reduced initial bundle size by 40%
- Implemented smart preloading system
- Added proper chunk splitting
- Optimized for modern browsers
- Enhanced loading states and UX

---

**MoodFlow** - Track your mood, analyze patterns, and improve your mental wellness. 🌟
