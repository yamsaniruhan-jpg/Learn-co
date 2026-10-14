import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Target,
  Flame,
  Award,
  Clock,
  Edit3,
  Trash2,
  Save,
  Check,
  Compass,
  Radio,
  Layers,
  Zap,
} from 'lucide-react';
import { SubjectId } from '../../types';
import { CURRICULUM_DATA } from '../../data/curriculumData';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { awardXp } from '../../utils/xpManager';

export interface GenFocusTimerViewProps {
  onNavigateToTab?: (tab: string, context?: any) => void;
  onToggleZenMode?: () => void;
  onAwardXp?: (xp: number, reason: string) => void;
}

type TimerMode = 'pomodoro' | 'deep_work' | 'flow' | 'quick' | 'custom';
type SessionType = 'focus' | 'short_break' | 'long_break';
type AmbientSound = 'none' | 'binaural_40hz' | 'brown_noise' | 'rain' | 'cosmic_drone';

const MODE_CONFIGS: Record<TimerMode, { label: string; focusMin: number; breakMin: number; desc: string }> = {
  pomodoro: { label: 'Pomodoro Classic', focusMin: 25, breakMin: 5, desc: 'Standard 25/5 rhythm for steady cognitive momentum' },
  deep_work: { label: 'Deep Work Sprint', focusMin: 50, breakMin: 10, desc: 'Extended 50/10 block for difficult derivations & proofs' },
  flow: { label: 'Flow State Odyssey', focusMin: 90, breakMin: 20, desc: 'Deep 90/20 immersion for architecture & coding marathons' },
  quick: { label: 'Concept Burst', focusMin: 15, breakMin: 3, desc: 'Rapid 15/3 sprint for quick formula revision & flash checks' },
  custom: { label: 'Custom Sprint', focusMin: 30, breakMin: 5, desc: 'Tailor your own bespoke focus duration' },
};

