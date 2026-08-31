import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Learn.co Original Geometric Mark: The Prism of Thought */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-sm shadow-indigo-500/20`}
      >
        <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center relative overflow-hidden">
          {/* Internal Geometric Accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-transparent pointer-events-none" />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5 text-white transform -rotate-6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Custom stylized L & Node prism geometry */}
            <path d="M4 4v16h16" />
            <path d="M4 14l6-6 4 4 6-6" className="text-cyan-400 stroke-cyan-300" strokeWidth="2.5" />
            <circle cx="20" cy="6" r="2" fill="#38bdf8" />
          </svg>
        </div>
      </div>

      {showWordmark && (
        <div className="flex items-baseline">
          <span
            className={`font-black tracking-tight text-slate-900 dark:text-white font-display ${textSizes[size]}`}
          >
            Learn
          </span>
          <span
            className={`font-bold tracking-tight text-indigo-600 dark:text-indigo-400 font-display ${textSizes[size]}`}
          >
            .co
          </span>
        </div>
      )}
    </div>
  );
};
