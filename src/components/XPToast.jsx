// src/components/XPToast.jsx
import { useState, useEffect } from 'react';

export default function XPToast({ xpEvent, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible || !xpEvent) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 
      transition-all duration-300 min-w-[240px] ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚡</span>
        <div>
          <p className="font-bold text-emerald-600">+{xpEvent.xpAwarded} XP</p>
          <p className="text-xs text-gray-500 capitalize">{xpEvent.action?.replace(/([A-Z])/g, ' $1')}</p>
        </div>
      </div>
      {xpEvent.leveledUp && (
        <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-purple-700">🎉 Level Up! Level {xpEvent.level}</p>
        </div>
      )}
      {xpEvent.newBadges?.length > 0 && (
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
          <p className="text-xs font-bold text-amber-800">
            🏅 New Badge: {xpEvent.newBadges[0].icon} {xpEvent.newBadges[0].badgeName}
          </p>
        </div>
      )}
    </div>
  );
}
