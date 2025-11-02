import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface LeaderboardEntry {
  position: number;
  id: number;
  telegramId: string;
  username: string | null;
  fullName: string | null;
  totalScore: number;
  testCount: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUser: {
    position: number | null;
    totalScore: number;
  };
  range: string;
}

export default function LeaderboardTab() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadLeaderboard(range);
  }, [range]);

  const loadLeaderboard = async (r: 'week' | 'month' | 'all') => {
    setLoading(true);
    try {
      const result = await api.getLeaderboard(r);
      setData(result);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  if (!data) {
    return <div className="empty-state">No leaderboard data available</div>;
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="leaderboard-tab">
      <div className="range-selector">
        <button
          className={`range-btn ${range === 'week' ? 'active' : ''}`}
          onClick={() => setRange('week')}
        >
          Week
        </button>
        <button
          className={`range-btn ${range === 'month' ? 'active' : ''}`}
          onClick={() => setRange('month')}
        >
          Month
        </button>
        <button
          className={`range-btn ${range === 'all' ? 'active' : ''}`}
          onClick={() => setRange('all')}
        >
          All Time
        </button>
      </div>

      {/* Current User Stats */}
      <div className="current-user-stats">
        <h3>Your Stats</h3>
        <div className="user-stat">
          <span>Position:</span>
          <strong>{data.currentUser.position || 'N/A'}</strong>
        </div>
        <div className="user-stat">
          <span>Total Score:</span>
          <strong>{data.currentUser.totalScore}</strong>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="leaderboard-list">
        <h3>Top Users</h3>
        {data.leaderboard.map((entry) => (
          <div
            key={entry.id}
            className={`leaderboard-item ${entry.position <= 3 ? 'top-three' : ''}`}
          >
            <div className="entry-rank">
              {entry.position <= 3 ? medals[entry.position - 1] : `#${entry.position}`}
            </div>
            <div className="entry-name">
              {entry.username || entry.fullName || 'Anonymous'}
            </div>
            <div className="entry-score">{entry.totalScore}</div>
          </div>
        ))}
      </div>

      {data.leaderboard.length === 0 && (
        <div className="empty-state">No entries yet. Be the first!</div>
      )}
    </div>
  );
}

