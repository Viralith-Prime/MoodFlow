import React from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';

export const Community: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
          <UserGroupIcon className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Community
        </h1>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mb-6">
          <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
          Coming Soon
        </div>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          We're working on bringing you an amazing community experience where you can connect with others, share your mood journey, and support each other.
        </p>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3">
              <span className="text-blue-600 dark:text-blue-400 text-lg">🌍</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Global Community</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Connect with users worldwide</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-3">
              <span className="text-green-600 dark:text-green-400 text-lg">💬</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Support Groups</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Join themed support communities</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-3">
              <span className="text-purple-600 dark:text-purple-400 text-lg">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Shared Insights</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Learn from community patterns</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-3">
              <span className="text-orange-600 dark:text-orange-400 text-lg">🤝</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Peer Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Give and receive encouragement</p>
          </div>
        </div>

        {/* Notification Signup */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Get Notified When We Launch
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Be the first to know when our community features are ready!
          </p>
          <button 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            onClick={() => {
              // For now, just show an alert
              alert('Thanks for your interest! We\'ll notify you when the community features are ready.');
            }}
          >
            Notify Me
          </button>
        </div>
      </div>
    </div>
  );
};