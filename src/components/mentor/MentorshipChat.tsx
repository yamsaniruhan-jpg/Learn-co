import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Sparkles,
  CheckCheck,
  Check,
  BookOpen,
  FileText,
  Target,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { MentorshipMessage, MentorshipRelationship } from '../../types/mentorship';
import { Button } from '../ui/Button';

interface MentorshipChatProps {
  relationship: MentorshipRelationship;
  messages: MentorshipMessage[];
  currentUserId: string;
  onSendMessage: (content: string, attachedResource?: any) => Promise<void>;
  onPrepareSessionWithCopilot: () => void;
}

export const MentorshipChat: React.FC<MentorshipChatProps> = ({
  relationship,
  messages,
  currentUserId,
  onSendMessage,
  onPrepareSessionWithCopilot,
}) => {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedResource, setAttachedResource] = useState<any>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !attachedResource) return;

    const messageText = content;
    const attachment = attachedResource;
    setContent('');
    setAttachedResource(null);
    setShowAttachMenu(false);
    setIsSending(true);

    try {
      await onSendMessage(messageText, attachment);
    } catch (err) {
      console.error(err);
      setContent(messageText);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      id={`mentorship-chat-${relationship.id}`}
      className="flex flex-col h-[560px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Chat Top Banner */}
      <div className="p-3.5 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={relationship.mentorAvatar}
            alt={relationship.mentorName}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/20"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {relationship.mentorName}
              </h4>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                Verified Mentor
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {relationship.subjectId.toUpperCase()} • Cadence: {relationship.agreedCadence}
            </p>
          </div>
        </div>

        {/* Action: Session Prep with Copilot */}
        <Button
          id="btn-prep-copilot-session"
          variant="outline"
          size="sm"
          className="text-xs flex items-center gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          onClick={onPrepareSessionWithCopilot}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Prep Agenda with Copilot</span>
        </Button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20 dark:bg-slate-950/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <BookOpen className="w-10 h-10 stroke-1 text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-semibold">No messages yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Send an introductory message to start discussing conceptual targets with {relationship.mentorName}.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === 'learner';
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <img
                    src={msg.senderAvatar || relationship.mentorAvatar}
                    alt={msg.senderName}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 mb-1"
                  />
                )}

                <div
                  className={`max-w-[78%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-br-xs shadow-sm'
                      : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-xs shadow-sm'
                  }`}
                >
                  {/* Attached Resource Embed if present */}
                  {msg.attachedResource && (
                    <div
                      className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                        isMe
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold block truncate">
                          {msg.attachedResource.title}
                        </span>
                        {msg.attachedResource.snippet && (
                          <p className="text-[11px] opacity-80 line-clamp-2 mt-0.5">
                            {msg.attachedResource.snippet}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] ${
                      isMe ? 'text-emerald-100/80' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && (
                      <span>
                        {msg.isRead ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-emerald-200/60" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Chip */}
      {attachedResource && (
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border-t border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 truncate">
            <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold truncate">Attached: {attachedResource.title}</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedResource(null)}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 ml-2"
          >
            Remove
          </button>
        </div>
      )}

      {/* Input Box Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            id="btn-toggle-attach"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {showAttachMenu && (
            <div className="absolute bottom-12 left-0 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-1 z-20 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAttachedResource({
                    type: 'creator_note',
                    id: 'res-calc-note-001',
                    title: 'Differential Calculus & Extrema Theorems',
                    snippet: 'Critical review of Taylor series expansion fallbacks.',
                  });
                  setShowAttachMenu(false);
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span className="truncate">Attach Calculus Notes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttachedResource({
                    type: 'learning_concept',
                    id: 'chem-sn2-walden',
                    title: 'SN2 Mechanism & Walden Inversion Drill',
                    snippet: 'Backside nucleophilic substitution diagnostic gap.',
                  });
                  setShowAttachMenu(false);
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
              >
                <Target className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate">Attach Weak Concept Drill</span>
              </button>
            </div>
          )}
        </div>

        <input
          type="text"
          id="input-mentor-chat-message"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Message ${relationship.mentorName}...`}
          className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />

        <Button
          id="btn-send-mentor-message"
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSending || (!content.trim() && !attachedResource)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
