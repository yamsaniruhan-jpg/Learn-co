import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface BreadcrumbsProps {
  items: { label: string; tabId?: string }[];
  onNavigate?: (tabId: string) => void;
  onBack?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  onNavigate,
  onBack,
}) => {
  return (
    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-[#6B6890] dark:text-[#B8B3D9]">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] min-h-[48px] min-w-[48px] cursor-pointer"
          title="Go Back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
      )}

      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861]">
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#6B6890]" />}
            {item.tabId && onNavigate ? (
              <button
                onClick={() => onNavigate(item.tabId!)}
                className="hover:text-[#6C5CE7] transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ) : (
              <span className={idx === items.length - 1 ? 'text-[#6C5CE7] font-black' : ''}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
