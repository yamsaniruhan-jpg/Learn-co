import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'segmented';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className = '',
}) => {
  if (variant === 'segmented') {
    return (
      <div
        className={`flex p-1 bg-[#F0EDFA] dark:bg-[#1E1B33] rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] overflow-x-auto ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 min-w-fit min-h-[40px] flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all duration-150 select-none cursor-pointer ${
                isActive
                  ? 'bg-[#FFFFFF] dark:bg-[#2A2647] text-[#6C5CE7] dark:text-[#8577ED] shadow-[0_1px_3px_rgba(45,42,74,0.08)]'
                  : 'text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isActive
                      ? 'bg-[#6C5CE7] text-white'
                      : 'bg-[#E3DFF5] dark:bg-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-[#E3DFF5] dark:border-[#3D3861] overflow-x-auto gap-4 sm:gap-6 ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`min-h-[44px] flex items-center gap-2 py-2.5 px-1 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors select-none cursor-pointer ${
                isActive
                  ? 'border-[#6C5CE7] text-[#6C5CE7] dark:border-[#8577ED] dark:text-[#8577ED]'
                  : 'border-transparent text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-[#6C5CE7] text-white'
                      : 'bg-[#F0EDFA] dark:bg-[#2A2647] text-[#6B6890] dark:text-[#B4B0D5]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default pills
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all select-none cursor-pointer ${
              isActive
                ? 'bg-[#6C5CE7] text-white shadow-[0_2px_6px_rgba(108,92,231,0.25)]'
                : 'bg-[#FFFFFF] dark:bg-[#2A2647] text-[#6B6890] dark:text-[#B4B0D5] border border-[#E3DFF5] dark:border-[#3D3861] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-white text-[#6C5CE7]'
                    : 'bg-[#F0EDFA] dark:bg-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
