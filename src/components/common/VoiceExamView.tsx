import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Search,
  Square,
  FileText,
  Download,
  ChevronRight,
  Headphones,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { VOICE_EXAM_BANK } from '../../data/voiceExamBank';
import { awardXp } from '../../utils/xpManager';
import { recordDailyActivity } from '../../utils/streakManager';
import { useAuth } from '../../context/AuthContext';

interface VoiceExamViewProps {
  onNavigateToTab: (tabId: string) => void;
}

interface EvaluationResult {
  score: number;
  strength: string;
  missing: string;
  verdict: 'PASS' | 'REVISE';
  mode: 'deterministic_offline';
  rubricBreakdown: {
    thesisScore: number;
    derivationScore: number;
    boundaryScore: number;
  };
}

export function evaluateOralResponseOffline(params: {
  rubric: string;
  thesis: string;
  derivation: string;
  constraints: string;
  spokenTranscript?: string;
}): EvaluationResult {
  const { rubric, thesis, derivation, constraints, spokenTranscript = '' } = params;
  const cleanSpoken = spokenTranscript.trim();
  const cleanThesis = thesis.trim() || cleanSpoken;
  const cleanDerivation = derivation.trim() || cleanSpoken;
  const cleanConstraints = constraints.trim() || cleanSpoken;

  const combined = `${cleanThesis} ${cleanDerivation} ${cleanConstraints} ${cleanSpoken}`.toLowerCase();
  const rubricKeywords = Array.from(
    new Set(
      String(rubric || '')
        .toLowerCase()
        .split(/[\s,.;:()/]+/)
        .filter((w) => w.length > 3)
    )
  );

  const matchedWords = rubricKeywords.filter((kw) => combined.includes(kw));
  const missingWords = rubricKeywords.filter((kw) => !combined.includes(kw));
  const matchRatio = rubricKeywords.length > 0 ? matchedWords.length / rubricKeywords.length : 0.5;

  const thesisScore = Math.min(30, Math.round((Math.min(cleanThesis.length, 140) / 140) * 14 + matchRatio * 16));
  const derivationScore = Math.min(45, Math.round((Math.min(cleanDerivation.length, 240) / 240) * 20 + matchRatio * 25));
  const boundaryScore = Math.min(25, Math.round((Math.min(cleanConstraints.length, 120) / 120) * 12 + matchRatio * 13));

  const totalScore = Math.min(100, Math.max(30, thesisScore + derivationScore + boundaryScore));
  const isPass = totalScore >= 70;

  return {
    score: totalScore,
    strength:
      matchedWords.length > 0
        ? `Covered key rubric concepts: "${matchedWords.slice(0, 4).join(', ')}".`
        : 'Recorded structured oral defense with clear logical progression.',
    missing:
      missingWords.length > 0
        ? `Address missing benchmark terms (${missingWords.slice(0, 3).join(', ')}) from: "${rubric}".`
        : 'Strong alignment across theorem statement, mechanism, and edge cases.',
    verdict: isPass ? 'PASS' : 'REVISE',
    mode: 'deterministic_offline',
    rubricBreakdown: {
      thesisScore,
      derivationScore,
      boundaryScore,
    },
  };
}

