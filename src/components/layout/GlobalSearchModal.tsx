import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Target,
  Sparkles,
  Compass,
  Calendar,
  Award,
  ArrowRight,
  Calculator,
  Terminal,
  Atom,
  FlaskConical,
  Dna,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string, context?: any) => void;
  onSelectConcept?: (conceptId: string) => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: 'Subject' | 'Practice' | 'Tool' | 'Concept' | 'Action';
  tabId: string;
  context?: any;
  icon: React.ReactNode;
  detail?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'math',
    title: 'Mathematics & Calculus Track',
    category: 'Subject',
    tabId: 'learn',
    context: { subjectId: 'math' },
    icon: <Calculator className="w-4 h-4 text-indigo-500" />,
    detail: 'Derivatives, Integrals, Linear Algebra, Optimization',
  },
  {
    id: 'cs',
    title: 'Computer Science & AI Track',
    category: 'Subject',
    tabId: 'learn',
    context: { subjectId: 'cs' },
    icon: <Terminal className="w-4 h-4 text-amber-500" />,
    detail: 'Gradient Descent, Transformers, Data Structures, Complexity',
  },
  {
    id: 'physics',
    title: 'Physics & Classical Mechanics Track',
    category: 'Subject',
    tabId: 'learn',
    context: { subjectId: 'physics' },
    icon: <Atom className="w-4 h-4 text-sky-500" />,
    detail: 'Work-Energy, Thermodynamics, Electromagnetism, Quantum',
  },
  {
    id: 'chemistry',
    title: 'Chemistry & Molecular Dynamics Track',
    category: 'Subject',
    tabId: 'learn',
    context: { subjectId: 'chemistry' },
    icon: <FlaskConical className="w-4 h-4 text-emerald-500" />,
    detail: 'Reaction Kinetics, SN1/SN2 Stereochemistry, Equilibrium',
  },
  {
    id: 'biology',
    title: 'Biology & Genetics Track',
    category: 'Subject',
    tabId: 'learn',
    context: { subjectId: 'biology' },
    icon: <Dna className="w-4 h-4 text-rose-500" />,
    detail: 'Cellular Respiration, CRISPR Gene Editing, Signal Pathways',
  },
  {
    id: 'practice-adaptive',
    title: 'Launch 5-Question Adaptive Practice Ladder',
    category: 'Practice',
    tabId: 'practice',
    icon: <Target className="w-4 h-4 text-indigo-600" />,
    detail: 'Calibrated diagnostic ladder with progressive hints & XP',
  },
  {
    id: 'creator-studio',
    title: 'AI Creator Studio (PDF & Notes to Flashcards/Quizzes)',
    category: 'Tool',
    tabId: 'create',
    icon: <Sparkles className="w-4 h-4 text-amber-500" />,
    detail: 'Upload course notes, syllabus, or research papers',
  },
  {
    id: 'copilot-socratic',
    title: 'Omni Socratic AI Copilot',
    category: 'Tool',
    tabId: 'copilot',
    icon: <Sparkles className="w-4 h-4 text-purple-500" />,
    detail: 'Interactive first-principles tutor and step-by-step solver',
  },
  {
    id: 'mentor-diag',
    title: 'Personal Mentor & Ebbinghaus Retention Forecast',
    category: 'Tool',
    tabId: 'mentor',
    icon: <Compass className="w-4 h-4 text-emerald-500" />,
    detail: 'Cognitive gap analysis & weekly study prescriptions',
  },
  {
    id: 'study-planner',
    title: 'Study Timetable & Planner',
    category: 'Tool',
    tabId: 'planner',
    icon: <Calendar className="w-4 h-4 text-blue-500" />,
    detail: 'Manage weekly study sessions and exam preparation schedule',
  },
  {
    id: 'gamification-badges',
    title: 'XP Economy, Streaks & Leaderboard',
    category: 'Tool',
    tabId: 'gamification',
    icon: <Award className="w-4 h-4 text-amber-500" />,
    detail: 'View tier progression, unlocked badges, and daily study streak',
  },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = SEARCH_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.detail?.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        onNavigate(selected.tabId, selected.context);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search STEM tracks, practice ladders, AI tools, or study planner... (⌘K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100/50 dark:divide-slate-800/50">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching modules or concepts found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.tabId, item.context);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-bold truncate">{item.title}</p>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {item.category}
                        </span>
                      </div>
                      {item.detail && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.detail}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Learn.co Omni Search</span>
        </div>
      </div>
    </div>
  );
};
