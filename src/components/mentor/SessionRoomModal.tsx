import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Share2,
  FileText,
  MessageSquare,
  Star,
  ShieldCheck,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { MentorshipSession, MentorshipRelationship } from '../../types/mentorship';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface SessionRoomModalProps {
  session: MentorshipSession | null;
  relationship: MentorshipRelationship | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSession: (sessionId: string, updates: Partial<MentorshipSession>) => Promise<void>;
  onSubmitFeedback: (feedback: any) => Promise<void>;
}

export const SessionRoomModal: React.FC<SessionRoomModalProps> = ({
  session,
  relationship,
  isOpen,
  onClose,
  onUpdateSession,
  onSubmitFeedback,
}) => {
  const [sharedNotes, setSharedNotes] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'agenda' | 'diagnostics'>('notes');
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session) {
      setSharedNotes(session.sharedNotes || '');
      setPrivateNotes(session.privateMentorNotes || '');
      setSecondsRemaining((session.durationMinutes || 45) * 60);
    }
  }, [session]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => Math.max(0, sec - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  if (!isOpen || !session || !relationship) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await onUpdateSession(session.id, {
        sharedNotes,
        privateMentorNotes: privateNotes,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteSession = async () => {
    await onUpdateSession(session.id, {
      status: 'COMPLETED',
      sharedNotes,
      privateMentorNotes: privateNotes,
    });
    setShowFeedbackModal(true);
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    await onSubmitFeedback({
      mentorshipId: relationship.id,
      sessionId: session.id,
      receiverId: relationship.mentorId,
      overallRating: rating,
      pedagogicalClarityRating: clarityRating,
      feedbackText,
      isPublicOnProfile: true,
    });
    setShowFeedbackModal(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="modal-session-room"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95"
      >
        {/* Top Room Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              1:1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  {session.title}
                </h3>
                <span className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Live Study Room
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Mentor: <strong className="text-slate-700 dark:text-slate-300">{relationship.mentorName}</strong> • Learner: <strong className="text-slate-700 dark:text-slate-300">{relationship.learnerName}</strong>
              </p>
            </div>
          </div>

          {/* Session Timer & Room Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>{formatTimer(secondsRemaining)}</span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setSecondsRemaining((session.durationMinutes || 45) * 60);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <Button
              id="btn-complete-session"
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              onClick={handleCompleteSession}
            >
              End Session & Log
            </Button>

            <button
              id="btn-close-session-room"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Room Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Collaborative Shared Notes & Invariant Derivations */}
          <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Shared Session Notes & Proofs (Markdown Supported)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2.5"
                disabled={isSaving}
                onClick={handleSaveNotes}
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>

            <textarea
              id="textarea-session-shared-notes"
              value={sharedNotes}
              onChange={(e) => setSharedNotes(e.target.value)}
              placeholder="Record step-by-step problem derivations, key theorems discussed, counter-examples, and action items..."
              className="flex-1 p-4 font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Right Panel: Structured Agenda, Topics, & Quick References */}
          <div className="w-full md:w-80 flex flex-col bg-slate-50/50 dark:bg-slate-800/30 overflow-y-auto p-4 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Session Focus Topics
              </span>
              <div className="flex flex-wrap gap-1.5">
                {session.topicsCovered.map((top, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  >
                    {top}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Pedagogical Invariants */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Session Derivation Checklist</span>
              </span>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4">
                <li>Formulate first-principles assumptions</li>
                <li>Test edge case & stationary points</li>
                <li>Construct sign charts / invariant tables</li>
                <li>Assign follow-up active recall task</li>
              </ul>
            </div>

            {/* Private Notes (Educator Only) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Private Mentor Notes (Not visible to learner)
              </span>
              <textarea
                rows={4}
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="Personal pedagogical observations, follow-up pacing notes..."
                className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Feedback Modal Overlay */}
        {showFeedbackModal && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Session Completed!
                </h4>
                <p className="text-xs text-slate-500">
                  Share feedback for your session with {relationship.mentorName}
                </p>
              </div>

              {/* Star rating */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="What was most helpful during this session? (e.g. clear derivations, great problem breakdown)..."
                className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    onClose();
                  }}
                >
                  Skip
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 text-white"
                  onClick={handleSendFeedback}
                >
                  Submit Review
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
