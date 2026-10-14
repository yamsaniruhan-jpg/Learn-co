export interface LeaderboardSubstage {
  id: string;
  stageId: string;
  stageName: string;
  substageName: string;
  division: 'III' | 'II' | 'I';
  levelOrder: number; // 1 to 30
  minXp: number;
  maxXp: number;
  promotionCutoffRank: number; // Top 10 for regular, Top 3 for elite
  colorScheme: {
    badgeBg: string;
    badgeText: string;
    border: string;
    accent: string;
    gradient: string;
  };
}

export interface LeaderboardStage {
  id: string;
  name: string;
  tierNumber: number; // 1 to 10
  description: string;
  badgeEmoji: string;
  promotionTopCount: number; // 10 for tiers 1-6, 3 for tiers 7-10
  substages: LeaderboardSubstage[];
  color: string;
}

export const LEADERBOARD_STAGES: LeaderboardStage[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    tierNumber: 1,
    description: 'Foundational Knowledge League - Where every STEM journey begins.',
    badgeEmoji: '🥉',
    promotionTopCount: 10,
    color: '#cd7f32',
    substages: [
      {
        id: 'bronze_3',
        stageId: 'bronze',
        stageName: 'Bronze',
        substageName: 'Bronze III',
        division: 'III',
        levelOrder: 1,
        minXp: 0,
        maxXp: 99,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-amber-950/40 dark:bg-amber-950/60',
          badgeText: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-700/50',
          accent: 'amber-600',
          gradient: 'from-amber-900/60 to-amber-950/80',
        },
      },
      {
        id: 'bronze_2',
        stageId: 'bronze',
        stageName: 'Bronze',
        substageName: 'Bronze II',
        division: 'II',
        levelOrder: 2,
        minXp: 100,
        maxXp: 199,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-amber-950/50 dark:bg-amber-950/70',
          badgeText: 'text-amber-500 dark:text-amber-300',
          border: 'border-amber-600/60',
          accent: 'amber-500',
          gradient: 'from-amber-800/60 to-amber-900/80',
        },
      },
      {
        id: 'bronze_1',
        stageId: 'bronze',
        stageName: 'Bronze',
        substageName: 'Bronze I',
        division: 'I',
        levelOrder: 3,
        minXp: 200,
        maxXp: 299,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-amber-900/60 dark:bg-amber-900/80',
          badgeText: 'text-amber-400 dark:text-amber-200',
          border: 'border-amber-500/70',
          accent: 'amber-400',
          gradient: 'from-amber-700/60 to-amber-800/80',
        },
      },
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    tierNumber: 2,
    description: 'Apprentice Scholar League - Consistent practice and verified diagnostics.',
    badgeEmoji: '🥈',
    promotionTopCount: 10,
    color: '#94a3b8',
    substages: [
      {
        id: 'silver_3',
        stageId: 'silver',
        stageName: 'Silver',
        substageName: 'Silver III',
        division: 'III',
        levelOrder: 4,
        minXp: 300,
        maxXp: 449,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-slate-800/60 dark:bg-slate-800/80',
          badgeText: 'text-slate-300 dark:text-slate-200',
          border: 'border-slate-500/60',
          accent: 'slate-300',
          gradient: 'from-slate-700/60 to-slate-800/80',
        },
      },
      {
        id: 'silver_2',
        stageId: 'silver',
        stageName: 'Silver',
        substageName: 'Silver II',
        division: 'II',
        levelOrder: 5,
        minXp: 450,
        maxXp: 599,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-slate-700/60 dark:bg-slate-700/80',
          badgeText: 'text-slate-200 dark:text-slate-100',
          border: 'border-slate-400/70',
          accent: 'slate-200',
          gradient: 'from-slate-600/60 to-slate-700/80',
        },
      },
      {
        id: 'silver_1',
        stageId: 'silver',
        stageName: 'Silver',
        substageName: 'Silver I',
        division: 'I',
        levelOrder: 6,
        minXp: 600,
        maxXp: 749,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-slate-600/60 dark:bg-slate-600/80',
          badgeText: 'text-white',
          border: 'border-slate-300/80',
          accent: 'slate-100',
          gradient: 'from-slate-500/60 to-slate-600/80',
        },
      },
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    tierNumber: 3,
    description: 'Disciplined Scholar League - High diagnostic accuracy and daily streaks.',
    badgeEmoji: '🥇',
    promotionTopCount: 10,
    color: '#eab308',
    substages: [
      {
        id: 'gold_3',
        stageId: 'gold',
        stageName: 'Gold',
        substageName: 'Gold III',
        division: 'III',
        levelOrder: 7,
        minXp: 750,
        maxXp: 949,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-yellow-950/50 dark:bg-yellow-950/70',
          badgeText: 'text-yellow-500 dark:text-yellow-400',
          border: 'border-yellow-600/60',
          accent: 'yellow-500',
          gradient: 'from-yellow-800/60 to-yellow-900/80',
        },
      },
      {
        id: 'gold_2',
        stageId: 'gold',
        stageName: 'Gold',
        substageName: 'Gold II',
        division: 'II',
        levelOrder: 8,
        minXp: 950,
        maxXp: 1199,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-yellow-900/60 dark:bg-yellow-900/80',
          badgeText: 'text-yellow-400 dark:text-yellow-300',
          border: 'border-yellow-500/70',
          accent: 'yellow-400',
          gradient: 'from-yellow-700/60 to-yellow-800/80',
        },
      },
      {
        id: 'gold_1',
        stageId: 'gold',
        stageName: 'Gold',
        substageName: 'Gold I',
        division: 'I',
        levelOrder: 9,
        minXp: 1200,
        maxXp: 1499,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-yellow-800/70 dark:bg-yellow-800/90',
          badgeText: 'text-yellow-300 dark:text-yellow-100',
          border: 'border-yellow-400/80',
          accent: 'yellow-300',
          gradient: 'from-yellow-600/60 to-yellow-700/80',
        },
      },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    tierNumber: 4,
    description: 'Adept Researcher League - Deep concept synthesis across multiple STEM fields.',
    badgeEmoji: '💠',
    promotionTopCount: 10,
    color: '#06b6d4',
    substages: [
      {
        id: 'platinum_3',
        stageId: 'platinum',
        stageName: 'Platinum',
        substageName: 'Platinum III',
        division: 'III',
        levelOrder: 10,
        minXp: 1500,
        maxXp: 1849,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-cyan-950/60 dark:bg-cyan-950/80',
          badgeText: 'text-cyan-400 dark:text-cyan-300',
          border: 'border-cyan-600/60',
          accent: 'cyan-400',
          gradient: 'from-cyan-800/60 to-cyan-900/80',
        },
      },
      {
        id: 'platinum_2',
        stageId: 'platinum',
        stageName: 'Platinum',
        substageName: 'Platinum II',
        division: 'II',
        levelOrder: 11,
        minXp: 1850,
        maxXp: 2199,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-cyan-900/60 dark:bg-cyan-900/80',
          badgeText: 'text-cyan-300 dark:text-cyan-200',
          border: 'border-cyan-500/70',
          accent: 'cyan-300',
          gradient: 'from-cyan-700/60 to-cyan-800/80',
        },
      },
      {
        id: 'platinum_1',
        stageId: 'platinum',
        stageName: 'Platinum',
        substageName: 'Platinum I',
        division: 'I',
        levelOrder: 12,
        minXp: 2200,
        maxXp: 2599,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-cyan-800/70 dark:bg-cyan-800/90',
          badgeText: 'text-cyan-200 dark:text-cyan-100',
          border: 'border-cyan-400/80',
          accent: 'cyan-200',
          gradient: 'from-cyan-600/60 to-cyan-700/80',
        },
      },
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    tierNumber: 5,
    description: 'Expert Analyst League - High velocity problem-solving and rigorous proofs.',
    badgeEmoji: '💎',
    promotionTopCount: 10,
    color: '#3b82f6',
    substages: [
      {
        id: 'diamond_3',
        stageId: 'diamond',
        stageName: 'Diamond',
        substageName: 'Diamond III',
        division: 'III',
        levelOrder: 13,
        minXp: 2600,
        maxXp: 3099,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-blue-950/60 dark:bg-blue-950/80',
          badgeText: 'text-blue-400 dark:text-blue-300',
          border: 'border-blue-600/60',
          accent: 'blue-400',
          gradient: 'from-blue-800/60 to-blue-900/80',
        },
      },
      {
        id: 'diamond_2',
        stageId: 'diamond',
        stageName: 'Diamond',
        substageName: 'Diamond II',
        division: 'II',
        levelOrder: 14,
        minXp: 3100,
        maxXp: 3699,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-blue-900/60 dark:bg-blue-900/80',
          badgeText: 'text-blue-300 dark:text-blue-200',
          border: 'border-blue-500/70',
          accent: 'blue-300',
          gradient: 'from-blue-700/60 to-blue-800/80',
        },
      },
      {
        id: 'diamond_1',
        stageId: 'diamond',
        stageName: 'Diamond',
        substageName: 'Diamond I',
        division: 'I',
        levelOrder: 15,
        minXp: 3700,
        maxXp: 4399,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-blue-800/70 dark:bg-blue-800/90',
          badgeText: 'text-blue-200 dark:text-blue-100',
          border: 'border-blue-400/80',
          accent: 'blue-200',
          gradient: 'from-blue-600/60 to-blue-700/80',
        },
      },
    ],
  },
  {
    id: 'master',
    name: 'Master',
    tierNumber: 6,
    description: 'Veteran Scholar League - Flawless multi-step reasoning and peer mentoring.',
    badgeEmoji: '🔮',
    promotionTopCount: 10,
    color: '#8b5cf6',
    substages: [
      {
        id: 'master_3',
        stageId: 'master',
        stageName: 'Master',
        substageName: 'Master III',
        division: 'III',
        levelOrder: 16,
        minXp: 4400,
        maxXp: 5199,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-purple-950/60 dark:bg-purple-950/80',
          badgeText: 'text-purple-400 dark:text-purple-300',
          border: 'border-purple-600/60',
          accent: 'purple-400',
          gradient: 'from-purple-800/60 to-purple-900/80',
        },
      },
      {
        id: 'master_2',
        stageId: 'master',
        stageName: 'Master',
        substageName: 'Master II',
        division: 'II',
        levelOrder: 17,
        minXp: 5200,
        maxXp: 6099,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-purple-900/60 dark:bg-purple-900/80',
          badgeText: 'text-purple-300 dark:text-purple-200',
          border: 'border-purple-500/70',
          accent: 'purple-300',
          gradient: 'from-purple-700/60 to-purple-800/80',
        },
      },
      {
        id: 'master_1',
        stageId: 'master',
        stageName: 'Master',
        substageName: 'Master I',
        division: 'I',
        levelOrder: 18,
        minXp: 6100,
        maxXp: 7099,
        promotionCutoffRank: 10,
        colorScheme: {
          badgeBg: 'bg-purple-800/70 dark:bg-purple-800/90',
          badgeText: 'text-purple-200 dark:text-purple-100',
          border: 'border-purple-400/80',
          accent: 'purple-200',
          gradient: 'from-purple-600/60 to-purple-700/80',
        },
      },
    ],
  },
  {
    id: 'grandmaster',
    name: 'Grandmaster',
    tierNumber: 7,
    description: 'Elite Theoretician League - Top 3 Weekly Promotion only!',
    badgeEmoji: '⚡',
    promotionTopCount: 3,
    color: '#ec4899',
    substages: [
      {
        id: 'grandmaster_3',
        stageId: 'grandmaster',
        stageName: 'Grandmaster',
        substageName: 'Grandmaster III',
        division: 'III',
        levelOrder: 19,
        minXp: 7100,
        maxXp: 8199,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-pink-950/60 dark:bg-pink-950/80',
          badgeText: 'text-pink-400 dark:text-pink-300',
          border: 'border-pink-600/60',
          accent: 'pink-400',
          gradient: 'from-pink-800/60 to-pink-900/80',
        },
      },
      {
        id: 'grandmaster_2',
        stageId: 'grandmaster',
        stageName: 'Grandmaster',
        substageName: 'Grandmaster II',
        division: 'II',
        levelOrder: 20,
        minXp: 8200,
        maxXp: 9399,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-pink-900/60 dark:bg-pink-900/80',
          badgeText: 'text-pink-300 dark:text-pink-200',
          border: 'border-pink-500/70',
          accent: 'pink-300',
          gradient: 'from-pink-700/60 to-pink-800/80',
        },
      },
      {
        id: 'grandmaster_1',
        stageId: 'grandmaster',
        stageName: 'Grandmaster',
        substageName: 'Grandmaster I',
        division: 'I',
        levelOrder: 21,
        minXp: 9400,
        maxXp: 10799,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-pink-800/70 dark:bg-pink-800/90',
          badgeText: 'text-pink-200 dark:text-pink-100',
          border: 'border-pink-400/80',
          accent: 'pink-200',
          gradient: 'from-pink-600/60 to-pink-700/80',
        },
      },
    ],
  },
  {
    id: 'challenger',
    name: 'Challenger',
    tierNumber: 8,
    description: 'Ascendant Vanguard League - Relentless pursuit of mathematical perfection. Top 3 promote.',
    badgeEmoji: '🔥',
    promotionTopCount: 3,
    color: '#f97316',
    substages: [
      {
        id: 'challenger_3',
        stageId: 'challenger',
        stageName: 'Challenger',
        substageName: 'Challenger III',
        division: 'III',
        levelOrder: 22,
        minXp: 10800,
        maxXp: 12299,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-orange-950/60 dark:bg-orange-950/80',
          badgeText: 'text-orange-400 dark:text-orange-300',
          border: 'border-orange-600/60',
          accent: 'orange-400',
          gradient: 'from-orange-800/60 to-orange-900/80',
        },
      },
      {
        id: 'challenger_2',
        stageId: 'challenger',
        stageName: 'Challenger',
        substageName: 'Challenger II',
        division: 'II',
        levelOrder: 23,
        minXp: 12300,
        maxXp: 13999,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-orange-900/60 dark:bg-orange-900/80',
          badgeText: 'text-orange-300 dark:text-orange-200',
          border: 'border-orange-500/70',
          accent: 'orange-300',
          gradient: 'from-orange-700/60 to-orange-800/80',
        },
      },
      {
        id: 'challenger_1',
        stageId: 'challenger',
        stageName: 'Challenger',
        substageName: 'Challenger I',
        division: 'I',
        levelOrder: 24,
        minXp: 14000,
        maxXp: 15999,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-orange-800/70 dark:bg-orange-800/90',
          badgeText: 'text-orange-200 dark:text-orange-100',
          border: 'border-orange-400/80',
          accent: 'orange-200',
          gradient: 'from-orange-600/60 to-orange-700/80',
        },
      },
    ],
  },
  {
    id: 'champion',
    name: 'Champion',
    tierNumber: 9,
    description: 'Paragon Laureate League - National benchmark mastery. Top 3 promote.',
    badgeEmoji: '👑',
    promotionTopCount: 3,
    color: '#e11d48',
    substages: [
      {
        id: 'champion_3',
        stageId: 'champion',
        stageName: 'Champion',
        substageName: 'Champion III',
        division: 'III',
        levelOrder: 25,
        minXp: 16000,
        maxXp: 18499,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-rose-950/60 dark:bg-rose-950/80',
          badgeText: 'text-rose-400 dark:text-rose-300',
          border: 'border-rose-600/60',
          accent: 'rose-400',
          gradient: 'from-rose-800/60 to-rose-900/80',
        },
      },
      {
        id: 'champion_2',
        stageId: 'champion',
        stageName: 'Champion',
        substageName: 'Champion II',
        division: 'II',
        levelOrder: 26,
        minXp: 18500,
        maxXp: 21499,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-rose-900/60 dark:bg-rose-900/80',
          badgeText: 'text-rose-300 dark:text-rose-200',
          border: 'border-rose-500/70',
          accent: 'rose-300',
          gradient: 'from-rose-700/60 to-rose-800/80',
        },
      },
      {
        id: 'champion_1',
        stageId: 'champion',
        stageName: 'Champion',
        substageName: 'Champion I',
        division: 'I',
        levelOrder: 27,
        minXp: 21500,
        maxXp: 24999,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-rose-800/70 dark:bg-rose-800/90',
          badgeText: 'text-rose-200 dark:text-rose-100',
          border: 'border-rose-400/80',
          accent: 'rose-200',
          gradient: 'from-rose-600/60 to-rose-700/80',
        },
      },
    ],
  },
  {
    id: 'legend',
    name: 'Legend',
    tierNumber: 10,
    description: 'Mythic Apex League - The pinnacle of global STEM intellect. Top 3 reign supreme.',
    badgeEmoji: '🌟',
    promotionTopCount: 3,
    color: '#a855f7',
    substages: [
      {
        id: 'legend_3',
        stageId: 'legend',
        stageName: 'Legend',
        substageName: 'Legend III',
        division: 'III',
        levelOrder: 28,
        minXp: 25000,
        maxXp: 29999,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-violet-950/70 dark:bg-violet-950/90',
          badgeText: 'text-violet-300 dark:text-violet-200',
          border: 'border-violet-500/70',
          accent: 'violet-300',
          gradient: 'from-violet-800/70 to-purple-900/90',
        },
      },
      {
        id: 'legend_2',
        stageId: 'legend',
        stageName: 'Legend',
        substageName: 'Legend II',
        division: 'II',
        levelOrder: 29,
        minXp: 30000,
        maxXp: 39999,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-purple-950/80 dark:bg-purple-950/90',
          badgeText: 'text-purple-300 dark:text-purple-200',
          border: 'border-purple-400/80',
          accent: 'purple-300',
          gradient: 'from-purple-800/70 to-indigo-900/90',
        },
      },
      {
        id: 'legend_1',
        stageId: 'legend',
        stageName: 'Legend',
        substageName: 'Legend I',
        division: 'I',
        levelOrder: 30,
        minXp: 40000,
        maxXp: 999999,
        promotionCutoffRank: 3,
        colorScheme: {
          badgeBg: 'bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20',
          badgeText: 'text-amber-300 font-extrabold',
          border: 'border-amber-400/90',
          accent: 'amber-400',
          gradient: 'from-amber-600/40 via-purple-600/40 to-pink-600/40',
        },
      },
    ],
  },
];

