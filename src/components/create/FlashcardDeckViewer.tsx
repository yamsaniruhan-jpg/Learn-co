import React, { useState } from 'react';
import { FlashcardItem } from '../../types/creator';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sparkles,
  Shuffle,
  CheckCircle2,
  HelpCircle,
  Tag,
  Maximize2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface FlashcardDeckViewerProps {
  flashcards: FlashcardItem[];
  title?: string;
  onUpdateCardMastery?: (index: number, mastered: boolean) => void;
}

export const FlashcardDeckViewer: React.FC<FlashcardDeckViewerProps> = ({
  flashcards: initialCards,
  title,
  onUpdateCardMastery,
}) => {
  const [cards, setCards] = useState<FlashcardItem[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'study' | 'grid'>('study');
  const [showHint, setShowHint] = useState<boolean>(false);

  // Sync if props change
  React.useEffect(() => {
    setCards(initialCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [initialCards]);

  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No flashcards in this deck.
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const masteredCount = cards.filter((c) => c.mastered).length;
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const toggleMastered = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = [...cards];
    updated[idx] = { ...updated[idx], mastered: !updated[idx].mastered };
    setCards(updated);
    if (onUpdateCardMastery) {
      onUpdateCardMastery(idx, updated[idx].mastered || false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            {cards.length} CARDS
          </Badge>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {masteredCount} of {cards.length} mastered
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            leftIcon={<Shuffle className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Shuffle
          </Button>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('study')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'study'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Focus Deck
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Grid View
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'study' ? (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Interactive 3D-feel Flashcard Flip Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`min-h-[260px] sm:min-h-[300px] p-6 sm:p-8 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between select-none relative shadow-sm hover:shadow-md ${
              isFlipped
                ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-700/80 shadow-indigo-950/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-indigo-400 dark:hover:border-indigo-600'
            }`}
          >
            {/* Top Bar inside Card */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <span
                className={`px-2 py-0.5 rounded-md uppercase tracking-wider text-[10px] font-bold ${
                  isFlipped
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {isFlipped ? 'Analytical Resolution' : 'Conceptual Question'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => toggleMastered(currentIndex, e)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    currentCard.mastered
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : isFlipped
                      ? 'bg-white/10 text-white/70 hover:bg-white/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Toggle mastery state"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{currentCard.mastered ? 'Mastered' : 'Mark Mastered'}</span>
                </button>

                <span className="text-xs opacity-60">
                  {currentIndex + 1} / {cards.length}
                </span>
              </div>
            </div>

            {/* Main Question / Answer Body */}
            <div className="py-6 my-auto text-center space-y-4">
              <p className="text-base sm:text-lg font-bold leading-relaxed max-w-xl mx-auto">
                {isFlipped ? currentCard.back : currentCard.front}
              </p>

              {/* LaTeX formula callout */}
              {currentCard.formula && (
                <div
                  className={`p-3 rounded-xl max-w-md mx-auto text-xs font-mono font-bold border ${
                    isFlipped
                      ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  $${currentCard.formula}$$
                </div>
              )}

              {/* Hint Display */}
              {currentCard.hint && showHint && !isFlipped && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs max-w-md mx-auto animate-in fade-in duration-150">
                  <strong>Hint:</strong> {currentCard.hint}
                </div>
              )}
            </div>

            {/* Bottom Footer inside Card */}
            <div className="flex items-center justify-between text-xs pt-2 opacity-75">
              <div>
                {currentCard.hint && !isFlipped && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHint(!showHint);
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold hover:underline text-amber-500"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>{showHint ? 'Hide Hint' : 'Reveal Diagnostic Hint'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <RotateCw className="w-3 h-3 animate-spin-once" />
                <span>Tap card or spacebar to flip</span>
              </div>
            </div>
          </div>

          {/* Navigation Controls Below Card */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={handlePrev}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsFlipped(!isFlipped)}
              leftIcon={<RotateCw className="w-4 h-4" />}
            >
              Flip Card
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next Card
            </Button>
          </div>
        </div>
      ) : (
        /* Grid Overview of All Cards in Deck */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card, idx) => (
            <div
              key={card.id || idx}
              onClick={() => {
                setCurrentIndex(idx);
                setViewMode('study');
              }}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400 font-mono">Card {idx + 1}</span>
                {card.mastered && (
                  <Badge variant="success" size="sm">
                    Mastered
                  </Badge>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                {card.front}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                {card.back}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
