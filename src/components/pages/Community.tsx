import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  CloudIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { authService } from '../../services/authService';
import type { LoginCredentials, RegisterCredentials, User } from '../../types';

interface FormSectionProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  children: React.ReactNode;
  error?: string;
}

const FormSection: React.FC<FormSectionProps> = ({ icon: Icon, title, description, children, error }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: error ? '2px solid #ef4444' : '1px solid #e5e7eb'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
      <div style={{
        padding: '0.5rem',
        backgroundColor: error ? '#fef2f2' : '#f0f9ff',
        borderRadius: '0.5rem',
        color: error ? '#ef4444' : '#2563eb'
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
    {error && (
      <div style={{
        padding: '0.75rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
        <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>{error}</span>
      </div>
    )}
    {children}
  </div>
);

interface InputFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  showPasswordToggle?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  type, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  error,
  showPasswordToggle = false 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#374151',
        marginBottom: '0.5rem'
      }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.75rem',
            paddingRight: showPasswordToggle ? '3rem' : '0.75rem',
            border: `2px solid ${error ? '#ef4444' : '#e5e7eb'}`,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            backgroundColor: 'white'
          }}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            {showPassword ? (
              <EyeSlashIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            ) : (
              <EyeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            )}
          </button>
        )}
      </div>
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
};

