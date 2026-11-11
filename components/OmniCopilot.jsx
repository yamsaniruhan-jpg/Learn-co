// components/OmniCopilot.jsx
import { useState, useRef, useEffect } from 'react';
import { apiCall } from '../client/firebase';

const MODES = [
  { id: 'general', icon: '🤖', label: 'General' },
  { id: 'learner', icon: '📚', label: 'Tutor' },
  { id: 'creator', icon: '✏️', label: 'Creator' },
  { id: 'mentor', icon: '🎯', label: 'Mentor' },
];

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
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiCall('/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({ message: input, mode }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response || data.reply,
          model: data.model,
          timestamp: Date.now(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'error',
          content: data.error || 'Something went wrong. Please try again.',
          timestamp: Date.now(),
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'Connection error. Check your internet and try again.',
        timestamp: Date.now(),
      }]);
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
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center text-2xl z-50 cursor-pointer"
        aria-label="Open AI Copilot"
      >
        🤖
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold">Omni Copilot</h3>
          <p className="text-xs opacity-80">AI-powered assistant</p>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-xl hover:opacity-70 cursor-pointer">✕</button>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-1 p-2 bg-gray-50 border-b overflow-x-auto">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap cursor-pointer ${
              mode === m.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-4xl mb-2">🤖</p>
            <p>Ask me anything about your courses,</p>
            <p>learning goals, or content creation.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white' :
              msg.role === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-gray-100 text-gray-800'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.model && (
                <p className="text-[10px] opacity-50 mt-1">via {msg.model}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 resize-none border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={4000}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
