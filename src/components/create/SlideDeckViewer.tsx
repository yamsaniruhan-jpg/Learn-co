import React, { useState } from 'react';
import { SlideItem } from '../../types/creator';
import {
  ChevronLeft,
  ChevronRight,
  Presentation,
  Volume2,
  Tv,
  Sparkles,
  Copy,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { latexToPlainText } from '../../utils/textSanitizer';

interface SlideDeckViewerProps {
  slides: SlideItem[];
  title?: string;
}

export const SlideDeckViewer: React.FC<SlideDeckViewerProps> = ({ slides, title }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  if (!slides || slides.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No presentation slides generated.
      </div>
    );
  }

  const slide = slides[currentSlide];

  const handleNext = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const handleCopyAllSlides = () => {
    let text = `LECTURE SLIDES: ${title || 'Stem Presentation'}\n`;
    text += `==================================================\n\n`;

    slides.forEach((s, idx) => {
      text += `SLIDE ${idx + 1}: ${latexToPlainText(s.title)}\n`;
      if (s.subtitle) text += `Subtitle: ${latexToPlainText(s.subtitle)}\n`;
      text += `--------------------------------------------------\n`;
      if (s.bullets && s.bullets.length > 0) {
        text += `Key Takeaways:\n`;
        s.bullets.forEach((b) => {
          text += `  • ${latexToPlainText(b)}\n`;
        });
      }
      if (s.calloutFormula) {
        text += `Equation / Principle: ${latexToPlainText(s.calloutFormula)}\n`;
      }
      if (s.speakerNotes) {
        text += `Presenter Script: ${latexToPlainText(s.speakerNotes)}\n`;
      }
      text += `\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSaveNormally = () => {
    let text = `LECTURE SLIDES: ${title || 'Stem Presentation'}\n\n`;
    slides.forEach((s, idx) => {
      text += `SLIDE ${idx + 1}: ${latexToPlainText(s.title)}\n`;
      if (s.subtitle) text += `${latexToPlainText(s.subtitle)}\n`;
      if (s.bullets) {
        s.bullets.forEach((b) => (text += `  • ${latexToPlainText(b)}\n`));
      }
      if (s.calloutFormula) {
        text += `Formula: ${latexToPlainText(s.calloutFormula)}\n`;
      }
      if (s.speakerNotes) {
        text += `Notes: ${latexToPlainText(s.speakerNotes)}\n`;
      }
      text += `\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'slides').toLowerCase().replace(/[^a-z0-9]/g, '_')}_notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header bar with Normal Copy & Save actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            {slides.length} LECTURE SLIDES
          </Badge>
          <span className="text-xs text-slate-500 font-medium">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAllSlides}
            leftIcon={copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            {copied ? 'Copied Slides Text!' : 'Copy Slides Normally'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveNormally}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            Save as Text (.txt)
          </Button>

          <Button
            variant={showNotes ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            leftIcon={<Volume2 className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {showNotes ? 'Speaker Notes (On)' : 'Speaker Notes (Off)'}
          </Button>
        </div>
      </div>

      {/* Main 16:9 Presentation Canvas */}
      <div className="relative aspect-[16/9] w-full rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-10 flex flex-col justify-between shadow-lg overflow-hidden select-none">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Slide Top Metadata */}
        <div className="flex items-center justify-between z-10 text-xs font-semibold text-indigo-300">
          <span className="uppercase tracking-widest text-[10px] font-bold bg-indigo-500/20 px-2.5 py-1 rounded-md border border-indigo-400/20">
            Learn.co Lecture Series
          </span>
          <span className="font-mono text-slate-400">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        {/* Slide Main Content with Clean Normal Text */}
        <div className="space-y-4 my-auto z-10 max-w-2xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            {latexToPlainText(slide.title)}
          </h2>
          {slide.subtitle && (
            <p className="text-xs sm:text-sm text-indigo-200 font-medium">
              {latexToPlainText(slide.subtitle)}
            </p>
          )}

          {/* Bullets with Clean Text */}
          <ul className="space-y-2.5 pt-2">
            {slide.bullets.map((bullet, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                <span>{latexToPlainText(bullet)}</span>
              </li>
            ))}
          </ul>

          {/* Clean Normal Formula Callout (no raw $$ markup) */}
          {slide.calloutFormula && (
            <div className="mt-3 p-3 rounded-xl bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 text-xs font-semibold inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 font-mono text-[10px] uppercase font-bold">
                Formula
              </span>
              <span>{latexToPlainText(slide.calloutFormula)}</span>
            </div>
          )}
        </div>

        {/* Slide Bottom Bar */}
        <div className="flex items-center justify-between z-10 text-[10px] text-slate-400 border-t border-white/10 pt-3">
          <span>{title ? latexToPlainText(title) : 'First-Principles Pedagogical Masterclass'}</span>
          <span>Press Next or arrows to advance</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="md"
          onClick={handlePrev}
          disabled={currentSlide === 0}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous Slide
        </Button>

        {/* Slide dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentSlide
                  ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                  : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleNext}
          disabled={currentSlide === slides.length - 1}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Next Slide
        </Button>
      </div>

      {/* Presenter Lecture Notes Box with Clean Text */}
      {showNotes && slide.speakerNotes && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Speaker Script & Pedagogical Talking Points:</span>
          </div>
          <p className="leading-relaxed whitespace-pre-line">{latexToPlainText(slide.speakerNotes)}</p>
        </div>
      )}
    </div>
  );
};
