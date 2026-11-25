import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  FileText,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Award,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CopilotMessage, CopilotFallbackQuestion } from '../../types/copilot';
import { CopilotClient } from '../../services/copilotClient';
import { FormattedMathText } from '../common/FormattedMathText';

interface CopilotMessageItemProps {
  message: CopilotMessage;
  userFullName: string;
  onQuickAction?: (actionPrompt: string) => void;
  onRegenerate?: () => void;
  onRevealFullSolution?: (message: CopilotMessage) => void;
  onRetryUnavailable?: (message: CopilotMessage) => void;
  onNavigateToCreator?: (resourceId?: string) => void;
}

interface ParsedSections {
  answer?: string;
  hint?: string;
  steps?: string;
  checkYourself?: string;
}

function parseStructuredCopilotReply(content: string): ParsedSections | null {
  const normalized = content.trim();
  const hasMarker = /\*\*(Answer|Hint|Step-by-step|Check yourself):\*\*/i.test(normalized);
  if (!hasMarker) return null;

  const extract = (labelRegex: RegExp): string | undefined => {
    const match = normalized.match(labelRegex);
    return match?.[1]?.trim() || undefined;
  };

  const stopPattern = '(?=\\n\\s*\\*\\*(?:Answer|Hint|Step-by-step|Check yourself):\\*\\*|$)';
  const answer = extract(new RegExp(`\\*\\*Answer:\\*\\*\\s*([\\s\\S]*?)${stopPattern}`, 'i'));
  const hint = extract(new RegExp(`\\*\\*Hint:\\*\\*\\s*([\\s\\S]*?)${stopPattern}`, 'i'));
  const steps = extract(new RegExp(`\\*\\*Step-by-step:\\*\\*\\s*([\\s\\S]*?)${stopPattern}`, 'i'));
  const checkYourself = extract(new RegExp(`\\*\\*Check yourself:\\*\\*\\s*([\\s\\S]*?)${stopPattern}`, 'i'));

  if (!answer && !hint && !steps && !checkYourself) return null;
  return { answer, hint, steps, checkYourself };
}

