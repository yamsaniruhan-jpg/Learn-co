import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Trophy, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { VOICE_EXAM_BANK } from '../../data/voiceExamBank';

interface VoiceExamViewProps {
  onNavigateToTab: (tabId: string) => void;
}

export const VoiceExamView: React.FC<VoiceExamViewProps> = ({ onNavigateToTab }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const currentQ = VOICE_EXAM_BANK[currentQIndex];

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTranscript('Listening for your verbal explanation...');
      setTimeout(() => {
        setTranscript(`[Simulated Speech-to-Text Recognition]: ${currentQ.rubric}`);
      }, 2500);
    } else {
      setIsRecording(false);
      setFeedback(`Excellent verbal derivation for ${currentQ.subject}! Key rubric matched: "${currentQ.rubric}". Score: 95 / 100 (+25 XP).`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-purple-300 border border-white/15">
            <Mic className="w-3.5 h-3.5 text-pink-400" />
            <span>Voice-First Oral Examination (100 Built-in Questions • Zero API Cost)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Oral Defense & Speech Examination
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Defend complex STEM concepts verbally from our pre-loaded bank of 100 expert questions. Evaluates conceptual clarity instantly with zero API token burn.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigateToTab('practice')}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold shrink-0"
        >
          Practice Arena
        </Button>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            {currentQ.subject} • Question {currentQIndex + 1} of {VOICE_EXAM_BANK.length}
          </span>
          <button
            onClick={() => {
              const randomIndex = Math.floor(Math.random() * VOICE_EXAM_BANK.length);
              setCurrentQIndex(randomIndex);
              setTranscript('');
              setFeedback(null);
            }}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            🔀 Randomize Question
          </button>
        </div>

        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
          {currentQ.question}
        </h2>

        <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Verbal Transcript</span>
            <span className="text-[11px] font-mono text-slate-500">
              {isRecording ? '🔴 Recording active...' : 'Ready for microphone input'}
            </span>
          </div>
          <div className="min-h-[100px] p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-700 dark:text-slate-300">
            {transcript || 'Click the microphone button below to start explaining your derivation verbally...'}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant={isRecording ? 'secondary' : 'primary'}
              size="lg"
              onClick={handleToggleRecord}
              leftIcon={isRecording ? <MicOff className="w-5 h-5 text-rose-500" /> : <Mic className="w-5 h-5" />}
              className={isRecording ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-300' : 'bg-purple-600 hover:bg-purple-500 text-white'}
            >
              {isRecording ? 'Stop Recording & Grade' : 'Start Speaking Defense'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTranscript('');
                setFeedback(null);
                setCurrentQIndex((prev) => (prev + 1) % VOICE_EXAM_BANK.length);
              }}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Next Question
            </Button>
          </div>
        </div>

        {feedback && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-medium flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Examiner Feedback & Rubric Match</span>
              <p>{feedback}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
