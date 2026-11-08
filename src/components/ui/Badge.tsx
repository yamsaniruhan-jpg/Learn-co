import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline' | 'xp' | 'streak' | 'math' | 'cs' | 'physics' | 'chemistry' | 'biology' | 'english' | 'data_science';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 font-bold',
    md: 'text-xs px-3 py-1 font-bold',
    lg: 'text-sm px-3.5 py-1.5 font-extrabold',
  };

  // Requirement: Opaque solid backgrounds, high contrast WCAG AA, borders #E3DFF5
  const variantStyles = {
    default: 'bg-[#F0EDFA] dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#E3DFF5] dark:border-[#3D3861]',
    primary: 'bg-[#6C5CE7] text-white border border-[#5b4bc4]',
    success: 'bg-[#4CAF8E] text-white border border-[#3e9375]',
    warning: 'bg-[#FFB84D] text-[#2D2A4A] border border-[#e09d3b]',
    error: 'bg-[#F25F5C] text-white border border-[#d64a47]',
    outline: 'bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF]',
    xp: 'bg-[#FFB84D] text-[#2D2A4A] border border-[#e09d3b] font-black',
    streak: 'bg-[#FF9F43] text-[#2D2A4A] border border-[#e08630] font-black',
    math: 'bg-[#6C5CE7] text-white border border-[#5b4bc4]',
    cs: 'bg-[#00B8A9] text-white border border-[#009b8e]',
    physics: 'bg-[#3867D6] text-white border border-[#2b53b0]',
    chemistry: 'bg-[#20BF6B] text-white border border-[#199955]',
    biology: 'bg-[#E056FD] text-white border border-[#b83acc]',
    english: 'bg-[#8854D0] text-white border border-[#6f3fb0]',
    data_science: 'bg-[#00D2D3] text-[#2D2A4A] border border-[#00abab]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full select-none whitespace-nowrap shadow-[0_1px_2px_rgba(45,42,74,0.04)] ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      )}
      {children}
    </span>
  );
};
