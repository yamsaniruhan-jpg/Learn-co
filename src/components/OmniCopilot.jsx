import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  BookOpen,
  PenTool,
  Target,
  X,
  ArrowUp,
  Sparkles,
  Lightbulb,
  ImagePlus,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { apiCall } from '../client/firebase';
import { FormattedMathText } from './common/FormattedMathText';
import { prepareQuestionImage } from '../utils/imageAttachment';

const MODES = [
  { id: 'general', Icon: Bot, label: 'General' },
  { id: 'learner', Icon: BookOpen, label: 'Tutor' },
  { id: 'creator', Icon: PenTool, label: 'Creator' },
  { id: 'mentor', Icon: Target, label: 'Mentor' },
];

const MODE_MAP = {
  general: 'socratic_hint',
  learner: 'socratic_hint',
  creator: 'conceptual_explainer',
  mentor: 'exam_solver',
};

export default function OmniCopilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [hintFirst, setHintFirst] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('general');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const handleOpen = (event) => {
      setIsOpen(true);
      const prefill = event?.detail?.prompt;
      if (typeof prefill === 'string' && prefill.trim()) {
        setInput(prefill);
      }
    };
    window.addEventListener('learnco:open-copilot', handleOpen);
    return () => window.removeEventListener('learnco:open-copilot', handleOpen);
  }, []);

  const handleImagePick = async (file) => {
    if (!file) return;
    try {
      const prepared = await prepareQuestionImage(file);
      setAttachedImage(prepared);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: err?.message || 'Could not attach image.', timestamp: Date.now() },
      ]);
    }
  };

  const sendMessage = async (overridePrompt, overrides = {}) => {
    const rawText = (overridePrompt ?? input).trim();
    const pendingImg = attachedImage;
    if ((!rawText && !pendingImg) || isLoading) return;

    const textToSend = rawText || 'Solve and explain the question shown in this photo.';
    const useHintFirst = overrides.hintFirst ?? hintFirst;
    const revealFullSolution = overrides.revealFullSolution ?? false;

    const userMessage = {
      role: 'user',
      content: textToSend,
      imageDataUrl: pendingImg?.previewUrl,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    if (!overridePrompt) setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const mappedMode = MODE_MAP[mode] || 'socratic_hint';
      const res = await apiCall('/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: textToSend,
          mode: mappedMode,
          hintFirst: useHintFirst,
          revealFullSolution,
          imageAttachment: pendingImg?.attachment,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const replyText =
          data.message?.content ?? data.response ?? data.reply ?? 'No response received.';
        const modelUsed = data.message?.modelUsed || data.modelUsed || data.model;
        setMessages((prev) => [
          ...prev,
          {
            role: modelUsed === 'unavailable' ? 'unavailable' : 'assistant',
            content: replyText,
            model: modelUsed,
            hintOnly: data.hintOnly || data.message?.hintOnly,
            fallbackPracticeQuestions:
              data.fallbackPracticeQuestions || data.message?.fallbackPracticeQuestions || [],
            originalQuestion: textToSend,
            timestamp: Date.now(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'error',
            content: data.error || 'Something went wrong. Please try again.',
            originalQuestion: textToSend,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: 'Connection error. Check your internet and tap Retry.',
          originalQuestion: textToSend,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 min-w-[56px] min-h-[56px] w-14 h-14 bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white rounded-2xl shadow-lg flex items-center justify-center z-40 transition-transform hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6C5CE7]"
        aria-label="Open Omni Copilot"
        title="Ask a doubt"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-[calc(100vw-2rem)] sm:w-[26rem] h-[540px] sm:h-[620px] bg-white dark:bg-[#2A2647] rounded-2xl shadow-2xl flex flex-col z-50 border border-[#E3DFF5] dark:border-[#3D3861] overflow-hidden">
      {/* Header */}
      <div className="bg-[#6C5CE7] text-white p-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Omni Copilot</h3>
            <p className="text-[11px] opacity-90">1-line answer · steps · check yourself</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="min-w-[44px] min-h-[44px] rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition cursor-pointer"
          aria-label="Close AI Copilot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode & Hint-First Row */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-[#F7F5FF] dark:bg-[#1E1B33] border-b border-[#E3DFF5] dark:border-[#3D3861]">
        <div className="flex gap-1 overflow-x-auto">
          {MODES.map((m) => {
            const ModeIcon = m.Icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs whitespace-nowrap flex items-center gap-1 transition cursor-pointer ${
                  mode === m.id
                    ? 'bg-[#6C5CE7] text-white font-bold'
                    : 'text-[#6B6890] dark:text-[#B4B0D5] hover:bg-white dark:hover:bg-[#2A2647]'
                }`}
              >
                <ModeIcon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={hintFirst}
          onClick={() => setHintFirst((prev) => !prev)}
          className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer border ${
            hintFirst
              ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-950 dark:text-amber-200'
              : 'bg-white dark:bg-[#2A2647] border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5]'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Hint</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-[#6B6890] dark:text-[#B4B0D5] mt-12 space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
              Ask a doubt or upload a photo
            </p>
            <p className="text-xs leading-relaxed">
              Toggle <strong>Hint</strong> above if you want a clue first instead of the full answer.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm space-y-2 ${
                msg.role === 'user'
                  ? 'bg-[#6C5CE7] text-white'
                  : msg.role === 'error' || msg.role === 'unavailable'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-[#2D2A4A] dark:text-[#F1EFFF] border border-amber-300 dark:border-amber-800'
                  : 'bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#E3DFF5] dark:border-[#3D3861]'
              }`}
            >
              {msg.imageDataUrl && (
                <img
                  src={msg.imageDataUrl}
                  alt="Uploaded question"
                  className="max-h-36 rounded-lg object-contain bg-black/10"
                />
              )}

              {msg.role === 'assistant' ? (
                <div className="whitespace-pre-wrap leading-relaxed">
                  <FormattedMathText text={String(msg.content || '')} preferNormalText />
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}

              {msg.hintOnly && (
                <button
                  type="button"
                  onClick={() =>
                    sendMessage(`Reveal full solution for: ${msg.originalQuestion || 'previous question'}`, {
                      hintFirst: false,
                      revealFullSolution: true,
                    })
                  }
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Reveal full solution</span>
                </button>
              )}

              {(msg.role === 'error' || msg.role === 'unavailable') && msg.originalQuestion && (
                <button
                  type="button"
                  onClick={() => sendMessage(msg.originalQuestion)}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}

              {msg.fallbackPracticeQuestions?.length > 0 && (
                <div className="pt-2 border-t border-amber-200 dark:border-amber-800 space-y-1.5">
                  <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    Practice on this topic:
                  </p>
                  {msg.fallbackPracticeQuestions.slice(0, 2).map((q) => (
                    <div
                      key={q.id}
                      className="p-2 rounded-lg bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-[11px]"
                    >
                      <FormattedMathText text={q.questionText} preferNormalText />
                    </div>
                  ))}
                </div>
              )}

              {msg.model && msg.role === 'assistant' && (
                <p className="text-[10px] text-[#6B6890] dark:text-[#B4B0D5] pt-1 border-t border-[#E3DFF5] dark:border-[#3D3861]">
                  Model: {msg.model} · AI can be wrong
                </p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#F7F5FF] dark:bg-[#1E1B33] rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-[#6B6890]">
              Solving...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#E3DFF5] dark:border-[#3D3861] bg-white dark:bg-[#2A2647] space-y-2">
        {attachedImage && (
          <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861]">
            <div className="flex items-center gap-2 min-w-0">
              <img src={attachedImage.previewUrl} alt="Question preview" className="w-8 h-8 rounded object-cover" />
              <span className="text-[11px] truncate">{attachedImage.attachment.name || 'Question image'}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              aria-label="Remove attached photo"
              className="p-1.5 text-rose-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              handleImagePick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#6C5CE7] flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Upload photo of a question"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hintFirst ? 'Ask for a hint...' : 'Ask anything...'}
            rows={1}
            className="flex-1 min-h-[44px] resize-none border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2.5 text-xs sm:text-sm bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
            maxLength={4000}
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={(!input.trim() && !attachedImage) || isLoading}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#6C5CE7] text-white flex items-center justify-center hover:bg-[#5B4BC4] disabled:opacity-50 shrink-0 cursor-pointer transition"
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
