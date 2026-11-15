import React, { useState } from 'react';
import {
  Compass,
  X,
  ArrowRight,
  Target,
  Sparkles,
  BookOpen,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  FlaskConical,
  ShoppingBag,
  Users,
  Calendar,
} from 'lucide-react';

interface FloatingGuideButtonProps {
  activeTab: string;
  onNavigate: (tabId: string, context?: any) => void;
  copilotVisible?: boolean;
}

interface ContextualGuide {
  heading: string;
  summary: string;
  steps: string[];
  primaryAction: { label: string; tab: string; icon: React.ComponentType<{ className?: string }> };
}

function getGuideForTab(tab: string): ContextualGuide {
  switch (tab) {
    case 'learn':
      return {
        heading: 'Learn & Explore Path',
        summary: 'Pick a subject track, read the core visual idea, then test yourself right away.',
        steps: [
          'Choose a STEM subject track at the top.',
          'Read through the concept breakdown in normal readable format.',
          'Jump to Practice Arena to lock it in and earn XP.',
        ],
        primaryAction: { label: 'Practice This Topic', tab: 'practice', icon: Target },
      };
    case 'practice':
      return {
        heading: 'Practice Arena Steps',
        summary: 'Solve adaptive problems step by step to raise your mastery score and streak.',
        steps: [
          'Choose your subject and difficulty.',
          'Submit an answer — any miss is automatically saved to your Mistake Notebook.',
          'Tap the Copilot button if you want a gentle hint without giving away the answer.',
        ],
        primaryAction: { label: 'Open Mistake Notebook', tab: 'intelligence', icon: AlertTriangle },
      };
    case 'create':
      return {
        heading: 'Creator Studio Flow',
        summary: 'Turn your PDFs, text notes, or URLs into clean slides, flashcards, and printable PDFs.',
        steps: [
          'Upload a file or paste study text in Sources.',
          'Generate Slides, Lecture Notes, Flashcards, or Mind Maps.',
          'Click Save / Print PDF or Export to download clean normal-format handouts.',
        ],
        primaryAction: { label: 'View Study Dashboard', tab: 'dashboard', icon: CheckCircle2 },
      };
    case 'intelligence':
      return {
        heading: 'Mastery & Mistake Notebook',
        summary: 'Turn weak areas into strengths by reviewing and retrying past misses.',
        steps: [
          'Open the Mistake Notebook tab to inspect missed questions in clean Normal Format.',
          'Click Save / Print PDF to keep an offline study review sheet.',
          'Tap Practice Similar or Remediate to clear unresolved concepts.',
        ],
        primaryAction: { label: 'Start Practice Drill', tab: 'practice', icon: Target },
      };
    case 'marketplace':
      return {
        heading: 'Course Marketplace',
        summary: 'Browse, enroll in, or publish community courses with live cloud persistence.',
        steps: [
          'Filter by topic or search for a course you want.',
          'Enroll in one tap to unlock lessons and track progress.',
          'Want to teach? Use Publish Course to share your curriculum live.',
        ],
        primaryAction: { label: 'Meet Personal Mentor', tab: 'mentor', icon: Users },
      };
    case 'mentor':
      return {
        heading: 'Live Personal Mentor',
        summary: 'Get real-time diagnostics on your study velocity and schedule live review goals.',
        steps: [
          'Check your retention health and weakest concepts below.',
          'Launch a targeted revision drill or message your live mentor.',
          'Sync recommendations directly into your Study Planner.',
        ],
        primaryAction: { label: 'Open Study Planner', tab: 'planner', icon: Calendar },
      };
    case 'simulations':
      return {
        heading: 'Interactive 3D Labs',
        summary: 'Manipulate sliders and formulas in real time to build intuition before solving.',
        steps: [
          'Pick a Physics, Calculus, Linear Algebra, or Chemistry lab.',
          'Drag the parameter sliders to observe live behavior.',
          'Head back to Practice Arena once the visual pattern clicks.',
        ],
        primaryAction: { label: 'Go to Practice Arena', tab: 'practice', icon: Target },
      };
    default:
      return {
        heading: 'What to Do Next',
        summary: 'Follow this quick 3-step loop anytime to keep your streak and mastery growing.',
        steps: [
          '1. Pick a subject in Learn & Explore or upload your notes in Creator Studio.',
          '2. Solve a quick set in Practice Arena (every miss goes to Mistake Notebook).',
          '3. Review unresolved items or ask Omni Copilot beside this button.',
        ],
        primaryAction: { label: 'Start Practice Arena', tab: 'practice', icon: Target },
      };
  }
}

