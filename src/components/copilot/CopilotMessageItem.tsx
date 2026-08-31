import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  FileText,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Code2,
} from 'lucide-react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import {
  CopilotMessage,
  CopilotCitation,
  CopilotArtifact,
} from '../../types/copilot';
import { CopilotClient } from '../../services/copilotClient';

interface CopilotMessageItemProps {
  message: CopilotMessage;
  userFullName: string;
  onQuickAction?: (actionPrompt: string) => void;
  onRegenerate?: () => void;
  onNavigateToCreator?: (resourceId?: string) => void;
}

export const CopilotMessageItem: React.FC<CopilotMessageItemProps> = ({
  message,
  userFullName,
  onQuickAction,
  onRegenerate,
  onNavigateToCreator,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(true);

  // Practice Question State if artifact attached
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePracticeOptionSelect = async (opt: string, practiceData: any) => {
    if (isSubmitted) return;
    setSelectedAnswer(opt);
    setIsSubmitted(true);

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

      if (res.isCorrect) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    } catch (err) {
      console.error('Practice answer submission failed:', err);
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
        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-purple-500/20'
        }`}
      >
        {isUser ? userFullName[0]?.toUpperCase() || 'U' : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Message Body Content */}
      <div className="space-y-2 max-w-[88%] sm:max-w-[92%] flex-1">
        {/* Top Header metadata */}
        <div
          className={`flex items-center gap-2 text-[11px] text-slate-400 px-1 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {isUser ? userFullName : 'Omni Copilot'}
          </span>
          {message.modelUsed && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
              {message.modelUsed}
            </span>
          )}
          {message.mode && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 text-[10px] font-medium capitalize">
              {message.mode.replace('_', ' ')}
            </span>
          )}
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Message Bubble */}
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed transition-colors ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
              : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/90 dark:border-slate-700/80 shadow-xs'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm space-y-2 selection:bg-purple-500 selection:text-white">
              <Markdown>{message.content}</Markdown>
            </div>
          )}
        </div>

        {/* Citations & Source Attribution Pill Card */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 space-y-1.5 text-xs">
            <button
              onClick={() => setShowCitations((prev) => !prev)}
              className="w-full flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[11px] cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                <span>Grounded Citations & Reference Knowledge ({message.citations.length})</span>
              </div>
              {showCitations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showCitations && (
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
            )}
          </div>
        )}

        {/* Embedded Practice Question Artifact */}
        {!isUser && message.artifact?.type === 'practice_question' && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-purple-50/90 dark:from-slate-800 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-indigo-600 text-white">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {message.artifact.title || 'Interactive Diagnostic Practice Drill'}
                  </h4>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    Reward: +5 XP upon correct resolution
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                {message.artifact.data.difficulty || 'Medium'}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
              {message.artifact.data.questionText}
            </p>

            {/* Multiple Choice Options */}
            <div className="space-y-1.5">
              {message.artifact.data.options?.map((opt: string, i: number) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectAnswer =
                  String(opt).trim().toLowerCase() ===
                  String(message.artifact?.data.correctAnswer).trim().toLowerCase();

                let btnStyles =
                  'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400';

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
                    disabled={isSubmitted}
                    onClick={() => handlePracticeOptionSelect(opt, message.artifact?.data)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyles}`}
                  >
                    <span>{opt}</span>
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

            {/* Feedback & Invariant Explanation */}
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
                  <p className="text-[11px] opacity-90 pt-1 border-t border-black/10 dark:border-white/10">
                    <strong>Invariant Explanation:</strong> {message.artifact.data.explanation}
                  </p>
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                {message.artifact.data?.flashcards?.length || 0} Cards
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Flashcards saved securely into your Creator Studio notebook.
            </p>
            {onNavigateToCreator && (
              <button
                onClick={() => onNavigateToCreator(message.artifact?.savedToCreatorId)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Notebook Synced
              </span>
            </div>
            {onNavigateToCreator && (
              <button
                onClick={() => onNavigateToCreator(message.artifact?.savedToCreatorId)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <span>Open in Creator Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Action Toolbar */}
        {!isUser && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 px-1 pt-0.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            )}

            {/* Quick Extension Pills */}
            {onQuickAction && (
              <div className="flex flex-wrap items-center gap-1 ml-auto">
                <button
                  onClick={() => onQuickAction('Can you explain this simpler with an intuitive physical analogy?')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-500 dark:text-slate-400 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  Simpler
                </button>
                <button
                  onClick={() => onQuickAction('Please provide a rigorous mathematical proof and derivation with invariants.')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950 hover:text-purple-600 text-slate-500 dark:text-slate-400 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  Deeper Proof
                </button>
                <button
                  onClick={() => onQuickAction('Give me 1 diagnostic practice problem to test my understanding.')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950 hover:text-cyan-600 text-slate-500 dark:text-slate-400 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  + Drill Problem
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
