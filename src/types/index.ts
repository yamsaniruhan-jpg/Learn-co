export * from './auth';
export * from './creator';
export * from './curriculum';
export * from './copilot';
export * from './mentorship';
export * from './planner';
export * from './analytics';

export type SubjectId = 'math' | 'cs' | 'physics' | 'chemistry' | 'biology';

export type DifficultyLevel = 'easy' | 'easy_medium' | 'medium' | 'medium_hard' | 'hard';

export type VerificationStatus = 'verified' | 'candidate' | 'flagged';

export type ResourceType = 'flashcards' | 'quiz' | 'summary' | 'mindmap' | 'slides';

export type UserRole = 'student' | 'educator' | 'admin';

export interface UserProfile {
  id: string;
  userId?: string;
  email: string;
  fullName: string;
  displayName?: string;
  avatarUrl: string;
  educationLevel?: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  dailyQuestionsSolvedToday: number;
  dailyAllowanceLimit: number;
  role: UserRole;
  targetExam?: string;
  targetScore?: string;
  examDate?: string;
  subjects?: SubjectId[];
  learningGoals?: string[];
  preferredStudyTimeMinutes?: number;
  weakTopics?: string[];
  studyTimeMinutesThisWeek: number;
  joinedDate: string;
  onboardingStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  timezone?: string;
  bio?: string;
  institution?: string;
}

export interface Subject {
  id: SubjectId;
  name: string;
  iconName: string;
  description: string;
  color: string;
  courseCount: number;
  conceptCount: number;
  masteryPercentage: number;
}

export interface Course {
  id: string;
  subjectId: SubjectId;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  chaptersCount: number;
  estimatedHours: number;
  iconName: string;
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  sequenceOrder: number;
  topicsCount: number;
}

export interface Topic {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  conceptsCount: number;
  masteryPercentage: number;
}

export interface ConceptCard {
  id: string;
  type: 'intuition' | 'derivation' | 'code' | 'visualization' | 'check';
  title: string;
  content: string;
  formula?: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  interactiveWidget?: 'sign_chart' | 'learning_rate_sim' | 'energy_bar' | 'molecule_reaction';
  checkQuestion?: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface Concept {
  id: string;
  topicId: string;
  subjectId: SubjectId;
  title: string;
  summary: string;
  difficulty: DifficultyLevel;
  xpReward: number;
  cards: ConceptCard[];
  prerequisites: string[];
  estimatedMinutes: number;
}

export interface Question {
  id: string;
  subjectId: SubjectId;
  courseId: string;
  topicId: string;
  conceptId: string;
  difficulty: DifficultyLevel;
  verificationStatus: VerificationStatus;
  questionType: 'multiple_choice' | 'numerical' | 'conceptual';
  questionText: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  stepByStepSolution?: string[];
  hints: string[];
  tags: string[];
  source: string;
  createdByAi: boolean;
}

export interface QuestionAttempt {
  id: string;
  questionId: string;
  subjectId: SubjectId;
  topicId: string;
  conceptId?: string;
  isCorrect: boolean;
  userAnswer: string | number;
  timeSpentSeconds: number;
  xpAwarded: number;
  hintsRevealed: number;
  timestamp: string;
  questionText: string;
  correctAnswerText: string;
  explanation: string;
}

export interface ConceptMastery {
  conceptId: string;
  conceptTitle: string;
  subjectId: SubjectId;
  masteryScore: number; // 0 - 100
  attemptsCount: number;
  correctCount: number;
  lastPracticedAt: string;
  retentionStrength: number; // 0 - 100
  isWeakArea: boolean;
}

export interface GeneratedResource {
  id: string;
  title: string;
  sourceType: 'text' | 'pdf' | 'url';
  resourceType: ResourceType;
  createdAt: string;
  content: {
    flashcards?: Array<{ question: string; answer: string }>;
    quiz?: Array<{ question: string; options: string[]; answerIndex: number; explanation: string }>;
    summary?: string;
    mindmap?: Array<{ node: string; parent?: string; details?: string }>;
    slides?: Array<{ slideTitle: string; bullets: string[]; notes: string }>;
  };
}

export interface StudyPlanSession {
  id: string;
  title: string;
  subjectId: SubjectId;
  topicTitle: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "16:00"
  durationMinutes: number;
  isCompleted: boolean;
  isMissed?: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface NotificationItem {
  id: string;
  type: 'reminder' | 'achievement' | 'streak_warning' | 'mentor_prescription' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'mastery' | 'streak' | 'practice' | 'creation' | 'copilot';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}
