# 🌈 MoodFlow - Advanced Mood Tracking & Analytics

**A modern, enterprise-grade mood tracking application built with React, TypeScript, and Vercel.**

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://typescriptjs.org)

## ✨ Features

- **📊 Advanced Analytics**: Comprehensive mood analytics with interactive charts
- **🗺️ Mood Mapping**: Geolocation-based mood tracking with interactive maps
- **👥 Community**: Connect with others and share your wellness journey
- **⚙️ Smart Settings**: Personalized experience with adaptive preferences
- **🔐 Secure Authentication**: Enterprise-grade security with JWT tokens
- **📱 Mobile-First**: Optimized for mobile devices with PWA capabilities
- **🚀 High Performance**: Optimized builds with code splitting and caching

## 🛠️ Tech Stack

### Frontend
- **React 19.1.0** with TypeScript
- **Vite 7.0** for lightning-fast builds
- **Tailwind CSS** for modern styling
- **React Leaflet** for interactive maps
- **Recharts** for beautiful data visualizations
- **Headless UI** for accessible components

### Backend
- **Vercel Serverless Functions** (Node.js 18.x)
- **Hybrid Storage System** - Postgres persistence with local fallback
- **JWT Authentication** with bcrypt
- **Rate Limiting & Security** built-in

### Features
- 🎯 **Advanced Chunking**: Optimized code splitting for faster loads
- 🗜️ **Smart Compression**: Adaptive compression based on network quality
- 🔒 **Enterprise Security**: AES-256 encryption, rate limiting, CORS
- 📊 **Performance Monitoring**: Real-time metrics and optimization
- 🌐 **Mobile Optimization**: Battery-aware and low-memory mode support
- 💾 **Hybrid Storage**: Postgres persistence with local storage fallback
- 🔄 **Real-time Sync**: Background data synchronization

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd moodflow-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 📦 Deployment

This app is optimized for **Vercel** deployment:

1. **Connect to Vercel**: Link your GitHub repository to Vercel
2. **Environment Variables**: Set up your JWT_SECRET in Vercel dashboard
3. **Deploy**: Vercel will automatically deploy on every push to main

### Environment Variables

Create these environment variables in your Vercel dashboard:

```env
JWT_SECRET=your-super-secure-jwt-secret-here
NODE_ENV=production
DATABASE_URL=your-vercel-postgres-connection-string
```

## 🏗️ Project Structure

```
moodflow-app/
├── src/                    # React application source
│   ├── components/         # Reusable UI components
│   ├── context/           # React context providers
│   ├── services/          # API service functions
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── constants/         # Application constants
├── api/                   # Vercel serverless functions
│   ├── auth/              # Authentication endpoints
│   ├── moods/             # Mood tracking endpoints
│   ├── settings/          # User settings endpoints
│   └── storage/           # Hybrid storage engine (Postgres + local)
├── public/                # Static assets
└── dist/                  # Production build output
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Performance Features

- **Code Splitting**: Automatic chunking by feature
- **Lazy Loading**: Components load on demand
- **Caching**: Intelligent cache strategies
- **Compression**: Adaptive compression algorithms
- **Mobile Optimization**: Battery and memory aware

## 📱 Mobile Features

- **PWA Support**: Install as native app
- **Offline Capable**: Works without internet
- **Battery Optimization**: Reduces operations on low battery
- **Low Memory Mode**: Adapts to device constraints
- **Touch Optimized**: Designed for mobile interaction

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevents abuse and attacks
- **Data Encryption**: AES-256 equivalent encryption
- **CORS Protection**: Proper cross-origin security
- **Input Validation**: Comprehensive data validation

## � Analytics & Monitoring

- **Performance Metrics**: Real-time performance tracking
- **Error Monitoring**: Comprehensive error logging
- **Usage Analytics**: Track user engagement
- **Device Adaptation**: Optimize for user's device

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🎯 Roadmap

- [ ] Real-time notifications
- [ ] Data export functionality
- [ ] Advanced AI insights
- [ ] Social features expansion
- [ ] Third-party integrations

---

**Built with ❤️ using modern web technologies for optimal performance and user experience.**
