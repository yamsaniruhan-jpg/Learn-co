import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Target,
  Calendar,
  Sparkles,
  Bot,
  Compass,
  BarChart3,
  Award,
  Trophy,
  ShieldCheck,
  User,
  BookMarked,
  Clock,
  HelpCircle,
  FlaskConical,
  Users,
  TrendingUp,
  Mic,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

export interface NavFeature {
  id: string;
  label: string;
  shortLabel: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  highlight?: boolean;
}

export const ALL_APP_FEATURES: NavFeature[] = [
  {
    id: 'dashboard',
    label: 'Home Dashboard',
    shortLabel: 'Home',
    category: 'Core',
    icon: LayoutDashboard,
    description: 'Overview, streaks, daily goals and quick access',
  },
  {
    id: 'focus',
    label: 'Zen Focus Timer',
    shortLabel: 'Zen Focus',
    category: 'Core',
    icon: Clock,
    description: 'Deep work timer with ambient binaural soundscapes & XP pulses',
  },
  {
    id: 'simulations',
    label: 'Virtual Simulations Hub',
    shortLabel: 'Simulations',
    category: 'Core',
    icon: FlaskConical,
    description: 'Interactive STEM lab models, sign charts, and gradient descent optimizers',
    highlight: true,
  },
  {
    id: 'user-guide',
    label: 'User Guide & Manual',
    shortLabel: 'Guide',
    category: 'Core',
    icon: HelpCircle,
    description: 'Complete platform guide, feature walkthroughs & daily routines',
  },
  {
    id: 'learn',
    label: 'Curriculum & Learn',
    shortLabel: 'Learn',
    category: 'Core',
    icon: BookOpen,
    description: 'Interactive STEM curriculum, chapters, and concepts',
  },
  {
    id: 'practice',
    label: 'Practice Arena',
    shortLabel: 'Practice',
    category: 'Core',
    icon: Target,
    description: 'Diagnostic question ladder with instant Socratic feedback',
  },
  {
    id: 'marketplace',
    label: 'Course Marketplace',
    shortLabel: 'Courses',
    category: 'Core',
    icon: ShoppingBag,
    description: 'Browse curated courses and structured learning modules',
  },
  {
    id: 'copilot',
    label: 'Omni AI Copilot',
    shortLabel: 'Copilot',
    category: 'AI Tools',
    icon: Bot,
    description: 'Socratic first-principles reasoning and step-by-step guidance',
    highlight: true,
  },
  {
    id: 'create',
    label: 'Creator Studio',
    shortLabel: 'Create',
    category: 'AI Tools',
    icon: Sparkles,
    description: 'AI quiz, flashcard and curriculum generator from sources',
    highlight: true,
  },
  {
    id: 'planner',
    label: 'Study Planner',
    shortLabel: 'Plan',
    category: 'Organization',
    icon: Calendar,
    description: 'AI-generated adaptive schedules, goals, and daily tasks',
  },
  {
    id: 'concepts',
    label: 'Concept Matrix',
    shortLabel: 'Concepts',
    category: 'Core',
    icon: Library,
    description: 'Interconnected knowledge graph and mastery ratings',
  },
  {
    id: 'mentor',
    label: 'Personal Mentor',
    shortLabel: 'Mentor',
    category: 'Guidance',
    icon: Compass,
    description: '1-on-1 mentorship, doubt resolution, and mentor applications',
  },
  {
    id: 'leaderboard',
    label: 'Global Leaderboard',
    shortLabel: 'Ranks',
    category: 'Gamification',
    icon: Trophy,
    description: 'Global cohort standings, XP ladder, and milestone legacy',
  },
  {
    id: 'intelligence',
    label: 'Mistake Notebook',
    shortLabel: 'Notebook',
    category: 'Analytics',
    icon: BarChart3,
    description: 'Error log, retention intervals, and targeted remediation',
  },
  {
    id: 'digital-archive',
    label: 'Digital Archive & Books',
    shortLabel: 'Archive',
    category: 'Resources',
    icon: BookMarked,
    description: 'Free textbooks, research archives, and open educational resources',
  },
  {
    id: 'study-rooms',
    label: 'Peer Study Rooms',
    shortLabel: 'Study Rooms',
    category: 'Collaboration',
    icon: Users,
    description: 'Real-time collaborative study sessions and group streak bonuses',
  },
  {
    id: 'voice-exam',
    label: 'Voice Oral Exam',
    shortLabel: 'Voice Exam',
    category: 'AI Tools',
    icon: Mic,
    description: 'Speech-to-text Socratic oral examinations & concept defenses',
  },
  {
    id: 'forecaster',
    label: 'Exam Forecaster',
    shortLabel: 'Forecaster',
    category: 'Analytics',
    icon: TrendingUp,
    description: 'Predictive score ranges, percentile forecasts & readiness analytics',
  },
  {
    id: 'offline-sync',
    label: 'PWA Offline Sync',
    shortLabel: 'Offline Sync',
    category: 'System',
    icon: RefreshCw,
    description: 'Service worker status, offline curriculum cache & retry queue',
  },
  {
    id: 'gamification',
    label: 'XP & Badges',
    shortLabel: 'Badges',
    category: 'Gamification',
    icon: Award,
    description: 'Achievements, badges, streaks, and scholarship milestones',
  },
  {
    id: 'profile',
    label: 'Scholar Profile',
    shortLabel: 'Profile',
    category: 'Account',
    icon: User,
    description: 'Account settings, exam dates, targets, and stats',
  },
  {
    id: 'admin',
    label: 'Admin Studio',
    shortLabel: 'Admin',
    category: 'System',
    icon: ShieldCheck,
    description: 'Platform metrics, mentor review, and system configurations',
  },
];

export const CATEGORY_ORDER = [
  'Core', 'AI Tools', 'Organization', 'Analytics', 'Gamification',
  'Resources', 'Collaboration', 'Guidance', 'System', 'Account',
];

export function groupNavFeatures<T extends { category: string }>(features: T[]) {
  const groups = new Map<string, T[]>();
  for (const feature of features) {
    const category = feature.category || 'Other';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(feature);
  }
  return [...groups.keys()].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a), bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  }).map((category) => ({ category, features: groups.get(category)! }));
}
