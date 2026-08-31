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
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

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

  return (
    <aside className="w-80 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none">
      {/* Top Header & New Conversation Button */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Sessions & Memory
              </h2>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            {conversations.length} Active
          </span>
        </div>

        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Tutoring Session</span>
        </button>

        {/* Search Conversations */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search past tutoring chats..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all outline-hidden"
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
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-100 shadow-xs'
                    : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 border-transparent text-slate-700 dark:text-slate-300'
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

                      {/* Hover action buttons */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
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
                            if (window.confirm('Delete this tutoring session?')) {
                              onDeleteConversation(conv.id);
                            }
                          }}
                          title="Delete conversation"
                          className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
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
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 space-y-3">
        {/* Learner Level Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              <span>Learner Rigor Level</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => onChangeLearnerLevel(lvl.id)}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold text-left transition-all ${
                  learnerLevel === lvl.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Mode Switches */}
        <div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Active Pedagogical Mode
          </span>
          <div className="grid grid-cols-2 gap-1">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => onChangeMode(m.id)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  activeMode === m.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-400 dark:border-indigo-500 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {m.icon}
                <span className="truncate">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
