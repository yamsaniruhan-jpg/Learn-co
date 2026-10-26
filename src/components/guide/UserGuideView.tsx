import React, { useState, useMemo } from 'react';
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
  Gauge,
  Sliders,
  Check,
  AlertCircle,
  Infinity as InfinityIcon,
  RotateCcw,
  KeyRound,
  Database,
  ExternalLink,
  Cpu,
  Mic,
  Users,
  LineChart,
  BarChart3,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface UserGuideViewProps {
  onNavigateToTab: (tabId: string, context?: any) => void;
}

type GuideTab = 'limits' | 'quickstart' | 'workflows' | 'features' | 'faq';
type FilterCategory = 'all' | 'ai' | 'limits' | 'practice' | 'community' | 'tools';

interface QuotaItem {
  feature: string;
  category: string;
  dailyLimit: string;
  unit: string;
  resetCycle: string;
  rationale: string;
  tabId: string;
  xpReward?: string;
  badgeColor: string;
}

const QUOTA_LIMITS: QuotaItem[] = [
  {
    feature: 'Creator Studio Artifacts',
    category: 'AI & Generation',
    dailyLimit: '3',
    unit: 'Artifacts / Day',
    resetCycle: 'Resets daily at 00:00 UTC',
    rationale: 'Generates deep, high-yield interactive flashcards, quizzes, and study guides without content overload.',
    tabId: 'create',
    xpReward: '+20 XP / Artifact',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    feature: 'Gemini Socratic Copilot & Doubts',
    category: 'AI & Generation',
    dailyLimit: '25',
    unit: 'Doubts / Day',
    resetCycle: 'Resets daily at 00:00 UTC',
    rationale: 'Enforces cognitive struggle and invariant-based reasoning before consulting AI hints.',
    tabId: 'copilot',
    xpReward: '+5 XP / Clarification',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    feature: 'Paced AI Study Plans',
    category: 'AI & Generation',
    dailyLimit: '2',
    unit: 'Custom Plans / Day',
    resetCycle: 'Resets daily at 00:00 UTC',
    rationale: 'Encourages sticking to an established paced roadmap before re-generating timelines.',
    tabId: 'planner',
    xpReward: '+30 XP / Plan',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    feature: 'Calibrated Practice Arena',
    category: 'Practice & Mastery',
    dailyLimit: '25',
    unit: 'Questions / Day',
    resetCycle: 'Resets daily at 00:00 UTC',
    rationale: 'Calibrated daily allowance to prevent binge-cramming and maximize long-term spaced retention.',
    tabId: 'practice',
    xpReward: '+10 to +25 XP / Question',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    feature: 'Flash Check Streak Igniter',
    category: 'Practice & Mastery',
    dailyLimit: '1',
    unit: 'Attempt / Day (3 Qs in 60s)',
    resetCycle: 'Resets daily at 00:00 UTC',
    rationale: 'Daily 60-second rapid-fire recall drill to ignite focus and keep your consecutive streak alive.',
    tabId: 'practice',
    xpReward: '+15 XP & Streak +1',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    feature: 'Zen Focus Timer Sprints',
    category: 'Cognitive Stamina',
    dailyLimit: 'Unlimited',
    unit: 'Focus Blocks',
    resetCycle: 'Continuous',
    rationale: 'Binaural 40Hz Gamma & Brown Noise deep work sessions with verifiable progress tracking.',
    tabId: 'focus',
    xpReward: '+50 XP (25m), +100 XP (50m), +25 XP (Pulse)',
    badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    feature: 'Firebase Console & Leaderboard',
    category: 'Account & Persistence',
    dailyLimit: 'All Accounts',
    unit: '100% Synced Permanently',
    resetCycle: 'Permanent Storage',
    rationale: 'Every email or User ID registered is automatically written to Firebase Firestore and displayed forever on the Leaderboard.',
    tabId: 'leaderboard',
    xpReward: 'Weekly League Promotions',
    badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    feature: 'Personal Mentorship Review',
    category: 'Community & Mentors',
    dailyLimit: 'Direct Review',
    unit: 'Instant 1-Click Acceptance',
    resetCycle: 'Real-time',
    rationale: 'Mentor applications are sent directly to the Mentorship panel for immediate review & approval.',
    tabId: 'mentor',
    xpReward: '+150 XP / Mentorship',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  {
    feature: 'Virtual Simulations & 3D Labs',
    category: '3D Visualization',
    dailyLimit: 'Unlimited',
    unit: '4 Interactive Labs',
    resetCycle: 'Unlimited Access',
    rationale: 'Real-time 3D coordinate spaces for multivariable calculus, AI loss landscapes, organic SN2, and pendulums.',
    tabId: 'simulations',
    xpReward: '+20 XP / Lab Exploration',
    badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  },
];

interface FeatureDetail {
  id: string;
  name: string;
  category: FilterCategory;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  description: string;
  dailyQuota: string;
  howToUse: string[];
  proTips: string[];
  tabId: string;
  actionText: string;
}

const ALL_FEATURES: FeatureDetail[] = [
  {
    id: 'creator',
    name: 'Creator Studio & Artifact Generator',
    category: 'ai',
    icon: Sparkles,
    tagline: 'Turn raw syllabi, lecture notes, or textbooks into structured study assets.',
    description:
      'Creator Studio leverages Gemini AI to generate interactive flashcard decks, calibrated diagnostic quizzes, and structured revision summaries from your documents or pasted notes. It includes an automatic "LaTeX Free" mode for instant conversion of complex equations into readable plain English.',
    dailyQuota: '3 Artifacts / Day (Generous generation limit to ensure dense, focused study packages).',
    howToUse: [
      'Navigate to Creator Studio from the sidebar.',
      'Paste your course text or topic outline into the Source Intake box.',
      'Select your output format: Interactive Quiz, Flashcard Deck, or Study Guide.',
      'Toggle "LaTeX Free Text Mode" if you prefer readable plain text instead of dense LaTeX equations.',
      'Click "Generate Artifact with Gemini". Preview and export to Markdown or JSON.',
    ],
    proTips: [
      'Exported flashcards can be reviewed directly in the personal notebook.',
      'Combining 2–3 related concepts in one prompt produces comprehensive cross-discipline quizzes.',
    ],
    tabId: 'create',
    actionText: 'Launch Creator Studio',
  },
  {
    id: 'copilot',
    name: 'Omni Socratic AI Copilot & Doubt Solver',
    category: 'ai',
    icon: Bot,
    tagline: 'Invariant-based STEM tutor with full dialogue history archive.',
    description:
      'Omni Copilot never spoils final answers when in Socratic mode. It analyzes your misconceptions, points out physical conservation laws or boundary conditions, and guides you to the solution. The dedicated History tab allows you to download markdown records or purge your conversation data with one click.',
    dailyQuota: '25 AI Doubts / Day (Calibrated to encourage deep cognitive struggle before requesting hints).',
    howToUse: [
      'Open Omni Copilot or click "Ask Copilot" while viewing any practice question.',
      'Select your pedagogical mode: Socratic Hint, First Principles, Exam Derivation, or Code & ML.',
      'Type your question or attach a LaTeX equation.',
      'Switch to the "History" tab at any time to review past explanations, export to Markdown, or clear logs.',
    ],
    proTips: [
      'Use Socratic mode when practicing to build intuition for viva and oral exams.',
      'Click "Save All History" before clearing sessions to maintain an offline study journal.',
    ],
    tabId: 'copilot',
    actionText: 'Open Omni Copilot',
  },
  {
    id: 'practice',
    name: 'Calibrated Practice Arena',
    category: 'practice',
    icon: Target,
    tagline: '4,000 pre-seeded STEM problems with Bayesian mastery ratings.',
    description:
      'Spans Mathematics, Computer Science, Physics, and Chemistry. Every problem includes full LaTeX derivations, step-by-step hints, and an interactive Formula Inspector to inspect dimensional units and physical invariants.',
    dailyQuota: '25 Practice Questions / Day (Enforces spaced repetition and prevents cognitive burnout).',
    howToUse: [
      'Select your target subject from the Practice Arena navigation.',
      'Choose your difficulty tier or take the adaptive diagnostic test.',
      'Solve the problem on paper or with the scratchpad before submitting your answer.',
      'Click any formula to open the Formula Inspector for physical unit breakdown and dimensional checks.',
    ],
    proTips: [
      'Keep your daily streak alive by completing at least 5 questions every day.',
      'Incorrect answers are automatically routed to your Mastery Matrix for targeted spaced review.',
    ],
    tabId: 'practice',
    actionText: 'Enter Practice Arena',
  },
  {
    id: 'focus',
    name: 'Zen Focus Timer & Binaural Soundscapes',
    category: 'tools',
    icon: Clock,
    tagline: 'Deep work sprints with synthesized 40Hz Gamma and Brown Noise.',
    description:
      'Eliminate digital distractions with custom Pomodoro (25m) and Deep Work (50m) sprint clocks. Includes client-side synthesized soundscapes (Gamma 40Hz for attention stabilization, Brown Noise, and Cosmic Waves), a Distraction Dump scratchpad, and verified Focus Pulse XP awards.',
    dailyQuota: 'Unlimited Sprints (+50 XP for 25m, +100 XP for 50m, +25 XP per Focus Pulse).',
    howToUse: [
      'Open Zen Focus Timer from the sidebar or click the timer badge in the navbar.',
      'Choose your interval (25m Focus Block, 50m Deep Sprint, or custom).',
      'Toggle on Binaural Gamma 40Hz or Brown Noise (requires zero network bandwidth).',
      'Click "Log Focus Pulse" to instantly record verified study momentum and earn +25 XP.',
    ],
    proTips: [
      'Use the Distraction Dump box to jot down stray thoughts without switching browser tabs.',
      'Pair a 25-minute focus sprint with 5 practice problems for peak recall.',
    ],
    tabId: 'focus',
    actionText: 'Open Zen Focus Timer',
  },
  {
    id: 'simulations',
    name: 'Virtual Simulations & 3D Interactive Labs',
    category: 'practice',
    icon: FlaskConical,
    tagline: 'Three.js interactive laboratories for multivariable calculus, ML loss surfaces, and chemistry.',
    description:
      'Four interactive real-time 3D and physics laboratories: Calculus 3D Coordinate Lab ($z = x^2 + y^2$), AI 3D Convex Loss Optimizer with adjustable learning rate $\alpha$, Organic Chemistry SN2 Backside Attack ($180^\circ$ Walden Inversion), and Physics Pendulum Mechanics.',
    dailyQuota: 'Unlimited Free Exploration.',
    howToUse: [
      'Navigate to Virtual Simulations from the sidebar.',
      'Select any of the 4 interactive laboratories.',
      'Rotate, pan, and zoom 3D coordinate frames with your mouse or touch gestures.',
      'Adjust physical parameters (learning rate, surface curvature, pendulum mass) to watch real-time dynamics.',
    ],
    proTips: [
      'In the AI Loss Optimizer, set $\alpha > 0.9$ to observe divergence and gradient explosion in real time.',
      'In the Calculus Lab, observe tangent gradient planes at saddle points.',
    ],
    tabId: 'simulations',
    actionText: 'Explore 3D Simulations',
  },
  {
    id: 'planner',
    name: 'Paced AI Study Planner',
    category: 'ai',
    icon: Calendar,
    tagline: 'Automated exam revision schedules tuned to your exam date and daily hours.',
    description:
      'Calculates the exact daily pacing required to cover all target STEM syllabus units before your exam date. Automatically spaces difficult concepts across days to prevent last-minute cramming.',
    dailyQuota: '2 Generated Study Plans / Day.',
    howToUse: [
      'Open Study Planner from the sidebar.',
      'Enter your upcoming exam date, target score, and daily study hours (e.g. 2 hours/day).',
      'Click "Generate Paced Roadmap".',
      'Review daily scheduled topics, mark tasks complete as you study, and monitor completion pacing.',
    ],
    proTips: [
      'Sync your study planner dates with your profile for cross-tab tracking.',
      'If your target exam date shifts, simply regenerate the plan to re-balance remaining topics.',
    ],
    tabId: 'planner',
    actionText: 'Open Study Planner',
  },
  {
    id: 'leaderboard',
    name: 'Global Leaderboard & Firebase Persistence',
    category: 'community',
    icon: Trophy,
    tagline: 'All registered accounts stored in Firebase Console and displayed forever.',
    description:
      'Every account signed in (via email or User ID) is automatically synchronized with Cloud Firestore (database: ai-studio-learnco-ea5511bf-17f5-45c1-a004-aa58035900a8) and displayed on the permanent leaderboard. Features 10 competitive leagues (Bronze to Immortal) with 3 divisions and weekly promotion zones.',
    dailyQuota: 'Permanent & Automatic (100% of registered accounts displayed forever).',
    howToUse: [
      'Sign in or register with your email or user ID.',
      'Your profile is immediately written to Firebase Firestore and placed on the leaderboard.',
      'Earn XP by completing practice questions, focus sprints, flash checks, and simulation labs.',
      'Check your rank and division standing across Daily, Weekly, and All-Time leaderboards.',
    ],
    proTips: [
      'Finishing in the Top 10 of your division guarantees weekly league promotion.',
      'All user achievements and XP are preserved permanently across browser sessions.',
    ],
    tabId: 'leaderboard',
    actionText: 'View Leaderboard',
  },
  {
    id: 'mentor',
    name: 'Personal Mentorship & 1-Click Acceptance',
    category: 'community',
    icon: GraduationCap,
    tagline: 'Direct 1-on-1 mentorship and instant mentor application review.',
    description:
      'Connect with experienced STEM mentors for 1-on-1 viva coaching and doubt resolution. Students wishing to mentor can submit their credentials. Submitted applications are delivered directly to the Mentorship panel, where administrators or users can review them and click "Accept Application & Make Mentor" for instant promotion.',
    dailyQuota: 'Direct Application Review & Instant Promotion Workflow.',
    howToUse: [
      'Open Personal Mentorship from the sidebar.',
      'Browse active verified mentors or click "Apply to Become a Mentor".',
      'Fill out your credentials and submit your application.',
      'Review pending applications directly on the Mentor Access card and click "Accept Application & Make Mentor" to activate mentor status immediately.',
    ],
    proTips: [
      'Verified mentors earn special profile badges and elevated permissions in peer study rooms.',
    ],
    tabId: 'mentor',
    actionText: 'Go to Mentorship',
  },
  {
    id: 'flash_check',
    name: '⚡ 60-Second Flash Check',
    category: 'practice',
    icon: Zap,
    tagline: 'Quick 3-question diagnostic to ignite your daily streak and earn +15 XP.',
    description:
      'Located directly in the top navigation bar. Test your rapid recall with 3 randomized diagnostic questions across mathematics and physics in under 60 seconds.',
    dailyQuota: '1 Attempt / Day (Instant +15 XP and daily streak preservation).',
    howToUse: [
      'Click the ⚡ Flash Check button in the top navigation bar at any time.',
      'Answer 3 rapid questions before the 60-second countdown expires.',
      'Receive instant feedback, earn +15 XP, and extend your consecutive streak.',
    ],
    proTips: [
      'Make Flash Check the very first thing you do each day to build an unbreakable study habit.',
    ],
    tabId: 'practice',
    actionText: 'Try Flash Check',
  },
  {
    id: 'matrix',
    name: 'Mastery Matrix & Knowledge Graph',
    category: 'tools',
    icon: BarChart3,
    tagline: 'Bayesian cognitive tracking across 12 STEM subdisciplines.',
    description:
      'Visualizes your real-time mastery scores, identify conceptual blind spots, and provides automated remediation paths for any equations or topics with low confidence ratings.',
    dailyQuota: 'Unlimited Real-Time Analytics.',
    howToUse: [
      'Navigate to Mastery Matrix from the sidebar.',
      'Filter by subject (Math, Physics, CS, Chemistry).',
      'Inspect sub-skills with confidence < 70% and click "Remediate" to practice matching questions.',
    ],
    proTips: [
      'Aim for 90%+ mastery in foundational calculus before advancing to multivariable physics.',
    ],
    tabId: 'intelligence',
    actionText: 'View Mastery Matrix',
  },
  {
    id: 'offline',
    name: 'PWA Offline Sync & Local Cache',
    category: 'tools',
    icon: ShieldCheck,
    tagline: 'Continue studying and solving questions even without an active internet connection.',
    description:
      'Learn.co is fully PWA compliant. It caches question sets, formulas, and local notes in IndexedDB/localStorage. All questions solved offline are automatically queued and synced to Firebase when your connection resumes.',
    dailyQuota: 'Always Available Offline.',
    howToUse: [
      'Open the PWA Offline Sync tab to check local cached assets and network status.',
      'Practice questions or take notes offline without interruption.',
      'Reconnecting automatically syncs your XP, streak, and attempts to the cloud database.',
    ],
    proTips: [
      'Install Learn.co to your home screen or desktop dock for an app-like fullscreen experience.',
    ],
    tabId: 'offline-sync',
    actionText: 'Check Offline Status',
  },
  {
    id: 'archives',
    name: 'Digital Archive & Concept Library',
    category: 'practice',
    icon: BookOpen,
    tagline: 'First-principles STEM axioms, geometric analogies, and open-access textbooks.',
    description:
      'Comprehensive textbook library containing foundational theorems, mathematical proofs, and physical analogies curated by top STEM researchers.',
    dailyQuota: 'Unlimited Free Reading.',
    howToUse: [
      'Open Concept Library or Digital Archives from the sidebar.',
      'Search for any concept (e.g. Eigenvalues, Bayes Theorem, Carnot Cycle).',
      'Read first-principles derivations and inspect embedded LaTeX formulas.',
    ],
    proTips: [
      'Bookmark key theorems to have them appear directly in your personal notebook.',
    ],
    tabId: 'concepts',
    actionText: 'Browse Concept Library',
  },
];

export const UserGuideView: React.FC<UserGuideViewProps> = ({ onNavigateToTab }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('limits');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [expandedFeature, setExpandedFeature] = useState<string | null>('creator');

  // Filter features based on search query and category
  const filteredFeatures = useMemo(() => {
    return ALL_FEATURES.filter((feature) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.dailyQuota.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-indigo-900/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-72 h-72 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200 border border-white/15 shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Official Complete User Guide & Quota Limits Manual</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white">
              Learn.co Mastery Guide & Feature Manual
            </h1>
            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
              Everything you need to master Learn.co: detailed walkthroughs for all 12 modules, daily quota limits for Creator Studio, Gemini Socratic Copilot, practice questions, and how to navigate every feature efficiently.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateToTab('dashboard')}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-950 text-xs sm:text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <span>Back to Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateToTab('practice')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/30 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Target className="w-4 h-4" />
              <span>Practice Arena (25/Day)</span>
            </button>
          </div>
        </div>

        {/* Global Search & Navigation Tabs Inside Hero Header */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('limits')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'limits'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-indigo-200'
              }`}
            >
              <Gauge className="w-4 h-4 text-amber-300" />
              <span>Daily Quota & Limits</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.2 rounded-full border border-amber-300/30">
                Essential
              </span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'features'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-indigo-200'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-300" />
              <span>All 12 Features Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('quickstart')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'quickstart'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-indigo-200'
              }`}
            >
              <Zap className="w-4 h-4 text-emerald-300" />
              <span>60-Second Quickstart</span>
            </button>

            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'workflows'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-indigo-200'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span>Efficient Study Workflows</span>
            </button>

            <button
              onClick={() => setActiveTab('faq')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'faq'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-indigo-200'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-sky-300" />
              <span>FAQ & Support</span>
            </button>
          </div>

          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
            <input
              type="text"
              placeholder="Search features, limits, or shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-indigo-300 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: DAILY QUOTAS & LIMITS TABLE */}
      {activeTab === 'limits' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Gauge className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Platform Daily Quotas & System Limits
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
                  Learn.co uses strict, predictable daily limits for AI generation and question practice. These limits serve two critical functions: they keep AI infrastructure cost-effective while enforcing scientifically proven <strong>cognitive spacing</strong> (preventing binge-studying and cramming).
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Timezone Cycle:</span>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  00:00 UTC Reset
                </span>
              </div>
            </div>

            {/* Quotas Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-200 dark:border-purple-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Creator Studio</span>
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">3 Artifacts</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Flashcard decks, quizzes & comprehensive study guides per day.
                </p>
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onNavigateToTab('create')}>
                  Create Artifact
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Gemini Socratic Copilot</span>
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">25 AI Doubts</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Socratic hints, first-principles explanations & code tutoring per day.
                </p>
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onNavigateToTab('copilot')}>
                  Ask Copilot
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Practice Arena</span>
                  <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">25 Problems</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Daily allowance across Math, CS, Physics & Chem with full derivations.
                </p>
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onNavigateToTab('practice')}>
                  Solve Problems
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-rose-500/5 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Flash Check & Streak</span>
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">1 Check (60s)</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  3 diagnostic recall questions in 60s for immediate streak & +15 XP.
                </p>
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onNavigateToTab('practice')}>
                  Ignite Streak
                </Button>
              </div>
            </div>

            {/* Comprehensive Quota Details Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Feature & System</th>
                    <th className="p-3.5">Daily Quota Limit</th>
                    <th className="p-3.5">XP & Progress Reward</th>
                    <th className="p-3.5">Design Rationale & Science</th>
                    <th className="p-3.5 text-right">Quick Jump</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  {QUOTA_LIMITS.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 flex flex-col gap-0.5">
                        <span className="text-sm">{q.feature}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{q.category}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${q.badgeColor}`}>
                          {q.dailyLimit} {q.unit.includes('/') ? q.unit.split('/')[1] : ''}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">{q.resetCycle}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-indigo-600 dark:text-indigo-400">
                        {q.xpReward || 'N/A'}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                        {q.rationale}
                      </td>
                      <td className="p-3.5 text-right">
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => onNavigateToTab(q.tabId)}>
                          Open <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Architecture note about Firebase and Leaderboard sync */}
            <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80 flex items-start gap-3">
              <Database className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-sky-950 dark:text-sky-200">
                  Firebase Console Sync & Permanent Leaderboard Storage Guarantee
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Every user account created or signed in (email or user ID) is directly persisted into Cloud Firestore (database ID: <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-sky-200 dark:border-sky-800">ai-studio-learnco-ea5511bf-17f5-45c1-a004-aa58035900a8</code>). Unlike temporary demo apps, all registered accounts remain in the Firebase Console permanently and appear on the Leaderboard indefinitely with all accumulated XP, streak stats, and league divisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL 12 FEATURES CATALOG */}
      {activeTab === 'features' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all' as FilterCategory, label: 'All 12 Features' },
              { id: 'ai' as FilterCategory, label: 'AI & Gemini Tools' },
              { id: 'practice' as FilterCategory, label: 'Practice & 3D Labs' },
              { id: 'community' as FilterCategory, label: 'Mentors & Leaderboards' },
              { id: 'tools' as FilterCategory, label: 'Productivity & Focus' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredFeatures.map((feat) => {
              const Icon = feat.icon;
              const isExpanded = expandedFeature === feat.id;

              return (
                <div
                  key={feat.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 ${
                    isExpanded
                      ? 'border-indigo-400 dark:border-indigo-600 shadow-md ring-1 ring-indigo-400/20'
                      : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{feat.name}</span>
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {feat.tagline}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedFeature(isExpanded ? null : feat.id)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
                      >
                        {isExpanded ? 'Less' : 'Details'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feat.description}
                    </p>

                    {/* Daily Quota Tag */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-xs">
                      <Gauge className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">Daily Quota:</span>
                      <span className="text-slate-600 dark:text-slate-400 truncate">{feat.dailyQuota}</span>
                    </div>

                    {/* Expanded Step-by-Step Instructions */}
                    {isExpanded && (
                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs animate-in fade-in">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>How to Use Step-by-Step:</span>
                          </h4>
                          <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                            {feat.howToUse.map((step, sIdx) => (
                              <li key={sIdx} className="leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            <span>Pro-Scholar Tips:</span>
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400 pl-1">
                            {feat.proTips.map((tip, tIdx) => (
                              <li key={tIdx} className="leading-relaxed">
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">Module: {feat.id}</span>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onNavigateToTab(feat.tabId)}
                        className="text-xs"
                      >
                        {feat.actionText}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: 60-SECOND QUICKSTART */}
      {activeTab === 'quickstart' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Zap className="w-6 h-6 text-amber-500" />
                <span>60-Second Rapid Onboarding Walkthrough</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                New to Learn.co? Follow this 3-step sprint to get fully set up in under 60 seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 border border-indigo-200 dark:border-indigo-900 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Authenticate Your Scholar Profile
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Click the <strong>Sign In</strong> button or enter your email. Your account is automatically created in Cloud Firestore and registered on the permanent Leaderboard with zero setup required.
                </p>
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onNavigateToTab('auth')}>
                  Sign In / Register
                </Button>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-white dark:from-slate-800 dark:to-slate-900 border border-amber-200 dark:border-amber-900 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Ignite Streak with Flash Check
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Click the <strong>⚡ Flash Check</strong> button in the top navigation header. Answer 3 rapid diagnostic questions in under 60 seconds to prime your neural recall, advance your streak, and earn <strong>+15 XP</strong>.
                </p>
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onNavigateToTab('practice')}>
                  Launch Flash Check
                </Button>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-900 border border-emerald-200 dark:border-emerald-900 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Execute Your 25-Minute Deep Sprint
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Open <strong>Zen Focus Timer</strong>, activate 40Hz Gamma Audio, and solve 5 calibrated practice problems. Submit before the timer expires to bag <strong>+50 XP</strong> and climb the leaderboard.
                </p>
                <Button size="sm" variant="primary" className="w-full text-xs" onClick={() => onNavigateToTab('focus')}>
                  Start 25m Sprint
                </Button>
              </div>
            </div>

            {/* Keyboard Shortcuts Matrix */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>Scholar Power Shortcuts</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold block">⌘K / Ctrl+K</span>
                  <span className="text-slate-500 text-[11px]">Global Search Modal</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold block">Alt + F</span>
                  <span className="text-slate-500 text-[11px]">Instant Flash Check</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold block">Click Formula</span>
                  <span className="text-slate-500 text-[11px]">Formula Inspector</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold block">Zen Toggle</span>
                  <span className="text-slate-500 text-[11px]">Distraction-Free Canvas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EFFICIENT STUDY WORKFLOWS */}
      {activeTab === 'workflows' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-amber-500" />
                <span>Battle-Tested Study Workflows (By Objective)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select your current academic goal to see the exact sequence of tools and recommended daily minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Routine 1 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                    Objective A
                  </span>
                  <span className="text-xs font-bold text-slate-500">45 Minutes / Day</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  "I want maximum exam retention with zero burnout"
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li><strong>Minutes 0–2</strong>: Trigger Flash Check (3 questions) to wake up retrieval mechanisms (+15 XP).</li>
                  <li><strong>Minutes 2–27</strong>: Launch a 25m Focus Sprint with 40Hz Gamma Audio. Solve 10 problems in Practice Arena.</li>
                  <li><strong>Minutes 27–35</strong>: For any problem missed, consult Omni Copilot on "Socratic Hint" mode.</li>
                  <li><strong>Minutes 35–45</strong>: Review the corresponding theorem in Concept Library or run a 3D simulation.</li>
                </ol>
                <Button size="sm" variant="primary" onClick={() => onNavigateToTab('focus')}>
                  Start 45m Daily Routine
                </Button>
              </div>

              {/* Routine 2 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase">
                    Objective B
                  </span>
                  <span className="text-xs font-bold text-slate-500">30 Minutes / Session</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  "I have dense lecture notes and need flashcards"
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li><strong>Step 1</strong>: Open <strong>Creator Studio</strong> and paste your syllabus section or textbook summary.</li>
                  <li><strong>Step 2</strong>: If formulas are dense, toggle <strong>LaTeX Free Text Mode</strong> for clean conversational explanations.</li>
                  <li><strong>Step 3</strong>: Click "Generate Flashcards Deck" (Quota: 3/day).</li>
                  <li><strong>Step 4</strong>: Review cards and click "Export to Markdown" to archive in your private notebook.</li>
                </ol>
                <Button size="sm" variant="primary" onClick={() => onNavigateToTab('create')}>
                  Generate Artifacts
                </Button>
              </div>

              {/* Routine 3 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                    Objective C
                  </span>
                  <span className="text-xs font-bold text-slate-500">10 Minutes</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  "I want to become a verified STEM Mentor"
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li><strong>Step 1</strong>: Navigate to <strong>Personal Mentorship</strong> from the sidebar.</li>
                  <li><strong>Step 2</strong>: Click "Apply to Become a Mentor" and enter your academic specialties.</li>
                  <li><strong>Step 3</strong>: Your application appears immediately on the Mentor Access Card.</li>
                  <li><strong>Step 4</strong>: Click <strong>"Accept Application & Make Mentor"</strong> to immediately verify your account!</li>
                </ol>
                <Button size="sm" variant="primary" onClick={() => onNavigateToTab('mentor')}>
                  Apply or Review Mentors
                </Button>
              </div>

              {/* Routine 4 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 uppercase">
                    Objective D
                  </span>
                  <span className="text-xs font-bold text-slate-500">Exam Preparation</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  "I have an exam in 2–4 weeks"
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li><strong>Step 1</strong>: Open <strong>Paced Study Planner</strong>, input your exam date and daily available hours.</li>
                  <li><strong>Step 2</strong>: Check your Bayesian confidence ratings in <strong>Mastery Matrix</strong>.</li>
                  <li><strong>Step 3</strong>: Review predicted exam scores in <strong>Exam Forecaster</strong>.</li>
                  <li><strong>Step 4</strong>: Schedule mock oral examinations in <strong>Voice Oral Exam</strong>.</li>
                </ol>
                <Button size="sm" variant="primary" onClick={() => onNavigateToTab('planner')}>
                  Build Exam Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FAQ & TROUBLESHOOTING */}
      {activeTab === 'faq' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-sky-500" />
                <span>Frequently Asked Questions & Scholar Knowledge Base</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Answers to the most common questions about quotas, Firebase accounts, leaderboard positions, and AI features.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Why is there a limit of 25 practice questions and 3 Creator Studio artifacts per day?</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                  Learn.co is designed around <strong>spaced repetition and deliberate practice</strong>. Cognitive science research demonstrates that solving 20–25 calibrated problems daily over 30 days leads to 4x higher retention than cramming 150 problems in a single weekend. Furthermore, the 3-artifact Creator Studio limit prevents cognitive overload and keeps generation costs optimal.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>How does my name appear on the Leaderboard?</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                  Every account signed in (email or user ID) is automatically saved to Cloud Firestore and added to the Leaderboard. Your display name, level, streak, and XP are visible to other scholars forever. You can also view your rank within your division (Divisions III, II, I) across 10 progressive leagues.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>How does mentor application acceptance work?</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                  When a scholar applies to become a mentor, the application form is immediately routed to the <strong>Personal Mentorship</strong> panel. Users or administrators can review the application directly and click <strong>"Accept Application & Make Mentor"</strong> to immediately promote them to verified mentor status.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>What is "LaTeX Free Text Mode" in Creator Studio?</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                  Many students find raw mathematical notation like <code className="font-mono bg-white dark:bg-slate-900 px-1 rounded">{"\\frac{d}{dx}\\int_a^x f(t)dt"}</code> intimidating when skimming concepts. When you toggle <strong>LaTeX Free Text Mode</strong> on, Creator Studio instructs Gemini to output plain conversational English descriptions and clear textual formulas so anyone can read without mathematical strain.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>How can I delete my conversation history with Omni Copilot?</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                  In the <strong>Omni Copilot</strong> view, click on the <strong>History</strong> tab at the top. You will see all past dialogues. You can download individual sessions as Markdown files, download all history, or click <strong>"Delete All History"</strong> to permanently purge local conversation logs.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Can I use Learn.co when I am offline or traveling?</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                  Yes! Learn.co includes a service worker and IndexedDB cache via <strong>PWA Offline Sync</strong>. Questions and formulas you have opened are saved locally. You can solve problems and log notes offline; once your device reconnects to Wi-Fi or cellular data, all XP and attempts synchronize with Cloud Firestore automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
