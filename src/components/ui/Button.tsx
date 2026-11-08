import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'xp' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  // Min tap targets: min 44px (md/lg), sm minimum 38-40px, rounded 12-16px, solid colors
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 min-h-[38px] gap-1.5',
    md: 'text-sm px-4.5 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-[0_2px_6px_rgba(108,92,231,0.25)] focus-visible:outline-[#6C5CE7]',
    secondary:
      'bg-[#00B8A9] hover:bg-[#009e91] text-white shadow-[0_2px_6px_rgba(0,184,169,0.25)] focus-visible:outline-[#00B8A9]',
    outline:
      'border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] focus-visible:outline-[#6C5CE7]',
    ghost:
      'bg-transparent hover:bg-[#F0EDFA] dark:hover:bg-[#2A2647] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]',
    destructive:
      'bg-[#F25F5C] hover:bg-[#e04e4b] text-white shadow-[0_2px_6px_rgba(242,95,92,0.25)] focus-visible:outline-[#F25F5C]',
    xp: 'bg-[#FFB84D] hover:bg-[#f0a93c] text-[#2D2A4A] font-extrabold shadow-[0_2px_6px_rgba(255,184,77,0.3)] focus-visible:outline-[#FFB84D]',
    success:
      'bg-[#4CAF8E] hover:bg-[#409c7d] text-white shadow-[0_2px_6px_rgba(76,175,142,0.25)] focus-visible:outline-[#4CAF8E]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
