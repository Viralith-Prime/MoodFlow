import React from 'react';

export const Community: React.FC = () => {
  return (
    <div className="h-full bg-gray-50 p-4 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-6xl mb-4">🚧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h1>
          <p className="text-gray-600 mb-4">
            Community features are under development. Soon you'll be able to:
          </p>
          <ul className="text-left text-gray-600 space-y-1">
            <li>• Connect with other users</li>
            <li>• Share mood insights</li>
            <li>• Join mood-based groups</li>
            <li>• Participate in challenges</li>
          </ul>
        </div>
      </div>
    </div>
  );
};