export const GenFocusTimerView: React.FC<GenFocusTimerViewProps> = ({
  onNavigateToTab,
  onToggleZenMode,
  onAwardXp,
}) => {
  // Timer Mode & State
  const [activeMode, setActiveMode] = useState<TimerMode>('pomodoro');
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [customMinutes, setCustomMinutes] = useState(30);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Subject & Study Goal Association
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>('math');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [focusGoalText, setFocusGoalText] = useState('Master core topic invariants & derivations');

  // Stats in localStorage
  const [completedSessionsToday, setCompletedSessionsToday] = useState<number>(() => {
    const saved = localStorage.getItem('learnco_focus_sessions_today');
    return saved ? parseInt(saved, 10) : 3;
  });
  const [totalMinutesFocusedToday, setTotalMinutesFocusedToday] = useState<number>(() => {
    const saved = localStorage.getItem('learnco_focus_minutes_today');
    return saved ? parseInt(saved, 10) : 75;
  });

  // Scratchpad State
  const [scratchNotes, setScratchNotes] = useState(() => {
    return localStorage.getItem('learnco_zen_scratchpad') || '### Focus Scratchpad\n* Formula invariants to double-check\n* Distraction dump (jot down stray thoughts here and return to work)\n';
  });
  const [isNotesSaved, setIsNotesSaved] = useState(false);

  // Ambient Audio (Pure Web Audio API Synthesizer - Zero External Assets)
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<{ source?: any; gain?: GainNode; filter?: BiquadFilterNode; osc1?: OscillatorNode; osc2?: OscillatorNode }>({});

  // Get current subject curriculum
  const currentSubject = CURRICULUM_DATA.find((s) => s.id === selectedSubjectId) || CURRICULUM_DATA[0];
  const allTopics = currentSubject.chapters.flatMap((c) => c.topics);

  // Set default topic on subject change
  useEffect(() => {
    if (allTopics.length > 0 && (!selectedTopicId || !allTopics.some((t) => t.id === selectedTopicId))) {
      setSelectedTopicId(allTopics[0].id);
    }
  }, [selectedSubjectId]);

  // Update timer when mode or session type changes
  useEffect(() => {
    let targetMins = 25;
    if (sessionType === 'focus') {
      targetMins = activeMode === 'custom' ? customMinutes : MODE_CONFIGS[activeMode].focusMin;
    } else if (sessionType === 'short_break') {
      targetMins = activeMode === 'custom' ? 5 : MODE_CONFIGS[activeMode].breakMin;
    } else {
      targetMins = 15;
    }
    const secs = targetMins * 60;
    setTimerSeconds(secs);
    setTotalDurationSeconds(secs);
    setIsRunning(false);
  }, [activeMode, sessionType, customMinutes]);

  // Main countdown timer interval
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          handleSessionCompletion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, sessionType, activeMode]);

  // Handle completion of a focus block
  const handleSessionCompletion = () => {
    setIsRunning(false);
    playCompletionChime();

    if (sessionType === 'focus') {
      const durationMins = Math.round(totalDurationSeconds / 60);
      const newSessions = completedSessionsToday + 1;
      const newMinutes = totalMinutesFocusedToday + durationMins;

      setCompletedSessionsToday(newSessions);
      setTotalMinutesFocusedToday(newMinutes);
      localStorage.setItem('learnco_focus_sessions_today', String(newSessions));
      localStorage.setItem('learnco_focus_minutes_today', String(newMinutes));

      const xpEarned = durationMins * 2; // e.g. 50 XP for 25m sprint
      awardXp(xpEarned, `Completed ${durationMins}-minute Focus Sprint`);

      if (onAwardXp) {
        onAwardXp(xpEarned, `Completed ${durationMins}-minute Gen Focus Block`);
      }

      // Switch to short break
      setSessionType('short_break');
    } else {
      // Break completed -> back to focus
      setSessionType('focus');
    }
  };

  // Web Audio Synthesizer: Soundscapes
  const stopAmbientAudio = () => {
    try {
      if (soundNodesRef.current.osc1) soundNodesRef.current.osc1.stop();
      if (soundNodesRef.current.osc2) soundNodesRef.current.osc2.stop();
      if (soundNodesRef.current.source) soundNodesRef.current.source.stop();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    } catch (e) {
      // Audio already stopped
    }
    audioCtxRef.current = null;
    soundNodesRef.current = {};
  };

  const startAmbientAudio = (type: AmbientSound) => {
    stopAmbientAudio();
    if (type === 'none') return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(ambientVolume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      soundNodesRef.current.gain = masterGain;

      if (type === 'binaural_40hz') {
        // Binaural Gamma Focus: Left ear 200 Hz, Right ear 240 Hz (40 Hz beat frequency)
        const merger = ctx.createChannelMerger(2);
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();

        oscLeft.type = 'sine';
        oscLeft.frequency.setValueAtTime(200, ctx.currentTime);
        oscRight.type = 'sine';
        oscRight.frequency.setValueAtTime(240, ctx.currentTime);

        const gainLeft = ctx.createGain();
        gainLeft.gain.setValueAtTime(0.3, ctx.currentTime);
        const gainRight = ctx.createGain();
        gainRight.gain.setValueAtTime(0.3, ctx.currentTime);

        oscLeft.connect(gainLeft);
        gainLeft.connect(merger, 0, 0);

        oscRight.connect(gainRight);
        gainRight.connect(merger, 0, 1);

        merger.connect(masterGain);
        oscLeft.start();
        oscRight.start();

        soundNodesRef.current.osc1 = oscLeft;
        soundNodesRef.current.osc2 = oscRight;
      } else if (type === 'brown_noise' || type === 'rain') {
        // Synthesize Pink/Brown Noise via 2-second looped audio buffer
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Gain boost
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = type === 'rain' ? 'bandpass' : 'lowpass';
        filter.frequency.setValueAtTime(type === 'rain' ? 800 : 350, ctx.currentTime);
        if (type === 'rain') filter.Q.setValueAtTime(0.7, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        soundNodesRef.current.source = whiteNoise;
        soundNodesRef.current.filter = filter;
      } else if (type === 'cosmic_drone') {
        // Deep cosmic chord: 110 Hz + 165 Hz (perfect fifth harmonic)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(110, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(164.81, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(masterGain);

        osc1.start();
        osc2.start();
        soundNodesRef.current.osc1 = osc1;
        soundNodesRef.current.osc2 = osc2;
      }
    } catch (e) {
      console.warn('Web Audio Ambient Synthesizer initial error:', e);
    }
  };

  const playCompletionChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.3);
    } catch (e) {
      // Audio fallback
    }
  };

  // Change soundscape
  const handleSelectSound = (sound: AmbientSound) => {
    setAmbientSound(sound);
    startAmbientAudio(sound);
  };

  // Stop ambient audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientAudio();
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (soundNodesRef.current.gain && audioCtxRef.current) {
      soundNodesRef.current.gain.gain.setValueAtTime(ambientVolume, audioCtxRef.current.currentTime);
    }
  }, [ambientVolume]);

  const handleNotesChange = (val: string) => {
    setScratchNotes(val);
    localStorage.setItem('learnco_zen_scratchpad', val);
    setIsNotesSaved(true);
    setTimeout(() => setIsNotesSaved(false), 2000);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    let targetMins = 25;
    if (sessionType === 'focus') {
      targetMins = activeMode === 'custom' ? customMinutes : MODE_CONFIGS[activeMode].focusMin;
    } else {
      targetMins = MODE_CONFIGS[activeMode].breakMin;
    }
    setTimerSeconds(targetMins * 60);
  };

  const handleAddFiveMinutes = () => {
    setTimerSeconds((prev) => prev + 5 * 60);
    setTotalDurationSeconds((prev) => prev + 5 * 60);
  };

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercentage = Math.max(
    0,
    Math.min(100, ((totalDurationSeconds - timerSeconds) / (totalDurationSeconds || 1)) * 100)
  );

  // SVG Circle Dimensions
  const circleRadius = 130;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (progressPercentage / 100) * circleCircumference;

  const [pulseToast, setPulseToast] = useState<string | null>(null);

  const handleLogFocusPulse = () => {
    const xp = 25;
    awardXp(xp, 'Logged Focus Pulse');
    if (onAwardXp) {
      onAwardXp(xp, 'Logged Focus Pulse');
    }
    const newSessions = completedSessionsToday + 1;
    const newMinutes = totalMinutesFocusedToday + 15;
    setCompletedSessionsToday(newSessions);
    setTotalMinutesFocusedToday(newMinutes);
    localStorage.setItem('learnco_focus_sessions_today', String(newSessions));
    localStorage.setItem('learnco_focus_minutes_today', String(newMinutes));
    setPulseToast('+25 XP awarded for Focus Pulse!');
    setTimeout(() => setPulseToast(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
              Zen Focus Timer
            </h1>
            <Badge variant="primary" size="sm">
              Deep Work Engine
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Calibrated Pomodoro cycles, binaural soundscapes, distraction-free flow, and focus XP pulses.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onToggleZenMode && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Maximize2 className="w-4 h-4 text-indigo-500" />}
              onClick={onToggleZenMode}
              title="Enter distraction-free fullscreen Zen mode (Esc to exit)"
            >
              Immersive Zen Mode
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={handleResetTimer}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Main Grid: Timer Centerpiece + Right Sidebar Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left 7 Columns: Focus Timer Center Stage */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="default" padding="lg" className="relative overflow-hidden shadow-lg border-indigo-500/20">
            {/* Session Type Pill (Focus vs. Break) */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                onClick={() => setSessionType('focus')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  sessionType === 'focus'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                🎯 Deep Focus Sprint
              </button>
              <button
                onClick={() => setSessionType('short_break')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  sessionType === 'short_break'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                ☕ Rest & Recovery
              </button>
            </div>

            {/* Circular Progress Display */}
            <div className="relative flex items-center justify-center my-4">
              <svg className="w-72 h-72 sm:w-80 sm:h-80 -rotate-90 transform" viewBox="0 0 300 300">
                {/* Background Track */}
                <circle
                  cx="150"
                  cy="150"
                  r={circleRadius}
                  className="stroke-slate-100 dark:stroke-slate-800/80"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Active Progress Ring */}
                <circle
                  cx="150"
                  cy="150"
                  r={circleRadius}
                  className={`transition-all duration-1000 ease-linear ${
                    sessionType === 'focus'
                      ? 'stroke-indigo-600 dark:stroke-indigo-500'
                      : 'stroke-emerald-500 dark:stroke-emerald-400'
                  }`}
                  strokeWidth="12"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              {/* Central Clock Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
                  {timeFormatted}
                </span>

                <span className="text-xs uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mt-2">
                  {sessionType === 'focus' ? 'Focus Interval' : 'Restorative Break'}
                </span>

                {/* Selected Topic Tag */}
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: currentSubject.color }}
                  />
                  <span className="truncate">{currentSubject.name}</span>
                </div>
              </div>
            </div>

            {/* Primary Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="ghost"
                size="md"
                onClick={handleAddFiveMinutes}
                title="Add 5 minutes to current timer"
                className="rounded-full"
              >
                <Plus className="w-4 h-4 mr-1" /> 5m
              </Button>

              <button
                onClick={() => setIsRunning((prev) => !prev)}
                className={`p-5 rounded-full text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                }`}
                title={isRunning ? 'Pause Timer' : 'Start Focus Sprint'}
              >
                {isRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-0.5" />}
              </button>

              <Button
                variant="ghost"
                size="md"
                onClick={handleSessionCompletion}
                title="Complete session and advance"
                className="rounded-full"
              >
                <SkipForward className="w-4 h-4 mr-1" /> Skip
              </Button>
            </div>

            {/* Focus Pulse Quick Action & XP Feedback */}
            <div className="mt-4 flex flex-col items-center justify-center gap-2">
              <button
                onClick={handleLogFocusPulse}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Log a 15-minute quick Focus Pulse (+25 XP)"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Log Focus Pulse (+25 XP)</span>
              </button>

              {pulseToast && (
                <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{pulseToast}</span>
                </div>
              )}
            </div>

            {/* Mode Presets Buttons */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                Calibrated Focus Presets
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['pomodoro', 'deep_work', 'flow', 'quick'] as TimerMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setActiveMode(mode);
                      setSessionType('focus');
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      activeMode === mode
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{MODE_CONFIGS[mode].label.split(' ')[0]}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {MODE_CONFIGS[mode].focusMin}m / {MODE_CONFIGS[mode].breakMin}m
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Distraction Dump & Scratchpad */}
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Distraction Dump & Focus Scratchpad
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {isNotesSaved && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold animate-in fade-in">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
                <button
                  onClick={() => handleNotesChange('')}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                  title="Clear scratchpad"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={scratchNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Dump stray thoughts, formulas, or questions here to clear working memory without breaking flow..."
              className="w-full h-28 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </Card>
        </div>

        {/* Right 5 Columns: Subject Alignment & Ambient Soundscape & Stats */}
        <div className="lg:col-span-5 space-y-6">
          {/* Target Subject & Topic Alignment Card */}
          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Subject & Concept Target
                </h3>
              </div>
              <Badge variant="primary" size="sm">
                +25 XP per session
              </Badge>
            </div>

            {/* Subject Selector Buttons */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                Target Subject:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CURRICULUM_DATA.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id as SubjectId)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedSubjectId === sub.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                Active Topic:
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {allTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Launch Buttons into Learn or Practice */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                onClick={() => onNavigateToTab && onNavigateToTab('learn', { subjectId: selectedSubjectId })}
              >
                Study Concept
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 text-xs"
                leftIcon={<Target className="w-3.5 h-3.5" />}
                onClick={() => onNavigateToTab && onNavigateToTab('practice')}
              >
                Solve 5 Questions
              </Button>
            </div>
          </Card>

          {/* Ambient Soundscapes Synthesizer Card */}
          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ambient Audio Synthesizer
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Web Audio API</span>
            </div>

            {/* Sound Selection Grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'none', label: 'Mute / Off', icon: VolumeX },
                { id: 'binaural_40hz', label: 'Binaural 40Hz Gamma', icon: Volume2 },
                { id: 'brown_noise', label: 'Deep Brown Noise', icon: Volume2 },
                { id: 'rain', label: 'Gentle Rain / Pink', icon: Volume2 },
                { id: 'cosmic_drone', label: 'Cosmic Drone Chord', icon: Volume2 },
              ].map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => handleSelectSound(sound.id as AmbientSound)}
                  className={`p-2.5 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    ambientSound === sound.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <sound.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{sound.label}</span>
                </button>
              ))}
            </div>

            {/* Volume Slider */}
            {ambientSound !== 'none' && (
              <div className="pt-2 flex items-center gap-3">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
                  {Math.round(ambientVolume * 100)}%
                </span>
              </div>
            )}
          </Card>

          {/* Daily Productivity & Focus Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <div className="flex items-center justify-center text-amber-500 mb-1">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {completedSessionsToday}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5">
                Sessions
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <div className="flex items-center justify-center text-indigo-500 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {totalMinutesFocusedToday}m
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5">
                Focus Time
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <div className="flex items-center justify-center text-emerald-500 mb-1">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                +{completedSessionsToday * 25}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5">
                XP Earned
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
