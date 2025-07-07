import React from 'react';

export const Analytics: React.FC = () => {
  return (
    <div className="h-full bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Overview</h2>
            <p className="text-gray-600">Charts and insights coming soon...</p>
            <div className="mt-4 h-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Trends</h2>
            <p className="text-gray-600">Mood patterns over time...</p>
            <div className="mt-4 h-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};