const FallbackQuestionCard: React.FC<{ q: CopilotFallbackQuestion; index: number }> = ({ q, index }) => {
  const [chosen, setChosen] = useState<string | null>(null);
  const expected = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
  const isRight = chosen !== null && chosen.trim().toLowerCase() === String(expected).trim().toLowerCase();

  return (
    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E3DFF5] dark:border-[#3D3861] space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-bold text-[#6C5CE7] dark:text-[#A598FF] uppercase tracking-wide">
          Topic Practice #{index + 1} · {q.subjectId.toUpperCase()}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium capitalize">
          {q.difficulty.replace('_', ' ')}
        </span>
      </div>
      <div className="text-xs sm:text-sm font-medium text-[#2D2A4A] dark:text-[#F1EFFF]">
        <FormattedMathText text={q.questionText} preferNormalText />
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {q.options.map((opt, idx) => {
          const picked = chosen === opt;
          const correctOpt = opt.trim().toLowerCase() === String(expected).trim().toLowerCase();
          let style =
            'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#6C5CE7]';
          if (chosen !== null) {
            if (correctOpt) {
              style = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold';
            } else if (picked) {
              style = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200';
            }
          }
          return (
            <button
              key={idx}
              type="button"
              onClick={() => chosen === null && setChosen(opt)}
              disabled={chosen !== null}
              className={`min-h-[44px] w-full text-left px-3 py-2 rounded-xl border text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] ${style}`}
            >
              <span><FormattedMathText text={opt} inline preferNormalText /></span>
              {chosen !== null && correctOpt && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {chosen !== null && picked && !correctOpt && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div
          className={`p-2.5 rounded-lg text-xs border ${
            isRight
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
          }`}
        >
          <p className="font-bold mb-1">{isRight ? 'Correct!' : `Answer: ${expected}`}</p>
          <FormattedMathText text={q.explanation} inline preferNormalText />
        </div>
      )}
    </div>
  );
};

export const CopilotMessageItem: React.FC<CopilotMessageItemProps> = ({
  message,
  userFullName,
  onQuickAction,
  onRegenerate,
  onRevealFullSolution,
  onRetryUnavailable,
  onNavigateToCreator,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(true);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const isUser = message.role === 'user';
  const isUnavailable = message.modelUsed === 'unavailable' || Boolean(message.unavailableReason);
  const parsed = !isUser && !isUnavailable ? parseStructuredCopilotReply(message.content) : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePracticeOptionSelect = async (opt: string, practiceData: any) => {
    if (isSubmitted || isSubmitting) return;
    setSelectedAnswer(opt);
    setFeedbackMsg('');
    setIsSubmitting(true);

    try {
      const res = await CopilotClient.submitPracticeAnswer({
        questionId: practiceData.id || `q-gen-${Date.now()}`,
        subjectId: practiceData.subjectId || 'math',
        topic: practiceData.topic || 'STEM Practice',
        userAnswer: opt,
        correctAnswer: practiceData.correctAnswer,
      });

      setIsCorrect(res.isCorrect);
      setFeedbackMsg(res.message);
      setIsSubmitted(true);

      if (res.isCorrect) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    } catch {
      setFeedbackMsg('Could not confirm the submission. Check practice history before retrying if the connection was lost.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`group flex gap-3 max-w-4xl w-full ${
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
          isUser
            ? 'bg-[#6C5CE7] text-white'
            : 'bg-[#F0EDFA] dark:bg-[#2A2647] text-[#6C5CE7] dark:text-[#A598FF] border border-[#E3DFF5] dark:border-[#3D3861]'
        }`}
      >
        {isUser ? userFullName[0]?.toUpperCase() || 'U' : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Message Body Content */}
      <div className="space-y-2 max-w-[88%] sm:max-w-[92%] flex-1 min-w-0">
        {/* Header Metadata */}
        <div
          className={`flex flex-wrap items-center gap-2 text-[11px] text-[#6B6890] dark:text-[#B4B0D5] px-1 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <span className="font-semibold text-[#2D2A4A] dark:text-[#F1EFFF]">
            {isUser ? userFullName : 'Omni Copilot'}
          </span>
          {!isUser && message.modelUsed && (
            <span
              data-testid="copilot-model-badge"
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F0EDFA] dark:bg-[#24203E] text-[#5B4BC4] dark:text-[#C2BAFF] border border-[#E3DFF5] dark:border-[#3D3861]"
            >
              Model: {message.modelUsed.replace(' (⚡ Zero-Cost Cache)', '')}
            </span>
          )}
          {message.hintOnly && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-[10px] font-semibold">
              Hint first
            </span>
          )}
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Message Bubble */}
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed transition-colors ${
            isUser
              ? 'bg-[#6C5CE7] text-white rounded-tr-xs'
              : isUnavailable
              ? 'bg-amber-50/70 dark:bg-amber-950/30 text-[#2D2A4A] dark:text-[#F1EFFF] rounded-tl-xs border border-amber-200 dark:border-amber-800'
              : 'bg-white dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF] rounded-tl-xs border border-[#E3DFF5] dark:border-[#3D3861]'
          }`}
        >
          {isUser ? (
            <div className="space-y-2">
              {message.imageDataUrl && (
                <img
                  src={message.imageDataUrl}
                  alt="Uploaded question screenshot"
                  className="max-h-48 rounded-xl border border-white/25 object-contain bg-black/10"
                />
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ) : isUnavailable ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-xs sm:text-sm">{message.content}</p>
                  <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                    You can retry once ready or practice curated questions on the same topic right below.
                  </p>
                </div>
              </div>

              {onRetryUnavailable && (
                <button
                  type="button"
                  onClick={() => onRetryUnavailable(message)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry question</span>
                </button>
              )}

              {message.fallbackPracticeQuestions && message.fallbackPracticeQuestions.length > 0 && (
                <div className="pt-2 space-y-2.5 border-t border-amber-200/70 dark:border-amber-800/60">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Practice questions on this topic
                  </p>
                  <div className="space-y-2.5">
                    {message.fallbackPracticeQuestions.map((q, idx) => (
                      <FallbackQuestionCard key={q.id} q={q} index={idx} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : parsed ? (
            <div className="space-y-3">
              {parsed.hint && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Hint</span>
                  </div>
                  <div className="text-xs sm:text-sm">
                    <FormattedMathText text={parsed.hint} preferNormalText />
                  </div>
                </div>
              )}

              {parsed.answer && (
                <div className="p-3 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6C5CE7] dark:text-[#A598FF]">
                    Answer
                  </div>
                  <div className="text-xs sm:text-sm font-semibold">
                    <FormattedMathText text={parsed.answer} preferNormalText />
                  </div>
                </div>
              )}

              {parsed.steps && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B6890] dark:text-[#B4B0D5]">
                    Step-by-step
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm">
                    <FormattedMathText text={parsed.steps} preferNormalText />
                  </div>
                </div>
              )}

              {parsed.checkYourself && (
                <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                    Check yourself
                  </div>
                  <div className="text-xs sm:text-sm">
                    <FormattedMathText text={parsed.checkYourself} preferNormalText />
                  </div>
                </div>
              )}

              {message.hintOnly && onRevealFullSolution && (
                <button
                  type="button"
                  onClick={() => onRevealFullSolution(message)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Reveal full solution</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm space-y-2">
                <FormattedMathText text={message.content} preferNormalText />
              </div>
              {message.hintOnly && onRevealFullSolution && (
                <button
                  type="button"
                  onClick={() => onRevealFullSolution(message)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Reveal full solution</span>
                </button>
              )}
            </div>
          )}

          {/* Clear "AI can be wrong" verification disclaimer on AI replies */}
          {!isUser && !isUnavailable && message.modelUsed && (
            <p className="mt-3 pt-2 border-t border-[#E3DFF5] dark:border-[#3D3861] text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
              AI can be wrong — double-check equations, units, and boundary cases.
            </p>
          )}
        </div>

        {/* Citations & Source Attribution */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => setShowCitations((prev) => !prev)}
              aria-expanded={showCitations}
              className="min-h-[44px] w-full flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[11px] cursor-pointer px-1"
            >
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                <span>Retrieved reference material ({message.citations.length})</span>
              </div>
              {showCitations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showCitations && (
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Retrieved as context; verify claims directly against source notes.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {message.citations.map((cit, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {cit.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 uppercase font-mono">
                          {cit.sourceType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-2 text-[10px]">
                        "{cit.snippet}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Embedded Practice Question Artifact */}
        {!isUser && message.artifact?.type === 'practice_question' && (
          <div className="p-4 rounded-2xl bg-[#F7F5FF] dark:bg-slate-800 border border-[#E3DFF5] dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#6C5CE7] text-white">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {message.artifact.title || 'Interactive Diagnostic Practice Drill'}
                  </h4>
                  <span className="text-[10px] text-[#6C5CE7] dark:text-[#A598FF] font-semibold">
                    Self-check only; generated questions earn no server XP
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F0EDFA] dark:bg-indigo-950 text-[#5B4BC4] dark:text-indigo-300 uppercase">
                {message.artifact.data.difficulty || 'Medium'}
              </span>
            </div>

            <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
              <FormattedMathText text={message.artifact.data.questionText} preferNormalText />
            </div>

            <div className="space-y-1.5">
              {message.artifact.data.options?.map((opt: string, i: number) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectAnswer =
                  String(opt).trim().toLowerCase() ===
                  String(message.artifact?.data.correctAnswer).trim().toLowerCase();

                let btnStyles =
                  'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#6C5CE7]';

                if (isSubmitted) {
                  if (isCorrectAnswer) {
                    btnStyles = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-semibold';
                  } else if (isSelected && !isCorrectAnswer) {
                    btnStyles = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200';
                  }
                } else if (isSelected) {
                  btnStyles = 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-semibold';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isSubmitted || isSubmitting}
                    onClick={() => handlePracticeOptionSelect(opt, message.artifact?.data)}
                    className={`min-h-[44px] w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyles}`}
                  >
                    <span><FormattedMathText text={opt} inline preferNormalText /></span>
                    {isSubmitted && isCorrectAnswer && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {isSubmitted && isSelected && !isCorrectAnswer && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {isSubmitting && <p role="status" className="text-xs text-slate-500">Submitting answer…</p>}
            {!isSubmitted && feedbackMsg && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{feedbackMsg}</p>}
            {isSubmitted && (
              <div
                className={`p-3 rounded-xl text-xs space-y-1 ${
                  isCorrect
                    ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100/70 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{feedbackMsg}</span>
                </div>
                {message.artifact.data.explanation && (
                  <div className="text-[11px] opacity-90 pt-1 border-t border-black/10 dark:border-white/10">
                    <strong>Invariant Explanation:</strong> <FormattedMathText text={message.artifact.data.explanation} inline preferNormalText />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Embedded Flashcard Deck Artifact */}
        {!isUser && message.artifact?.type === 'flashcards' && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Generated Flashcard Deck: {message.artifact.title}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-200 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                {message.artifact.data?.flashcards?.length || 0} Cards
              </span>
            </div>
            {onNavigateToCreator && (
              <button
                type="button"
                onClick={() => onNavigateToCreator(message.artifact?.savedToCreatorId)}
                className="min-h-[44px] inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <span>View & Practice Deck in Creator Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Embedded Summary Note Artifact */}
        {!isUser && message.artifact?.type === 'summary' && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950 dark:text-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Synthesis Saved: {message.artifact.title}</span>
              </div>
            </div>
            {onNavigateToCreator && (
              <button
                type="button"
                onClick={() => onNavigateToCreator(message.artifact?.savedToCreatorId)}
                className="min-h-[44px] inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <span>Open in Creator Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Action Toolbar */}
        {!isUser && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B6890] dark:text-[#B4B0D5] px-1 pt-0.5">
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[44px] px-2 flex items-center gap-1 hover:text-[#2D2A4A] dark:hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="min-h-[44px] px-2 flex items-center gap-1 hover:text-[#2D2A4A] dark:hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            )}

            {onQuickAction && !isUnavailable && (
              <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => onQuickAction('Explain that simpler with a quick intuition check.')}
                  className="min-h-[44px] px-3 py-1 rounded-lg bg-[#F0EDFA] dark:bg-[#24203E] hover:bg-[#E3DFF5] dark:hover:bg-[#3D3861] text-[#5B4BC4] dark:text-[#C2BAFF] text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Simpler
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAction('Show a full rigorous proof and check boundary cases.')}
                  className="min-h-[44px] px-3 py-1 rounded-lg bg-[#F0EDFA] dark:bg-[#24203E] hover:bg-[#E3DFF5] dark:hover:bg-[#3D3861] text-[#5B4BC4] dark:text-[#C2BAFF] text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Deeper proof
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
