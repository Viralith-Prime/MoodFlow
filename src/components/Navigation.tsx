import React from 'react';
import { MapIcon, PlusIcon, ChartBarIcon, Cog6ToothIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { MapIcon as MapIconSolid, PlusIcon as PlusIconSolid, ChartBarIcon as ChartBarIconSolid, Cog6ToothIcon as Cog6ToothIconSolid, UserGroupIcon as UserGroupIconSolid } from '@heroicons/react/24/solid';
import { useApp } from '../context/AppContext';
import type { NavigationTab } from '../types';

interface NavigationProps {
  className?: string;
}

const navigationItems = [
  { id: 'home' as NavigationTab, label: 'Map', icon: MapIcon, iconSolid: MapIconSolid },
  { id: 'log' as NavigationTab, label: 'Log Mood', icon: PlusIcon, iconSolid: PlusIconSolid },
  { id: 'analytics' as NavigationTab, label: 'Analytics', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { id: 'settings' as NavigationTab, label: 'Settings', icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid },
  { id: 'community' as NavigationTab, label: 'Community', icon: UserGroupIcon, iconSolid: UserGroupIconSolid, disabled: true },
];

export const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const { state, setCurrentTab } = useApp();

  const handleTabClick = (tabId: NavigationTab, disabled?: boolean) => {
    if (!disabled) {
      setCurrentTab(tabId);
    }
  };

  return (
    <nav className={`bg-white border-t border-gray-200 shadow-lg ${className}`}>
      <div className="flex justify-around items-center h-16 px-2">
        {navigationItems.map((item) => {
          const isActive = state.currentTab === item.id;
          const IconComponent = isActive ? item.iconSolid : item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id, item.disabled)}
              disabled={item.disabled}
              className={`nav-item ${isActive ? 'active' : ''} ${
                item.disabled ? 'opacity-50 cursor-not-allowed' : ''
              } min-w-0 flex-1`}
              aria-label={item.label}
            >
              <IconComponent className="h-6 w-6" />
              <span className="text-xs font-medium truncate">{item.label}</span>
              {item.disabled && (
                <span className="text-xs text-gray-400">(Soon)</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};