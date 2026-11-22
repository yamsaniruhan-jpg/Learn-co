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

  // Requirement: Solid opaque surfaces (#FFFFFF light, #2A2647 dark), crisp borders, compact mobile fit
  const variantStyles = {
    default:
      'bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-2xl shadow-[0_1px_4px_rgba(45,42,74,0.05)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.28)]',
    subtle:
      'bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] rounded-2xl',
    elevated:
      'bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-2xl shadow-[0_6px_18px_rgba(45,42,74,0.07)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.36)]',
    interactive:
      'bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-2xl shadow-[0_1px_4px_rgba(45,42,74,0.05)] hover:shadow-[0_6px_18px_rgba(108,92,231,0.12)] hover:border-[#6C5CE7] dark:hover:border-[#8577ED] transition-all duration-150 cursor-pointer',
    bordered:
      'bg-transparent border border-dashed border-[#E3DFF5] dark:border-[#3D3861] rounded-2xl',
  };

  return (
    <div className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};
