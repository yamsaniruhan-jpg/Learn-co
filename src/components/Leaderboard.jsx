// src/components/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { apiCall } from '../client/firebase';

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    apiCall(`/gamification/leaderboard?timeframe=${timeframe}`)
      .then(res => res.json())
      .then(data => setEntries(data.leaderboard || []))
      .catch(console.error);
  }, [timeframe]);

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg text-gray-900">🏆 Leaderboard</h2>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-2.5 py-1 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Time</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
        </select>
      </div>

      <div className="space-y-2">
        {entries.map(entry => (
          <div
            key={entry.uid}
            className={`flex items-center gap-3 p-2.5 rounded-lg border border-transparent transition-colors ${
              entry.rank <= 3 ? 'bg-amber-50/70 border-amber-200/50' : 'hover:bg-gray-50'
            }`}
          >
            <span className="w-8 text-center font-bold text-sm">
              {medals[entry.rank] || `#${entry.rank}`}
            </span>
            <div className="w-8 h-8 bg-blue-100 text-blue-700 font-semibold rounded-full flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
              {entry.picture ? (
                <img src={entry.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                entry.name?.[0] || '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{entry.name}</p>
              <p className="text-xs text-gray-400">Level {entry.level}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-blue-600">{entry.xp.toLocaleString()} XP</p>
              <p className="text-xs text-orange-500">🔥 {entry.streak}</p>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-xs text-center text-gray-400 py-6">No leaderboard entries available.</p>
        )}
      </div>
    </div>
  );
}
