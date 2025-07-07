import React, { useState } from 'react';
import { 
  BellIcon, 
  ShieldCheckIcon, 
  PaintBrushIcon, 
  UserIcon, 
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';


interface SettingsSectionProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ icon: Icon, title, description, children }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
      <div style={{
        padding: '0.5rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '0.5rem',
        color: '#2563eb'
      }}>
        <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
      </div>
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
          {title}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          {description}
        </p>
      </div>
    </div>
    {children}
  </div>
);

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, label, description }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid #f3f4f6'
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          {description}
        </div>
      )}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      style={{
        width: '3rem',
        height: '1.5rem',
        borderRadius: '1rem',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: enabled ? '#2563eb' : '#d1d5db',
        transition: 'all 0.2s ease',
        position: 'relative',
        outline: 'none'
      }}
    >
      <div
        style={{
          width: '1.25rem',
          height: '1.25rem',
          borderRadius: '50%',
          backgroundColor: 'white',
          position: 'absolute',
          top: '0.125rem',
          left: enabled ? '1.625rem' : '0.125rem',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      />
    </button>
  </div>
);

interface SelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Array<{ value: string | number; label: string }>;
  label: string;
  description?: string;
}

const Select: React.FC<SelectProps> = ({ value, onChange, options, label, description }) => (
  <div style={{ padding: '1rem 0', borderBottom: '1px solid #f3f4f6' }}>
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          {description}
        </div>
      )}
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '0.5rem 0.75rem',
        border: '2px solid #e5e7eb',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        backgroundColor: 'white',
        cursor: 'pointer',
        outline: 'none',
        transition: 'border-color 0.2s ease'
      }}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  description?: string;
  formatter?: (value: number) => string;
}

const Slider: React.FC<SliderProps> = ({ 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  label, 
  description, 
  formatter = (v) => v.toString() 
}) => (
  <div style={{ padding: '1rem 0', borderBottom: '1px solid #f3f4f6' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {description}
          </div>
        )}
      </div>
      <div style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#2563eb',
        backgroundColor: '#f0f9ff',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem'
      }}>
        {formatter(value)}
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        backgroundColor: '#e5e7eb',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none'
      }}
    />
  </div>
);

