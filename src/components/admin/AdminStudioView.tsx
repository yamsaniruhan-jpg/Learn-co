import React, { useState } from 'react';
import {
  ShieldCheck,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Plus,
  Search,
} from 'lucide-react';
import { Question, VerificationStatus } from '../../types';
import { SEED_QUESTIONS } from '../../data/seedData';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';
import { DifficultyBadge } from '../ui/GamificationIndicators';

export const AdminStudioView: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>(SEED_QUESTIONS);
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');
  const [inspectQuestion, setInspectQuestion] = useState<Question | null>(null);

  const handleVerify = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, verificationStatus: 'verified' } : q))
    );
    if (inspectQuestion?.id === id) {
      setInspectQuestion((prev) => (prev ? { ...prev, verificationStatus: 'verified' } : null));
    }
  };

  const handleFlag = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, verificationStatus: 'flagged' } : q))
    );
    if (inspectQuestion?.id === id) {
      setInspectQuestion((prev) => (prev ? { ...prev, verificationStatus: 'flagged' } : null));
    }
  };

  const filteredQuestions = questions.filter((q) =>
    statusFilter === 'all' ? true : q.verificationStatus === statusFilter
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Editorial Governance Queue</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
            Question Verification & Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Enforce pedagogical rigor: AI candidate item review, mathematical correctness verification, and hint rubric checks.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'verified', label: 'Verified Editorial' },
          { id: 'candidate', label: 'AI Candidates' },
          { id: 'flagged', label: 'Flagged for Review' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Questions Queue */}
      <div className="space-y-3">
        {filteredQuestions.map((q) => (
          <Card key={q.id} variant="default" padding="md" className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant={q.subjectId} size="sm">
                    {q.subjectId.toUpperCase()}
                  </Badge>
                  <DifficultyBadge difficulty={q.difficulty} />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      q.verificationStatus === 'verified'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : q.verificationStatus === 'flagged'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {q.verificationStatus}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {q.questionText}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Topic: {q.topicId} • Source: {q.source}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setInspectQuestion(q)}
                >
                  Inspect
                </Button>
                {q.verificationStatus !== 'verified' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleVerify(q.id)}
                  >
                    Verify
                  </Button>
                )}
                {q.verificationStatus !== 'flagged' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleFlag(q.id)}
                  >
                    Flag
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Inspect Item Modal */}
      <Dialog
        isOpen={!!inspectQuestion}
        onClose={() => setInspectQuestion(null)}
        title="Question Editorial Inspection"
        description="Verify mathematical correctness and progressive hint rubrics."
        maxWidth="2xl"
      >
        {inspectQuestion && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Question Statement
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                {inspectQuestion.questionText}
              </p>
            </div>

            {inspectQuestion.options && (
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Answer Options
                </span>
                <div className="space-y-1">
                  {inspectQuestion.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border ${
                        String(opt) === String(inspectQuestion.correctAnswer)
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 font-bold text-emerald-800 dark:text-emerald-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt} {String(opt) === String(inspectQuestion.correctAnswer) && '(Correct)'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Analytical Solution & Proof
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
                {inspectQuestion.explanation}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectQuestion(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleVerify(inspectQuestion.id);
                  setInspectQuestion(null);
                }}
              >
                Approve & Mark Verified
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
