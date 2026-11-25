import React, { useState, useEffect } from 'react';
import {
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Terminal,
  Code2,
  BookOpen,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  ICT_CODING_PROBLEMS,
  ICTCodingProblem,
  ICTRunResult,
  runICTCodeInSandbox,
} from '../../data/ictCodingProblems';
import { useAuth } from '../../context/AuthContext';
import { AuthClient } from '../../services/authClient';
import { OfflineStorageManager } from '../../utils/offlineStorage';
import { buildApiHeaders } from '../../utils/csrf';

function solvedStorageKey(userId: string | null | undefined): string {
  return `learnco_ict_code_solved_v1:${userId || 'guest'}`;
}

function readSolvedIds(userId: string | null | undefined): string[] {
  try {
    const raw = localStorage.getItem(solvedStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export const ICTCodeRunnerLab: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const [selectedId, setSelectedId] = useState<string>(ICT_CODING_PROBLEMS[0].id);
  const [codeByProblem, setCodeByProblem] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const p of ICT_CODING_PROBLEMS) initial[p.id] = p.starterCode;
    return initial;
  });
  const [solvedIds, setSolvedIds] = useState<string[]>(() => readSolvedIds(user?.id));
  const [showReference, setShowReference] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastMode, setLastMode] = useState<'sample' | 'submit' | null>(null);
  const [runResult, setRunResult] = useState<ICTRunResult | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    setSolvedIds(readSolvedIds(user?.id));
  }, [user?.id]);

  const problem: ICTCodingProblem =
    ICT_CODING_PROBLEMS.find((p) => p.id === selectedId) || ICT_CODING_PROBLEMS[0];
  const currentCode = codeByProblem[problem.id] ?? problem.starterCode;

  const updateCode = (val: string) => {
    setCodeByProblem((prev) => ({ ...prev, [problem.id]: val }));
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const nextValue = `${currentCode.substring(0, start)}  ${currentCode.substring(end)}`;
      updateCode(nextValue);
      window.requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  const recordCompletion = async (prob: ICTCodingProblem, durationMs: number) => {
    const nextSolved = Array.from(new Set([...solvedIds, prob.id]));
    setSolvedIds(nextSolved);
    try {
      localStorage.setItem(solvedStorageKey(user?.id), JSON.stringify(nextSolved));
    } catch {
      // ignore storage errors
    }

    const sessionId = AuthClient.getSessionId();
    const attemptId = `ict-code-${prob.id}-${Date.now()}`;
    const seconds = Math.max(1, Math.round(durationMs / 1000) || 10);

    if (!sessionId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      if (user?.id) {
        OfflineStorageManager.saveOfflineAttempt({
          id: attemptId,
          userId: user.id,
          questionId: prob.id,
          subjectId: 'cs',
          topic: prob.topic,
          userAnswer: 'PASSED_ALL_TESTS',
          isCorrect: true,
          timeSpentSeconds: seconds,
        });
        setSyncMessage('All tests passed. Saved locally to offline sync queue.');
      }
      return;
    }

    try {
      const res = await fetch('/api/practice/submit-attempt', {
        method: 'POST',
        credentials: 'include',
        headers: buildApiHeaders(),
        body: JSON.stringify({
          attemptId,
          questionId: prob.id,
          subjectId: 'cs',
          topicId: prob.topic,
          selectedAnswer: 'PASSED_ALL_TESTS',
          isCorrect: true,
          timeSpentSeconds: seconds,
        }),
      });
      if (res.ok) {
        setSyncMessage('All sample & hidden tests passed. Progress synced to your account.');
        await refreshUserData();
      }
    } catch {
      if (user?.id) {
        OfflineStorageManager.saveOfflineAttempt({
          id: attemptId,
          userId: user.id,
          questionId: prob.id,
          subjectId: 'cs',
          topic: prob.topic,
          userAnswer: 'PASSED_ALL_TESTS',
          isCorrect: true,
          timeSpentSeconds: seconds,
        });
        setSyncMessage('All tests passed. Queued locally for sync.');
      }
    }
  };

  const executeTests = async (mode: 'sample' | 'submit') => {
    setIsRunning(true);
    setLastMode(mode);
    setSyncMessage(null);
    const cases =
      mode === 'sample'
        ? problem.sampleCases
        : [...problem.sampleCases, ...problem.hiddenCases];
    try {
      const res = await runICTCodeInSandbox(currentCode, cases, 2000);
      setRunResult(res);
      if (mode === 'submit' && res.success) {
        await recordCompletion(problem, res.totalDurationMs);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + Problem Switcher */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              ICT Algorithmic Sandbox &middot; Isolated Web Worker Execution
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              International Coding Test (ICT) Code Runner
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              Solved {solvedIds.length} / {ICT_CODING_PROBLEMS.length} Problems
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ICT_CODING_PROBLEMS.map((p) => {
            const active = p.id === problem.id;
            const solved = solvedIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedId(p.id);
                  setRunResult(null);
                  setLastMode(null);
                  setSyncMessage(null);
                  setShowReference(false);
                }}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                  active
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                }`}
              >
                {solved && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-emerald-300' : 'text-emerald-500'}`}
                  />
                )}
                <span>{p.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Specification */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{problem.title}</h3>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {problem.difficulty} &middot; {problem.topic} &middot; ~{problem.estimatedMinutes} min
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{problem.statement}</p>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">Input &amp; Output</div>
              <div className="font-mono text-slate-600 dark:text-slate-400">{problem.inputFormat}</div>
              <div className="text-slate-600 dark:text-slate-400 mt-1">{problem.outputFormat}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">Constraints</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400 font-mono">
                {problem.constraints.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Sample Cases
            </div>
            {problem.sampleCases.map((sc) => (
              <div
                key={sc.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1 overflow-x-auto"
              >
                <div>
                  <span className="font-bold text-slate-500">Input:</span> {JSON.stringify(sc.input)}
                </div>
                <div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Expected:</span>{' '}
                  {JSON.stringify(sc.expected)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowReference((prev) => !prev)}
              className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{showReference ? 'Hide Reference Approach & Complexity' : 'Show Complexity & Reference Solution'}</span>
            </button>

            {showReference && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Target Complexity: <span className="font-mono">{problem.timeComplexity}</span> time &middot;{' '}
                  <span className="font-mono">{problem.spaceComplexity}</span> space
                </div>
                <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-x-auto leading-relaxed">
                  {problem.referenceSolution}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right: Code Editor & Test Runner */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Code2 className="w-4 h-4 text-indigo-500" />
                <span>JavaScript (ES2022) &middot; Offline Sandbox</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  updateCode(problem.starterCode);
                  setRunResult(null);
                  setSyncMessage(null);
                }}
                className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Starter</span>
              </button>
            </div>

            <textarea
              aria-label="ICT JavaScript solution editor"
              spellCheck={false}
              value={currentCode}
              onChange={(e) => updateCode(e.target.value)}
              onKeyDown={handleEditorKeyDown}
              className="w-full h-72 sm:h-80 p-4 bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none resize-y"
            />

            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>2.0s execution limit per run &middot; Tab inserts 2 spaces</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => void executeTests('sample')}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isRunning && lastMode === 'sample' ? 'Running...' : 'Run Sample Tests'}</span>
                </button>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => void executeTests('submit')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isRunning && lastMode === 'submit' ? 'Evaluating...' : 'Submit All Tests'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results & Stdout Panel */}
          {runResult && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {runResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                  <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                    {runResult.compileError
                      ? 'Execution Error'
                      : `${runResult.passedCount} / ${runResult.totalCount} Tests Passed`}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  {runResult.totalDurationMs} ms total
                </span>
              </div>

              {syncMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {syncMessage}
                </div>
              )}

              {runResult.compileError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-mono text-rose-700 dark:text-rose-300">
                  {runResult.compileError}
                </div>
              )}

              {runResult.caseResults.length > 0 && (
                <div className="space-y-2">
                  {runResult.caseResults.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                          {c.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                          <span>{c.label}</span>
                        </div>
                        <span className="font-mono text-slate-400 tabular-nums">{c.durationMs} ms</span>
                      </div>
                      {!c.passed && (
                        <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 pl-6">
                          {c.error ? (
                            <span className="text-rose-500">Error: {c.error}</span>
                          ) : c.isHidden ? (
                            <span>Hidden test case output did not match expected answer.</span>
                          ) : (
                            <>
                              <div>Expected: {c.expected}</div>
                              <div>Actual: {c.actual}</div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {runResult.logs.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-sans font-bold text-xs mb-1">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Console Output</span>
                  </div>
                  {runResult.logs.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
