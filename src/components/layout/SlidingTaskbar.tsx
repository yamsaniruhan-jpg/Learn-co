import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ALL_APP_FEATURES } from '../../utils/navigationFeatures';
import { useAuth } from '../../context/AuthContext';

interface SlidingTaskbarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

export const SlidingTaskbar: React.FC<SlidingTaskbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, profile } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isAdmin = user?.role === 'admin' || profile?.role === 'admin';
  const visibleFeatures = ALL_APP_FEATURES.filter((feat) => feat.id !== 'admin' || isAdmin);

  const updateScrollEdges = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollEdges();
    const el = scrollContainerRef.current;
    if (!el) return;
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateScrollEdges());
      ro.observe(el);
    }
    window.addEventListener('resize', updateScrollEdges);
    return () => {
      window.removeEventListener('resize', updateScrollEdges);
      ro?.disconnect();
    };
  }, [updateScrollEdges, visibleFeatures.length]);

  useEffect(() => {
    if (activeTabRef.current && typeof activeTabRef.current.scrollIntoView === 'function') {
      activeTabRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const scrollBy = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % visibleFeatures.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + visibleFeatures.length) % visibleFeatures.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = visibleFeatures.length - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      const targetFeat = visibleFeatures[nextIdx];
      if (targetFeat) {
        setActiveTab(targetFeat.id);
        tabRefs.current[nextIdx]?.focus();
      }
    }
  };

  return (
    <nav
      aria-label="Quick tab switcher"
      className="w-full bg-[#FFFFFF] dark:bg-[#2A2647] border-b border-[#E3DFF5] dark:border-[#3D3861] py-2 px-3 sm:px-6 sticky top-16 z-20 shadow-xs"
    >
      <div className="max-w-[1600px] mx-auto flex items-center gap-2">
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scrollBy(-280)}
          disabled={!canScrollLeft}
          className="hidden sm:flex p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-35 disabled:cursor-default transition-colors shrink-0 shadow-xs cursor-pointer"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable wrapper with overflow edge fade gradients */}
        <div className="relative flex-1 min-w-0">
          {canScrollLeft && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-[#FFFFFF] dark:from-[#2A2647] to-transparent z-10"
            />
          )}
          {canScrollRight && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-[#FFFFFF] dark:from-[#2A2647] to-transparent z-10"
            />
          )}

          {/* Sliding Horizontally Scrollable Container */}
          <div
            ref={scrollContainerRef}
            onScroll={updateScrollEdges}
            role="tablist"
            aria-label="Application sections"
            className="w-full overflow-x-auto flex items-center gap-2 py-1 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {visibleFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              const isActive = activeTab === feat.id;
              return (
                <button
                  key={`slide-tab-${feat.id}`}
                  ref={(el) => {
                    tabRefs.current[idx] = el;
                    if (isActive) activeTabRef.current = el;
                  }}
                  type="button"
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  aria-selected={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  onClick={() => setActiveTab(feat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
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
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scrollBy(280)}
          disabled={!canScrollRight}
          className="hidden sm:flex p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-35 disabled:cursor-default transition-colors shrink-0 shadow-xs cursor-pointer"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
