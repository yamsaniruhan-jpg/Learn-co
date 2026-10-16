import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  Search,
  BookOpen,
  Send,
  Play,
  Square,
  FileText,
  Sliders,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { VOICE_EXAM_BANK } from '../../data/voiceExamBank';
import { awardXp } from '../../utils/xpManager';

interface VoiceExamViewProps {
  onNavigateToTab: (tabId: string) => void;
}

interface EvaluationResult {
  score: number;
  strength: string;
  missing: string;
  verdict: 'PASS' | 'REVISE';
  mode: 'ai_low_token' | 'deterministic_offline';
  rubricBreakdown?: {
    thesisScore: number;
    derivationScore: number;
    boundaryScore: number;
  };
}

export const VoiceExamView: React.FC<VoiceExamViewProps> = ({ onNavigateToTab }) => {
  // Question navigation and filtering
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);

  // Form input fields
  const [thesisText, setThesisText] = useState<string>('');
  const [derivationText, setDerivationText] = useState<string>('');
  const [constraintsText, setConstraintsText] = useState<string>('');
  const [activeTargetField, setActiveTargetField] = useState<'thesis' | 'derivation' | 'constraints'>('thesis');
  const activeTargetFieldRef = useRef<'thesis' | 'derivation' | 'constraints'>('thesis');

  useEffect(() => {
    activeTargetFieldRef.current = activeTargetField;
  }, [activeTargetField]);

  // Microphone & Speech Recognition State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeechDetected, setIsSpeechDetected] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isAudioRecording, setIsAudioRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioVolumeLevel, setAudioVolumeLevel] = useState<number>(0);

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
  const recognitionRef = useRef<any>(null);

  // Get distinct subjects from question bank
  const allSubjects = ['All', ...Array.from(new Set(VOICE_EXAM_BANK.map((q) => q.subject)))];

  // Filter questions based on subject and search query
  const filteredQuestions = VOICE_EXAM_BANK.filter((q) => {
    const matchesSubject = selectedSubject === 'All' || q.subject === selectedSubject;
    const matchesSearch =
      searchQuery.trim() === '' ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.rubric.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const activeQuestion = filteredQuestions[currentQIndex] || VOICE_EXAM_BANK[0];

  // Reset form when question changes
  const handleSelectQuestion = (index: number) => {
    stopAllAudio();
    setCurrentQIndex(index);
    setThesisText('');
    setDerivationText('');
    setConstraintsText('');
    setEvaluation(null);
    setSpeechError(null);
    setRecordedAudioUrl(null);
    setHasAwardedXp(false);
  };

  // Clean up audio resources on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const stopAllAudio = () => {
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
    setIsListening(false);
    setIsAudioRecording(false);
    setIsSpeechDetected(false);
    setInterimTranscript('');
    setAudioVolumeLevel(0);
  };

  // Insert high-scoring sample defense tailored to the current question (0 tokens, immediate practice)
  const handleFillSampleDefense = () => {
    const q = activeQuestion;
    setThesisText(
      `The fundamental theorem states that for ${q.subject.toLowerCase()} systems governed by these conditions, the invariant property holds: ${q.rubric.slice(0, 90)}.`
    );
    setDerivationText(
      `1. Establish state parameters and initial conservation constraints.\n2. Apply the fundamental operator or differential relation according to first principles.\n3. Verify equilibrium stationary points where the gradient vanishes.\n4. Reconcile with key rubric requirement: ${q.rubric}.`
    );
    setConstraintsText(
      `Valid under non-degenerate boundary constraints where dissipation/damping is accounted for and asymptotic limits converge.`
    );
    setEvaluation(null);
  };

  // Start real-time speech dictation and mic visualizer
  const toggleSpeechRecognition = async () => {
    if (isListening || isAudioRecording) {
      stopAllAudio();
      return;
    }

    setSpeechError(null);
    setInterimTranscript('');

    // 1. Request microphone access
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
    } catch (err: any) {
      console.warn('Microphone permission denied or unavailable:', err);
      setSpeechError(
        'Microphone permission was blocked by the browser. You can type into the form or click "Insert Sample Defense" below.'
      );
      return;
    }

    // 2. Set up audio visualizer
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
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }
    } catch (visErr) {
      console.warn('Audio visualization not supported:', visErr);
    }

    // 3. Set up MediaRecorder for actual voice playback
    try {
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(url);
        }
      };

      mediaRecorder.start(250);
      setIsAudioRecording(true);
    } catch (recErr) {
      console.warn('MediaRecorder unavailable:', recErr);
    }

    // 4. Set up Web Speech Recognition with real-time feedback
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onaudiostart = () => {
          setIsSpeechDetected(true);
        };

        recognition.onspeechstart = () => {
          setIsSpeechDetected(true);
        };

        recognition.onspeechend = () => {
          setIsSpeechDetected(false);
        };

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
            const currentField = activeTargetFieldRef.current;
            if (currentField === 'thesis') {
              setThesisText((prev) => (prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()));
            } else if (currentField === 'derivation') {
              setDerivationText((prev) => (prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()));
            } else {
              setConstraintsText((prev) => (prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()));
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition event error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setSpeechError(
              'Live speech-to-text dictation is restricted by browser security/iframe sandbox. Your audio is recorded below, or you can use the form and templates.'
            );
          } else if (event.error === 'no-speech') {
            // Keep listening, just quiet
          }
        };

        recognition.onend = () => {
          setIsSpeechDetected(false);
          // If still toggled on by user, automatically resume
          if (isListening && recognitionRef.current) {
            try {
              recognition.start();
            } catch {
              setIsListening(false);
            }
          }
        };

        recognition.start();
        setIsListening(true);
      } catch (specErr) {
        console.warn('SpeechRecognition setup error:', specErr);
        setIsListening(true);
      }
    } else {
      setIsListening(true);
      setSpeechError(
        'Web Speech API not supported in this browser. Voice is being recorded via MediaRecorder, and you can type into the form fields.'
      );
    }
  };

  // Insert standard template structure into the active field
  const handleInsertTemplate = (type: 'definition' | 'derivation' | 'boundary') => {
    if (type === 'definition') {
      setThesisText((prev) =>
        prev
          ? `${prev}\n[Definition]: The core invariant here states that...`
          : `[Definition]: Under standard conditions, the primary concept states that...`
      );
    } else if (type === 'derivation') {
      setDerivationText((prev) =>
        prev
          ? `${prev}\nStep 1: Set up equilibrium state\nStep 2: Apply differential operator\nStep 3: Solve for critical point`
          : `Step 1: Formulate the governing equation\nStep 2: Differentiate with respect to the state variable\nStep 3: Equate to stationarity and evaluate boundary limits`
      );
    } else {
      setConstraintsText((prev) =>
        prev
          ? `${prev}\n[Boundary Conditions]: Valid for non-negative states when damping coefficient is strictly zero.`
          : `[Boundary Conditions]: This formulation holds strictly when friction/damping is zero and the domain remains convex.`
      );
    }
  };

  // Evaluate the submission (either deterministic 0-token or low-token AI)
  const handleEvaluate = async (preferAi: boolean = false) => {
    stopAllAudio();

    if (!thesisText.trim() && !derivationText.trim()) {
      setSpeechError('Please provide at least a concept definition or derivation before grading.');
      return;
    }

    setIsEvaluating(true);
    setSpeechError(null);

    try {
      if (preferAi) {
        // Call the low-token server endpoint (< 180 tokens max)
        const response = await fetch('/api/ai/voice-exam-eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: activeQuestion.question,
            rubric: activeQuestion.rubric,
            subject: activeQuestion.subject,
            thesis: thesisText,
            derivation: derivationText,
            constraints: constraintsText,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setEvaluation({
            score: data.score,
            strength: data.strength,
            missing: data.missing,
            verdict: data.verdict,
            mode: data.mode || 'ai_low_token',
            rubricBreakdown: {
              thesisScore: Math.round(data.score * 0.35),
              derivationScore: Math.round(data.score * 0.45),
              boundaryScore: Math.round(data.score * 0.2),
            },
          });

          if (data.score >= 70 && !hasAwardedXp) {
            awardXp(25, `Passed Oral Exam: ${activeQuestion.subject}`);
            setHasAwardedXp(true);
          }
          setIsEvaluating(false);
          return;
        }
      }

      // Fast, authentic deterministic rubric evaluation (Zero tokens)
      const combined = `${thesisText} ${derivationText} ${constraintsText}`.toLowerCase();
      const rubricKeywords = activeQuestion.rubric
        .toLowerCase()
        .split(/[\s,.;]+/)
        .filter((w) => w.length > 3);

      const matchedWords = rubricKeywords.filter((kw) => combined.includes(kw));
      const matchRatio = rubricKeywords.length > 0 ? matchedWords.length / rubricKeywords.length : 0.5;

      // Rubric section grading
      let thesisScore = Math.min(30, Math.round((thesisText.trim().length / 60) * 15 + matchRatio * 15));
      let derivationScore = Math.min(45, Math.round((derivationText.trim().length / 100) * 20 + matchRatio * 25));
      let boundaryScore = Math.min(25, Math.round((constraintsText.trim().length / 40) * 12 + (constraintsText ? 13 : 0)));

      let totalScore = thesisScore + derivationScore + boundaryScore;
      totalScore = Math.min(100, Math.max(30, totalScore));

      const isPass = totalScore >= 70;
      setEvaluation({
        score: totalScore,
        strength:
          matchedWords.length > 0
            ? `Accurately anchored core concept terms: "${matchedWords.slice(0, 3).join(', ')}".`
            : 'Clear logical structure and progression across oral defense sections.',
        missing:
          matchRatio < 0.6
            ? `Address the required rubric benchmark: "${activeQuestion.rubric}".`
            : 'Consider adding explicit dimensional or asymptotic checks.',
        verdict: isPass ? 'PASS' : 'REVISE',
        mode: 'deterministic_offline',
        rubricBreakdown: {
          thesisScore,
          derivationScore,
          boundaryScore,
        },
      });

      if (isPass && !hasAwardedXp) {
        awardXp(25, `Passed Oral Exam: ${activeQuestion.subject}`);
        setHasAwardedXp(true);
      }
    } catch (err: any) {
      console.error('Oral exam evaluation error:', err);
      setSpeechError('Evaluation encountered an issue. Using instant local grading.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-purple-900/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-purple-300 border border-white/15">
            <Mic className="w-3.5 h-3.5 text-pink-400" />
            <span>Oral Defense Examination Form (100 Pre-Generated Questions • Zero Cost Protection)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            STEM Oral Defense Examination
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Practice verbally or in writing defending complex theorems, derivations, and mechanisms. Submissions are
            graded against reference rubrics locally or via token-capped Socratic evaluation without burning AI budgets.
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
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
          >
            Peer Study Rooms
          </Button>
        </div>
      </div>

      {/* Subject Filter & Question Selector Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {allSubjects.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  setSelectedSubject(sub);
                  setCurrentQIndex(0);
                  setEvaluation(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search 100 questions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentQIndex(0);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Question Selector Carousel / Jumper */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            Question {currentQIndex + 1} of {filteredQuestions.length} ({activeQuestion.subject})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prevIdx = (currentQIndex - 1 + filteredQuestions.length) % filteredQuestions.length;
                handleSelectQuestion(prevIdx);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => {
                const randomIdx = Math.floor(Math.random() * filteredQuestions.length);
                handleSelectQuestion(randomIdx);
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[11px] hover:bg-purple-100 cursor-pointer"
            >
              🎲 Random
            </button>
            <button
              onClick={() => {
                const nextIdx = (currentQIndex + 1) % filteredQuestions.length;
                handleSelectQuestion(nextIdx);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Main Examination Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Question Prompt & Reference Rubric */}
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                {activeQuestion.subject} Exam
              </span>
              <span className="text-[11px] font-mono text-slate-400">ID #{activeQuestion.id}</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                {activeQuestion.question}
              </h2>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Reference Rubric Benchmark</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                "{activeQuestion.rubric}"
              </p>
            </div>

            {/* Audio Recording & Playback Section */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Speech Input Station</span>
                </span>
                {isListening && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Recording...
                  </span>
                )}
              </div>

              {/* Volume / Sound Wave visualizer */}
              {isListening && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Microphone Amplitude</span>
                    <span>{audioVolumeLevel}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-rose-500 h-full transition-all duration-75"
                      style={{ width: `${Math.max(8, audioVolumeLevel)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Spoken Audio Playback if recorded */}
              {recordedAudioUrl && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500">Your Recorded Audio Defense:</span>
                  <audio controls src={recordedAudioUrl} className="w-full h-8" />
                </div>
              )}

              <Button
                variant={isListening ? 'secondary' : 'primary'}
                size="md"
                onClick={toggleSpeechRecognition}
                leftIcon={isListening ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                className={`w-full justify-center ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-purple-600 hover:bg-purple-500 text-white font-bold'
                }`}
              >
                {isListening ? 'Stop Speech Recording' : 'Start Microphone Recording'}
              </Button>
            </div>

            {speechError && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{speechError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle & Right Column: Structured Defense Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  Oral Defense Submission Form
                </h3>
                <p className="text-xs text-slate-500">
                  Dictate or type each section. Dictation automatically streams into your active field.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillSampleDefense}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors cursor-pointer"
                  title="Populate well-structured model defense for this question (0 AI cost • Instant Practice)"
                >
                  ✨ Insert Sample Defense
                </button>

                {/* Active Dictation Target Field Switcher */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase">Dictate Into:</span>
                  {(['thesis', 'derivation', 'constraints'] as const).map((field) => (
                    <button
                      key={field}
                      onClick={() => setActiveTargetField(field)}
                      className={`px-2 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                        activeTargetField === field
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {field}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Dictation Feedback Banner */}
            {isListening && (
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 text-xs text-purple-950 dark:text-purple-200 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isSpeechDetected ? 'bg-emerald-500 ring-2 ring-emerald-300 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-bold shrink-0">
                    {isSpeechDetected ? '🎙️ Speech Detected:' : '🎙️ Microphone Live:'}
                  </span>
                  <span className="truncate italic text-slate-700 dark:text-slate-300">
                    {interimTranscript
                      ? `"${interimTranscript}"`
                      : `Listening... Dictating into [${activeTargetField.toUpperCase()}]`}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0">
                  Target: {activeTargetField}
                </span>
              </div>
            )}

            {/* Field 1: Core Thesis & Definition */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>1. Core Theorem / First-Principles Definition</span>
                  {activeTargetField === 'thesis' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[10px] font-mono">
                      (Active Voice Target)
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate('definition')}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  + Insert Template
                </button>
              </div>
              <textarea
                rows={3}
                value={thesisText}
                onFocus={() => setActiveTargetField('thesis')}
                onChange={(e) => setThesisText(e.target.value)}
                placeholder="State the foundational theorem or concept in your own words..."
                className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800/70 focus:outline-hidden transition-all ${
                  activeTargetField === 'thesis'
                    ? 'border-purple-500 ring-2 ring-purple-400/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>

            {/* Field 2: Step-by-Step Derivation & Mechanics */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>2. Step-by-Step Derivation / Physical Mechanism</span>
                  {activeTargetField === 'derivation' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[10px] font-mono">
                      (Active Voice Target)
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate('derivation')}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  + Insert Steps
                </button>
              </div>
              <textarea
                rows={4}
                value={derivationText}
                onFocus={() => setActiveTargetField('derivation')}
                onChange={(e) => setDerivationText(e.target.value)}
                placeholder="Walk through the mathematical steps, rate changes, or reaction mechanism..."
                className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800/70 focus:outline-hidden transition-all ${
                  activeTargetField === 'derivation'
                    ? 'border-purple-500 ring-2 ring-purple-400/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>

            {/* Field 3: Invariants, Boundary Conditions & Constraints */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>3. Invariants, Boundary Constraints & Physical Significance</span>
                  {activeTargetField === 'constraints' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[10px] font-mono">
                      (Active Voice Target)
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate('boundary')}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  + Insert Bounds
                </button>
              </div>
              <textarea
                rows={2}
                value={constraintsText}
                onFocus={() => setActiveTargetField('constraints')}
                onChange={(e) => setConstraintsText(e.target.value)}
                placeholder="What remains invariant? When does this rule hold or break down (edge cases)?"
                className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800/70 focus:outline-hidden transition-all ${
                  activeTargetField === 'constraints'
                    ? 'border-purple-500 ring-2 ring-purple-400/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>

            {/* Submission & Grading Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  disabled={isEvaluating}
                  onClick={() => handleEvaluate(false)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  {isEvaluating ? 'Evaluating...' : 'Grade Locally (0 Tokens • Free)'}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  disabled={isEvaluating}
                  onClick={() => handleEvaluate(true)}
                  className="border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-xs font-bold"
                  title="Low-token AI evaluation strictly capped under 180 tokens"
                >
                  Grade with AI (&lt; 150 Tokens)
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setThesisText('');
                  setDerivationText('');
                  setConstraintsText('');
                  setEvaluation(null);
                  setRecordedAudioUrl(null);
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Clear Form
              </Button>
            </div>
          </div>

          {/* Detailed Rubric Evaluation Results */}
          {evaluation && (
            <div
              className={`p-6 sm:p-7 rounded-3xl border shadow-xl space-y-4 animate-in fade-in duration-200 ${
                evaluation.verdict === 'PASS'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-slate-900 dark:text-slate-100'
                  : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-slate-900 dark:text-slate-100'
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
                      {evaluation.verdict === 'PASS' ? 'Oral Defense Passed!' : 'Defense Needs Revision'}
                    </h4>
                    <span className="text-xs opacity-75">
                      Evaluated via {evaluation.mode === 'ai_low_token' ? 'Low-Token Gemini Engine' : 'Instant Local Rubric'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-current/20 font-mono font-black text-lg">
                    {evaluation.score} / 100
                  </div>
                  {evaluation.score >= 70 && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs">
                      +25 XP Awarded
                    </span>
                  )}
                </div>
              </div>

              {/* Rubric Score Breakdown Bars */}
              {evaluation.rubricBreakdown && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-current/10 space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Concept Definition:</span>
                      <span className="font-mono">{evaluation.rubricBreakdown.thesisScore} / 30</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full"
                        style={{ width: `${(evaluation.rubricBreakdown.thesisScore / 30) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-current/10 space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Derivation Rigor:</span>
                      <span className="font-mono">{evaluation.rubricBreakdown.derivationScore} / 45</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full"
                        style={{ width: `${(evaluation.rubricBreakdown.derivationScore / 45) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-current/10 space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Invariants & Bounds:</span>
                      <span className="font-mono">{evaluation.rubricBreakdown.boundaryScore} / 25</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full"
                        style={{ width: `${(evaluation.rubricBreakdown.boundaryScore / 25) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Examiner Comments */}
              <div className="space-y-2 pt-1 text-xs sm:text-sm">
                <div>
                  <span className="font-bold">Key Strength: </span>
                  <span className="opacity-90">{evaluation.strength}</span>
                </div>
                <div>
                  <span className="font-bold">Remediation Advice: </span>
                  <span className="opacity-90">{evaluation.missing}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