export const Settings: React.FC = () => {
  const { state, updateSettings } = useApp();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const handleSettingChange = (path: string, value: any) => {
    const pathArray = path.split('.');
    const newSettings = { ...state.userSettings };
    
    let current: any = newSettings;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;
    
    updateSettings(newSettings);
  };

  const handleExportData = () => {
    const exportData = {
      moods: state.moods,
      settings: state.userSettings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodflow-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const handleClearData = () => {
    localStorage.removeItem('moodflow-moods');
    localStorage.removeItem('moodflow-settings');
    window.location.reload();
  };

  const containerStyle: React.CSSProperties = {
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem',
    overflow: 'auto'
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1rem',
    textAlign: 'center',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '0.5rem'
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '0.875rem',
    margin: 0
  };

  const buttonStyle = (variant: 'primary' | 'danger' | 'success' = 'primary'): React.CSSProperties => {
    const colors = {
      primary: { bg: '#2563eb', hover: '#1d4ed8' },
      danger: { bg: '#dc2626', hover: '#b91c1c' },
      success: { bg: '#059669', hover: '#047857' }
    };
    
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      width: '100%',
      padding: '0.75rem 1rem',
      backgroundColor: colors[variant].bg,
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '0.5rem'
    };
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '1rem'
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>⚙️ Settings</h1>
        <p style={subtitleStyle}>
          Customize your MoodFlow experience and manage your data
        </p>
      </div>

      {/* Notifications */}
      <SettingsSection
        icon={BellIcon}
        title="Notifications"
        description="Manage reminders and alerts"
      >
        <Toggle
          enabled={state.userSettings.notifications.enabled}
          onChange={(value) => handleSettingChange('notifications.enabled', value)}
          label="Enable Notifications"
          description="Receive mood logging reminders and insights"
        />
        
        {state.userSettings.notifications.enabled && (
          <>
            <Toggle
              enabled={state.userSettings.notifications.dailyReminder}
              onChange={(value) => handleSettingChange('notifications.dailyReminder', value)}
              label="Daily Reminder"
              description="Get reminded to log your mood each day"
            />
            
            <Select
              value={state.userSettings.notifications.reminderTime}
              onChange={(value) => handleSettingChange('notifications.reminderTime', value)}
              options={[
                { value: '08:00', label: '8:00 AM' },
                { value: '12:00', label: '12:00 PM' },
                { value: '18:00', label: '6:00 PM' },
                { value: '20:00', label: '8:00 PM' },
                { value: '22:00', label: '10:00 PM' }
              ]}
              label="Reminder Time"
              description="When should we remind you to log your mood?"
            />
            
            <Toggle
              enabled={state.userSettings.notifications.weeklyReport}
              onChange={(value) => handleSettingChange('notifications.weeklyReport', value)}
              label="Weekly Reports"
              description="Receive weekly mood pattern summaries"
            />
          </>
        )}
      </SettingsSection>

      {/* Privacy */}
      <SettingsSection
        icon={ShieldCheckIcon}
        title="Privacy & Security"
        description="Control your data and privacy settings"
      >
        <Toggle
          enabled={state.userSettings.privacy.shareLocation}
          onChange={(value) => handleSettingChange('privacy.shareLocation', value)}
          label="Share Location"
          description="Allow location data to be used for mood mapping"
        />
        
        <Toggle
          enabled={state.userSettings.privacy.makePublic}
          onChange={(value) => handleSettingChange('privacy.makePublic', value)}
          label="Public Moods"
          description="Make your moods visible on the community map"
        />
        
        <Toggle
          enabled={state.userSettings.privacy.allowAnalytics}
          onChange={(value) => handleSettingChange('privacy.allowAnalytics', value)}
          label="Analytics Data"
          description="Help improve MoodFlow with anonymous usage data"
        />
      </SettingsSection>

      {/* Theme & Appearance */}
      <SettingsSection
        icon={PaintBrushIcon}
        title="Theme & Appearance"
        description="Customize the look and feel"
      >
        <div style={{ padding: '1rem 0', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
              Theme Mode
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Choose your preferred color scheme
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              { value: 'light', label: 'Light', icon: SunIcon },
              { value: 'dark', label: 'Dark', icon: MoonIcon },
              { value: 'auto', label: 'Auto', icon: ComputerDesktopIcon }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleSettingChange('preferences.theme', value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  border: '2px solid',
                  borderColor: state.userSettings.preferences.theme === value ? '#2563eb' : '#e5e7eb',
                  borderRadius: '0.5rem',
                  backgroundColor: state.userSettings.preferences.theme === value ? '#f0f9ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon style={{ 
                  width: '1.25rem', 
                  height: '1.25rem', 
                  color: state.userSettings.preferences.theme === value ? '#2563eb' : '#6b7280' 
                }} />
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 500,
                  color: state.userSettings.preferences.theme === value ? '#2563eb' : '#6b7280'
                }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Preferences */}
      <SettingsSection
        icon={Cog6ToothIcon}
        title="General Preferences"
        description="Customize default behaviors"
      >
        <Slider
          value={state.userSettings.preferences.defaultIntensity}
          onChange={(value) => handleSettingChange('preferences.defaultIntensity', value)}
          min={1}
          max={5}
          label="Default Intensity"
          description="Starting intensity when logging new moods"
          formatter={(value) => `${value}/5`}
        />
        
        <Toggle
          enabled={state.userSettings.preferences.autoLocation}
          onChange={(value) => handleSettingChange('preferences.autoLocation', value)}
          label="Auto-Detect Location"
          description="Automatically use your current location for mood entries"
        />
      </SettingsSection>

      {/* Account & Data */}
      <SettingsSection
        icon={UserIcon}
        title="Account & Data"
        description="Manage your account and data"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
          <button
            onClick={handleExportData}
            style={buttonStyle('primary')}
          >
            <DocumentArrowDownIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Export My Data
          </button>
          
          <button
            onClick={() => setShowConfirmClear(true)}
            style={buttonStyle('danger')}
          >
            <TrashIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Clear All Data
          </button>
        </div>
        
        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
            <strong>Export Data:</strong> Download all your moods and settings as a JSON file for backup or migration.
            <br />
            <strong>Clear Data:</strong> Permanently delete all moods and reset settings. This cannot be undone.
          </div>
        </div>
      </SettingsSection>

      {/* Confirmation Modal */}
      {showConfirmClear && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#dc2626', marginBottom: '1rem' }}>
              ⚠️ Clear All Data
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              This will permanently delete all your moods, settings, and data. This action cannot be undone.
              <br /><br />
              Are you sure you want to continue?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowConfirmClear(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <XMarkIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                Cancel
              </button>
              <button
                onClick={handleClearData}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <TrashIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Success */}
      {showExportSuccess && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '1rem',
          right: '1rem',
          backgroundColor: '#059669',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            Data exported successfully! Check your downloads.
          </span>
        </div>
      )}
    </div>
  );
};