// Flat list of all 30 substages in sequential order (1 to 30)
export const ALL_SUBSTAGES: LeaderboardSubstage[] = LEADERBOARD_STAGES.flatMap(
  (stage) => stage.substages
);

/**
 * Determine a learner's stage & substage from their XP score
 */
export function calculateStageFromXp(xp: number): {
  stage: LeaderboardStage;
  substage: LeaderboardSubstage;
  nextSubstage?: LeaderboardSubstage;
  progressPercent: number;
} {
  const safeXp = Math.max(0, xp);
  let matchedSubstage = ALL_SUBSTAGES[0];

  for (let i = 0; i < ALL_SUBSTAGES.length; i++) {
    const s = ALL_SUBSTAGES[i];
    if (safeXp >= s.minXp && (safeXp <= s.maxXp || i === ALL_SUBSTAGES.length - 1)) {
      matchedSubstage = s;
      break;
    }
  }

  const stage = LEADERBOARD_STAGES.find((st) => st.id === matchedSubstage.stageId) || LEADERBOARD_STAGES[0];
  const nextSubstage = ALL_SUBSTAGES.find((s) => s.levelOrder === matchedSubstage.levelOrder + 1);

  let progressPercent = 100;
  if (nextSubstage) {
    const range = matchedSubstage.maxXp - matchedSubstage.minXp + 1;
    const gained = safeXp - matchedSubstage.minXp;
    progressPercent = Math.min(100, Math.max(0, Math.round((gained / range) * 100)));
  }

  return {
    stage,
    substage: matchedSubstage,
    nextSubstage,
    progressPercent,
  };
}

