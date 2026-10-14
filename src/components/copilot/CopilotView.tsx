import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  BookOpen,
  Calculator,
  RotateCcw,
  Square,
  PanelRight,
  Info,
  ChevronRight,
  Target,
  Stethoscope,
  Code2,
  Brain,
  Sliders,
  Award,
  Layers,
  FileText,
  Bookmark,
  CheckCircle2,
  Trash2,
  Cpu,
} from 'lucide-react';
import {
  CopilotMessage,
  CopilotConversation,
  CopilotMode,
  LearnerLevel,
  CopilotContextPayload,
  CopilotCitation,
  CopilotArtifact,
} from '../../types/copilot';
import { UserProfile } from '../../types';
import Markdown from 'react-markdown';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CopilotClient } from '../../services/copilotClient';
import { CopilotSidebar } from './CopilotSidebar';
import { CopilotMessageItem } from './CopilotMessageItem';

interface CopilotViewProps {
  user: UserProfile;
  initialContext?: string;
  initialPrompt?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const CopilotView: React.FC<CopilotViewProps> = ({
  user,
  initialContext = '',
  initialPrompt = '',
  onNavigateToTab,
}) => {
  // Conversation List State
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<CopilotConversation | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Tab switcher state: 'chat' | 'history'
  const [copilotViewTab, setCopilotViewTab] = useState<'chat' | 'history'>('chat');

  // Mode, Model & Learner Configuration
  const [activeMode, setActiveMode] = useState<CopilotMode>('socratic_hint');
  const [learnerLevel, setLearnerLevel] = useState<LearnerLevel>('intermediate');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');

  // Interactive Context
  const [activeContextNote, setActiveContextNote] = useState<string>(initialContext);
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Input & Streaming States
  const [inputPrompt, setInputPrompt] = useState<string>(initialPrompt);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingCitations, setStreamingCitations] = useState<CopilotCitation[]>([]);
  const [streamingArtifact, setStreamingArtifact] = useState<CopilotArtifact | undefined>();

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Update initialContext when prop changes
  useEffect(() => {
    if (initialContext) {
      setActiveContextNote(initialContext);
    }
  }, [initialContext]);

