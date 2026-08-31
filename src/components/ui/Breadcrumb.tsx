import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      <ol className="flex items-center space-x-1.5 overflow-x-auto py-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center whitespace-nowrap">
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 shrink-0" />}
              {isLast ? (
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  {item.icon}
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  onClick={item.onClick}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  {item.icon}
                  {item.label}
                </button>
              ) : (
                <span className="flex items-center gap-1.5 font-medium">
                  {item.icon}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
