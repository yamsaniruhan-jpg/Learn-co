// src/components/GamificationBar.jsx
import { useState, useEffect } from 'react';
import { apiCall } from '../client/firebase';

export default function GamificationBar() {
  const [profile, setProfile] = useState(null);
  const [showBadges, setShowBadges] = useState(false);

  useEffect(() => {
    apiCall('/gamification/profile')
      .then(res => res.json())
      .then(setProfile)
      .catch(console.error);
  }, []);

  if (!profile) return null;

  const nextXP = profile.nextLevelXP || 100;
  const progressPercent = Math.min(Math.max((profile.xp / nextXP) * 100, 0), 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-700">
            {profile.level}
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900">Level {profile.level}</p>
            <p className="text-xs text-gray-400">{profile.xp} / {profile.nextLevelXP} XP</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="text-orange-500">🔥 {profile.streak}</span>
          <span className="text-amber-500">⭐ {profile.xp}</span>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-700"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Badges */}
      <button
        onClick={() => setShowBadges(!showBadges)}
        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
      >
        {showBadges ? 'Hide' : 'Show'} Badges ({(profile.badges || []).length})
      </button>

      {showBadges && (
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100">
          {(profile.badges || []).map(badge => (
            <div
              key={badge.badgeId}
              className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 text-xs text-amber-900"
              title={badge.badgeName}
            >
              <span>{badge.icon}</span>
              <span>{badge.badgeName}</span>
            </div>
          ))}
          {(!profile.badges || profile.badges.length === 0) && (
            <p className="text-xs text-gray-400">Complete lessons and quizzes to earn badges!</p>
          )}
        </div>
      )}
    </div>
  );
}