  // Update initialPrompt when prop changes
  useEffect(() => {
    if (initialPrompt) {
      setInputPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Scroll to bottom on new messages or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isStreaming]);

  const loadConversations = async () => {
    try {
      const convs = await CopilotClient.listConversations();
      setConversations(convs);

      if (convs.length > 0 && !activeConversationId) {
        selectConversation(convs[0].id);
      } else if (convs.length === 0) {
        handleNewConversation();
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const selectConversation = async (convId: string) => {
    try {
      setActiveConversationId(convId);
      const data = await CopilotClient.getConversation(convId);
      if (data) {
        setActiveConversation(data.conversation);
        setMessages(data.messages);
        setActiveMode(data.conversation.mode || 'socratic_hint');
        setLearnerLevel(data.conversation.learnerLevel || 'intermediate');
      }
    } catch (err) {
      console.error('Failed to select conversation:', err);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await CopilotClient.createConversation({
        title: 'New Tutoring Session',
        mode: activeMode,
        learnerLevel: learnerLevel,
      });

      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setActiveConversation(newConv);

      // Seed initial welcome message for this fresh session
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          conversationId: newConv.id,
          userId: user.id || 'user-alex-001',
          role: 'assistant',
          content: `Hello **${user.fullName.split(' ')[0]}**! I am your **Omni Socratic AI Copilot**.\n\nI am configured for **${learnerLevel.toUpperCase()}** academic rigor across Mathematics, CS, Physics, Chemistry, and AI.\n\nAsk any question, request a step-by-step mathematical proof, or choose a tutoring mode below to begin.`,
          mode: activeMode,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      const success = await CopilotClient.deleteConversation(convId);
      if (success) {
        const remaining = conversations.filter((c) => c.id !== convId);
        setConversations(remaining);
        if (activeConversationId === convId) {
          if (remaining.length > 0) {
            selectConversation(remaining[0].id);
          } else {
            handleNewConversation();
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleDeleteAllHistory = async () => {
    if (window.confirm('Are you sure you want to delete ALL tutoring session history? This cannot be undone.')) {
      const success = await CopilotClient.deleteAllConversations();
      if (success) {
        setConversations([]);
        setActiveConversationId(null);
        setActiveConversation(null);
        setMessages([]);
        handleNewConversation();
      }
    }
  };

  const handleExportHistory = async () => {
    const data = await CopilotClient.exportHistory();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omni-copilot-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('Failed to export history.');
    }
  };

  const handleRenameConversation = async (convId: string, newTitle: string) => {
    try {
      const updated = await CopilotClient.updateConversation(convId, { title: newTitle });
      if (updated) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
        );
        if (activeConversation?.id === convId) {
          setActiveConversation(updated);
        }
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleTogglePin = async (convId: string, pinned: boolean) => {
    try {
      const updated = await CopilotClient.updateConversation(convId, { pinned });
      if (updated) {
        loadConversations();
      }
    } catch (err) {
      console.error('Failed to pin conversation:', err);
    }
  };

  const handleExportSingleSession = async (conv: CopilotConversation) => {
    try {
      const data = await CopilotClient.getConversation(conv.id);
      if (!data) return;
      let md = `# Omni Copilot Tutoring Session: ${data.conversation.title}\n\n`;
      md += `* **Date**: ${new Date(data.conversation.updatedAt).toLocaleDateString()}\n`;
      md += `* **Mode**: ${data.conversation.mode || 'socratic_hint'}\n`;
      md += `* **Learner Level**: ${data.conversation.learnerLevel || 'intermediate'}\n\n`;
      md += `---\n\n`;
      for (const m of data.messages) {
        md += `### ${m.role === 'user' ? user.fullName : 'Omni Copilot'} (${new Date(m.timestamp).toLocaleTimeString()})\n\n`;
        md += `${m.content}\n\n`;
        if (m.citations && m.citations.length > 0) {
          md += `*Citations*: ${m.citations.map((c) => c.title).join(', ')}\n\n`;
        }
        md += `---\n\n`;
      }
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omni-session-${conv.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export single session:', err);
    }
  };

  const handleClearConversation = async () => {
    if (!activeConversationId) return;
    if (window.confirm('Clear all message history in this session?')) {
      await CopilotClient.clearConversation(activeConversationId);
      setMessages([]);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || isStreaming) return;

    setInputPrompt('');

    // Ensure we have an active conversation
    let currentConvId = activeConversationId;
    if (!currentConvId) {
      const newConv = await CopilotClient.createConversation({
        title: textToSend.slice(0, 40),
        mode: activeMode,
        learnerLevel: learnerLevel,
      });
      currentConvId = newConv.id;
      setActiveConversationId(newConv.id);
      setActiveConversation(newConv);
      setConversations((prev) => [newConv, ...prev]);
    }

    // Append user message immediately
    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      conversationId: currentConvId,
      userId: user.id || 'user-alex-001',
      role: 'user',
      content: textToSend,
      mode: activeMode,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Setup streaming state
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingCitations([]);
    setStreamingArtifact(undefined);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const contextPayload: CopilotContextPayload = {
      learnerLevel,
      studyContextNote: activeContextNote || undefined,
    };

    let accumulatedContent = '';
    const accumulatedCitations: CopilotCitation[] = [];
    let accumulatedArtifact: CopilotArtifact | undefined;

    try {
      await CopilotClient.streamMessage(
        {
          conversationId: currentConvId,
          prompt: textToSend,
          mode: activeMode,
          learnerLevel,
          context: contextPayload,
          selectedModel: selectedModel || undefined,
        },
        {
          onToken: (token) => {
            accumulatedContent += token;
            setStreamingContent(accumulatedContent);
          },
          onCitation: (cit) => {
            accumulatedCitations.push(cit);
            setStreamingCitations([...accumulatedCitations]);
          },
          onArtifact: (art) => {
            accumulatedArtifact = art;
            setStreamingArtifact(art);
          },
          onDone: (doneData) => {
            const assistantMsg: CopilotMessage = {
              id: doneData.messageId || `ai-${Date.now()}`,
              conversationId: currentConvId!,
              userId: user.id || 'user-alex-001',
              role: 'assistant',
              content: accumulatedContent,
              mode: activeMode,
              modelUsed: doneData.modelUsed || 'gemini-3.5-flash',
              citations: accumulatedCitations,
              artifact: accumulatedArtifact,
              timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, assistantMsg]);
            setIsStreaming(false);
            setStreamingContent('');
            setStreamingCitations([]);
            setStreamingArtifact(undefined);

            // Refresh conversation title & snippet in list
            loadConversations();
          },
          onError: (errMsg) => {
            console.error('Streaming error received:', errMsg);
            setIsStreaming(false);
          },
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed in Copilot stream:', err);
      }
      setIsStreaming(false);
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const suggestedPrompts = [
    'Why does SN2 inversion require backside nucleophilic attack?',
    'How do I test extrema when f\'(c) = 0 and f\'\'(c) = 0?',
    'Derive the learning rate stability threshold in gradient descent.',
    'Formulate a 5-question practice quiz on Multivariable Calculus.',
    'Analyze my past mistakes and diagnose root misconceptions.',
  ];

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-7.5rem)] sm:h-[calc(100vh-6.5rem)] flex bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* 1. Left Session Sidebar */}
      <CopilotSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        learnerLevel={learnerLevel}
        onChangeLearnerLevel={(lvl) => {
          setLearnerLevel(lvl);
          if (activeConversationId) {
            CopilotClient.updateConversation(activeConversationId, { learnerLevel: lvl });
          }
        }}
        activeMode={activeMode}
        onChangeMode={(mode) => {
          setActiveMode(mode);
          if (activeConversationId) {
            CopilotClient.updateConversation(activeConversationId, { mode });
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          CopilotClient.listConversations(q).then(setConversations);
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onDeleteAllHistory={handleDeleteAllHistory}
        onExportHistory={handleExportHistory}
      />

      {/* 2. Center Main Chat Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
        {/* Top Control Header */}
        <div className="h-14 px-3 sm:px-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Sessions Toggle Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
              title="Open Chat Sessions & Modes"
              aria-label="Open sessions"
            >
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </button>

            {/* Sub-Tab Switcher: Live Tutoring Chat vs Session History */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCopilotViewTab('chat')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  copilotViewTab === 'chat'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setCopilotViewTab('history')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  copilotViewTab === 'history'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>History ({conversations.length})</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {activeConversation?.title || 'Omni Socratic AI Copilot'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Model Selector Dropdown */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <Cpu className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-hidden pr-2 cursor-pointer"
              >
                <option value="gemini-3.5-flash" className="dark:bg-slate-800">⚡ Gemini 3.5 Flash (Recommended)</option>
                <option value="gemini-3.8-flash" className="dark:bg-slate-800">🔷 Gemini 3.8 Flash (Reasoning)</option>
                <option value="gemini-flash-latest" className="dark:bg-slate-800">✨ Gemini Flash Latest</option>
                <option value="gemini-3.5-flash-lite" className="dark:bg-slate-800">🟢 3.5 Flash-Lite</option>
              </select>
            </div>

            {/* Clear Messages */}
            <button
              onClick={handleClearConversation}
              title="Clear message history in active session"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Context Drawer Toggle */}
            <button
              onClick={() => setIsContextDrawerOpen((prev) => !prev)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isContextDrawerOpen
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Toggle Study Context & Knowledge Matrix"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Study Context Banner if present */}
        {activeContextNote && (
          <div className="px-4 py-2 bg-indigo-50/90 dark:bg-indigo-950/50 border-b border-indigo-200 dark:border-indigo-900 flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-semibold">Active Context:</span>
              <span className="truncate opacity-90">{activeContextNote}</span>
            </div>
            <button
              onClick={() => setActiveContextNote('')}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-2 font-bold cursor-pointer"
            >
              Clear Context
            </button>
          </div>
        )}

        {/* Content Canvas: Chat Tab vs History Tab */}
        {copilotViewTab === 'history' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* History Control Card */}
            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Tutoring Session History & Saved Archives</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Review past Socratic dialogues, save and export complete transcripts, or purge history.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportHistory}
                    disabled={conversations.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="Save & Download All History as JSON"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Save All History</span>
                  </button>
                  <button
                    onClick={handleDeleteAllHistory}
                    disabled={conversations.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="Permanently Delete All History"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete All History</span>
                  </button>
                </div>
              </div>

              {/* Search History Filter */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    CopilotClient.listConversations(e.target.value).then(setConversations);
                  }}
                  placeholder="Filter saved sessions by title or keyword..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Conversations Grid List */}
            {conversations.length === 0 ? (
              <div className="text-center py-16 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Tutoring Sessions Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Ask Omni Copilot any STEM question to start building your persistent revision archive.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    handleNewConversation();
                    setCopilotViewTab('chat');
                  }}
                >
                  Start New Tutoring Session
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      activeConversationId === conv.id
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {conv.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="capitalize text-purple-600 dark:text-purple-400 font-semibold">
                            {conv.mode ? conv.mode.replace('_', ' ') : 'Socratic'}
                          </span>
                          <span>•</span>
                          <span className="uppercase text-indigo-600 dark:text-indigo-400 font-semibold">
                            {conv.learnerLevel || 'Intermediate'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => {
                          selectConversation(conv.id);
                          setCopilotViewTab('chat');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 text-xs cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>Open in Chat</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleExportSingleSession(conv)}
                          className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Save this session transcript as Markdown"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Save Markdown</span>
                        </button>
                        <button
                          onClick={() => handleDeleteConversation(conv.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                          title="Delete this session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Live Chat Canvas */
          <>
            {/* Conversation Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg) => (
                <CopilotMessageItem
                  key={msg.id}
                  message={msg}
                  userFullName={user.fullName}
                  onQuickAction={handleQuickPrompt}
                  onRegenerate={() => {
                    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                    if (lastUserMsg) {
                      handleSendMessage(lastUserMsg.content);
                    }
                  }}
                  onNavigateToCreator={(resId) => {
                    if (onNavigateToTab) {
                      onNavigateToTab('create');
                    }
                  }}
                />
              ))}

              {/* Active Live Streaming Item */}
              {isStreaming && (
                <div className="flex gap-3 max-w-4xl mr-auto animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="space-y-2 flex-1 max-w-[92%]">
                    <div className="flex items-center justify-between text-[11px] text-purple-600 dark:text-purple-400 font-semibold px-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <span>Deriving step-by-step Socratic solution...</span>
                      </div>
                      <button
                        onClick={handleStopStreaming}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-600 text-[10px] font-bold hover:bg-rose-100 cursor-pointer"
                      >
                        <Square className="w-3 h-3 fill-rose-600" />
                        <span>Stop Generating</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-purple-200 dark:border-purple-900 shadow-xs">
                      {streamingContent ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm space-y-2">
                          <Markdown>{streamingContent}</Markdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                          <span>Synthesizing first-principles reasoning...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Always-Available Quick Prompt Action Chips */}
            <div className="px-4 pb-1.5 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setInputPrompt('Can you provide a Socratic hint without revealing the final answer?')}
                className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <span>💡 Socratic Hint</span>
              </button>
              <button
                type="button"
                onClick={() => setInputPrompt('What is the first-principles intuition and physical/mathematical invariant here?')}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <span>🔍 First Principles</span>
              </button>
              <button
                type="button"
                onClick={() => setInputPrompt('Can you check boundary limits (as x -> 0 or infinity) and symmetry invariants?')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <span>📐 Boundary Check</span>
              </button>
              <button
                type="button"
                onClick={() => setInputPrompt('Generate 1 challenging diagnostic multiple-choice question on this topic.')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <span>📝 Practice Problem</span>
              </button>
              <button
                type="button"
                onClick={() => setInputPrompt('Diagnose the common trap or misconception students fall into for this topic.')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <span>🩺 Diagnose Mistake</span>
              </button>
            </div>

            {/* Bottom Input Prompt Bar */}
            <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-1.5 shadow-2xs"
              >
                <textarea
                  rows={1}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Ask Omni Copilot under ${activeMode.replace('_', ' ')} mode... (Press Enter to send)`}
                  className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none max-h-32"
                />

                <div className="flex items-center gap-1.5 pr-1 shrink-0">
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStopStreaming}
                      className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span className="hidden sm:inline">Stop</span>
                    </button>
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!inputPrompt.trim()}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Send
                    </Button>
                  )}
                </div>
              </form>

              {/* Quick Guidance Footer Note */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>
                  Omni Copilot uses grounded curriculum invariants and verified derivations.
                </span>
                <span className="font-mono text-[9px]">Shift+Enter for newline</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Right Context Drawer */}
      {isContextDrawerOpen && (
        <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-y-auto space-y-4 shrink-0 animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>Learner Matrix & Context</span>
            </div>
            <button
              onClick={() => setIsContextDrawerOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* User Gamification Card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Scholar Profile
            </span>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span>{user.fullName}</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                Level {user.level} ({user.xp} XP)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Streak: {user.currentStreak} Days</span>
              <span>Quota: {user.dailyQuestionsSolvedToday}/{user.dailyAllowanceLimit}</span>
            </div>
          </div>

          {/* Active Target Exam */}
          <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-purple-950 dark:text-purple-200 text-[11px]">
              <Target className="w-3.5 h-3.5 text-purple-600" />
              <span>Target Benchmark</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
              {user.targetExam || 'Advanced STEM Olympiad'}
            </p>
          </div>

          {/* Quick RAG Search Tool */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Creator Studio Notebook
            </span>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Copilot automatically retrieves relevant notes, flashcards, and derivations from your Creator Studio during conversations.
              </p>
              <button
                onClick={() => onNavigateToTab && onNavigateToTab('create')}
                className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-100 cursor-pointer"
              >
                <span>Open Creator Studio</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
