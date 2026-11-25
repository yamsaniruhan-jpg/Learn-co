import React, { useState, useEffect } from 'react';
import { BookMarked, Search, Trash2, ArrowRight, Sparkles, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { SubjectId } from '../../types';

interface SavedItem {
  id: string;
  title: string;
  type: 'concept' | 'qa' | 'course' | 'note';
  preview: string;
  subject?: string;
  timestamp: string;
  tabTarget?: string;
}

interface SavedViewProps {
  onNavigate: (tabId: string, context?: any) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({ onNavigate }) => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    // Load bookmarks from local storage & recent state
    try {
      const storedBookmarks = localStorage.getItem('learnco_bookmarked_items');
      const parsed = storedBookmarks ? JSON.parse(storedBookmarks) : [
        {
          id: 'sav-1',
          title: 'Maxwell-Boltzmann Distribution Speed Derivation',
          type: 'concept',
          preview: 'Statistical mechanics derivation of molecular speeds in ideal gases.',
          subject: 'Physics',
          timestamp: '2 hours ago',
          tabTarget: 'concepts'
        },
        {
          id: 'sav-2',
          title: 'Eigenvalues & Diagonalization Quick Check',
          type: 'qa',
          preview: 'Steps to find characteristic polynomial det(A - λI) = 0.',
          subject: 'Math',
          timestamp: 'Yesterday',
          tabTarget: 'practice'
        },
        {
          id: 'sav-3',
          title: 'Calculus Mastery Course Module 1',
          type: 'course',
          preview: 'Limits, continuity, and instantaneous rates of change.',
          subject: 'Math',
          timestamp: '3 days ago',
          tabTarget: 'marketplace'
        }
      ];
      setSavedItems(parsed);
    } catch {
      setSavedItems([]);
    }
  }, []);

  const handleRemove = (id: string) => {
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    try {
      localStorage.setItem('learnco_bookmarked_items', JSON.stringify(updated));
    } catch {}
  };

  const filtered = savedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.preview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#2A2647] rounded-2xl p-6 border border-[#E3DFF5] dark:border-[#3D3861] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-[#6C5CE7]/10 text-[#6C5CE7] dark:text-[#8577ED]">
              <BookMarked className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
              Saved
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6B6890] dark:text-[#B4B0D5]">
            Your bookmarked concepts, Q&A summaries, and study modules
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6890]" />
          <input
            type="text"
            placeholder="Search saved items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] focus:outline-2 focus:outline-[#6C5CE7]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'concept', 'qa', 'course', 'note'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer min-h-[40px] ${
              filterType === type
                ? 'bg-[#6C5CE7] text-white shadow-xs'
                : 'bg-white dark:bg-[#2A2647] text-[#6B6890] dark:text-[#B4B0D5] border border-[#E3DFF5] dark:border-[#3D3861] hover:text-[#2D2A4A]'
            }`}
          >
            {type === 'all' ? 'All Saved' : type}
          </button>
        ))}
      </div>

      {/* Grid of Saved Items */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#2A2647] rounded-2xl p-12 text-center border border-[#E3DFF5] dark:border-[#3D3861]">
          <BookMarked className="w-12 h-12 text-[#6B6890] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1">No Saved Items Found</h3>
          <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mb-4">
            Bookmark lessons, AI answers, or courses while studying to see them here.
          </p>
          <button
            onClick={() => onNavigate('learn')}
            className="px-5 py-2.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold hover:bg-[#5b4be2] cursor-pointer"
          >
            Explore Learn Curriculum
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#2A2647] rounded-2xl p-5 border border-[#E3DFF5] dark:border-[#3D3861] shadow-xs hover:border-[#6C5CE7] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED] border border-[#E3DFF5] dark:border-[#3D3861]">
                    {item.type}
                  </span>
                  <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                    {item.timestamp}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1.5 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mb-4 line-clamp-2">
                  {item.preview}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E3DFF5] dark:border-[#3D3861]">
                <span className="text-xs font-bold text-[#6C5CE7] dark:text-[#8577ED]">
                  {item.subject || 'General'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Remove from saved"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {item.tabTarget && (
                    <button
                      onClick={() => onNavigate(item.tabTarget!)}
                      className="px-3 py-1.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#5b4be2] cursor-pointer"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