export const FloatingGuideButton: React.FC<FloatingGuideButtonProps> = ({
  activeTab,
  onNavigate,
  copilotVisible = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const guide = getGuideForTab(activeTab);
  const PrimaryIcon = guide.primaryAction.icon;

  // Position cleanly to the left of the floating Copilot button without overlapping
  const buttonPositionClass = copilotVisible
    ? 'bottom-20 md:bottom-6 right-20 md:right-24'
    : 'bottom-20 md:bottom-6 right-4 md:right-6';

  const quickDestinations = [
    { id: 'learn', label: 'Learn', icon: BookOpen, tint: 'bg-[#F0EDFA] text-[#6C5CE7] dark:bg-[#1E1B33] dark:text-[#8577ED]' },
    { id: 'practice', label: 'Practice', icon: Target, tint: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300' },
    { id: 'create', label: 'Creator', icon: Sparkles, tint: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300' },
    { id: 'intelligence', label: 'Mistakes', icon: AlertTriangle, tint: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' },
    { id: 'simulations', label: '3D Labs', icon: FlaskConical, tint: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300' },
    { id: 'marketplace', label: 'Courses', icon: ShoppingBag, tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed ${buttonPositionClass} h-14 px-3.5 rounded-full bg-white dark:bg-[#2A2647] hover:bg-[#F7F5FF] dark:hover:bg-[#342F56] text-[#6C5CE7] dark:text-[#F1EFFF] border-2 border-[#6C5CE7]/35 hover:border-[#6C5CE7] shadow-[0_8px_24px_rgba(45,42,74,0.16)] flex items-center justify-center gap-2 z-40 transition-all hover:scale-105 cursor-pointer`}
        aria-label="Open Next-Step Guide"
        aria-expanded={isOpen}
        title="Step-by-step Guide: What to do next"
      >
        <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/12 dark:bg-[#6C5CE7]/30 flex items-center justify-center shrink-0">
          <Compass className="w-5 h-5 text-[#6C5CE7] dark:text-[#A598FF]" />
        </div>
        <span className="hidden sm:inline text-xs font-extrabold tracking-tight pr-0.5">
          Guide
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed bottom-36 md:bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] sm:w-96 rounded-3xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-[0_18px_48px_rgba(45,42,74,0.22)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.65)] z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-150"
          role="dialog"
          aria-label="What to Do Next Guide"
        >
          {/* Branded Header */}
          <div className="bg-gradient-to-r from-[#00B8A9] to-[#6C5CE7] text-white p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#01000E] p-1 border border-white/30 shadow-xs shrink-0">
                <img
                  src="/logo-mark.png"
                  alt="LearnCo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-black text-sm leading-tight">{guide.heading}</h3>
                <p className="text-[11px] text-white/85 font-medium">
                  Clear next steps for this screen
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
              aria-label="Close guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
              {guide.summary}
            </p>

            {/* Clear 1-2-3 Steps */}
            <div className="space-y-2">
              {guide.steps.map((stepText, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861]"
                >
                  <span className="w-6 h-6 rounded-full bg-[#6C5CE7] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-[#2D2A4A] dark:text-[#F1EFFF] font-medium leading-snug">
                    {stepText.replace(/^\d+\.\s*/, '')}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Symbol Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6B6890] dark:text-[#B4B0D5] px-1">
                Quick Jump Symbols
              </span>
              <div className="grid grid-cols-3 gap-2">
                {quickDestinations.map((dest) => {
                  const Icon = dest.icon;
                  const isCurrent = activeTab === dest.id;
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => {
                        onNavigate(dest.id);
                        setIsOpen(false);
                      }}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        isCurrent
                          ? 'border-[#6C5CE7] bg-[#F0EDFA] dark:bg-[#6C5CE7]/25'
                          : 'border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7]/60 bg-white dark:bg-[#1E1B33]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dest.tint}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                        {dest.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer CTA Row */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onNavigate(guide.primaryAction.tab);
                  setIsOpen(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <PrimaryIcon className="w-4 h-4 shrink-0" />
                <span>{guide.primaryAction.label}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('user-guide');
                  setIsOpen(false);
                }}
                className="py-2.5 px-3.5 rounded-full bg-[#F7F5FF] dark:bg-[#1E1B33] hover:bg-[#EAE5FF] dark:hover:bg-[#342F56] border border-[#E3DFF5] dark:border-[#3D3861] text-[#6C5CE7] dark:text-[#A598FF] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Open the complete interactive platform manual"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Full Manual</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
