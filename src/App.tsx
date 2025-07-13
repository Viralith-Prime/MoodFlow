import React from 'react';
import { AppProvider } from './context/AppContext';

// Simple test component
const TestComponent: React.FC = () => {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f9fafb',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#2563eb', marginBottom: '10px' }}>MoodFlow Test</h1>
        <p style={{ color: '#374151' }}>If you can see this, the app is loading correctly!</p>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        flex: 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#111827', marginBottom: '10px' }}>Debug Info</h2>
        <ul style={{ color: '#6b7280', fontSize: '14px' }}>
          <li>React is working</li>
          <li>Context is working</li>
          <li>Styling is working</li>
          <li>Time: {new Date().toLocaleString()}</li>
        </ul>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <TestComponent />
    </AppProvider>
  );
};

export default App;
