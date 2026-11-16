import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ALL_APP_FEATURES, NavFeature } from '../../utils/navigationFeatures';
import { useAuth } from '../../context/AuthContext';

interface SlidingTaskbarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

export const SlidingTaskbar: React.FC<SlidingTaskbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, profile } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'admin' || profile?.role === 'admin';

  const visibleFeatures = ALL_APP_FEATURES.filter((feat) => feat.id !== 'admin' || isAdmin);

  const scrollBy = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF]/90 dark:bg-[#2A2647]/90 backdrop-blur-md border-b border-[#E3DFF5] dark:border-[#3D3861] py-2 px-3 sm:px-6 sticky top-16 z-20 shadow-xs">
      <div className="max-w-[1600px] mx-auto flex items-center gap-2">
        {/* Left Scroll Button */}
        <button
          onClick={() => scrollBy(-280)}
          className="hidden sm:flex p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-xs cursor-pointer"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Sliding Horizontally Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto scrollbar-none flex items-center gap-2 py-1 scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visibleFeatures.map((feat) => {
            const Icon = feat.icon;
            const isActive = activeTab === feat.id;
            return (
              <button
                key={`slide-tab-${feat.id}`}
                onClick={() => setActiveTab(feat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]'
                    : 'bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                <span className="whitespace-nowrap">{feat.shortLabel || feat.label}</span>
                {feat.highlight && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scrollBy(280)}
          className="hidden sm:flex p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-xs cursor-pointer"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