/**
 * Weekly promotion zone determination
 * - Ranks 1 to cutoff: PROMOTION ZONE
 * - Ranks cutoff+1 to (total - 3): SAFE ZONE
 * - Bottom 3 (if division allows demotion): RELEGATION ZONE
 */
export function getPromotionZoneInfo(rank: number, totalEntries: number, stageId: string): {
  zone: 'promotion' | 'safe' | 'demotion';
  label: string;
  badgeBg: string;
  badgeText: string;
  border: string;
} {
  const stage = LEADERBOARD_STAGES.find((s) => s.id === stageId) || LEADERBOARD_STAGES[0];
  const promoCutoff = stage.promotionTopCount; // 10 for Bronze-Master, 3 for Grandmaster-Legend

  if (rank <= promoCutoff) {
    return {
      zone: 'promotion',
      label: `Promotion Zone (Top ${promoCutoff}) 🚀`,
      badgeBg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
      badgeText: 'text-emerald-700 dark:text-emerald-300 font-bold',
      border: 'border-emerald-500/40',
    };
  }

  // If in bottom 3 and there are enough participants (> 8)
  if (totalEntries > 8 && rank > totalEntries - 3 && stage.tierNumber > 1) {
    return {
      zone: 'demotion',
      label: 'Demotion Risk ⚠️',
      badgeBg: 'bg-rose-500/15 dark:bg-rose-500/25',
      badgeText: 'text-rose-700 dark:text-rose-300 font-bold',
      border: 'border-rose-500/40',
    };
  }

  return {
    zone: 'safe',
    label: 'Safe Zone 🛡️',
    badgeBg: 'bg-slate-500/15 dark:bg-slate-500/20',
    badgeText: 'text-slate-600 dark:text-slate-400 font-medium',
    border: 'border-slate-300 dark:border-slate-700',
  };
}

/**
 * Returns hours and days until Sunday midnight UTC weekly league reset
 */
export function getWeeklyResetCountdown(): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 is Sunday
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
  
  const nextSunday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilSunday,
    23, 59, 59
  ));

  const diffMs = Math.max(0, nextSunday.getTime() - now.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;

  return { days, hours, minutes };
}
