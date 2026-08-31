import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Zap,
  BatteryLow,
  Battery,
  BrainCircuit,
  Sliders,
  Activity,
  Check,
  X,
  Hourglass,
  Flame,
  Smile,
  X as CloseIcon,
  Sparkles,
  Trophy,
  RotateCcw,
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import confetti from 'canvas-confetti';

export type UserMoodState = 'TIRED' | 'STRESSED' | 'ENERGETIC' | 'LASER_FOCUSED';

interface CognitiveWarmUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWarmUpComplete?: (xpEarned: number, mood: UserMoodState) => void;
}

interface TileItem {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

const BASE_SYMBOLS = ['⚛️', '📐', '🧬', '⚡️', '💡', '🧪'];

const LOGIC_QUESTIONS = [
  { text: 'Is 17 a prime number?', answer: true },
  { text: 'd/dx [sin(x)] = -cos(x)?', answer: false },
  { text: 'Binary 1010 equals decimal 10?', answer: true },
  { text: 'Is light speed c ≈ 3×10^8 m/s in vacuum?', answer: true },
  { text: 'pH < 7 indicates an alkaline solution?', answer: false },
  { text: 'In Python, len([1, 2, 3, 4]) == 4?', answer: true },
  { text: 'Newton\'s 2nd Law is F = m / a?', answer: false },
  { text: 'log10(1000) == 3?', answer: true },
];

export const CognitiveWarmUpModal: React.FC<CognitiveWarmUpModalProps> = ({
  isOpen,
  onClose,
  onWarmUpComplete,
}) => {
  const [step, setStep] = useState<'ASSESS' | 'WARMUP' | 'RESULT'>('ASSESS');
  const [energyLevel, setEnergyLevel] = useState<number>(65);
  const [currentMood, setCurrentMood] = useState<UserMoodState>('ENERGETIC');
  const [gameMode, setGameMode] = useState<'CALM_TILES' | 'SPEED_LOGIC'>('SPEED_LOGIC');

  // Tile game state
  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [calmXp, setCalmXp] = useState<number>(0);

  // Speed logic state
  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const [logicScore, setLogicScore] = useState<number>(0);
  const [logicStreak, setLogicStreak] = useState<number>(0);
  const [logicMultiplier, setLogicMultiplier] = useState<number>(1);
  const [secondsLeft, setSecondsLeft] = useState<number>(20);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Derive mood state
  useEffect(() => {
    if (energyLevel <= 30) {
      setCurrentMood('STRESSED');
      setGameMode('CALM_TILES');
    } else if (energyLevel <= 55) {
      setCurrentMood('TIRED');
      setGameMode('CALM_TILES');
    } else if (energyLevel <= 80) {
      setCurrentMood('ENERGETIC');
      setGameMode('SPEED_LOGIC');
    } else {
      setCurrentMood('LASER_FOCUSED');
      setGameMode('SPEED_LOGIC');
    }
  }, [energyLevel]);

  // Init tiles game
  const initTiles = () => {
    const pairs = [...BASE_SYMBOLS, ...BASE_SYMBOLS];
    const shuffled = pairs
      .sort(() => Math.random() - 0.5)
      .map((sym, idx) => ({
        id: idx,
        symbol: sym,
        flipped: false,
        matched: false,
      }));
    setTiles(shuffled);
    setFlippedIds([]);
    setMatchedCount(0);
    setCalmXp(0);
  };

  // Timer for Speed Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
      sounds.playLevelUp();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
    return () => clearInterval(interval);
  }, [isTimerActive, secondsLeft]);

  const handleStartWarmUp = () => {
    sounds.playSuccess();
    if (gameMode === 'CALM_TILES') {
      initTiles();
    } else {
      setQuestionIdx(0);
      setLogicScore(0);
      setLogicStreak(0);
      setLogicMultiplier(energyLevel > 80 ? 2 : 1);
      setSecondsLeft(20);
      setIsTimerActive(true);
    }
    setStep('WARMUP');
  };

  const handleTileClick = (id: number) => {
    if (flippedIds.length === 2) return;
    const tile = tiles.find((t) => t.id === id);
    if (!tile || tile.matched || tile.flipped) return;

    sounds.playClick();
    const newTiles = tiles.map((t) => (t.id === id ? { ...t, flipped: true } : t));
    setTiles(newTiles);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped;
      const firstTile = newTiles.find((t) => t.id === firstId);
      const secondTile = newTiles.find((t) => t.id === secondId);

      if (firstTile && secondTile && firstTile.symbol === secondTile.symbol) {
        // Matched!
        setTimeout(() => {
          sounds.playSuccess();
          setTiles((prev) =>
            prev.map((t) => (t.id === firstId || t.id === secondId ? { ...t, matched: true } : t))
          );
          setFlippedIds([]);
          setMatchedCount((c) => {
            const next = c + 1;
            const updatedXp = next * 15;
            setCalmXp(updatedXp);
            if (next >= BASE_SYMBOLS.length) {
              sounds.playLevelUp();
              confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
            }
            return next;
          });
        }, 350);
      } else {
        // Not matched
        setTimeout(() => {
          sounds.playFailure();
          setTiles((prev) =>
            prev.map((t) => (t.id === firstId || t.id === secondId ? { ...t, flipped: false } : t))
          );
          setFlippedIds([]);
        }, 800);
      }
    }
  };

  const handleLogicAnswer = (userChoice: boolean) => {
    const currentQ = LOGIC_QUESTIONS[questionIdx % LOGIC_QUESTIONS.length];
    const isCorrect = currentQ.answer === userChoice;

    if (isCorrect) {
      sounds.playSuccess();
      const streak = logicStreak + 1;
      const mult = streak >= 3 ? 3 : streak >= 2 ? 2 : 1;
      const gain = 10 * mult;
      setLogicScore((s) => s + gain);
      setLogicStreak(streak);
      setLogicMultiplier(mult);
    } else {
      sounds.playFailure();
      setLogicStreak(0);
      setLogicMultiplier(1);
    }

    setQuestionIdx((i) => i + 1);
  };

  const handleFinishAndCollect = () => {
    const finalXp = gameMode === 'CALM_TILES' ? Math.max(calmXp, 50) : Math.max(logicScore, 40);
    sounds.playLevelUp();
    if (onWarmUpComplete) {
      onWarmUpComplete(finalXp, currentMood);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cognitive Intake & Focus Warm-Up
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calibrate your mental state before entering practice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'ASSESS' && (
              <motion.div
                key="assess"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Energy Slider Card */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-500" /> Current Mental Battery
                    </span>
                    <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {energyLevel}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />

                  {/* Mood Status Preview */}
                  <div className="pt-2 flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                      {energyLevel <= 30 ? (
                        <BatteryLow className="w-6 h-6 text-rose-500" />
                      ) : energyLevel <= 55 ? (
                        <Battery className="w-6 h-6 text-amber-500" />
                      ) : energyLevel <= 80 ? (
                        <BrainCircuit className="w-6 h-6 text-indigo-500" />
                      ) : (
                        <Zap className="w-6 h-6 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {currentMood === 'STRESSED' && 'Decompression & Calm Focus'}
                        {currentMood === 'TIRED' && 'Low Battery / Gentle Ramp-up'}
                        {currentMood === 'ENERGETIC' && 'Curious & Energized State'}
                        {currentMood === 'LASER_FOCUSED' && 'Peak Performance & Speed Mode'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {gameMode === 'CALM_TILES'
                          ? 'Starting with a soothing memory tile alignment exercise to rebuild cognitive flow with zero stress.'
                          : 'Starting with a high-octane 20-second Speed Logic surge with streak multipliers to prime rapid recall.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartWarmUp}
                  className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Launch {gameMode === 'CALM_TILES' ? 'Mindful Pattern Focus' : 'Speed Logic Trial'}
                  </span>
                </button>
              </motion.div>
            )}

            {step === 'WARMUP' && gameMode === 'CALM_TILES' && (
              <motion.div
                key="tiles"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                    <span>Match pairs to restore clarity</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {matchedCount} / {BASE_SYMBOLS.length} Pairs Matched (+{calmXp} XP)
                  </div>
                </div>

                {/* Tiles Grid */}
                <div className="grid grid-cols-4 gap-2.5 max-w-sm mx-auto">
                  {tiles.map((tile) => (
                    <button
                      key={tile.id}
                      onClick={() => handleTileClick(tile.id)}
                      disabled={tile.matched || tile.flipped}
                      className={`h-16 rounded-xl flex items-center justify-center text-xl font-bold border transition-all duration-200 cursor-pointer ${
                        tile.matched
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-600 scale-100 opacity-90'
                          : tile.flipped
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-600'
                          : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-indigo-400'
                      }`}
                    >
                      {tile.matched || tile.flipped ? tile.symbol : '❓'}
                    </button>
                  ))}
                </div>

                {matchedCount >= BASE_SYMBOLS.length ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                    <div className="flex justify-center text-emerald-500">
                      <Smile className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Focus Restored & Mindset Balanced!
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        You earned <strong className="text-indigo-600 dark:text-indigo-400 font-mono">+{Math.max(calmXp, 50)} XP</strong> bonus.
                      </p>
                    </div>
                    <button
                      onClick={handleFinishAndCollect}
                      className="py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition shadow cursor-pointer"
                    >
                      Claim XP & Enter Practice
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      onClick={initTiles}
                      className="text-xs text-slate-400 hover:text-indigo-500 inline-flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Grid
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'WARMUP' && gameMode === 'SPEED_LOGIC' && (
              <motion.div
                key="logic"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Timer and Score bar */}
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Speed Logic Surge
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {logicStreak >= 2 && (
                      <span className="text-xs font-mono font-bold text-amber-500 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 animate-bounce" /> {logicMultiplier}x Multiplier
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Hourglass className="w-3 h-3" /> {secondsLeft}s
                    </span>
                  </div>
                </div>

                {secondsLeft > 0 ? (
                  <div className="space-y-4">
                    {/* Prompt Box */}
                    <div className="p-6 rounded-2xl bg-slate-900 text-white text-center min-h-[100px] flex flex-col justify-center border border-slate-800 shadow-inner">
                      <span className="text-base font-bold">
                        {LOGIC_QUESTIONS[questionIdx % LOGIC_QUESTIONS.length].text}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-2 font-mono">
                        True or False?
                      </span>
                    </div>

                    {/* True / False Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleLogicAnswer(true)}
                        className="py-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> True
                      </button>
                      <button
                        onClick={() => handleLogicAnswer(false)}
                        className="py-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" /> False
                      </button>
                    </div>

                    <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                      Score: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{logicScore} XP</strong> | Streak: <strong className="font-mono">{logicStreak}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-center space-y-3.5">
                    <div className="flex justify-center text-indigo-600 dark:text-indigo-400">
                      <Trophy className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Speed Logic Completed!
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Total score earned: <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{Math.max(logicScore, 40)} XP</strong>.
                      </p>
                    </div>
                    <button
                      onClick={handleFinishAndCollect}
                      className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition shadow-md cursor-pointer"
                    >
                      Collect XP & Enter Practice
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
