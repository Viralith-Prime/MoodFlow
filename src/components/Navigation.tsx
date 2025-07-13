import React from 'react';
import { MapIcon, PlusIcon, ChartBarIcon, Cog6ToothIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { MapIcon as MapIconSolid, PlusIcon as PlusIconSolid, ChartBarIcon as ChartBarIconSolid, Cog6ToothIcon as Cog6ToothIconSolid, UserGroupIcon as UserGroupIconSolid } from '@heroicons/react/24/solid';
import { useApp } from '../context/useApp';
import type { NavigationTab } from '../types';

interface NavigationProps {
  className?: string;
}

const navigationItems = [
  { id: 'home' as NavigationTab, label: 'Map', icon: MapIcon, iconSolid: MapIconSolid },
  { id: 'log' as NavigationTab, label: 'Log Mood', icon: PlusIcon, iconSolid: PlusIconSolid },
  { id: 'analytics' as NavigationTab, label: 'Analytics', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { id: 'settings' as NavigationTab, label: 'Settings', icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid },
  { id: 'community' as NavigationTab, label: 'Community', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
];

export const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const { state, setCurrentTab } = useApp();

  const handleTabClick = (tabId: NavigationTab, disabled?: boolean) => {
    if (!disabled) {
      setCurrentTab(tabId);
    }
  };

  const baseNavStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderTop: '1px solid #e5e7eb',
    boxShadow: '0 -1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '0.5rem',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: '70px',
    position: 'relative'
  };

  const baseButtonStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    minWidth: '60px',
    gap: '0.25rem'
  };

  const activeButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    color: '#2563eb',
    backgroundColor: '#f0f9ff'
  };

  const inactiveButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    color: '#6b7280'
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    color: '#9ca3af',
    cursor: 'not-allowed',
    opacity: 0.5
  };

  const iconStyle: React.CSSProperties = {
    width: '1.5rem',
    height: '1.5rem'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 500,
    textAlign: 'center',
    lineHeight: 1.2,
    maxWidth: '60px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  return (
    <nav 
      className={`bg-white border-t border-gray-200 shadow-lg ${className}`}
      style={baseNavStyle}
    >
      {navigationItems.map((item) => {
        const isActive = state.currentTab === item.id;
        const IconComponent = isActive ? item.iconSolid : item.icon;
        
        const buttonStyle = (item as { disabled?: boolean }).disabled 
          ? disabledButtonStyle
          : isActive 
            ? activeButtonStyle
            : inactiveButtonStyle;
        
        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id, (item as { disabled?: boolean }).disabled)}
            disabled={(item as { disabled?: boolean }).disabled}
            className={`nav-item ${isActive ? 'active' : ''} ${
              (item as { disabled?: boolean }).disabled ? 'opacity-50 cursor-not-allowed' : ''
            } min-w-0 flex-1`}
            style={buttonStyle}
            aria-label={item.label}
          >
            <IconComponent style={iconStyle} />
            <span style={labelStyle}>{item.label}</span>
            {(item as { disabled?: boolean }).disabled && (
              <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>
                (Soon)
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};