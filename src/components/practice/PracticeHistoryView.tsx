import React, { useState, useEffect } from 'react';
import { AuthClient } from '../../services/authClient';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  RefreshCw,
} from 'lucide-react';

interface AttemptRecord {
  id: string;
  questionId: string;
  subjectId: string;
  topicId: string;
  difficulty: string;
  selectedAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  solvingTimeSeconds: number;
  hintsRevealedCount: number;
  submittedAt: string;
  questionText?: string;
  explanation?: string;
  stepByStepSolution?: string[];
}

export const PracticeHistoryView: React.FC = () => {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/practice/history', {
        headers: {
          Authorization: `Bearer ${AuthClient.getToken()}`,
        },
      });
      const data = await res.json();
      if (data.attempts) {
        setAttempts(data.attempts);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredAttempts = attempts.filter((a) => {
    if (filterSubject !== 'all' && a.subjectId !== filterSubject) return false;
    if (filterStatus === 'correct' && !a.isCorrect) return false;
    if (filterStatus === 'incorrect' && a.isCorrect) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTopic = a.topicId?.toLowerCase().includes(q);
      const matchText = a.questionText?.toLowerCase().includes(q);
      return matchTopic || matchText;
    }
    return true;
  });

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const overallAccuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Quick Summary Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            <span>Practice Session History & Attempt Logs</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative immutable record of all STEM question attempts, time per problem, and accuracy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Solved</div>
            <div className="text-base font-mono font-bold text-slate-900 dark:text-slate-100">{totalAttempts}</div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Lifetime Accuracy</div>
            <div className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">{overallAccuracy}%</div>
          </div>

          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Subjects</option>
            <option value="math">Mathematics</option>
            <option value="cs">Computer Science & AI</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
            <option value="biology">Biology</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Attempts</option>
            <option value="correct">Correct Only</option>
            <option value="incorrect">Incorrect Only</option>
          </select>
        </div>

        <div className="relative flex-1 max-w-sm ml-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by topic or question text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Attempts List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            Loading practice attempts...
          </div>
        ) : filteredAttempts.length > 0 ? (
          filteredAttempts.map((attempt) => {
            const isExp = expandedId === attempt.id;
            return (
              <div
                key={attempt.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        attempt.isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {attempt.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {attempt.topicId || 'Practice Problem'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 uppercase text-slate-500">
                          {attempt.subjectId}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 capitalize text-slate-500">
                          {attempt.difficulty?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{attempt.solvingTimeSeconds}s</span>
                        <span>•</span>
                        <span>{new Date(attempt.submittedAt).toLocaleDateString()}</span>
                        {attempt.hintsRevealedCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{attempt.hintsRevealedCount} hint(s)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        attempt.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {attempt.isCorrect ? '+5 XP' : '0 XP'}
                    </span>

                    <button
                      onClick={() => setExpandedId(isExp ? null : attempt.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Question Statement */}
                {attempt.questionText && (
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-serif line-clamp-2">
                    {attempt.questionText}
                  </div>
                )}

                {/* Expanded Details */}
                {isExp && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Your Response</span>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {attempt.selectedAnswer?.toString() || 'None'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Correct Answer</span>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {attempt.correctAnswer?.toString() || '—'}
                        </div>
                      </div>
                    </div>

                    {attempt.explanation && (
                      <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/40 text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">Explanation:</span>
                        <p>{attempt.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No practice attempts found for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
