import React, { useState, useMemo } from 'react';
import { ChartBarIcon, CalendarIcon, ArrowTrendingUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useApp } from '../../context/AppContext';
import { MOOD_OPTIONS } from '../../constants/moods';


interface MoodStats {
  totalMoods: number;
  averageIntensity: number;
  currentStreak: number;
  longestStreak: number;
  mostCommonMood: string;
  moodDistribution: Array<{ name: string; value: number; color: string; emoji: string }>;
  weeklyTrend: Array<{ date: string; intensity: number; count: number }>;
  dailyAverage: Array<{ day: string; intensity: number }>;
}

export const Analytics: React.FC = () => {
  const { state } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'calendar' | 'insights'>('overview');

  // Calculate analytics data
  const analytics = useMemo((): MoodStats => {
    const now = new Date();
    let filteredMoods = state.moods;

    // Filter by selected period
    if (selectedPeriod !== 'all') {
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filteredMoods = state.moods.filter(mood => mood.timestamp >= cutoffDate);
    }

    // Basic stats
    const totalMoods = filteredMoods.length;
    const averageIntensity = totalMoods > 0 
      ? Math.round((filteredMoods.reduce((sum, mood) => sum + mood.intensity, 0) / totalMoods) * 10) / 10
      : 0;

    // Streak calculation
    const sortedMoods = [...state.moods].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedMoods.length; i++) {
      const moodDate = new Date(sortedMoods[i].timestamp);
      moodDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - moodDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i || (i === 0 && daysDiff <= 1)) {
        tempStreak++;
        if (i === 0 || daysDiff <= 1) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Mood distribution
    const moodCounts: Record<string, number> = {};
    filteredMoods.forEach(mood => {
      moodCounts[mood.name] = (moodCounts[mood.name] || 0) + 1;
    });

    const moodDistribution = Object.entries(moodCounts).map(([name, count]) => {
      const moodOption = MOOD_OPTIONS.find(m => m.name === name);
      return {
        name,
        value: count,
        color: moodOption?.color || '#6b7280',
        emoji: moodOption?.emoji || '😐'
      };
    }).sort((a, b) => b.value - a.value);

    const mostCommonMood = moodDistribution[0]?.name || 'None';

    // Weekly trend
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }).reverse();

    const weeklyTrend = last30Days.map(dateStr => {
      const dayMoods = filteredMoods.filter(mood => 
        mood.timestamp.toISOString().split('T')[0] === dateStr
      );
      const avgIntensity = dayMoods.length > 0 
        ? dayMoods.reduce((sum, mood) => sum + mood.intensity, 0) / dayMoods.length
        : 0;
      
      return {
        date: dateStr,
        intensity: Math.round(avgIntensity * 10) / 10,
        count: dayMoods.length
      };
    });

    // Daily average
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyAverage = daysOfWeek.map(day => {
      const dayIndex = daysOfWeek.indexOf(day);
      const dayMoods = filteredMoods.filter(mood => mood.timestamp.getDay() === dayIndex);
      const avgIntensity = dayMoods.length > 0
        ? dayMoods.reduce((sum, mood) => sum + mood.intensity, 0) / dayMoods.length
        : 0;
      
      return {
        day: day.slice(0, 3),
        intensity: Math.round(avgIntensity * 10) / 10
      };
    });

    return {
      totalMoods,
      averageIntensity,
      currentStreak,
      longestStreak,
      mostCommonMood,
      moodDistribution,
      weeklyTrend,
      dailyAverage
    };
  }, [state.moods, selectedPeriod]);

  // AI Insights
  const getInsights = (): string[] => {
    const insights: string[] = [];
    
    if (analytics.currentStreak >= 7) {
      insights.push(`🔥 Amazing! You've logged moods for ${analytics.currentStreak} days straight!`);
    } else if (analytics.currentStreak >= 3) {
      insights.push(`⭐ Great streak! ${analytics.currentStreak} days of mood tracking.`);
    }

    if (analytics.averageIntensity >= 4) {
      insights.push(`😊 Your average mood intensity is high (${analytics.averageIntensity}/5) - you're doing great!`);
    } else if (analytics.averageIntensity <= 2.5) {
      insights.push(`💙 Your mood intensity has been lower lately. Consider reaching out to friends or trying relaxation techniques.`);
    }

    if (analytics.mostCommonMood === 'Happy' || analytics.mostCommonMood === 'Excited') {
      insights.push(`🌟 You've been feeling ${analytics.mostCommonMood.toLowerCase()} most often - keep up the positive energy!`);
    }

    const weekendMoods = analytics.dailyAverage.filter(d => d.day === 'Sat' || d.day === 'Sun');
    const weekdayMoods = analytics.dailyAverage.filter(d => d.day !== 'Sat' && d.day !== 'Sun');
    const weekendAvg = weekendMoods.reduce((sum, d) => sum + d.intensity, 0) / weekendMoods.length;
    const weekdayAvg = weekdayMoods.reduce((sum, d) => sum + d.intensity, 0) / weekdayMoods.length;

    if (weekendAvg > weekdayAvg + 0.5) {
      insights.push(`🏖️ You tend to feel better on weekends - consider bringing some weekend energy to your weekdays!`);
    }

    if (analytics.totalMoods >= 30) {
      insights.push(`📊 You've logged ${analytics.totalMoods} moods! This data helps us understand your patterns better.`);
    }

    return insights.slice(0, 3);
  };

  const containerStyle: React.CSSProperties = {
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem',
    overflow: 'auto'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    marginBottom: '1rem'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827'
  };

  const periodButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: '2px solid',
    borderColor: isActive ? '#2563eb' : '#e5e7eb',
    backgroundColor: isActive ? '#f0f9ff' : 'white',
    color: isActive ? '#2563eb' : '#6b7280',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'all 0.2s ease'
  });

  const statCardStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
    padding: '1rem',
    textAlign: 'center',
    border: '1px solid #e2e8f0'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '0.25rem'
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: 500
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    backgroundColor: isActive ? '#2563eb' : '#f1f5f9',
    color: isActive ? 'white' : '#64748b',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'all 0.2s ease'
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
            {formatDate(label || '')}
          </p>
          {payload.map((item: { name: string; value: number; color: string }, index: number) => (
            <p key={index} style={{ margin: 0, fontSize: '0.875rem', color: item.color }}>
              {item.name}: {item.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderOverview = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      <div style={statCardStyle}>
        <div style={statValueStyle}>{analytics.totalMoods}</div>
        <div style={statLabelStyle}>Total Moods</div>
      </div>
      <div style={statCardStyle}>
        <div style={statValueStyle}>{analytics.averageIntensity}</div>
        <div style={statLabelStyle}>Avg Intensity</div>
      </div>
      <div style={statCardStyle}>
        <div style={statValueStyle}>{analytics.currentStreak}</div>
        <div style={statLabelStyle}>Current Streak</div>
      </div>
      <div style={statCardStyle}>
        <div style={statValueStyle}>{analytics.longestStreak}</div>
        <div style={statLabelStyle}>Longest Streak</div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
          Mood Intensity Over Time
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={analytics.weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              domain={[0, 5]}
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="intensity" 
              stroke="#2563eb" 
              strokeWidth={3}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
          Average by Day of Week
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={analytics.dailyAverage}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
            <YAxis domain={[0, 5]} stroke="#6b7280" fontSize={12} />
            <Tooltip />
            <Bar 
              dataKey="intensity" 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderMoodDistribution = () => (
    <div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
        Mood Distribution
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analytics.moodDistribution}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
                             label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {analytics.moodDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
          {analytics.moodDistribution.slice(0, 6).map((mood) => (
            <div key={mood.name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              border: `2px solid ${mood.color}20`
            }}>
              <span style={{ fontSize: '1.25rem' }}>{mood.emoji}</span>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                  {mood.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {mood.value} times
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsights = () => {
    const insights = getInsights();
    
    return (
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SparklesIcon style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
          AI-Powered Insights
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {insights.map((insight, index) => (
            <div key={index} style={{
              padding: '1rem',
              backgroundColor: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '0.75rem',
              border: '1px solid #f59e0b20',
              fontSize: '0.875rem',
              lineHeight: 1.6
            }}>
              {insight}
            </div>
          ))}
          
          {insights.length === 0 && (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6b7280',
              backgroundColor: '#f8fafc',
              borderRadius: '0.75rem',
              border: '2px dashed #e5e7eb'
            }}>
              <SparklesIcon style={{ width: '3rem', height: '3rem', color: '#d1d5db', margin: '0 auto 1rem' }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Log more moods to unlock personalized insights!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>📊 Analytics Dashboard</h1>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['7d', '30d', '90d', 'all'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                style={periodButtonStyle(selectedPeriod === period)}
              >
                {period === 'all' ? 'All Time' : period.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {analytics.totalMoods === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            <ChartBarIcon style={{ width: '4rem', height: '4rem', color: '#d1d5db', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Data Yet</h3>
            <p style={{ margin: 0 }}>Start logging moods to see beautiful analytics!</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedView('overview')}
                style={tabButtonStyle(selectedView === 'overview')}
              >
                                 <ArrowTrendingUpIcon style={{ width: '1rem', height: '1rem' }} />
                Overview
              </button>
              <button
                onClick={() => setSelectedView('trends')}
                style={tabButtonStyle(selectedView === 'trends')}
              >
                <ChartBarIcon style={{ width: '1rem', height: '1rem' }} />
                Trends
              </button>
              <button
                onClick={() => setSelectedView('calendar')}
                style={tabButtonStyle(selectedView === 'calendar')}
              >
                <CalendarIcon style={{ width: '1rem', height: '1rem' }} />
                Distribution
              </button>
              <button
                onClick={() => setSelectedView('insights')}
                style={tabButtonStyle(selectedView === 'insights')}
              >
                <SparklesIcon style={{ width: '1rem', height: '1rem' }} />
                Insights
              </button>
            </div>

            {selectedView === 'overview' && renderOverview()}
            {selectedView === 'trends' && renderTrends()}
            {selectedView === 'calendar' && renderMoodDistribution()}
            {selectedView === 'insights' && renderInsights()}
          </>
        )}
      </div>
    </div>
  );
};