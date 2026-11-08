import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647] ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-center mb-4 shadow-xs">
        {icon || <HelpCircle className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">{title}</h3>
      <p className="text-xs sm:text-sm text-[#6B6890] dark:text-[#B4B0D5] mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
