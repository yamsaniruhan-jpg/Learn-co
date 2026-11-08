import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface AIUsageIndicatorProps {
  userTier?: 'free' | 'pro' | 'super' | string;
  className?: string;
  onUpgradeClick?: () => void;
}

export const AIUsageIndicator: React.FC<AIUsageIndicatorProps> = ({
  userTier: explicitTier,
  className = '',
  onUpgradeClick,
}) => {
  const { user } = useAuth();
  const effectiveTier = explicitTier || user?.subscription || 'free';
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining?: number }>({
    used: 0,
    limit: effectiveTier === 'super' ? 500 : effectiveTier === 'pro' ? 100 : 10,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/ai/usage')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (isMounted && data && typeof data.used === 'number') {
          setUsage(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveTier]);

  const limit = usage.limit || 10;
  const used = usage.used || 0;
  const remaining = Math.max(0, limit - used);
  const percentage = (used / limit) * 100;
  const isWarning = percentage > 80;
  const isCritical = percentage >= 95;

  return (
    <div
      className={`ai-usage-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-[0_1px_3px_rgba(45,42,74,0.06)] min-h-[36px] select-none ${
        isCritical
          ? 'bg-[#F25F5C] text-white'
          : isWarning
          ? 'bg-[#FFB84D] text-[#2D2A4A]'
          : 'bg-[#4CAF8E] text-white'
      } ${className}`}
      title={`AI Hourly Quota: ${used} used of ${limit} limit (${remaining} remaining)`}
    >
      <span className="flex items-center gap-1.5 font-bold">
        <Bot className="w-3.5 h-3.5 shrink-0" />
        <span>AI: {isLoading ? '...' : `${remaining} left`}</span>
      </span>
      {isCritical && effectiveTier === 'free' && (
        <button
          onClick={onUpgradeClick}
          className="ml-1 inline-flex items-center gap-0.5 underline font-extrabold hover:opacity-90 cursor-pointer"
        >
          <span>Upgrade</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default AIUsageIndicator;
