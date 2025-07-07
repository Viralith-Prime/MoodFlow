import React from 'react';

export const MoodLogging: React.FC = () => {
  return (
    <div className="h-full bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Log Your Mood</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600 text-center">
            Mood logging interface coming next...
          </p>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};