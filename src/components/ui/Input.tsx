import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-[#2D2A4A] dark:text-[#F1EFFF]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#6B6890] dark:text-[#B4B0D5] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full min-h-[44px] rounded-xl border bg-[#FFFFFF] dark:bg-[#2A2647] px-4 py-2.5 text-sm text-[#2D2A4A] dark:text-[#F1EFFF] transition-all placeholder:text-[#8E8BAF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-[#6C5CE7] disabled:opacity-50 disabled:bg-[#F7F5FF] dark:disabled:bg-[#1E1B33] ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error
                ? 'border-[#F25F5C] focus:border-[#F25F5C] focus:ring-[#F25F5C]'
                : 'border-[#E3DFF5] dark:border-[#3D3861]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-[#6B6890] dark:text-[#B4B0D5] flex items-center">{rightIcon}</div>
          )}
        </div>
        {error && <p className="text-xs text-[#F25F5C] font-bold">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] font-medium">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-[#2D2A4A] dark:text-[#F1EFFF]">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={`w-full min-h-[96px] rounded-xl border bg-[#FFFFFF] dark:bg-[#2A2647] p-3.5 text-sm text-[#2D2A4A] dark:text-[#F1EFFF] transition-all placeholder:text-[#8E8BAF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-[#6C5CE7] disabled:opacity-50 disabled:bg-[#F7F5FF] dark:disabled:bg-[#1E1B33] ${
            error
              ? 'border-[#F25F5C] focus:border-[#F25F5C] focus:ring-[#F25F5C]'
              : 'border-[#E3DFF5] dark:border-[#3D3861]'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[#F25F5C] font-bold">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] font-medium">{helperText}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
