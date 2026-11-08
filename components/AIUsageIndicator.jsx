// components/AIUsageIndicator.jsx
import React, { useState, useEffect } from 'react';

export default function AIUsageIndicator({ userTier = 'free' }) {
  const [usage, setUsage] = useState({ used: 0, limit: 10 });

  useEffect(() => {
    fetch('/api/ai/usage')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.used === 'number') {
          setUsage(data);
        }
      })
      .catch(err => {
        console.warn('Failed to load AI usage:', err);
      });
  }, []);

  const limit = usage.limit || 10;
  const used = usage.used || 0;
  const percentage = (used / limit) * 100;
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  return (
    <div
      className={`ai-usage-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-sm select-none ${
        isCritical
          ? 'bg-[#F25F5C] text-white'
          : isWarning
          ? 'bg-[#FFB84D] text-[#2D2A4A]'
          : 'bg-[#4CAF8E] text-white'
      }`}
    >
      <span className="flex items-center gap-1">
        <span>🤖</span>
        <span>AI: {Math.max(0, limit - used)} remaining</span>
      </span>
      {isCritical && userTier === 'free' && (
        <a
          href="#pricing"
          className="ml-1.5 underline text-xs font-extrabold hover:opacity-90"
        >
          Upgrade for more →
        </a>
      )}
    </div>
  );
}
