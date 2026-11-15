// src/components/OmniCopilot.jsx
import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  BookOpen,
  PenTool,
  Target,
  X,
  ArrowUp,
  Sparkles,
} from 'lucide-react';
import { apiCall } from '../client/firebase';
import { FormattedMathText } from './common/FormattedMathText';

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
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('general');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    const textToSend = input.trim();
    if (!textToSend || isLoading) return;

    const userMessage = { role: 'user', content: textToSend, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const mappedMode = MODE_MAP[mode] || 'socratic_hint';
      const res = await apiCall('/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({ prompt: textToSend, mode: mappedMode }),
      });

      const data = await res.json();

      if (res.ok) {
        const replyText =
          data.message?.content ?? data.response ?? data.reply ?? 'No response received.';
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: replyText,
            model: data.message?.modelUsed || data.model,
            timestamp: Date.now(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'error',
            content: data.error || 'Something went wrong. Please try again.',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: 'Connection error. Check your internet and try again.',
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
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-14 h-14 bg-gradient-to-br from-[#6C5CE7] to-[#8577ED] hover:from-[#5B4BC4] hover:to-[#6C5CE7] text-white rounded-full shadow-[0_8px_24px_rgba(108,92,231,0.38)] flex items-center justify-center z-40 transition-transform hover:scale-105 cursor-pointer"
        aria-label="Open Gemini Omni Copilot"
        title="Open Gemini Omni Copilot"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[520px] sm:h-[600px] bg-white dark:bg-[#2A2647] rounded-3xl shadow-2xl flex flex-col z-50 border border-[#E3DFF5] dark:border-[#3D3861] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6C5CE7] to-[#8577ED] text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm leading-tight">Omni Copilot</h3>
            <p className="text-[11px] opacity-85">Gemini Study Assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition cursor-pointer"
          aria-label="Close AI Copilot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-1.5 p-2.5 bg-[#F7F5FF] dark:bg-[#1E1B33] border-b border-[#E3DFF5] dark:border-[#3D3861] overflow-x-auto">
        {MODES.map((m) => {
          const ModeIcon = m.Icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                mode === m.id
                  ? 'bg-[#6C5CE7] text-white font-bold shadow-xs'
                  : 'text-[#6B6890] dark:text-[#B4B0D5] hover:bg-white dark:hover:bg-[#2A2647]'
              }`}
            >
              <ModeIcon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-[#6B6890] dark:text-[#B4B0D5] mt-16 space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] flex items-center justify-center mx-auto">
              <Bot className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
              Ask Omni Copilot anything
            </p>
            <p className="text-xs max-w-[240px] mx-auto leading-relaxed">
              Get hints, solve formulas in plain readable notation, or ask what to study next.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-3xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-[#6C5CE7] text-white'
                  : msg.role === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#E3DFF5] dark:border-[#3D3861]'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="whitespace-pre-wrap leading-relaxed">
                  <FormattedMathText text={String(msg.content || '')} preferNormalText />
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
              {msg.model && <p className="text-[10px] opacity-55 mt-1">via {msg.model}</p>}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#F7F5FF] dark:bg-[#1E1B33] rounded-3xl px-4 py-3 text-xs font-semibold text-[#6B6890]">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#E3DFF5] dark:border-[#3D3861] bg-white dark:bg-[#2A2647]">
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 resize-none border border-[#E3DFF5] dark:border-[#3D3861] rounded-full px-4 py-2.5 text-sm bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
            maxLength={4000}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center hover:bg-[#5B4BC4] disabled:opacity-50 shrink-0 cursor-pointer transition"
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
