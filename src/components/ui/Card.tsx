import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'elevated' | 'interactive' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-2.5 sm:p-3.5',
    md: 'p-3.5 sm:p-5',
    lg: 'p-4 sm:p-6',
  };

  // Solid architectural surfaces (#FFFFFF light, #111114 obsidian dark) with hairline borders
  const variantStyles = {
    default:
      'bg-[#FFFFFF] dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] rounded-xl shadow-[0_1px_3px_rgba(45,42,74,0.04)] dark:shadow-none',
    subtle:
      'bg-[#F7F5FF] dark:bg-[#09090B] border border-[#E3DFF5] dark:border-[#232329] rounded-xl',
    elevated:
      'bg-[#FFFFFF] dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#2A2A32] rounded-xl shadow-[0_6px_18px_rgba(45,42,74,0.07)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)]',
    interactive:
      'bg-[#FFFFFF] dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] rounded-xl shadow-[0_1px_3px_rgba(45,42,74,0.04)] hover:shadow-[0_6px_18px_rgba(108,92,231,0.12)] hover:border-[#6C5CE7] dark:hover:border-[#CCFF00]/60 transition-all duration-150 cursor-pointer',
    bordered:
      'bg-transparent border border-dashed border-[#E3DFF5] dark:border-[#2A2A32] rounded-xl',
  };

  return (
    <div className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};