export const Community: React.FC = () => {
  const [currentView, setCurrentView] = useState<'welcome' | 'login' | 'register' | 'account' | 'migration'>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);

  // Form states
  const [loginForm, setLoginForm] = useState<LoginCredentials>({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterCredentials>({ username: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete account states
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const response = await authService.verifyToken();
      if (response.success && response.data?.authenticated && response.data.user) {
        setUser(response.data.user);
        setCurrentView('account');
        
        // Check for data migration
        if (authService.hasAnonymousDataToMigrate()) {
          setCurrentView('migration');
        }
      } else {
        setCurrentView('welcome');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setCurrentView('welcome');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login(loginForm);
      if (response.success && response.data) {
        setUser(response.data.user);
        setSuccessMessage('Login successful!');
        
        // Check for data migration
        if (authService.hasAnonymousDataToMigrate()) {
          setCurrentView('migration');
        } else {
          setCurrentView('account');
        }
        
        setLoginForm({ email: '', password: '' });
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerForm.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.register(registerForm);
      if (response.success && response.data) {
        setUser(response.data.user);
        setSuccessMessage('Account created successfully!');
        
        // Check for data migration
        if (authService.hasAnonymousDataToMigrate()) {
          setCurrentView('migration');
        } else {
          setCurrentView('account');
        }
        
        setRegisterForm({ username: '', email: '', password: '' });
        setConfirmPassword('');
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setCurrentView('welcome');
      setSuccessMessage('Logged out successfully');
    } catch (error) {
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authService.migrateAnonymousData();
      if (response.success) {
        setSuccessMessage('Data migrated successfully!');
        setCurrentView('account');
      } else {
        setError(response.error || 'Migration failed');
      }
    } catch (error) {
      setError('Network error during migration');
    } finally {
      setIsLoading(false);
    }
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

  const buttonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary'): React.CSSProperties => {
    const colors = {
      primary: { bg: '#2563eb', hover: '#1d4ed8', text: 'white' },
      secondary: { bg: '#f3f4f6', hover: '#e5e7eb', text: '#374151' },
      danger: { bg: '#dc2626', hover: '#b91c1c', text: 'white' }
    };
    
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      width: '100%',
      padding: '0.75rem 1rem',
      backgroundColor: colors[variant].bg,
      color: colors[variant].text,
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '0.5rem',
      opacity: isLoading ? 0.7 : 1
    };
  };

  if (isLoading && currentView === 'welcome') {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <ArrowPathIcon style={{ width: '3rem', height: '3rem', color: '#2563eb', margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
          {currentView === 'welcome' && '👥 Community & Accounts'}
          {currentView === 'login' && '🔐 Sign In'}
          {currentView === 'register' && '📝 Create Account'}
          {currentView === 'account' && `👋 Welcome, ${user?.username}!`}
          {currentView === 'migration' && '📦 Data Migration'}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          {currentView === 'welcome' && 'Sign in or create an account for advanced sync and features'}
          {currentView === 'login' && 'Access your account and sync across devices'}
          {currentView === 'register' && 'Join MoodFlow for enhanced features and cloud sync'}
          {currentView === 'account' && 'Manage your account and enjoy premium features'}
          {currentView === 'migration' && 'Transfer your local data to your new account'}
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div style={{
          backgroundColor: '#059669',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage('')}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>
      )}

      {/* Welcome View */}
      {currentView === 'welcome' && (
        <>
          <FormSection
            icon={UserIcon}
            title="Get Started"
            description="Choose how you'd like to continue"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentView('login')}
                style={buttonStyle('primary')}
                disabled={isLoading}
              >
                <ArrowRightOnRectangleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                Sign In to Existing Account
              </button>
              
              <button
                onClick={() => setCurrentView('register')}
                style={buttonStyle('secondary')}
                disabled={isLoading}
              >
                <UserPlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                Create New Account
              </button>
            </div>
            
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#f8fafc', 
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                🚀 Premium Features with Account:
              </h3>
              <ul style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5, paddingLeft: '1rem', margin: 0 }}>
                <li>☁️ Cloud sync across all devices</li>
                <li>📊 Advanced analytics and insights</li>
                <li>💾 Unlimited mood storage</li>
                <li>🔒 Enhanced privacy and security</li>
                <li>🎯 Personalized recommendations</li>
                <li>📱 Cross-device synchronization</li>
              </ul>
            </div>
          </FormSection>
        </>
      )}

      {/* Login View */}
      {currentView === 'login' && (
        <>
          <FormSection
            icon={ArrowRightOnRectangleIcon}
            title="Sign In"
            description="Enter your credentials to access your account"
            error={error}
          >
            <form onSubmit={handleLogin}>
              <InputField
                label="Email"
                type="email"
                value={loginForm.email}
                onChange={(value) => setLoginForm({...loginForm, email: value})}
                placeholder="your@email.com"
                required
              />
              
              <InputField
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(value) => setLoginForm({...loginForm, password: value})}
                placeholder="Enter your password"
                required
                showPasswordToggle
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  style={buttonStyle('primary')}
                  disabled={isLoading || !loginForm.email || !loginForm.password}
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <ArrowRightOnRectangleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      Sign In
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('welcome');
                    setError('');
                    setLoginForm({ email: '', password: '' });
                  }}
                  style={buttonStyle('secondary')}
                >
                  Back to Welcome
                </button>
              </div>
            </form>
          </FormSection>
          
          <FormSection
            icon={UserPlusIcon}
            title="Don't have an account?"
            description="Create one now to get started"
          >
            <button
              onClick={() => {
                setCurrentView('register');
                setError('');
              }}
              style={buttonStyle('primary')}
            >
              <UserPlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              Create Account
            </button>
          </FormSection>
        </>
      )}

      {/* Register View */}
      {currentView === 'register' && (
        <>
          <FormSection
            icon={UserPlusIcon}
            title="Create Account"
            description="Join MoodFlow for premium features"
            error={error}
          >
            <form onSubmit={handleRegister}>
              <InputField
                label="Username"
                type="text"
                value={registerForm.username}
                onChange={(value) => setRegisterForm({...registerForm, username: value})}
                placeholder="Choose a username"
                required
              />
              
              <InputField
                label="Email"
                type="email"
                value={registerForm.email}
                onChange={(value) => setRegisterForm({...registerForm, email: value})}
                placeholder="your@email.com"
                required
              />
              
              <InputField
                label="Password"
                type="password"
                value={registerForm.password}
                onChange={(value) => setRegisterForm({...registerForm, password: value})}
                placeholder="At least 8 characters"
                required
                showPasswordToggle
              />
              
              <InputField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm your password"
                required
                showPasswordToggle
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  style={buttonStyle('primary')}
                  disabled={isLoading || !registerForm.username || !registerForm.email || !registerForm.password || !confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      Create Account
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('welcome');
                    setError('');
                    setRegisterForm({ username: '', email: '', password: '' });
                    setConfirmPassword('');
                  }}
                  style={buttonStyle('secondary')}
                >
                  Back to Welcome
                </button>
              </div>
            </form>
          </FormSection>
          
          <FormSection
            icon={ArrowRightOnRectangleIcon}
            title="Already have an account?"
            description="Sign in to your existing account"
          >
            <button
              onClick={() => {
                setCurrentView('login');
                setError('');
              }}
              style={buttonStyle('primary')}
            >
              <ArrowRightOnRectangleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              Sign In
            </button>
          </FormSection>
        </>
      )}

      {/* Data Migration View */}
      {currentView === 'migration' && (
        <>
          <FormSection
            icon={CloudIcon}
            title="Data Migration Available"
            description="We found local data that can be transferred to your account"
          >
            <div style={{
              padding: '1rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fed7aa',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                <strong>Found:</strong> {authService.hasAnonymousDataToMigrate() ? 'Mood entries and settings' : 'Settings'} 
                from your anonymous usage. Transfer this data to your account for safekeeping and sync.
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
              <button
                onClick={handleMigrateData}
                style={buttonStyle('primary')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Migrating Data...
                  </>
                ) : (
                  <>
                    <CloudIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Migrate Data to Account
                  </>
                )}
              </button>
              
              <button
                onClick={() => setCurrentView('account')}
                style={buttonStyle('secondary')}
              >
                Skip Migration
              </button>
            </div>
          </FormSection>
        </>
      )}

      {/* Account View */}
      {currentView === 'account' && user && (
        <>
          <FormSection
            icon={UserIcon}
            title="Account Information"
            description="Your account details and status"
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#374151' }}>Username:</strong>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#111827' }}>{user.username}</p>
              </div>
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#374151' }}>Email:</strong>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#111827' }}>{user.email}</p>
              </div>
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#374151' }}>Member Since:</strong>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#111827' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#374151' }}>Last Login:</strong>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#111827' }}>
                  {new Date(user.lastLogin).toLocaleDateString()}
                </p>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={CloudIcon}
            title="Premium Features"
            description="You're enjoying all premium features"
          >
            <div style={{
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bfdbfe',
              borderRadius: '0.5rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckIcon style={{ width: '1rem', height: '1rem', color: '#059669' }} />
                  <span style={{ fontSize: '0.75rem', color: '#0c4a6e' }}>Cloud Sync</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckIcon style={{ width: '1rem', height: '1rem', color: '#059669' }} />
                  <span style={{ fontSize: '0.75rem', color: '#0c4a6e' }}>Unlimited Storage</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckIcon style={{ width: '1rem', height: '1rem', color: '#059669' }} />
                  <span style={{ fontSize: '0.75rem', color: '#0c4a6e' }}>Advanced Analytics</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckIcon style={{ width: '1rem', height: '1rem', color: '#059669' }} />
                  <span style={{ fontSize: '0.75rem', color: '#0c4a6e' }}>Cross-Device Access</span>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={ShieldCheckIcon}
            title="Account Actions"
            description="Manage your account and security"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
              <button
                onClick={handleLogout}
                style={buttonStyle('secondary')}
                disabled={isLoading}
              >
                <ArrowRightOnRectangleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                Sign Out
              </button>
              
              <button
                onClick={() => setShowDeleteModal(true)}
                style={buttonStyle('danger')}
              >
                <TrashIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                Delete Account
              </button>
            </div>
          </FormSection>
        </>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#dc2626', marginBottom: '1rem' }}>
              ⚠️ Delete Account
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              This will permanently delete your account and all associated data. This action cannot be undone.
              <br /><br />
              Type your password to confirm:
            </p>
            <input
              type="password"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none',
                marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
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
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmation) {
                    setIsLoading(true);
                    try {
                      const response = await authService.deleteAccount(deleteConfirmation);
                      if (response.success) {
                        setUser(null);
                        setCurrentView('welcome');
                        setSuccessMessage('Account deleted successfully');
                        setShowDeleteModal(false);
                      } else {
                        setError(response.error || 'Failed to delete account');
                      }
                    } catch (error) {
                      setError('Network error');
                    } finally {
                      setIsLoading(false);
                      setDeleteConfirmation('');
                    }
                  }
                }}
                disabled={!deleteConfirmation || isLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: deleteConfirmation ? '#dc2626' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: deleteConfirmation ? 'pointer' : 'not-allowed'
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};