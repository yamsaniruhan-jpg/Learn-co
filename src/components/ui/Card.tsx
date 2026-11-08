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
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  // Requirement: Solid opaque surfaces (#FFFFFF light, #2A2647 dark), soft solid shadows, rounded 12-16px, border #E3DFF5
  const variantStyles = {
    default:
      'bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-2xl shadow-[0_2px_8px_rgba(45,42,74,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
    subtle:
      'bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] rounded-2xl',
    elevated:
      'bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-2xl shadow-[0_8px_20px_rgba(45,42,74,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]',
    interactive:
      'bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-2xl shadow-[0_2px_8px_rgba(45,42,74,0.06)] hover:shadow-[0_8px_20px_rgba(108,92,231,0.12)] hover:border-[#6C5CE7] dark:hover:border-[#8577ED] transition-all duration-200 cursor-pointer',
    bordered:
      'bg-transparent border-2 border-dashed border-[#E3DFF5] dark:border-[#3D3861] rounded-2xl',
  };

  return (
    <div className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};
