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
      className="w-full bg-[#FFFFFF] dark:bg-[#2A2647] border-b border-[#E3DFF5] dark:border-[#3D3861] py-1 px-2.5 sm:px-6 sticky top-14 sm:top-16 z-20"
    >
      <div className="max-w-[1600px] mx-auto flex items-center gap-1.5">
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scrollBy(-260)}
          disabled={!canScrollLeft}
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] disabled:opacity-35 disabled:cursor-default transition-colors shrink-0 cursor-pointer"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable wrapper with overflow edge fade gradients */}
        <div className="relative flex-1 min-w-0">
          {canScrollLeft && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-[#FFFFFF] dark:from-[#2A2647] to-transparent z-10"
            />
          )}
          {canScrollRight && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-[#FFFFFF] dark:from-[#2A2647] to-transparent z-10"
            />
          )}

          {/* Sliding Horizontally Scrollable Container */}
          <div
            ref={scrollContainerRef}
            onScroll={updateScrollEdges}
            role="tablist"
            aria-label="Application sections"
            className="w-full overflow-x-auto flex items-center gap-1 py-0.5 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C5CE7] ${
                    isActive
                      ? 'bg-[#6C5CE7] text-white font-bold shadow-xs'
                      : 'bg-transparent hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#6C5CE7] dark:text-[#8577ED]'}`} />
                  <span className="whitespace-nowrap">{feat.shortLabel || feat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scrollBy(260)}
          disabled={!canScrollRight}
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] disabled:opacity-35 disabled:cursor-default transition-colors shrink-0 cursor-pointer"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
