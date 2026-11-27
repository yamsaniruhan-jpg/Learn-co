import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Compass,
  GraduationCap,
  Sparkles,
  Bot,
  Brain,
  HelpCircle,
  BookOpen,
  Calculator,
  Code2,
  Stethoscope,
  Target,
  FileText,
} from 'lucide-react';
import {
  CopilotConversation,
  CopilotMode,
  LearnerLevel,
} from '../../types/copilot';

interface CopilotSidebarProps {
  conversations: CopilotConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  learnerLevel: LearnerLevel;
  onChangeLearnerLevel: (level: LearnerLevel) => void;
  activeMode: CopilotMode;
  onChangeMode: (mode: CopilotMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onDeleteAllHistory?: () => void;
  onExportHistory?: () => void;
}

export const CopilotSidebar: React.FC<CopilotSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  learnerLevel,
  onChangeLearnerLevel,
  activeMode,
  onChangeMode,
  searchQuery,
  onSearchChange,
  isMobileOpen = false,
  onCloseMobile,
  onDeleteAllHistory,
  onExportHistory,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleStartRename = (conv: CopilotConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (convId: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const levels: Array<{ id: LearnerLevel; label: string; desc: string }> = [
    { id: 'beginner', label: 'Beginner', desc: 'Intuitive analogies & foundations' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Standard undergraduate rigor' },
    { id: 'advanced', label: 'Advanced', desc: 'Formal proof & operator theory' },
    { id: 'exam_focused', label: 'Exam Focus', desc: 'High-yield shortcuts & traps' },
  ];

  const modes: Array<{ id: CopilotMode; label: string; icon: React.ReactNode }> = [
    { id: 'socratic_hint', label: 'Socratic Hint', icon: <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'conceptual_explainer', label: 'First Principles', icon: <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> },
    { id: 'exam_solver', label: 'Rigorous Proof', icon: <Calculator className="w-3.5 h-3.5 text-purple-500" /> },
    { id: 'code_tutor', label: 'Code & AI/ML', icon: <Code2 className="w-3.5 h-3.5 text-emerald-500" /> },
    { id: 'mistake_doctor', label: 'Mistake Doctor', icon: <Stethoscope className="w-3.5 h-3.5 text-rose-500" /> },
    { id: 'practice_generator', label: 'Practice Drill', icon: <Target className="w-3.5 h-3.5 text-cyan-500" /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] dark:bg-[#111114] select-none">
      {/* Top Header & New Conversation Button */}
      <div className="p-4 border-b border-[#E3DFF5] dark:border-[#232329] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#F0EDFA] dark:bg-[#16161C] text-[#6C5CE7] dark:text-[#CCFF00]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#2D2A4A] dark:text-[#F4F4F6] uppercase tracking-wider">
                Sessions & Memory
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0EDFA] dark:bg-[#16161C] text-[#6C5CE7] dark:text-[#CCFF00] border border-[#E3DFF5] dark:border-[#232329]">
              {conversations.length} Active
            </span>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#2D2A4A] dark:hover:text-[#F4F4F6] cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            onNewConversation();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#6C5CE7] dark:bg-[#CCFF00] hover:bg-[#5B4BC4] dark:hover:bg-[#d9ff33] active:scale-[0.99] text-white dark:text-[#09090B] text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Tutoring Session</span>
        </button>

        {/* Search Conversations */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6890] dark:text-[#71717A]" />
          <input
            type="text"
            placeholder="Search past tutoring chats..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-[#F7F5FF] dark:bg-[#16161C] border border-[#E3DFF5] dark:border-[#232329] focus:border-[#6C5CE7] dark:focus:border-[#CCFF00] focus:bg-white dark:focus:bg-[#09090B] text-xs text-[#2D2A4A] dark:text-[#F4F4F6] placeholder:text-[#6B6890] transition-all outline-hidden"
          />
        </div>
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs">No conversations found.</p>
            <p className="text-[10px]">Start a new session to begin Socratic inquiry.</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group relative p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#F0EDFA] dark:bg-[#16161C] border-[#6C5CE7]/40 dark:border-[#CCFF00]/50 text-[#2D2A4A] dark:text-[#F4F4F6] shadow-xs'
                    : 'bg-transparent hover:bg-[#F7F5FF] dark:hover:bg-[#16161C]/70 border-transparent text-[#6B6890] dark:text-[#9E9EA9]'
                }`}
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => handleSaveRename(conv.id, e)}
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white dark:bg-slate-800 rounded border border-indigo-400 text-xs text-slate-900 dark:text-white outline-hidden"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRename}
                      className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        {conv.pinned && (
                          <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                        <span className="font-semibold truncate text-[12px]">
                          {conv.title}
                        </span>
                      </div>

                      {/* Hover action buttons (kept visible while confirming delete) */}
                      <div
                        className={`${
                          confirmDeleteId === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        } flex items-center gap-0.5 shrink-0 transition-opacity`}
                      >
                        {confirmDeleteId === conv.id ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                                onDeleteConversation(conv.id);
                              }}
                              title="Confirm delete"
                              className="p-1 text-white bg-rose-600 hover:bg-rose-700 rounded cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              title="Cancel delete"
                              className="p-1 text-slate-500 hover:text-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePin(conv.id, !conv.pinned);
                              }}
                              title={conv.pinned ? 'Unpin conversation' : 'Pin conversation'}
                              className="p-1 text-slate-400 hover:text-amber-500 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleStartRename(conv, e)}
                              title="Rename conversation"
                              className="p-1 text-slate-400 hover:text-indigo-500 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(conv.id);
                              }}
                              title="Delete conversation"
                              className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {conv.lastMessageSnippet && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {conv.lastMessageSnippet}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span className="capitalize">{conv.mode.replace('_', ' ')}</span>
                      <span>{new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Configuration: Learner Level & Mode Selector */}
      <div className="p-3 border-t border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#09090B] space-y-3">
        {/* Learner Level Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-[#6B6890] dark:text-[#9E9EA9] uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#6C5CE7] dark:text-[#CCFF00]" />
              <span>Learner Rigor Level</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => onChangeLearnerLevel(lvl.id)}
                className={`min-h-[44px] px-2.5 py-2 rounded-xl text-[11px] font-semibold text-left transition-all cursor-pointer ${
                  learnerLevel === lvl.id
                    ? 'bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B] shadow-2xs font-bold'
                    : 'bg-[#FFFFFF] dark:bg-[#16161C] text-[#6B6890] dark:text-[#9E9EA9] border border-[#E3DFF5] dark:border-[#232329] hover:border-[#6C5CE7]/40'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Mode Switches */}
        <div>
          <span className="text-[10px] font-bold text-[#6B6890] dark:text-[#9E9EA9] uppercase tracking-wider block mb-1.5">
            Active Pedagogical Mode
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => onChangeMode(m.id)}
                className={`min-h-[44px] flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                  activeMode === m.id
                    ? 'bg-[#FFFFFF] dark:bg-[#16161C] text-[#6C5CE7] dark:text-[#CCFF00] border border-[#6C5CE7] dark:border-[#CCFF00] shadow-2xs'
                    : 'bg-[#FFFFFF] dark:bg-[#111114] text-[#6B6890] dark:text-[#9E9EA9] border border-[#E3DFF5] dark:border-[#232329]'
                }`}
              >
                {m.icon}
                <span className="truncate">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save & Delete All History Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E3DFF5] dark:border-[#232329]">
          <button
            onClick={onExportHistory}
            className="min-h-[44px] flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-[#4CAF8E]/12 hover:bg-[#4CAF8E]/20 text-[#247A5E] dark:text-[#7ADEC0] text-[11px] font-bold border border-[#4CAF8E]/30 transition-colors cursor-pointer"
            title="Save & Export All History"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Save History</span>
          </button>
          <button
            onClick={onDeleteAllHistory}
            className="min-h-[44px] flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-500/25 transition-colors cursor-pointer"
            title="Delete All History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 lg:w-80 flex-col h-full border-r border-[#E3DFF5] dark:border-[#232329] shrink-0 select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#2D2A4A]/80 dark:bg-[#09090B]/90"
            onClick={onCloseMobile}
          />
          <div className="relative w-4/5 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
