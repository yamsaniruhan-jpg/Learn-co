import React, { useState } from 'react';
import {
  BookOpen,
  Compass,
  Target,
  Clock,
  Bot,
  Sparkles,
  Calendar,
  Trophy,
  Award,
  Layers,
  CheckCircle2,
  HelpCircle,
  Search,
  ArrowRight,
  Flame,
  Zap,
  Brain,
  ShieldCheck,
  FileText,
  Volume2,
  Bookmark,
  Share2,
  ChevronRight,
  Lightbulb,
  GraduationCap,
  FlaskConical,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface UserGuideViewProps {
  onNavigateToTab: (tabId: string, context?: any) => void;
}

type GuideSection =
  | 'overview'
  | 'daily_loop'
  | 'practice'
  | 'zen_focus'
  | 'copilot'
  | 'concepts'
  | 'creator'
  | 'planner'
  | 'mentor'
  | 'gamification'
  | 'simulations'
  | 'roadmap';

export const UserGuideView: React.FC<UserGuideViewProps> = ({ onNavigateToTab }) => {
  const [activeSection, setActiveSection] = useState<GuideSection>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    { id: 'overview' as GuideSection, label: 'Platform Tour', icon: Compass },
    { id: 'daily_loop' as GuideSection, label: 'Daily Efficient Workflow', icon: Zap },
    { id: 'practice' as GuideSection, label: 'Practice & Diagnostics', icon: Target },
    { id: 'zen_focus' as GuideSection, label: 'Zen Focus & Pulse (XP)', icon: Clock },
    { id: 'copilot' as GuideSection, label: 'Omni AI Copilot & History', icon: Bot },
    { id: 'concepts' as GuideSection, label: 'Concept Matrix & Formulas', icon: BookOpen },
    { id: 'creator' as GuideSection, label: 'Creator Studio', icon: Sparkles },
    { id: 'simulations' as GuideSection, label: 'Virtual Simulations Hub', icon: FlaskConical },
    { id: 'planner' as GuideSection, label: 'Paced Study Planner', icon: Calendar },
    { id: 'mentor' as GuideSection, label: 'Personal Mentorship', icon: GraduationCap },
    { id: 'gamification' as GuideSection, label: 'XP, Streaks & Ranks', icon: Trophy },
    { id: 'roadmap' as GuideSection, label: 'What To Do Next', icon: Lightbulb },
  ];

  const filteredSections = searchQuery.trim()
    ? sections.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : sections;

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 sm:p-8 lg:p-10 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-60 h-60 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-bold text-indigo-200 border border-white/15">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Official Scholar Manual & Architecture Guide</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white">
              Learn.co Complete User Guide
            </h1>
            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
              Master the platform from first principles. Discover every feature, optimize your daily study routine, earn verified XP, and unlock deep STEM problem-solving mastery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateToTab('dashboard')}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 text-xs sm:text-sm font-bold hover:bg-indigo-50 transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>Back to Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateToTab('focus')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>Zen Focus Timer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Section Index & Right Detailed Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sticky Index */}
        <div className="lg:col-span-1 space-y-3 lg:sticky lg:top-20">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Guide Chapters
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                11 Sections
              </span>
            </div>

            <div className="space-y-1">
              {sections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-left truncate">{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Helper */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800/80 border border-indigo-100 dark:border-slate-700 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span>Need Quick Support?</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Press <kbd className="px-1 py-0.5 font-mono text-[9px] bg-white dark:bg-slate-800 border rounded">⌘K</kbd> anywhere on the site to trigger instant global search and jump directly to any topic or tool.
            </p>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Compass className="w-6 h-6 text-indigo-600" />
                    <span>Platform Tour & Architecture</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Learn.co is an elite STEM diagnostics, cognitive mastery, and research-grade revision workstation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <span>Calibrated Practice Arena</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Diagnostic ladder of curated STEM problems with Bayesian mastery ratings. Every question provides step-by-step LaTeX derivations and first-principles hints.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => onNavigateToTab('practice')}>
                    Open Practice Arena
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Zen Focus Timer</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Pomodoro and Deep Work sprint timer with built-in Binaural Gamma 40Hz and Brown Noise soundscapes. Earn XP for every completed focus pulse and deep block.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => onNavigateToTab('focus')}>
                    Open Zen Focus Timer
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span>Omni Socratic AI Copilot</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Academic AI assistant grounded in conservation laws and invariant-based reasoning. Never gives spoiler answers on Socratic mode. Features complete session history save/delete.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => onNavigateToTab('copilot')}>
                    Launch Omni Copilot
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Paced Study Planner</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Personalized revision schedules that automatically distribute concepts leading up to your exam target dates. Synchronizes workload to prevent burnout.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => onNavigateToTab('planner')}>
                    Open Study Planner
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: DAILY EFFICIENT LOOP */}
          {activeSection === 'daily_loop' && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-amber-500" />
                  <span>The Pro-Scholar Daily 5-Step Routine</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  How high-performing STEM students use Learn.co in 30–60 minutes per day to achieve top 1% retention.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Ignite Daily Streak with a 60-Second Flash Check
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Click the <strong>⚡ Flash Check</strong> button in the top navigation bar. Solve 3 quick diagnostic questions within 60 seconds to prime cognitive recall, keep your streak alive, and earn <strong>+15 XP</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Check Your Study Planner Pacing
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Navigate to the <strong>Study Planner</strong> tab to review today's scheduled concepts and review tasks. The algorithm paces difficult topics evenly before your target exam date.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Enter a 25-Minute Zen Focus Block
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Open the <strong>Zen Focus Timer</strong>, select Binaural Gamma 40Hz audio, and eliminate distractions. Each finished sprint grants <strong>+50 XP</strong> and registers your focus momentum on the global leaderboard.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Work Through Today's Daily Practice Allowance
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      You have 25 problems in your calibrated daily allowance. Solve problems in the <strong>Practice Arena</strong>. If you get stuck, use Omni Copilot Socratic hint to pinpoint the invariant without viewing the answer.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    5
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Remediate Errors in the Mastery Matrix
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Open <strong>Mastery Matrix / Notebook</strong> to review any missed attempts. The spaced repetition engine will schedule a re-test at increasing intervals until mastery hits 100%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: ZEN FOCUS TIMER */}
          {activeSection === 'zen_focus' && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-indigo-600" />
                  <span>Zen Focus Timer & Focus Pulse XP</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  How the Zen Focus workspace optimizes cognitive stamina and awards gamified XP.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-2">
                  <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
                    🎯 How to Earn XP with Zen Focus:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Completing a 25m Focus Block</strong>: Automatically awards <strong>+50 XP</strong>.</li>
                    <li><strong>Deep Work (50m Sprint)</strong>: Automatically awards <strong>+100 XP</strong>.</li>
                    <li><strong>Clicking "Log Focus Pulse"</strong>: Immediately credits <strong>+25 XP</strong> to your profile and refreshes your activity indicator.</li>
                    <li><strong>Zen Mode Canvas</strong>: Click the Zen Mode toggle to hide all menus and focus strictly on formula scratchpads.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-indigo-500" />
                      <span>Synthesized Binaural Audio</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Built right into your browser with zero network lag: 40Hz Gamma Focus, Brown Noise, and Cosmic Soundscapes crafted to stabilize attention span.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <span>Distraction Dump Scratchpad</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Jot down stray thoughts or formulas while studying. Your notes persist locally across sessions so your focus remains unbroken.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="primary" onClick={() => onNavigateToTab('focus')}>
                    Open Zen Focus Timer Now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: OMNI COPILOT */}
          {activeSection === 'copilot' && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Bot className="w-6 h-6 text-purple-600" />
                  <span>Omni Socratic AI Copilot & History Archive</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  How to prompt Omni Copilot for deep understanding, and how to save or delete conversation archives.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 space-y-2">
                  <h4 className="font-bold text-purple-950 dark:text-purple-200 text-sm">
                    💡 Pedagogical Modes Explained:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-800">
                      <span className="font-bold text-purple-700 dark:text-purple-300 block">Socratic Hint</span>
                      Diagnoses your current mental model and asks guiding questions without spoiling the final answer.
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-800">
                      <span className="font-bold text-purple-700 dark:text-purple-300 block">First Principles Explainer</span>
                      Decomposes complex equations into geometric intuition and conservation laws.
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-800">
                      <span className="font-bold text-purple-700 dark:text-purple-300 block">Exam Derivation</span>
                      Provides rigorous step-by-step proofs with boundary condition checks ($x \to 0, \infty$).
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-800">
                      <span className="font-bold text-purple-700 dark:text-purple-300 block">Code & AI/ML Tutor</span>
                      Writes idiomatic Python with NumPy/PyTorch vectorization and asymptotic bounds.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-indigo-500" />
                    <span>How to Save & Delete History in the Dedicated Tab:</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li>In the Omni Copilot view, switch to the <strong>History</strong> tab at the top.</li>
                    <li>To save all dialogues, click <strong>Save All History</strong> to download a complete backup.</li>
                    <li>To save an individual conversation, click <strong>Save Markdown</strong> on that specific card.</li>
                    <li>To clear all stored session history, click <strong>Delete All History</strong> and confirm.</li>
                  </ol>
                </div>

                <div className="pt-2">
                  <Button variant="primary" onClick={() => onNavigateToTab('copilot')}>
                    Open Omni Copilot
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: WHAT TO DO NEXT */}
          {activeSection === 'roadmap' && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                  <span>Action Plan: What To Do Next</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose your next immediate step based on your current study stage.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 border border-indigo-200 dark:border-indigo-900 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                      Next Step 1
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Configure Your Target Benchmark
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Set your upcoming exam or target score in your profile to tailor the diagnostic ladder difficulty.
                    </p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => onNavigateToTab('profile')}>
                    Go to Profile
                  </Button>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-white dark:from-slate-800 dark:to-slate-900 border border-purple-200 dark:border-purple-900 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase">
                      Next Step 2
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Launch a 25m Focus Sprint
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Start your timer with 40Hz audio to gain deep cognitive momentum and earn 50 XP right away.
                    </p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => onNavigateToTab('focus')}>
                    Start Zen Focus
                  </Button>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-900 border border-emerald-200 dark:border-emerald-900 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                      Next Step 3
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Solve 5 Diagnostic Problems
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Establish your baseline Bayesian mastery ratings and unlock targeted remediation cards.
                    </p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => onNavigateToTab('practice')}>
                    Solve Problems
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* OTHER SECTIONS: PRACTICE, CONCEPTS, CREATOR, PLANNER, MENTOR, GAMIFICATION */}
          {activeSection !== 'overview' &&
            activeSection !== 'daily_loop' &&
            activeSection !== 'zen_focus' &&
            activeSection !== 'copilot' &&
            activeSection !== 'roadmap' && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 capitalize">
                    {sections.find((s) => s.id === activeSection)?.label} Guide
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Everything you need to know about this module and how to maximize its effectiveness.
                  </p>
                </div>

                {activeSection === 'practice' && (
                  <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      The <strong>Practice Arena</strong> features a calibrated diagnostic ladder spanning Mathematics, CS, Physics, and Chemistry.
                    </p>
                    <ul className="list-disc list-inside space-y-1.5">
                      <li><strong>Daily Allowance</strong>: 25 problems per day to prevent binge-studying and enforce continuous daily spacing.</li>
                      <li><strong>Bayesian Mastery</strong>: Every correct and incorrect answer updates your concept confidence rating in real-time.</li>
                      <li><strong>Formula Inspector</strong>: Click on any LaTeX formula to inspect dimensional units, invariant definitions, and physical limits.</li>
                    </ul>
                    <Button variant="primary" onClick={() => onNavigateToTab('practice')}>
                      Go to Practice Arena
                    </Button>
                  </div>
                )}

                {activeSection === 'concepts' && (
                  <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      The <strong>Concept Matrix & Digital Archives</strong> contain the comprehensive STEM knowledge graph.
                    </p>
                    <ul className="list-disc list-inside space-y-1.5">
                      <li><strong>Concept Library</strong>: Detailed chapters with first-principles axioms, physical analogies, and counterexamples.</li>
                      <li><strong>Digital Archive Hub</strong>: Curated open textbooks and academic papers covering calculus, physics, and ML.</li>
                    </ul>
                    <Button variant="primary" onClick={() => onNavigateToTab('concepts')}>
                      Explore Concept Library
                    </Button>
                  </div>
                )}

                {activeSection === 'creator' && (
                  <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      The <strong>Creator Studio</strong> transforms your lecture notes, textbook PDFs, or syllabus text into structured learning assets.
                    </p>
                    <ul className="list-disc list-inside space-y-1.5">
                      <li><strong>Quiz & Flashcard Generation</strong>: Instantly build interactive flashcard decks with LaTeX formatting.</li>
                      <li><strong>Export & Share</strong>: Save resources to your private study collection or export to Markdown/JSON.</li>
                    </ul>
                    <Button variant="primary" onClick={() => onNavigateToTab('create')}>
                      Launch Creator Studio
                    </Button>
                  </div>
                )}

                {activeSection === 'planner' && (
                  <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      The <strong>Paced Study Planner</strong> prevents cramming by creating an adaptive schedule tailored to your available daily hours and target exam dates.
                    </p>
                    <Button variant="primary" onClick={() => onNavigateToTab('planner')}>
                      Open Study Planner
                    </Button>
                  </div>
                )}

                {activeSection === 'mentor' && (
                  <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      The <strong>Personal Mentorship</strong> system matches you with senior STEM scholars for 1-on-1 doubt resolution, code reviews, and viva preparation.
                    </p>
                    <Button variant="primary" onClick={() => onNavigateToTab('mentor')}>
                      Find a Mentor
                    </Button>
                  </div>
                )}

                {activeSection === 'simulations' && (
                  <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      The <strong>Virtual Simulations & 3D Labs</strong> hub provides immersive 3D coordinate spaces and real-time interactive STEM laboratories.
                    </p>
                    <ul className="list-disc list-inside space-y-1.5">
                      <li><strong>Calculus 3D Coordinate Laboratory</strong>: Inspect multivariable surfaces ($f(x,y) = x^2 + y^2$), tangent slopes, and partial derivatives.</li>
                      <li><strong>AI 3D Loss Optimizer</strong>: Tune learning rate hyperparameter $\alpha$ to observe descent trajectories across a 3D convex loss basin.</li>
                      <li><strong>Organic Chemistry SN2 Lab</strong>: Simulate backside nucleophilic attack ($180^\circ$) and tetrahedral Walden configuration inversion.</li>
                      <li><strong>Physics Mechanics Lab</strong>: Track mechanical energy conservation (U + K = Constant) under harmonic pendulum motion.</li>
                    </ul>
                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 mt-4">
                      <h4 className="font-bold text-indigo-900 dark:text-indigo-200">Recent Platform Enhancements (v4.2 Update)</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 text-xs">
                        <li><strong>LaTeX Free Creator Studio</strong>: Artifact viewers and export tools now feature automatic conversion to clean, readable normal text.</li>
                        <li><strong>10-Stage League Hierarchy</strong>: Leaderboards updated to 10 ordered leagues with 3 substages (Division III, II, I) and weekly promotion zones (Top 10 / Top 3).</li>
                        <li><strong>Zero-Trust Firebase & Auth</strong>: Robust authentication token caching and secure Firestore integration.</li>
                      </ul>
                    </div>
                    <Button variant="primary" onClick={() => onNavigateToTab('simulations')} className="mt-2">
                      Open Virtual Simulations Hub
                    </Button>
                  </div>
                )}

                {activeSection === 'gamification' && (
                  <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      <strong>XP & Gamification Matrix</strong>: Every verified effort awards XP based on mathematical proof:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5">
                      <li>Solving a diagnostic question: <strong>+10 to +25 XP</strong></li>
                      <li>Completing 60s Flash Check: <strong>+15 XP</strong></li>
                      <li>25m Focus sprint: <strong>+50 XP</strong></li>
                      <li>Daily Streak preservation: Tiered multi-day multiplier</li>
                    </ul>
                    <Button variant="primary" onClick={() => onNavigateToTab('gamification')}>
                      View XP & Achievements
                    </Button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
