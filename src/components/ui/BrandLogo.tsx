import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
    xl: 'w-14 h-14 rounded-2xl',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* LearnCo Official Glowing Emblem */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center overflow-hidden bg-slate-950 border border-indigo-500/40 shadow-sm shadow-indigo-500/30 shrink-0 group`}
      >
        <img
          src="/assets/aistudio/Screenshot_20261025-000443_ChatGPT_a6cdbef4.jpg"
          alt="LearnCo Website Icon"
          className="w-full h-full object-cover scale-110 transition-transform duration-300 group-hover:scale-120"
        />
      </div>

      {showWordmark && (
        <div className="flex items-baseline">
          <span
            className={`font-black tracking-tight text-slate-900 dark:text-white font-display ${textSizes[size]}`}
          >
            Learn
          </span>
          <span
            className={`font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent font-display ${textSizes[size]}`}
          >
            Co
          </span>
        </div>
      )}
    </div>
  );
};
