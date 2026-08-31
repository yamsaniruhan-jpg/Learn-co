import React, { useState } from 'react';
import {
  Sparkles,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Loader2,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AnalyticsClient } from '../../services/analyticsClient';

interface AiDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string, context?: any) => void;
}

export const AiDiagnosticModal: React.FC<AiDiagnosticModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [focus, setFocus] = useState<string>('overall');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [diagnostic, setDiagnostic] = useState<{
    headline: string;
    diagnosticInsights: string[];
    prescriptions: string[];
    cognitiveProfile: string;
  } | null>(null);

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const res = await AnalyticsClient.getAiDiagnosticSummary(focus);
      setDiagnostic(res);
    } catch (err) {
      console.error('Failed to generate diagnostic summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!diagnostic) return;
    const text = `# ${diagnostic.headline}\n\n## Cognitive Profile\n${diagnostic.cognitiveProfile}\n\n## Diagnostic Insights\n${diagnostic.diagnosticInsights.map((i) => `- ${i}`).join('\n')}\n\n## Pedagogical Prescriptions\n${diagnostic.prescriptions.map((p) => `- ${p}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Socratic Cognitive Diagnostic Synthesis" maxWidth="lg">
      <div className="space-y-6">
        {/* Header explanation */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
          <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              AI Cognitive Diagnostic Profiler:
            </span>{' '}
            Synthesizes your multi-factor empirical metrics, repeated error traces, and retention decay rates into actionable pedagogical prescriptions.
          </div>
        </div>

        {/* Focus selector & Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Diagnostic Focus:</span>
            {[
              { id: 'overall', label: 'Holistic STEM' },
              { id: 'math', label: 'Mathematics & Calculus' },
              { id: 'chemistry', label: 'Organic Chemistry' },
              { id: 'cs', label: 'Optimization & CS' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFocus(f.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  focus === f.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={isLoading}
            className="text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate Diagnosis
              </>
            )}
          </Button>
        </div>

        {/* Results Container */}
        {diagnostic && (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            {/* Headline */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-700/60">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                Cognitive State Headline
              </span>
              <h3 className="text-base font-bold font-display">{diagnostic.headline}</h3>
            </div>

            {/* Cognitive Profile */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">
                Empirical Cognitive Profile:
              </span>
              {diagnostic.cognitiveProfile}
            </div>

            {/* Two Column Grid: Insights & Prescriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Diagnostic Insights */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Diagnostic Insights & Traps
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {diagnostic.diagnosticInsights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prescriptions */}
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Pedagogical Prescriptions
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {diagnostic.prescriptions.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={handleCopy} className="text-xs">
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    Copied Summary
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy Summary
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onClose();
                    if (onNavigateTab) onNavigateTab('practice');
                  }}
                  className="text-xs"
                >
                  <span>Practice Prescribed Set</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
