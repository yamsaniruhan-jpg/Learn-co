import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: 'primary' | 'secondary' | 'xp' | 'streak' | 'success' | 'warning' | 'purple';
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
    primary: 'bg-[#6C5CE7] dark:bg-[#8577ED]',
    secondary: 'bg-[#00B8A9] dark:bg-[#00D1C1]',
    xp: 'bg-[#FFB84D] dark:bg-[#FFC066]',
    streak: 'bg-[#FFB84D] dark:bg-[#FFC066]',
    success: 'bg-[#4CAF8E] dark:bg-[#5AC29E]',
    warning: 'bg-[#FFB84D] dark:bg-[#FFC066]',
    purple: 'bg-[#6C5CE7] dark:bg-[#8577ED]',
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-[#6B6890] dark:text-[#B4B0D5] mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={`w-full bg-[#E3DFF5] dark:bg-[#3D3861] rounded-full overflow-hidden ${sizeStyles[size]}`}
      >
        <div
          className={`h-full transition-all duration-300 rounded-full ${variantStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
