export const XP_PER_CORRECT_QUESTION = 5;
export const XP_PER_INCORRECT_QUESTION = 0;
export const XP_PER_ABANDONED_QUESTION = 0;

export const DAILY_PRACTICE_LIMIT = 25;

export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type UserRole = 'student' | 'educator' | 'admin';

export type SubjectId = 'math' | 'cs' | 'physics' | 'chemistry' | 'biology';

export type DifficultyLevel = 'easy' | 'easy_medium' | 'medium' | 'medium_hard' | 'hard';

export type VerificationStatus = 'verified' | 'candidate' | 'flagged';

export type AttemptStatus = 'STARTED' | 'SUBMITTED' | 'CORRECT' | 'INCORRECT' | 'ABANDONED';

export type TimeframeFilter = 'daily' | 'weekly' | 'monthly' | 'all_time';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash?: string;
  authProvider: 'email' | 'google';
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  displayName?: string;
  avatarUrl: string;
  educationLevel: string;
  targetExam: string;
  targetScore: string;
  examDate: string;
  subjects: SubjectId[];
  learningGoals: string[];
  preferredStudyTimeMinutes: number;
  studyTimeMinutesThisWeek: number;
  role: UserRole;
  onboardingStatus: OnboardingStatus;
  timezone: string;
  joinedDate: string;
  bio?: string;
  institution?: string;
}

export interface UserGamification {
  userId: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD in user timezone
  dailyQuestionsSolvedToday: number;
  dailyAllowanceLimit: number;
}

export interface UserSettings {
  userId: string;
  theme: ThemePreference;
  notifications: {
    studyReminders: boolean;
    streakAlerts: boolean;
    achievementAlerts: boolean;
    mentorAlerts: boolean;
    copilotAlerts: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'cohort' | 'private';
    leaderboardVisibility: boolean;
    analyticsSharing: boolean;
  };
  learningPreferences: {
    socraticGuidanceLevel: 'high' | 'medium' | 'low';
    showDetailedDerivations: boolean;
    timerVisible: boolean;
    soundEffects: boolean;
  };
}

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: 'QUESTION_CORRECT' | 'CONCEPT_COMPLETED' | 'STREAK_BONUS' | 'INITIAL_BONUS';
  relatedAttemptId?: string;
  relatedConceptId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface QuestionAttemptRecord {
  id: string;
  userId: string;
  questionId: string;
  subjectId: SubjectId;
  topicId: string;
  subtopicId?: string;
  conceptId?: string;
  difficulty: DifficultyLevel;
  selectedAnswer: string | number;
  correctAnswer: string | number;
  isCorrect: boolean;
  solvingTimeSeconds: number;
  hintsRevealedCount: number;
  startedAt: string;
  submittedAt: string;
  status: AttemptStatus;
  xpAwarded: number;
  questionText: string;
  explanation: string;
  stepByStepSolution?: string[];
}

export interface SubmitAttemptRequest {
  attemptId: string;
  questionId: string;
  subjectId: SubjectId;
  topicId: string;
  difficulty: DifficultyLevel;
  questionText: string;
  selectedAnswer: string | number;
  correctAnswer: string | number;
  explanation: string;
  stepByStepSolution?: string[];
  solvingTimeSeconds: number;
  hintsRevealedCount: number;
}

export interface SubmitAttemptResult {
  isCorrect: boolean;
  xpAwarded: number;
  newTotalXp: number;
  newLevel: number;
  currentStreak: number;
  longestStreak: number;
  dailyQuestionsSolvedToday: number;
  isDailyLimitReached: boolean;
  quota: DailyPracticeQuota;
  attempt: QuestionAttemptRecord;
  mistakeRecorded: boolean;
}

export interface MistakeRecord {
  id: string;
  userId: string;
  attemptId: string;
  questionId: string;
  subjectId: SubjectId;
  topicId: string;
  subtopicId?: string;
  conceptId?: string;
  difficulty: DifficultyLevel;
  questionText: string;
  userAnswer: string | number;
  correctAnswer: string | number;
  explanation: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface UserStatistics {
  userId: string;
  totalAttempts: number;
  completedAttempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  abandonedCount: number;
  accuracyPercentage: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyTimeMinutes: number;
  subjectBreakdown: Record<SubjectId, {
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
  recentActivity: Array<{
    date: string;
    questionsSolved: number;
    xpEarned: number;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string;
  xp: number;
  level: number;
  streak: number;
  isCurrentUser?: boolean;
}

export interface DailyPracticeQuota {
  questionsSolvedToday: number;
  dailyLimit: number;
  remaining: number;
  isLimitReached: boolean;
  resetsAt: string; // ISO timestamp of next local midnight
}

/**
 * Progression Level Formula:
 * Level 1: 0 - 24 XP
 * Level 2: 25 - 99 XP
 * Level 3: 100 - 224 XP
 * Level 4: 225 - 399 XP
 * Level 5: 400 - 624 XP
 * Formula: Level = Math.floor(Math.sqrt(XP / 25)) + 1
 */
export function calculateLevelFromXp(xp: number): {
  level: number;
  currentLevelMinXp: number;
  nextLevelMinXp: number;
  progressPercent: number;
  xpRemainingToNextLevel: number;
} {
  const safeXp = Math.max(0, xp);
  const level = Math.max(1, Math.floor(Math.sqrt(safeXp / 25)) + 1);
  const currentLevelMinXp = (level - 1) * (level - 1) * 25;
  const nextLevelMinXp = level * level * 25;
  const range = Math.max(1, nextLevelMinXp - currentLevelMinXp);
  const progressPercent = Math.min(100, Math.max(0, ((safeXp - currentLevelMinXp) / range) * 100));
  const xpRemainingToNextLevel = Math.max(0, nextLevelMinXp - safeXp);

  return {
    level,
    currentLevelMinXp,
    nextLevelMinXp,
    progressPercent: Math.round(progressPercent),
    xpRemainingToNextLevel,
  };
}
