import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  variant?: 'default' | 'error';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  variant = 'default',
  className = '',
}) => {
  const isError = variant === 'error';
  return (
    <div
      role={isError ? 'alert' : undefined}
      className={`flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-2xl border ${
        isError
          ? 'border-[#F25F5C]/35 dark:border-[#FA7270]/40 bg-[#FFF5F5] dark:bg-[#2E1B24]'
          : 'border-dashed border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647]'
      } ${className}`}
    >
      <div
        className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 shadow-xs ${
          isError
            ? 'bg-[#FFE8E8] dark:bg-[#3A2029] text-[#F25F5C] dark:text-[#FA7270] border-[#F25F5C]/30'
            : 'bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED] border-[#E3DFF5] dark:border-[#3D3861]'
        }`}
      >
        {icon || <HelpCircle className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">{title}</h3>
      <p className="text-xs sm:text-sm text-[#6B6890] dark:text-[#B4B0D5] mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>
      {action ? (
        <div className="mt-5">{action}</div>
      ) : actionLabel && onAction ? (
        <div className="mt-5">
          <Button variant={isError ? 'destructive' : 'primary'} size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
