import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeSampleData } from './utils/sampleData'
import { preloadComponents } from './utils/componentPreloader'

// Initialize sample data for demo purposes
initializeSampleData();

// Initialize component preloading
preloadComponents();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
