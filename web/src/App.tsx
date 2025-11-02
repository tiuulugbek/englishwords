import { useState, useEffect } from 'react';
import './App.css';
import { api } from './services/api';
import LearnTab from './components/LearnTab';
import TestTab from './components/TestTab';
import LeaderboardTab from './components/LeaderboardTab';

// Telegram WebApp types
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        ready: () => void;
        expand: () => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        onEvent: (event: string, handler: (event: any) => void) => void;
      };
    };
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<'learn' | 'test' | 'leaderboard'>('learn');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      // Authenticate with backend
      authenticateUser();
    } else {
      console.warn('Telegram WebApp not available');
      setLoading(false);
    }
  }, []);

  const authenticateUser = async () => {
    try {
      const initData = window.Telegram.WebApp.initData;
      if (initData) {
        await api.authenticate(initData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="title">📚 Vocabulary Trainer</h1>

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'learn' ? 'active' : ''}`}
          onClick={() => setActiveTab('learn')}
        >
          📖 Learn
        </button>
        <button
          className={`tab ${activeTab === 'test' ? 'active' : ''}`}
          onClick={() => setActiveTab('test')}
        >
          ✍️ Test
        </button>
        <button
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Ranking
        </button>
      </div>

      {/* Tab Content */}
      <div className="content">
        {activeTab === 'learn' && <LearnTab />}
        {activeTab === 'test' && <TestTab />}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
      </div>
    </div>
  );
}

export default App;
