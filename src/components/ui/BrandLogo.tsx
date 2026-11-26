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
    md: 'w-8 h-8 rounded-lg',
    lg: 'w-10 h-10 rounded-xl',
    xl: 'w-12 h-12 rounded-xl',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* LearnCo Official Architectural Emblem */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center overflow-hidden bg-[#09090B] border border-[#6C5CE7]/40 dark:border-[#CCFF00]/40 shrink-0 group`}
      >
        <img
          src="/logo-mark.png"
          alt="LearnCo Logo"
          className="w-full h-full object-contain p-0.5 transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {showWordmark && (
        <div className="flex items-baseline gap-0.5">
          <span
            className={`font-bold uppercase tracking-[0.22em] text-[#2D2A4A] dark:text-[#F4F4F6] font-display ${textSizes[size]}`}
          >
            Learn
          </span>
          <span
            className={`font-bold uppercase tracking-[0.22em] text-[#6C5CE7] dark:text-[#CCFF00] font-display ${textSizes[size]}`}
          >
            Co
          </span>
        </div>
      )}
    </div>
  );
};
