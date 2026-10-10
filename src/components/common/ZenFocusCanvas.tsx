import React, { useState, useEffect } from 'react';
import {
  Minimize2,
  Maximize2,
  Play,
  Pause,
  RotateCcw,
  Edit3,
  X,
  BookOpen,
  Sparkles,
  Clock,
  Trash2,
} from 'lucide-react';

interface ZenFocusCanvasProps {
  isActive: boolean;
  onExit: () => void;
  children: React.ReactNode;
}

export const ZenFocusCanvas: React.FC<ZenFocusCanvasProps> = ({
  isActive,
  onExit,
  children,
}) => {
  // Pomodoro Timer State (25 minutes standard)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchNotes, setScratchNotes] = useState(() => {
    return localStorage.getItem('learnco_zen_scratchpad') || '';
  });

  // Listen for Escape key to exit Zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onExit]);

  // Pomodoro countdown timer
  useEffect(() => {
    if (!isRunning || !isActive) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isActive]);

  const handleNotesChange = (val: string) => {
    setScratchNotes(val);
    localStorage.setItem('learnco_zen_scratchpad', val);
  };

  if (!isActive) return <>{children}</>;

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-40 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Floating Minimalist Control Pill */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 px-3 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl text-xs">
        {/* Timer Display */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>{timeFormatted}</span>
        </div>

        {/* Timer Play / Pause */}
        <button
          onClick={() => setIsRunning((prev) => !prev)}
          title={isRunning ? 'Pause Timer' : 'Start Focus Timer'}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Timer Reset */}
        <button
          onClick={() => {
            setIsRunning(false);
            setTimerSeconds(25 * 60);
          }}
          title="Reset to 25 mins"
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Scratchpad Toggle */}
        <button
          onClick={() => setIsScratchpadOpen((prev) => !prev)}
          className={`px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 transition-all cursor-pointer ${
            isScratchpadOpen
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Scratchpad & Derivation Notes"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Scratchpad</span>
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Exit Zen Mode */}
        <button
          onClick={onExit}
          className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="Exit Zen Mode (or press Escape)"
        >
          <Minimize2 className="w-3 h-3" />
          <span>Exit Zen</span>
        </button>
      </div>

      {/* Main Study Canvas Stage */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-16">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>

      {/* Slide-out Scratchpad Drawer */}
      {isScratchpadOpen && (
        <div className="fixed right-4 bottom-4 top-20 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 flex flex-col z-50 animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Edit3 className="w-4 h-4 text-indigo-500" />
              <span>Derivation Scratchpad</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleNotesChange('')}
                title="Clear notes"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsScratchpadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <textarea
            value={scratchNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Jot down rough calculations, variable substitution invariants, step-by-step limits..."
            className="flex-1 w-full bg-transparent p-2 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none mt-2"
          />

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Auto-saved to local memory</span>
            <span>{scratchNotes.length} chars</span>
          </div>
        </div>
      )}
    </div>
  );
};
