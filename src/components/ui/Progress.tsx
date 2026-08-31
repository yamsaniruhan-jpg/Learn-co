import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: 'primary' | 'xp' | 'streak' | 'success' | 'warning' | 'purple';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  className = '',
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeStyles = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantStyles = {
    primary: 'bg-indigo-600 dark:bg-indigo-500',
    xp: 'bg-gradient-to-r from-amber-500 to-amber-400',
    streak: 'bg-gradient-to-r from-orange-500 to-amber-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    purple: 'bg-purple-600',
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${sizeStyles[size]}`}
      >
        <div
          className={`h-full transition-all duration-300 rounded-full ${variantStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
