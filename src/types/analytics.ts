import { SubjectId, DifficultyLevel, ExamTrackId, QuestionTypeId } from './curriculum';
import { UserStatistics, MistakeRecord } from './auth';

export type MasteryLabel =
  | 'NOT_STARTED'
  | 'LEARNING'
  | 'DEVELOPING'
  | 'STRONG'
  | 'MASTERED'
  | 'PROFICIENT'
  | 'FAMILIAR'
  | 'DECAYED';

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type RevisionStatus =
  | 'UP_TO_DATE'
  | 'NEEDS_REVISION'
  | 'OVERDUE'
  | 'CRITICAL_DECAY';

export type DecayRisk = 'low' | 'moderate' | 'high' | 'critical';

export interface ConceptMasteryEstimate {
  conceptId: string;
  conceptTitle: string;
  chapterId?: string;
  chapterTitle?: string;
  topicId: string;
  topicTitle?: string;
  subjectId: SubjectId;
  masteryScore: number; // 0 - 100
  masteryLabel: MasteryLabel;
  accuracy: number | null; // null if no attempts yet (never fake 0%)
  attemptsCount: number;
  correctCount: number;
  incorrectCount: number;
  confidenceLevel: ConfidenceLevel;
  difficultyResilience?: number; // 0 - 100
  recentPerformanceScore: number; // score from recent attempts
  practiceFrequencyDays: number;
  mistakeFrequencyCount: number;
  revisionStatus: RevisionStatus;
  retentionStrength: number; // 0 - 100
  recencyFactor?: number; // 0 - 100
  lastPracticedAt: string | null;
  isWeakArea: boolean;
  isPrerequisiteBlocked: boolean;
  blockedPrerequisites: Array<{ id: string; title: string; subjectId: SubjectId }>;
  difficulty: DifficultyLevel;
}

export interface TopicAnalyticsDetail {
  topicId: string;
  topicTitle: string;
  chapterId: string;
  chapterTitle: string;
  subjectId: SubjectId;
  attemptsCount: number;
  accuracy: number | null;
  masteryScore: number;
  masteryLabel: MasteryLabel;
  concepts: ConceptMasteryEstimate[];
  mistakesCount: number;
  unresolvedMistakesCount: number;
  lastPracticedAt: string | null;
  decayRisk: DecayRisk;
}

export interface SubjectAnalyticsSummary {
  subjectId: SubjectId;
  name: string;
  color: string;
  totalAttempts: number;
  accuracyPercentage: number | null;
  masteryPercentage: number;
  totalConceptCount?: number;
  masteredConceptCount?: number;
  conceptsTracked: number;
  conceptsMastered: number;
  conceptsDeveloping: number;
  conceptsWeak: number;
  strongTopics: string[];
  developingTopics: string[];
  weakTopics: string[];
  recentActivityCount: number;
  improvementTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
  decayRiskCount: number;
}

export interface MistakeAnalyticsSummary {
  totalMistakes: number;
  unresolvedCount: number;
  resolvedCount: number;
  remediationRate?: number;
  repeatedMistakeConcepts: Array<{
    conceptId: string;
    conceptTitle: string;
    subjectId: SubjectId;
    topicId: string;
    mistakeCount: number;
    lastOccurredAt: string;
  }>;
  subjectBreakdown: Record<SubjectId, number>;
  difficultyDistribution: Record<DifficultyLevel, number>;
  questionTypeDistribution: Record<string, number>;
  frequentTrapTypes: string[];
}

export interface ExamReadinessEstimate {
  examTrack: ExamTrackId;
  examTrackId?: ExamTrackId;
  examName: string;
  estimatedReadinessScore: number; // 0 - 100
  readinessBand: 'FOUNDATIONAL' | 'DEVELOPING' | 'COMPETITIVE' | 'HIGH_CONFIDENCE' | 'BENCHMARK_READY';
  syllabusCoveragePercent: number;
  conceptMasteryPercent: number;
  practiceVolumeScore: number;
  accuracyScore: number | null;
  difficultyTierDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  revisionConsistencyScore: number;
  keyStrengthAreas: string[];
  criticalGaps: string[];
  projectedPacingDaysRemaining: number | null;
  summaryNarrative: string;
}

export type ActionType =
  | 'PRACTICE_CONCEPT'
  | 'REMEDIATE_MISTAKE'
  | 'REVISE_DECAY'
  | 'COMPLETE_PLANNER_TASK'
  | 'EXPLORE_PREREQUISITE'
  | 'SOCRATIC_CONSULT'
  | 'CREATOR_RESOURCE_STUDY';

export interface NextBestAction {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  explanation: string; // Plain-English explainable rationale based on authoritative signals
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  priorityScore: number; // 0 - 100
  subjectId: SubjectId;
  topicId?: string;
  conceptId?: string;
  questionId?: string;
  taskId?: string;
  resourceId?: string;
  estimatedMinutes: number;
  xpReward: number;
  actionTarget: {
    tab: string;
    context?: Record<string, any>;
  };
}

export interface ProgressTrendPoint {
  date: string; // YYYY-MM-DD or formatted date
  label: string;
  questionsSolved: number;
  questionsAttempted?: number;
  correctCount?: number;
  masteredConceptsCumulative?: number;
  accuracy: number | null;
  cumulativeXp: number;
  avgMasteryScore: number;
  tasksCompleted: number;
  timeSpentMinutes: number;
}

export interface LearnerAnalyticsDashboardData {
  userStatistics: UserStatistics;
  overallMasteryScore: number;
  overallAccuracy: number | null;
  totalAttemptsCount: number;
  masterySummary: {
    totalTracked: number;
    masteredCount: number;
    developingCount: number;
    weakCount: number;
    notStartedCount: number;
    avgMasteryScore: number;
    overallAccuracy: number | null;
  };
  subjectSummaries: SubjectAnalyticsSummary[];
  nextBestActions: NextBestAction[];
  mistakeAnalytics: MistakeAnalyticsSummary;
  mistakeSummary: MistakeAnalyticsSummary;
  examReadiness: ExamReadinessEstimate;
  topicDetails?: TopicAnalyticsDetail[];
  masteryList?: ConceptMasteryEstimate[];
  recentMistakes?: MistakeRecord[];
  progressTrends: {
    daily: ProgressTrendPoint[];
    weekly: ProgressTrendPoint[];
    monthly: ProgressTrendPoint[];
  };
  isColdStart: boolean;
  generatedAt: string;
}