export const VoiceExamView: React.FC<VoiceExamViewProps> = ({ onNavigateToTab }) => {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);

  // Voice-First Live Transcript + Structured Oral Sections
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [thesisText, setThesisText] = useState<string>('');
  const [derivationText, setDerivationText] = useState<string>('');
  const [constraintsText, setConstraintsText] = useState<string>('');
  const [activeTargetField, setActiveTargetField] = useState<'all' | 'thesis' | 'derivation' | 'constraints'>('all');
  const activeTargetFieldRef = useRef<'all' | 'thesis' | 'derivation' | 'constraints'>('all');

  useEffect(() => {
    activeTargetFieldRef.current = activeTargetField;
  }, [activeTargetField]);

  // Microphone, Speech Recognition & Read-Aloud TTS State
  const [isListening, setIsListening] = useState<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const [isSpeechDetected, setIsSpeechDetected] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isAudioRecording, setIsAudioRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedSeconds, setRecordedSeconds] = useState<number>(0);
  const [audioVolumeLevel, setAudioVolumeLevel] = useState<number>(0);

  // Browser SpeechSynthesis ("Voiceover Talent")
  const [isReadingAloud, setIsReadingAloud] = useState<boolean>(false);
  const [autoReadQuestions, setAutoReadQuestions] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');
  const [speechRate, setSpeechRate] = useState<number>(0.98);
  const recordedUrlRef = useRef<string | null>(null);

  // Evaluation & Results State
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [hasAwardedXp, setHasAwardedXp] = useState<boolean>(false);

  // Audio References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const allSubjects = ['All', ...Array.from(new Set(VOICE_EXAM_BANK.map((q) => q.subject)))];

  const filteredQuestions = VOICE_EXAM_BANK.filter((q) => {
    const matchesSubject = selectedSubject === 'All' || q.subject === selectedSubject;
    const matchesSearch =
      searchQuery.trim() === '' ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.rubric.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const hasFilteredQuestions = filteredQuestions.length > 0;
  const safeQIndex = hasFilteredQuestions ? Math.min(currentQIndex, filteredQuestions.length - 1) : 0;
  const activeQuestion = hasFilteredQuestions ? filteredQuestions[safeQIndex] : null;

  const replaceRecordedAudioUrl = (nextUrl: string | null) => {
    if (recordedUrlRef.current && recordedUrlRef.current !== nextUrl) {
      try {
        URL.revokeObjectURL(recordedUrlRef.current);
      } catch {
        // Ignore revoke errors
      }
    }
    recordedUrlRef.current = nextUrl;
    setRecordedAudioUrl(nextUrl);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      try {
        const list = window.speechSynthesis.getVoices() || [];
        const sorted = [...list].sort((a, b) => {
          const aEn = a.lang.startsWith('en') ? 0 : 1;
          const bEn = b.lang.startsWith('en') ? 0 : 1;
          return aEn - bEn || a.name.localeCompare(b.name);
        });
        setAvailableVoices(sorted);
        if (sorted.length > 0 && !selectedVoiceUri) {
          const preferred =
            sorted.find((v) => v.lang.startsWith('en') && /natural|microsoft|google/i.test(v.name)) ||
            sorted.find((v) => v.lang.startsWith('en')) ||
            sorted[0];
          if (preferred) setSelectedVoiceUri(preferred.voiceURI);
        }
      } catch {
        // Ignore browser voice enumeration errors
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, []);

  const stopSpeechSynthesis = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore TTS cancel error
      }
    }
    setIsReadingAloud(false);
  };

  const readQuestionAloud = (questionText: string) => {
    if (!activeQuestion) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechError('Text-to-speech playback is not supported in this browser.');
      return;
    }
    stopSpeechSynthesis();
    const utterance = new SpeechSynthesisUtterance(
      `${activeQuestion.subject} oral examination prompt: ${questionText}`
    );
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.voiceURI === selectedVoiceUri) ||
      voices.find((v) => v.lang.startsWith('en') && /natural|microsoft|google/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = speechRate;
    utterance.onstart = () => setIsReadingAloud(true);
    utterance.onend = () => setIsReadingAloud(false);
    utterance.onerror = () => setIsReadingAloud(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectQuestion = (index: number) => {
    stopAllAudio();
    stopSpeechSynthesis();
    setCurrentQIndex(index);
    setSpokenTranscript('');
    setThesisText('');
    setDerivationText('');
    setConstraintsText('');
    setEvaluation(null);
    setSpeechError(null);
    replaceRecordedAudioUrl(null);
    setRecordedSeconds(0);
    setHasAwardedXp(false);
  };

  useEffect(() => {
    if (autoReadQuestions && activeQuestion?.question) {
      readQuestionAloud(activeQuestion.question);
    }
  }, [activeQuestion?.id, autoReadQuestions]);

  useEffect(() => {
    return () => {
      stopAllAudio();
      stopSpeechSynthesis();
      replaceRecordedAudioUrl(null);
    };
  }, []);

  const stopAllAudio = () => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore close error
      }
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recTimerRef.current) {
      window.clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    setIsListening(false);
    setIsAudioRecording(false);
    setIsSpeechDetected(false);
    setInterimTranscript('');
    setAudioVolumeLevel(0);
  };

  const routeSpokenChunk = (chunk: string) => {
    const clean = chunk.trim();
    if (!clean) return;

    // Hands-free voice command to switch target oral defense section
    if (/^next section\b/i.test(clean)) {
      const order: Array<'all' | 'thesis' | 'derivation' | 'constraints'> = ['all', 'thesis', 'derivation', 'constraints'];
      const nextIdx = (order.indexOf(activeTargetFieldRef.current) + 1) % order.length;
      setActiveTargetField(order[nextIdx]);
      return;
    }

    setSpokenTranscript((prev) => (prev ? `${prev.trim()} ${clean}` : clean));

    const target = activeTargetFieldRef.current;
    if (target === 'thesis') {
      setThesisText((prev) => (prev ? `${prev.trim()} ${clean}` : clean));
    } else if (target === 'derivation') {
      setDerivationText((prev) => (prev ? `${prev.trim()} ${clean}` : clean));
    } else if (target === 'constraints') {
      setConstraintsText((prev) => (prev ? `${prev.trim()} ${clean}` : clean));
    }
  };

  const toggleSpeechRecognition = async () => {
    if (isListening || isAudioRecording) {
      stopAllAudio();
      return;
    }

    stopSpeechSynthesis();
    setSpeechError(null);
    setInterimTranscript('');
    setRecordedSeconds(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
    } catch (err: any) {
      console.warn('Microphone permission denied or unavailable:', err);
      setSpeechError(
        'Microphone permission is blocked or no microphone was found. Allow microphone access in your browser bar to record & transcribe your voice.'
      );
      return;
    }

    // Audio level meter
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setAudioVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }
    } catch {
      // Visualizer optional
    }

    // MediaRecorder voice recording (pick browser-supported audio MIME type)
    try {
      audioChunksRef.current = [];
      const supportedMime =
        typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
          ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) =>
              MediaRecorder.isTypeSupported(m)
            )
          : undefined;
      const mediaRecorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const blobType = mediaRecorder.mimeType || supportedMime || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
          const url = URL.createObjectURL(audioBlob);
          replaceRecordedAudioUrl(url);
        }
      };

      mediaRecorder.start(250);
      setIsAudioRecording(true);
      recTimerRef.current = window.setInterval(() => {
        setRecordedSeconds((s) => s + 1);
      }, 1000);
    } catch (recErr) {
      console.warn('MediaRecorder unavailable:', recErr);
    }

    // Web Speech API live microphone reading (with stale-closure fix via isListeningRef)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    isListeningRef.current = true;
    setIsListening(true);

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onaudiostart = () => setIsSpeechDetected(true);
        recognition.onspeechstart = () => setIsSpeechDetected(true);
        recognition.onspeechend = () => setIsSpeechDetected(false);

        recognition.onresult = (event: any) => {
          let latestInterim = '';
          let finalChunk = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              finalChunk += transcript + ' ';
            } else {
              latestInterim += transcript + ' ';
            }
          }

          setInterimTranscript(latestInterim.trim());
          if (finalChunk.trim()) {
            routeSpokenChunk(finalChunk);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setSpeechError(
              'Speech recognition service was blocked in this frame, while your microphone audio is still being recorded below.'
            );
          }
        };

        recognition.onend = () => {
          setIsSpeechDetected(false);
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognition.start();
            } catch {
              isListeningRef.current = false;
              setIsListening(false);
            }
          }
        };

        recognition.start();
      } catch {
        // Keep recording active even if speech API throws
      }
    } else {
      setSpeechError(
        'Your microphone is recording audio cleanly. Live speech-to-text requires Chrome, Edge, or Safari; you can also review/edit notes below if needed.'
      );
    }
  };

  // Deterministic local rubric grading
  const handleEvaluateFree = () => {
    if (!activeQuestion) return;
    stopAllAudio();

    if (!spokenTranscript.trim() && !thesisText.trim() && !derivationText.trim()) {
      setSpeechError('Record your spoken oral answer (or add brief notes) before grading.');
      return;
    }

    setIsEvaluating(true);
    setSpeechError(null);

    const result = evaluateOralResponseOffline({
      rubric: activeQuestion.rubric,
      thesis: thesisText,
      derivation: derivationText,
      constraints: constraintsText,
      spokenTranscript,
    });

    setEvaluation(result);
    if (result.score >= 70 && !hasAwardedXp) {
      awardXp(25, `Passed Oral Exam: ${activeQuestion.subject}`);
      recordDailyActivity(user?.id || 'default_user', {
        questionsSolved: 1,
        xpEarned: 25,
        minutesStudied: Math.max(2, Math.round(recordedSeconds / 60)),
        sessionsCompleted: 1,
      });
      setHasAwardedXp(true);
    }
    setIsEvaluating(false);
  };

  const wordCount = `${spokenTranscript} ${thesisText} ${derivationText} ${constraintsText}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#2D2A4A] dark:bg-[#24203E] text-white p-6 sm:p-8 shadow-xl border border-[#3D3861] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#8577ED] border border-white/15">
            <Mic className="w-3.5 h-3.5 text-[#00B8A9]" />
            <span>Voiceover Talent &amp; Live Speech Recorder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            STEM Voice Oral Examination
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Choose a voiceover narrator to hear each prompt aloud, speak directly into your microphone for live
            transcription and playback, and receive instant structured rubric feedback.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigateToTab('practice')}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Practice Arena
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigateToTab('study-rooms')}
            className="bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-bold"
          >
            Peer Study Rooms
          </Button>
        </div>
      </div>

      {/* Subject Filter & Question Selector Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {allSubjects.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setSelectedSubject(sub);
                  handleSelectQuestion(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-[#6C5CE7] text-white shadow-xs'
                    : 'bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-white'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-[#8E8BAF] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentQIndex(0);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-[#E3DFF5] dark:border-[#3D3861]">
          <span className="font-semibold text-[#6B6890] dark:text-[#B4B0D5] tabular-nums">
            {hasFilteredQuestions && activeQuestion
              ? `Question ${safeQIndex + 1} of ${filteredQuestions.length} (${activeQuestion.subject})`
              : '0 matching questions'}
          </span>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6B6890] dark:text-[#B4B0D5] cursor-pointer mr-2">
              <input
                type="checkbox"
                checked={autoReadQuestions}
                onChange={(e) => setAutoReadQuestions(e.target.checked)}
                className="accent-[#6C5CE7]"
              />
              Auto-read aloud
            </label>
            <button
              type="button"
              disabled={!hasFilteredQuestions || filteredQuestions.length <= 1}
              onClick={() => handleSelectQuestion((safeQIndex - 1 + filteredQuestions.length) % filteredQuestions.length)}
              className="px-2.5 py-1 rounded-lg border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] disabled:opacity-40 text-[11px] font-bold cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasFilteredQuestions || filteredQuestions.length <= 1}
              onClick={() => handleSelectQuestion(Math.floor(Math.random() * filteredQuestions.length))}
              className="px-2.5 py-1 rounded-lg bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED] disabled:opacity-40 font-bold text-[11px] cursor-pointer"
            >
              Random
            </button>
            <button
              type="button"
              disabled={!hasFilteredQuestions || filteredQuestions.length <= 1}
              onClick={() => handleSelectQuestion((safeQIndex + 1) % filteredQuestions.length)}
              className="px-2.5 py-1 rounded-lg border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] disabled:opacity-40 text-[11px] font-bold cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Main Examination Stage */}
      {!activeQuestion ? (
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title="No matching oral exam prompts"
          description="Try clearing your search filter or picking another STEM subject."
          action={
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => {
                setSelectedSubject('All');
                setSearchQuery('');
                setCurrentQIndex(0);
              }}
            >
              Show All Prompts
            </Button>
          }
        />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Examiner Prompt & Microphone Recorder Station */}
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED]">
                {activeQuestion.subject} Exam
              </span>
              <span className="text-[11px] font-mono text-[#8E8BAF] tabular-nums">ID #{activeQuestion.id}</span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-[#2D2A4A] dark:text-[#F1EFFF] leading-snug">
              {activeQuestion.question}
            </h2>

            {/* Voiceover Talent Narrator Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B6890] dark:text-[#B4B0D5] mb-1">
                  Voiceover Talent
                </label>
                <select
                  aria-label="Select voiceover talent voice"
                  value={selectedVoiceUri}
                  onChange={(e) => setSelectedVoiceUri(e.target.value)}
                  className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#F7F5FF] dark:bg-[#1E1B33] text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF]"
                >
                  {availableVoices.length === 0 ? (
                    <option value="">Default System Voice</option>
                  ) : (
                    availableVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B6890] dark:text-[#B4B0D5] mb-1">
                  Pace
                </label>
                <select
                  aria-label="Select voiceover speed"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#F7F5FF] dark:bg-[#1E1B33] text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF]"
                >
                  <option value={0.85}>0.85x Slow</option>
                  <option value={0.98}>1.0x Clear</option>
                  <option value={1.15}>1.15x Brisk</option>
                </select>
              </div>
            </div>

            {/* Voice Synthesis Question Reader */}
            <button
              type="button"
              onClick={() => (isReadingAloud ? stopSpeechSynthesis() : readQuestionAloud(activeQuestion.question))}
              className="w-full min-h-[44px] px-4 py-2 rounded-2xl bg-[#F0EDFA] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] text-[#6C5CE7] dark:text-[#8577ED] text-xs font-bold flex items-center justify-center gap-2 hover:border-[#6C5CE7] cursor-pointer transition"
            >
              {isReadingAloud ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
              <span>{isReadingAloud ? 'Stop Question Audio' : 'Read Question Aloud'}</span>
            </button>

            <div className="p-4 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#6C5CE7] dark:text-[#8577ED] uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>Reference Rubric Benchmark</span>
              </div>
              <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed italic">
                "{activeQuestion.rubric}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Columns: Voice-First Microphone Reading, Recording & Free Evaluation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-xl space-y-5">
            {/* Primary Microphone Reading & Recording Control */}
            <div className="p-5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-[#2D2A4A] dark:text-[#F1EFFF] text-base flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-[#6C5CE7]" />
                    <span>Microphone Reading & Voice Recorder</span>
                  </h3>
                  <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-0.5">
                    Press Start, speak your full theorem explanation naturally, and your voice is recorded + read live. Say "next section" to advance sections hands-free.
                  </p>
                </div>
                {isListening && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold tabular-nums shrink-0">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    REC {Math.floor(recordedSeconds / 60)}:{String(recordedSeconds % 60).padStart(2, '0')}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={toggleSpeechRecognition}
                  leftIcon={isListening ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
                  className={`min-h-[48px] flex-1 sm:flex-none justify-center px-6 cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-700 text-white font-bold'
                      : 'bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-bold'
                  }`}
                >
                  {isListening ? 'Stop Microphone & Save Audio' : 'Start Microphone Reading & Recording'}
                </Button>

                {recordedAudioUrl && (
                  <a
                    href={recordedAudioUrl}
                    download={`learnco-oral-${activeQuestion.id}.webm`}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-white dark:bg-[#2A2647] text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5 hover:border-[#6C5CE7]"
                  >
                    <Download className="w-4 h-4 text-[#6C5CE7]" />
                    Save Recording (.webm)
                  </a>
                )}
              </div>

              {isListening && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-[#6B6890] dark:text-[#B4B0D5] font-mono tabular-nums">
                    <span>{isSpeechDetected ? 'Microphone Reading Active' : 'Listening for Speech...'}</span>
                    <span>Input Level: {audioVolumeLevel}%</span>
                  </div>
                  <div className="w-full bg-[#E3DFF5] dark:bg-[#2A2647] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#6C5CE7] h-full transition-all duration-75"
                      style={{ width: `${Math.max(6, audioVolumeLevel)}%` }}
                    />
                  </div>
                  {interimTranscript && (
                    <p className="text-xs italic text-[#6C5CE7] dark:text-[#8577ED] pt-1">
                      Hearing: "{interimTranscript}"
                    </p>
                  )}
                </div>
              )}

              {recordedAudioUrl && (
                <div className="space-y-1.5 pt-2 border-t border-[#E3DFF5] dark:border-[#3D3861]">
                  <span className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                    Recorded Voice Playback:
                  </span>
                  <audio controls src={recordedAudioUrl} className="w-full h-10" />
                </div>
              )}

              {speechError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{speechError}</span>
                </div>
              )}
            </div>

            {/* Target Routing Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-[#6B6890] dark:text-[#B4B0D5] mr-1">
                  Stream Voice Into:
                </span>
                {(
                  [
                    { id: 'all', label: 'Full Spoken Transcript' },
                    { id: 'thesis', label: '1. Definition' },
                    { id: 'derivation', label: '2. Derivation' },
                    { id: 'constraints', label: '3. Bounds' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTargetField(item.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      activeTargetField === item.id
                        ? 'bg-[#6C5CE7] text-white'
                        : 'bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5] tabular-nums">
                {wordCount} words spoken
              </span>
            </div>

            {/* Live Captured Spoken Transcript Display */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] block">
                Live Captured Voice Transcript (Editable if corrections needed)
              </label>
              <textarea
                rows={4}
                value={spokenTranscript}
                onChange={(e) => setSpokenTranscript(e.target.value)}
                placeholder="Click 'Start Microphone Reading & Recording' above and speak your oral defense aloud..."
                className="w-full p-3.5 rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] text-xs sm:text-sm text-[#2D2A4A] dark:text-[#F1EFFF] bg-[#FAF9FF] dark:bg-[#1E1B33] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
              />
            </div>

            {/* Optional Section Breakdown */}
            <details className="rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FAF9FF] dark:bg-[#1E1B33] p-4">
              <summary className="text-xs font-bold text-[#6C5CE7] dark:text-[#8577ED] cursor-pointer flex items-center gap-1.5">
                <ChevronRight className="w-4 h-4" />
                Optional Structured Oral Breakdown (Definition / Derivation / Constraints)
              </summary>
              <div className="space-y-3 pt-3">
                <textarea
                  rows={2}
                  value={thesisText}
                  onFocus={() => setActiveTargetField('thesis')}
                  onChange={(e) => setThesisText(e.target.value)}
                  placeholder="1. Core Theorem / Definition..."
                  className="w-full p-3 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] text-xs bg-white dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
                <textarea
                  rows={2}
                  value={derivationText}
                  onFocus={() => setActiveTargetField('derivation')}
                  onChange={(e) => setDerivationText(e.target.value)}
                  placeholder="2. Step-by-Step Derivation..."
                  className="w-full p-3 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] text-xs bg-white dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
                <textarea
                  rows={2}
                  value={constraintsText}
                  onFocus={() => setActiveTargetField('constraints')}
                  onChange={(e) => setConstraintsText(e.target.value)}
                  placeholder="3. Invariants & Edge-Case Boundaries..."
                  className="w-full p-3 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] text-xs bg-white dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>
            </details>

            {/* Rubric Grading Action Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E3DFF5] dark:border-[#3D3861]">
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isEvaluating}
                onClick={handleEvaluateFree}
                className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                {isEvaluating ? 'Grading...' : 'Grade Oral Defense'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  stopAllAudio();
                  setSpokenTranscript('');
                  setThesisText('');
                  setDerivationText('');
                  setConstraintsText('');
                  setEvaluation(null);
                  replaceRecordedAudioUrl(null);
                  setRecordedSeconds(0);
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Answer
              </Button>
            </div>
          </div>

          {/* Rubric Evaluation Results */}
          {evaluation && (
            <div
              className={`p-6 sm:p-7 rounded-3xl border shadow-xl space-y-4 animate-in fade-in duration-200 ${
                evaluation.verdict === 'PASS'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-[#2D2A4A] dark:text-[#F1EFFF]'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-[#2D2A4A] dark:text-[#F1EFFF]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-current/15 pb-3">
                <div className="flex items-center gap-2.5">
                  {evaluation.verdict === 'PASS' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-black text-lg">
                      {evaluation.verdict === 'PASS' ? 'Oral Rubric Passed!' : 'Oral Practice Feedback'}
                    </h4>
                    <span className="text-xs opacity-75">
                      Evaluated instantaneously against STEM benchmark rubric
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 tabular-nums">
                  <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#2A2647] border border-current/20 font-mono font-black text-lg">
                    {evaluation.score} / 100
                  </div>
                  {evaluation.score >= 70 && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs">
                      +25 XP Awarded
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 tabular-nums">
                <div className="p-3 rounded-2xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Concept Definition</span>
                    <span className="font-mono">{evaluation.rubricBreakdown.thesisScore} / 30</span>
                  </div>
                  <div className="w-full bg-[#E3DFF5] dark:bg-[#1E1B33] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#6C5CE7] h-full" style={{ width: `${(evaluation.rubricBreakdown.thesisScore / 30) * 100}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Mechanism & Rigor</span>
                    <span className="font-mono">{evaluation.rubricBreakdown.derivationScore} / 45</span>
                  </div>
                  <div className="w-full bg-[#E3DFF5] dark:bg-[#1E1B33] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#00B8A9] h-full" style={{ width: `${(evaluation.rubricBreakdown.derivationScore / 45) * 100}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Invariants & Bounds</span>
                    <span className="font-mono">{evaluation.rubricBreakdown.boundaryScore} / 25</span>
                  </div>
                  <div className="w-full bg-[#E3DFF5] dark:bg-[#1E1B33] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full" style={{ width: `${(evaluation.rubricBreakdown.boundaryScore / 25) * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs sm:text-sm">
                <p>
                  <strong>Key Strength:</strong> {evaluation.strength}
                </p>
                <p>
                  <strong>Next Refinement:</strong> {evaluation.missing}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
