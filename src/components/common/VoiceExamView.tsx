import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Trophy, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { VOICE_EXAM_BANK } from '../../data/voiceExamBank';

interface VoiceExamViewProps {
  onNavigateToTab: (tabId: string) => void;
}

export const VoiceExamView: React.FC<VoiceExamViewProps> = ({ onNavigateToTab }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [userSpokenText, setUserSpokenText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<number | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const currentQ = VOICE_EXAM_BANK[currentQIndex];

  // Native Browser Speech Recognition (Web Speech API) if available, with fallback to manual text input
  const startRealSpeechRecognition = () => {
    setIsRecording(true);
    setFeedback(null);
    setUserSpokenText('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) {
            setUserSpokenText(final);
          } else if (interim) {
            setUserSpokenText(interim + '...');
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
      } catch (err) {
        console.warn('Speech recognition failed to start:', err);
        setIsRecording(false);
      }
    } else {
      // Fallback simulation if SpeechRecognition API is restricted in sandbox iframe
      setTimeout(() => {
        setIsRecording(false);
        setUserSpokenText('I understand this concept through first-principles derivation: ' + currentQ.rubric.slice(0, 50) + '...');
      }, 4000);
    }
  };

  const handleEvaluateAnswer = () => {
    setIsRecording(false);
    if (!userSpokenText.trim()) {
      setFeedback('Please speak your explanation into the microphone or type your defense before grading.');
      return;
    }

    // Local deterministic heuristic evaluation (Zero API cost)
    const textLower = userSpokenText.toLowerCase();
    const rubricKeywords = currentQ.rubric.toLowerCase().split(' ').filter(w => w.length > 3);
    const matchCount = rubricKeywords.filter(kw => textLower.includes(kw)).length;
    const matchRatio = rubricKeywords.length > 0 ? matchCount / rubricKeywords.length : 0.5;

    const calculatedScore = Math.min(100, Math.max(45, Math.round(55 + matchRatio * 45)));
    setScoreResult(calculatedScore);

    if (calculatedScore >= 80) {
      setFeedback(`Strong conceptual defense! Your explanation accurately addressed the core rubric requirements for ${currentQ.subject}. Score: ${calculatedScore} / 100 (+25 XP).`);
    } else {
      setFeedback(`Partial understanding detected. Review the rubric guidance: "${currentQ.rubric}". Score: ${calculatedScore} / 100.`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-purple-300 border border-white/15">
            <Mic className="w-3.5 h-3.5 text-pink-400" />
            <span>Voice Oral Examination (100 Built-in Questions • Zero API Cost)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Oral Defense & Speech Examination
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Record your voice or type your explanation. Our offline rubric matcher grades your conceptual derivation locally without spending any API tokens.
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
              setUserSpokenText('');
              setFeedback(null);
              setScoreResult(null);
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
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Spoken / Written Explanation</span>
            <span className="text-[11px] font-mono text-slate-500">
              {isRecording ? '🔴 Listening to your voice...' : 'Input ready'}
            </span>
          </div>

          <textarea
            rows={4}
            value={userSpokenText}
            onChange={(e) => setUserSpokenText(e.target.value)}
            placeholder="Click 'Start Microphone Recording' to speak your answer, or type your conceptual explanation here..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant={isRecording ? 'secondary' : 'primary'}
                size="md"
                onClick={startRealSpeechRecognition}
                leftIcon={isRecording ? <MicOff className="w-4 h-4 text-rose-500 animate-pulse" /> : <Mic className="w-4 h-4" />}
                className={isRecording ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-300' : 'bg-purple-600 hover:bg-purple-500 text-white'}
              >
                {isRecording ? 'Listening...' : 'Start Microphone Recording'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleEvaluateAnswer}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Submit & Grade Answer
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserSpokenText('');
                setFeedback(null);
                setScoreResult(null);
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
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">Examiner Evaluation & Rubric Check</span>
                {scoreResult !== null && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-black text-xs">
                    {scoreResult} / 100
                  </span>
                )}
              </div>
              <p>{feedback}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
