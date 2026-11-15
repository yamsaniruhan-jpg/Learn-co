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
    sm: 'w-7 h-7 rounded-xl',
    md: 'w-9 h-9 rounded-2xl',
    lg: 'w-11 h-11 rounded-2xl',
    xl: 'w-14 h-14 rounded-3xl',
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
        className={`${iconSizes[size]} relative flex items-center justify-center overflow-hidden bg-[#01000E] border border-indigo-500/40 shadow-sm shadow-indigo-500/30 shrink-0 group`}
      >
        <img
          src="/logo-mark.png"
          alt="LearnCo Logo"
          className="w-full h-full object-contain p-0.5 transition-transform duration-300 group-hover:scale-110"
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
