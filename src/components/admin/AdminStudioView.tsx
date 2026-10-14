import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Plus,
  Search,
  Sparkles,
  BookOpen,
  HelpCircle,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Code,
  Layers,
  ArrowRight,
  GraduationCap,
  Flame,
  FileCheck,
  SlidersHorizontal,
  FileText,
  Download,
  Terminal,
  Clock,
  Activity,
  Calendar,
  Bookmark,
  Bell,
  Send,
  Radio,
  Share2,
} from 'lucide-react';
import { Question, VerificationStatus, SubjectId } from '../../types';
import { SEED_QUESTIONS } from '../../data/seedData';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';
import { DifficultyBadge } from '../ui/GamificationIndicators';
import { FormattedMathText, cleanLatexToNormalText } from '../common/FormattedMathText';
import { AnalyticsClient } from '../../services/analyticsClient';

type TextDisplayMode = 'formatted' | 'normal_text' | 'raw_latex';

interface AuditLogItem {
  id: string;
  timestamp: string;
  category: 'PRACTICE' | 'VERIFICATION' | 'STREAK' | 'PLANNER' | 'ZOTERO' | 'AUTH' | 'SYSTEM';
  action: string;
  userId?: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  details: string;
  metadata?: Record<string, any>;
}

export const AdminStudioView: React.FC = () => {
  const [studioTab, setStudioTab] = useState<'questions' | 'audit_logs'>('questions');
  const [questions, setQuestions] = useState<Question[]>(SEED_QUESTIONS);
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<TextDisplayMode>('formatted');

  // Logs State
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [selectedLogEntry, setSelectedLogEntry] = useState<AuditLogItem | null>(null);

  // Webhook Alert Config State
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState<boolean>(false);
  const [webhookConfig, setWebhookConfig] = useState({
    enabled: true,
    webhookUrl: 'https://hooks.slack.com/services/DEMO/STEM_ALERTS/LEARNCO',
    minSeverity: 'WARNING_AND_ERROR',
    channelName: '#stem-curriculum-alerts',
  });
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);

  // Spaced Repetition Trigger State
  const [isTriggeringSpaced, setIsTriggeringSpaced] = useState<boolean>(false);

  // Modals
  const [inspectQuestion, setInspectQuestion] = useState<Question | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isLatexCleanerOpen, setIsLatexCleanerOpen] = useState<boolean>(false);
  const [latexInput, setLatexInput] = useState<string>(
    '\\int_0^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}'
  );
  const [copiedCleanText, setCopiedCleanText] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const data = await AnalyticsClient.getLogs({
        category: logCategoryFilter !== 'ALL' ? logCategoryFilter : undefined,
        search: logSearchQuery.trim() || undefined,
        limit: 150,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const loadWebhookConfig = async () => {
    try {
      const cfg = await AnalyticsClient.getWebhookConfig();
      if (cfg) setWebhookConfig(cfg);
    } catch (e) {
      console.warn('Failed to load webhook configuration', e);
    }
  };

  useEffect(() => {
    if (studioTab === 'audit_logs') {
      fetchLogs();
    }
  }, [studioTab, logCategoryFilter]);

  useEffect(() => {
    loadWebhookConfig();
  }, []);

  // Verification actions
  const handleVerify = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, verificationStatus: 'verified' } : q))
    );
    if (inspectQuestion?.id === id) {
      setInspectQuestion((prev) => (prev ? { ...prev, verificationStatus: 'verified' } : null));
    }
    AnalyticsClient.logClientEvent(
      'VERIFICATION',
      'QUESTION_VERIFIED',
      `Approved and verified question: ${id}`,
      'SUCCESS',
      { questionId: id }
    );
    showNotification('Question approved and marked as Verified Editorial benchmark.');
  };

  const handleFlag = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, verificationStatus: 'flagged' } : q))
    );
    if (inspectQuestion?.id === id) {
      setInspectQuestion((prev) => (prev ? { ...prev, verificationStatus: 'flagged' } : null));
    }
    AnalyticsClient.logClientEvent(
      'VERIFICATION',
      'QUESTION_FLAGGED',
      `Flagged question for editorial review: ${id}`,
      'WARNING',
      { questionId: id }
    );
    showNotification('Question flagged for pedagogical review.');
  };

  const handleVerifyAllCandidates = () => {
    const candidateCount = questions.filter((q) => q.verificationStatus === 'candidate').length;
    if (candidateCount === 0) {
      showNotification('No pending AI candidate questions to verify.');
      return;
    }
    setQuestions((prev) =>
      prev.map((q) =>
        q.verificationStatus === 'candidate' ? { ...q, verificationStatus: 'verified' } : q
      )
    );
    AnalyticsClient.logClientEvent(
      'VERIFICATION',
      'BATCH_VERIFY_ALL',
      `Batch approved all ${candidateCount} pending AI candidate problems.`,
      'SUCCESS',
      { count: candidateCount }
    );
    showNotification(`Successfully verified all ${candidateCount} AI candidate questions!`);
  };

  const handleGenerateFreshCandidates = () => {
    const subjects: SubjectId[] = ['math', 'cs', 'physics', 'chemistry', 'biology'];
    const randomSub = subjects[Math.floor(Math.random() * subjects.length)];
    const newId = `q-ai-cand-${Date.now().toString(36)}`;

    const newCandidate: Question = {
      id: newId,
      subjectId: randomSub,
      courseId: `${randomSub}-advanced-topics`,
      topicId: 'Algorithmic Problem Solving',
      conceptId: `concept-${newId}`,
      difficulty: 'medium',
      verificationStatus: 'candidate',
      questionType: 'multiple_choice',
      questionText: `Find the general solution to the differential equation $\\frac{dy}{dx} + 2y = e^{-x}$ with initial condition $y(0) = 1$.`,
      options: [
        '$y(x) = e^{-x}$',
        '$y(x) = 2e^{-x} - e^{-2x}$',
        '$y(x) = e^{-x} + C e^{-2x}$',
        '$y(x) = e^{-2x}$',
      ],
      correctAnswer: '$y(x) = e^{-x}$',
      explanation:
        'Using integrating factor $I(x) = e^{\\int 2 dx} = e^{2x}$. Then $\\frac{d}{dx}[y e^{2x}] = e^x \\implies y e^{2x} = e^x + C \\implies y(x) = e^{-x} + C e^{-2x}$. Given $y(0)=1 \\implies 1 = 1 + C \\implies C = 0$. Thus $y(x) = e^{-x}$.',
      stepByStepSolution: [
        'Compute integrating factor $I(x) = e^{\\int 2 dx} = e^{2x}$',
        'Multiply both sides: $e^{2x}\\frac{dy}{dx} + 2e^{2x}y = e^x$',
        'Integrate: $y e^{2x} = \\int e^x dx = e^x + C$',
        'Divide by $e^{2x}$: $y(x) = e^{-x} + C e^{-2x}$',
        'Apply $y(0)=1 \\implies 1 = 1 + C \\implies C = 0$',
        'Final solution: $y(x) = e^{-x}$',
      ],
      hints: [
        'Find the integrating factor $I(x) = e^{\\int P(x) dx}$ where $P(x) = 2$.',
        'Multiply through and integrate both sides with respect to $x$.',
        'Use $y(0) = 1$ to determine constant $C$.',
      ],
      tags: ['Differential Equations', 'Integrating Factor', 'Calculus'],
      source: 'Omni AI Candidate Generator Engine',
      createdByAi: true,
    };

    setQuestions((prev) => [newCandidate, ...prev]);
    AnalyticsClient.logClientEvent(
      'SYSTEM',
      'AI_CANDIDATE_GENERATED',
      `Generated new AI candidate problem for subject: ${randomSub}`,
      'INFO',
      { questionId: newId, subject: randomSub }
    );
    showNotification(
      'Generated new AI candidate problem with full step-by-step proof and progressive hint rubric.'
    );
  };

  const handleTriggerSpacedRepetition = async () => {
    setIsTriggeringSpaced(true);
    try {
      const res = await AnalyticsClient.triggerSpacedRepetition();
      showNotification(
        `Automated spaced review triggered! Scheduled ${res.tasksCreated} remediation task(s) across: ${res.remediatedTopics.slice(0, 2).join(', ')}.`
      );
      if (studioTab === 'audit_logs') fetchLogs();
    } catch (e: any) {
      showNotification(`Failed to trigger spaced repetition: ${e.message}`);
    } finally {
      setIsTriggeringSpaced(false);
    }
  };

  const handleSaveWebhookConfig = async () => {
    try {
      await AnalyticsClient.setWebhookConfig(webhookConfig);
      showNotification('Webhook alerting configuration saved successfully.');
      setIsWebhookModalOpen(false);
    } catch (e: any) {
      showNotification(`Failed to save webhook config: ${e.message}`);
    }
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      const res = await AnalyticsClient.testWebhook();
      showNotification(res.message || 'Test alert successfully sent to webhook channel.');
      if (studioTab === 'audit_logs') fetchLogs();
    } catch (e: any) {
      showNotification(`Failed to dispatch test webhook: ${e.message}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const stats = useMemo(() => {
    const total = questions.length;
    const verified = questions.filter((q) => q.verificationStatus === 'verified').length;
    const candidate = questions.filter((q) => q.verificationStatus === 'candidate').length;
    const flagged = questions.filter((q) => q.verificationStatus === 'flagged').length;
    return { total, verified, candidate, flagged };
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (statusFilter !== 'all' && q.verificationStatus !== statusFilter) return false;
      if (subjectFilter !== 'all' && q.subjectId !== subjectFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inText = q.questionText.toLowerCase().includes(query);
        const inTopic = q.topicId.toLowerCase().includes(query);
        const inTags = q.tags.some((t) => t.toLowerCase().includes(query));
        if (!inText && !inTopic && !inTags) return false;
      }
      return true;
    });
  }, [questions, statusFilter, subjectFilter, searchQuery]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCleanText(true);
    setTimeout(() => setCopiedCleanText(false), 2000);
  };

  const handleDownloadLogsJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadLogsCsv = () => {
    const headers = ['id', 'timestamp', 'category', 'action', 'status', 'userId', 'details'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      l.category,
      l.action,
      l.status,
      l.userId || 'N/A',
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert Banner */}
      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-200 shadow-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header with Navigation and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Editorial Governance & Audit Logs</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] border border-indigo-500/20">
              Anti-Repetition & Spaced Review Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Question Verification & System Audit Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Audit AI candidates, inspect attempt telemetry, normalize LaTeX equations into clean typography, and configure automated error alerting webhooks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mr-2">
            <button
              onClick={() => setStudioTab('questions')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                studioTab === 'questions'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Questions Queue
            </button>
            <button
              onClick={() => setStudioTab('audit_logs')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                studioTab === 'audit_logs'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Audit & Activity Logs
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Bell className="w-4 h-4 text-purple-500" />}
            onClick={() => setIsWebhookModalOpen(true)}
          >
            Alert Webhooks
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={
              <Zap className={`w-4 h-4 text-amber-500 ${isTriggeringSpaced ? 'animate-bounce' : ''}`} />
            }
            onClick={handleTriggerSpacedRepetition}
            disabled={isTriggeringSpaced}
          >
            {isTriggeringSpaced ? 'Scheduling...' : 'Auto-Spaced Review'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<HelpCircle className="w-4 h-4 text-indigo-500" />}
            onClick={() => setIsTutorialOpen(true)}
          >
            Tutorial
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Code className="w-4 h-4 text-amber-500" />}
            onClick={() => setIsLatexCleanerOpen(true)}
          >
            LaTeX Tool
          </Button>
          <Button
            variant="success"
            size="sm"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={handleVerifyAllCandidates}
          >
            Verify All
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleGenerateFreshCandidates}
          >
            Generate Candidate
          </Button>
        </div>
      </div>

      {/* VIEW TAB 1: QUESTIONS & CANDIDATES QUEUE */}
      {studioTab === 'questions' && (
        <div className="space-y-6">
          {/* Studio Analytics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Database Items
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {stats.total}
              </div>
              <span className="text-[10px] text-slate-400">All subjects & chapters</span>
            </div>

            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Verified Editorial
              </span>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                {stats.verified}
              </div>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                Approved benchmarks
              </span>
            </div>

            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40 shadow-xs">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                AI Candidates Pending
              </span>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-0.5">
                {stats.candidate}
              </div>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                Awaiting review
              </span>
            </div>

            <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/80 dark:border-rose-900/40 shadow-xs">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Flagged Review Queue
              </span>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-0.5">
                {stats.flagged}
              </div>
              <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80">
                Requires moderation
              </span>
            </div>
          </div>

          {/* Control Bar: Search, Subject Filters, Status Filters, & Display Mode Switch */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search question statements, equations, formulas, topics, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Text Representation Mode Switch */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2">
                  Math View:
                </span>
                <button
                  onClick={() => setDisplayMode('formatted')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    displayMode === 'formatted'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Formatted Math
                </button>
                <button
                  onClick={() => setDisplayMode('normal_text')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    displayMode === 'normal_text'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Normal Text
                </button>
                <button
                  onClick={() => setDisplayMode('raw_latex')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    displayMode === 'raw_latex'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Raw LaTeX
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Status Tabs */}
              <div className="flex gap-1.5 overflow-x-auto">
                {[
                  { id: 'all', label: `All Items (${stats.total})` },
                  { id: 'verified', label: `Verified (${stats.verified})` },
                  { id: 'candidate', label: `AI Candidates (${stats.candidate})` },
                  { id: 'flagged', label: `Flagged for Review (${stats.flagged})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Subject Tabs */}
              <div className="flex gap-1 overflow-x-auto">
                {['all', 'math', 'cs', 'physics', 'chemistry', 'biology'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSubjectFilter(sub)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      subjectFilter === sub
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No Questions Found Matching Criteria
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search query, status filters, or generate new AI candidates.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setSubjectFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                    q.verificationStatus === 'verified'
                      ? 'border-emerald-200/80 dark:border-emerald-950/60'
                      : q.verificationStatus === 'candidate'
                      ? 'border-amber-200/80 dark:border-amber-950/60'
                      : 'border-rose-200/80 dark:border-rose-950/60'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 uppercase text-slate-600 dark:text-slate-300">
                        {q.subjectId}
                      </span>
                      <DifficultyBadge difficulty={q.difficulty} />
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                          q.verificationStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : q.verificationStatus === 'candidate'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {q.verificationStatus === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                        {q.verificationStatus === 'candidate' && <Sparkles className="w-3 h-3" />}
                        {q.verificationStatus === 'flagged' && <AlertCircle className="w-3 h-3" />}
                        {q.verificationStatus.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {q.topicId}
                      </span>
                    </div>

                    {/* Question Content based on active displayMode */}
                    <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-serif line-clamp-2">
                      {displayMode === 'formatted' ? (
                        <FormattedMathText text={q.questionText} />
                      ) : displayMode === 'normal_text' ? (
                        cleanLatexToNormalText(q.questionText)
                      ) : (
                        <code className="font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded">
                          {q.questionText}
                        </code>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                      <span>ID: {q.id}</span>
                      <span>•</span>
                      <span>{q.options.length} Options</span>
                      {q.stepByStepSolution && (
                        <>
                          <span>•</span>
                          <span>{q.stepByStepSolution.length} Derivation Steps</span>
                        </>
                      )}
                      {q.hints && (
                        <>
                          <span>•</span>
                          <span>{q.hints.length} Progressive Hints</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Right Column */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setInspectQuestion(q)}
                    >
                      Inspect
                    </Button>

                    {q.verificationStatus !== 'verified' && (
                      <button
                        onClick={() => handleVerify(q.id)}
                        className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                        title="Approve and verify"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {q.verificationStatus !== 'flagged' && (
                      <button
                        onClick={() => handleFlag(q.id)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                        title="Flag for review"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW TAB 2: SYSTEM, ATTEMPT & AUDIT LOGS */}
      {studioTab === 'audit_logs' && (
        <div className="space-y-4">
          {/* Logs Control & Export Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter logs by action, keyword, or user..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
                disabled={isLoadingLogs}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadLogsJson}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export JSON
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadLogsCsv}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export CSV
              </Button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {['ALL', 'PRACTICE', 'VERIFICATION', 'STREAK', 'PLANNER', 'ZOTERO', 'SYSTEM'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setLogCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    logCategoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Logs List Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {logs.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Terminal className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No Logs Recorded Yet
                </h3>
                <p className="text-xs text-slate-500">
                  Telemetry logs from practice sessions, streak verifications, and Zotero exports will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogEntry(log)}
                    className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : log.status === 'WARNING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : log.status === 'ERROR'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {log.status}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {log.action}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {log.category}
                          </span>
                          {log.userId && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              user: {log.userId}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 leading-relaxed">
                          {log.details}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Webhook Configuration Modal */}
      <Dialog
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        title="Alert Webhook & Telemetry Dispatch Configuration"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-900 dark:text-slate-100">
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
            <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
              <Radio className="w-4 h-4 text-indigo-600" />
              <span>Real-Time Audit & Critical Alert Webhooks</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              When enabled, high-priority pedagogical errors, system warnings, and verification updates are instantly dispatched to your Slack, Discord, or custom monitoring endpoint.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Webhook URL Endpoint (Slack, Discord, or Custom JSON API)
              </label>
              <input
                type="text"
                value={webhookConfig.webhookUrl}
                onChange={(e) =>
                  setWebhookConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))
                }
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Channel / Room Identifier
                </label>
                <input
                  type="text"
                  value={webhookConfig.channelName || ''}
                  onChange={(e) =>
                    setWebhookConfig((prev) => ({ ...prev, channelName: e.target.value }))
                  }
                  placeholder="#stem-alerts"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Alert Severity
                </label>
                <select
                  value={webhookConfig.minSeverity}
                  onChange={(e) =>
                    setWebhookConfig((prev) => ({
                      ...prev,
                      minSeverity: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ERROR_ONLY">Critical Errors Only (Strict)</option>
                  <option value="WARNING_AND_ERROR">Warnings & Errors (Recommended)</option>
                  <option value="ALL">All Audit Telemetry Events (Verbose)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="webhook-enabled-toggle"
                checked={webhookConfig.enabled}
                onChange={(e) =>
                  setWebhookConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="webhook-enabled-toggle" className="font-semibold text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                Enable Automated Dispatch for matching telemetry events
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestWebhook}
              disabled={isTestingWebhook}
              leftIcon={<Send className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-spin' : ''}`} />}
            >
              {isTestingWebhook ? 'Sending Test...' : 'Test Webhook Dispatch'}
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsWebhookModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveWebhookConfig}>
                Save Webhook Config
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Log Details Modal */}
      {selectedLogEntry && (
        <Dialog
          isOpen={!!selectedLogEntry}
          onClose={() => setSelectedLogEntry(null)}
          title="Telemetry Audit Log Details"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-slate-900 dark:text-slate-100">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div>
                <span className="font-bold text-slate-400 block mb-0.5">Category</span>
                <span className="font-semibold">{selectedLogEntry.category}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 block mb-0.5">Status</span>
                <span className="font-semibold">{selectedLogEntry.status}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 block mb-0.5">Action</span>
                <span className="font-mono font-semibold">{selectedLogEntry.action}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 block mb-0.5">Timestamp</span>
                <span className="font-mono">{new Date(selectedLogEntry.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-400 block mb-1">Details & Message</span>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl leading-relaxed font-serif">
                {selectedLogEntry.details}
              </div>
            </div>

            {selectedLogEntry.metadata && (
              <div>
                <span className="font-bold text-slate-400 block mb-1">Metadata Payload</span>
                <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLogEntry.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedLogEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* LaTeX Cleaner Modal */}
      <Dialog
        isOpen={isLatexCleanerOpen}
        onClose={() => setIsLatexCleanerOpen(false)}
        title="LaTeX Equation Normalizer"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500">
            Paste raw LaTeX strings to test mathematical normalization into clean, readable notation.
          </p>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Raw LaTeX Input:
            </label>
            <textarea
              rows={3}
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Formatted Output */}
          <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40">
            <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
              Formatted KaTeX Rendering:
            </span>
            <div className="text-sm font-serif">
              <FormattedMathText text={latexInput} />
            </div>
          </div>

          {/* Clean Plain Text Output */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Normalized Plain Text:
              </span>
              <button
                onClick={() => copyToClipboard(cleanLatexToNormalText(latexInput))}
                className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                {copiedCleanText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCleanText ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-sans text-xs text-slate-700 dark:text-slate-300 select-all">
              {cleanLatexToNormalText(latexInput) || '(No input)'}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIsLatexCleanerOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Tutorial Modal */}
      <Dialog
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        title="Admin Editorial & Verification Workflow"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 space-y-1">
            <h4 className="font-bold">Guidelines for Verifying STEM Problems:</h4>
            <p>
              Every problem added to LearnCo must satisfy strict rigorous mathematical standards, first-principles derivation invariants, and progressive hint rubric requirements.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 dark:text-slate-100">1. Verification Status Criteria:</h5>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-emerald-600">Verified:</strong> Editorial quality, fully formatted equations, rigorous step-by-step solutions.</li>
              <li><strong className="text-amber-600">Candidate:</strong> Newly generated by AI engines; requires human inspection.</li>
              <li><strong className="text-rose-600">Flagged:</strong> Needs correction or contains ambiguous notation.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 dark:text-slate-100">2. Anti-Repetition Guarantee:</h5>
            <p>
              When a learner practices, the Question Selection Engine prioritizes unattempted problems first to eliminate repeated questions across sessions.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIsTutorialOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Inspect Question Modal */}
      <Dialog
        isOpen={!!inspectQuestion}
        onClose={() => setInspectQuestion(null)}
        title={inspectQuestion ? `Inspect Question: ${inspectQuestion.id}` : 'Question Details'}
        maxWidth="lg"
      >
        {inspectQuestion && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                {inspectQuestion.subjectId}
              </span>
              <DifficultyBadge difficulty={inspectQuestion.difficulty} />
              <Badge variant={inspectQuestion.verificationStatus === 'verified' ? 'success' : 'default'}>
                {inspectQuestion.verificationStatus.toUpperCase()}
              </Badge>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {inspectQuestion.topicId}
              </span>
            </div>

            {/* Statement */}
            <div className="space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">
                Problem Statement
              </span>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-sm font-serif">
                <FormattedMathText text={inspectQuestion.questionText} />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">
                Calibrated Options
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inspectQuestion.options.map((opt, oIdx) => {
                  const isCorrect = opt === inspectQuestion.correctAnswer;
                  return (
                    <div
                      key={oIdx}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <FormattedMathText text={opt} inline />
                      {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation & Steps */}
            <div className="space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">
                Step-by-Step Derivation & Solution
              </span>
              <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900 space-y-2">
                <div className="font-serif">
                  <FormattedMathText text={inspectQuestion.explanation} />
                </div>
                {inspectQuestion.stepByStepSolution && (
                  <div className="space-y-1 pt-2 border-t border-indigo-100/60 dark:border-indigo-900/60">
                    {inspectQuestion.stepByStepSolution.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-1.5 text-[11px]">
                        <span className="font-bold text-indigo-600">{sIdx + 1}.</span>
                        <FormattedMathText text={step} inline />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hints */}
            {inspectQuestion.hints && inspectQuestion.hints.length > 0 && (
              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider block">
                  Progressive Hint Rubric ({inspectQuestion.hints.length} tiers)
                </span>
                <div className="space-y-1">
                  {inspectQuestion.hints.map((hint, hIdx) => (
                    <div
                      key={hIdx}
                      className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 flex items-start gap-2"
                    >
                      <span className="font-bold text-amber-600">Tier {hIdx + 1}:</span>
                      <FormattedMathText text={hint} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setInspectQuestion(null)}>
                Close
              </Button>
              {inspectQuestion.verificationStatus !== 'flagged' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    handleFlag(inspectQuestion.id);
                  }}
                >
                  Flag for Review
                </Button>
              )}
              {inspectQuestion.verificationStatus !== 'verified' && (
                <Button
                  variant="success"
                  size="sm"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => {
                    handleVerify(inspectQuestion.id);
                  }}
                >
                  Approve & Mark Verified
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
