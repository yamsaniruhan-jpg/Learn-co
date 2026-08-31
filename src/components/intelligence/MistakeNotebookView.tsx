import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Bot,
  Search,
  Flame,
  Check,
  RotateCcw,
} from 'lucide-react';
import { MistakeRecord } from '../../types/auth';
import { MistakeAnalyticsSummary } from '../../types/analytics';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AnalyticsClient } from '../../services/analyticsClient';

interface MistakeNotebookViewProps {
  summary: MistakeAnalyticsSummary;
  mistakes: MistakeRecord[];
  onNavigateTab?: (tab: string, context?: any) => void;
  onRefresh?: () => void;
}

export const MistakeNotebookView: React.FC<MistakeNotebookViewProps> = ({
  summary,
  mistakes,
  onNavigateTab,
  onRefresh,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [filterResolved, setFilterResolved] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [scheduledIds, setScheduledIds] = useState<Record<string, boolean>>({});

  const remediationRate =
    summary.totalMistakes > 0
      ? Math.round((summary.resolvedCount / summary.totalMistakes) * 100)
      : 100;

  const handleToggleResolve = async (mistake: MistakeRecord) => {
    try {
      setUpdatingId(mistake.id);
      await AnalyticsClient.resolveMistake(mistake.id, !mistake.resolved);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to toggle mistake resolve:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleScheduleRemediation = async (mistake: MistakeRecord) => {
    try {
      setUpdatingId(mistake.id);
      await AnalyticsClient.scheduleMistakeRemediation(
        mistake.id,
        new Date().toISOString().split('T')[0],
        '17:00'
      );
      setScheduledIds((prev) => ({ ...prev, [mistake.id]: true }));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to schedule remediation:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMistakes = mistakes.filter((m) => {
    const matchesSubject = selectedSubject === 'all' || m.subjectId === selectedSubject;
    const matchesResolved =
      filterResolved === 'all'
        ? true
        : filterResolved === 'resolved'
        ? m.resolved
        : !m.resolved;
    const matchesSearch =
      m.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.topicId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.explanation || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesResolved && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default" padding="md" className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Mistakes Tracked
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display">
              {summary.totalMistakes}
            </span>
            <span className="text-xs text-slate-400">across question sessions</span>
          </div>
        </Card>

        <Card variant="default" padding="md" className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Unresolved Misconceptions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-500 font-display">
              {summary.unresolvedCount}
            </span>
            <span className="text-xs text-rose-400">requiring revision</span>
          </div>
        </Card>

        <Card variant="default" padding="md" className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Resolved & Mastered
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-500 font-display">
              {summary.resolvedCount}
            </span>
            <span className="text-xs text-emerald-400">retried & verified</span>
          </div>
        </Card>

        <Card variant="default" padding="md" className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Remediation Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-display">
              {remediationRate}%
            </span>
            <span className="text-xs text-slate-400">error conversion efficiency</span>
          </div>
        </Card>
      </div>

      {/* Repeated Mistake Clusters (if any) */}
      {summary.repeatedMistakeConcepts && summary.repeatedMistakeConcepts.length > 0 && (
        <Card variant="default" padding="md" className="space-y-3 bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              Repeated Error Clusters Detected (High Cognitive Debt)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {summary.repeatedMistakeConcepts.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    {item.conceptTitle}
                  </span>
                  <span className="text-[11px] text-slate-400 uppercase font-mono">
                    {item.subjectId} • {item.mistakeCount} errors
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    if (onNavigateTab) {
                      onNavigateTab('practice', {
                        subjectId: item.subjectId,
                        conceptId: item.conceptId,
                        topicId: item.conceptTitle,
                      });
                    }
                  }}
                  className="text-xs py-1 px-2.5 shrink-0"
                >
                  Remediate
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search mistakes, concepts, or formulas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Resolved filter toggle */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['unresolved', 'resolved', 'all'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterResolved(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filterResolved === mode
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <div className="flex gap-1 overflow-x-auto">
            {['all', 'math', 'cs', 'physics', 'chemistry', 'biology'].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  selectedSubject === sub
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mistake Items List */}
      {filteredMistakes.length === 0 ? (
        <Card variant="default" padding="lg" className="text-center py-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Mistakes Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {filterResolved === 'unresolved'
              ? 'Great work! You have no unresolved mistake backlog matching this filter.'
              : 'No mistake records matching the selected criteria.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((mistake) => {
            const isScheduled = scheduledIds[mistake.id];
            const isUpdating = updatingId === mistake.id;

            return (
              <Card
                key={mistake.id}
                variant="default"
                padding="md"
                className={`transition-all space-y-3.5 ${
                  mistake.resolved
                    ? 'opacity-80 border-emerald-200/60 dark:border-emerald-950/40 bg-emerald-50/10'
                    : 'hover:border-rose-200 dark:hover:border-rose-900/60'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={mistake.subjectId} size="sm">
                      {mistake.subjectId.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {mistake.topicId}
                    </span>
                    {mistake.resolved ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        RESOLVED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        UNRESOLVED
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Recorded {new Date(mistake.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Question Statement */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Problem Statement
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {mistake.questionText}
                  </p>
                </div>

                {/* Answers Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Your Answer */}
                  <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
                      Your Answer (Trap / Misconception)
                    </span>
                    <p className="text-xs text-rose-950 dark:text-rose-200 font-medium font-mono">
                      {mistake.userAnswer || 'Incorrect option chosen'}
                    </p>
                  </div>

                  {/* Correct Invariant */}
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      Correct Invariant / Solution
                    </span>
                    <p className="text-xs text-emerald-950 dark:text-emerald-200 font-medium font-mono">
                      {mistake.correctAnswer}
                    </p>
                  </div>
                </div>

                {/* Invariant Explanation */}
                {mistake.explanation && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Derivation Invariant: </span>
                    {mistake.explanation}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={mistake.resolved ? 'secondary' : 'primary'}
                      onClick={() => handleToggleResolve(mistake)}
                      disabled={isUpdating}
                      className="text-xs py-1 px-3"
                    >
                      {mistake.resolved ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Mark Unresolved
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Mark Resolved
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleScheduleRemediation(mistake)}
                      disabled={isScheduled || isUpdating}
                      className="text-xs py-1 px-3"
                    >
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {isScheduled ? 'Scheduled' : 'Schedule Review'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (onNavigateTab) {
                          onNavigateTab('practice', {
                            subjectId: mistake.subjectId,
                            conceptId: mistake.conceptId,
                            topicId: mistake.topicId,
                          });
                        }
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 py-1 px-2.5"
                    >
                      <span>Practice Similar</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (onNavigateTab) {
                          onNavigateTab('copilot', {
                            prompt: `Help me understand my mistake on this problem:\n\n"${mistake.questionText}"\n\nI answered: "${mistake.userAnswer}", but the correct answer is "${mistake.correctAnswer}". Please derive the underlying invariant and give me a socratic hint.`,
                          });
                        }
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 py-1 px-2.5"
                    >
                      <Bot className="w-3.5 h-3.5 mr-1" />
                      Ask Copilot
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
