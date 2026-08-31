import { SubjectId } from './index';

export type StudyTaskType =
  | 'LEARN_CONCEPT'
  | 'READ_NOTES'
  | 'PRACTICE_QUESTIONS'
  | 'REVIEW_MISTAKES'
  | 'REVISION'
  | 'FLASHCARDS'
  | 'QUIZ'
  | 'WORKSHEET'
  | 'MIND_MAP'
  | 'CREATOR_RESOURCE_REVIEW'
  | 'MENTORSHIP_TASK';

export type StudyTaskStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'RESCHEDULED';

export type StudyTaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ARCHIVED';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface UnavailablePeriod {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason?: string;
}

export interface StudyScheduleSettings {
  userId: string;
  availableDays: DayOfWeek[];
  dailyAvailableMinutes: number;
  preferredStartTime: string; // e.g. "18:00"
  preferredEndTime: string; // e.g. "20:00"
  preferredSessionLength: number; // e.g. 30, 45, 60 mins
  breakDurationMinutes: number;
  unavailablePeriods: UnavailablePeriod[];
  autoRescheduleMissed: boolean;
  reminderNotifications: boolean;
  reminderMinutesBefore: number;
  targetExamTrack?: string;
}

export interface StudyGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetExam?: string;
  targetScore?: string;
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  subjects: SubjectId[];
  topics: string[];
  progressPercent: number; // 0 - 100
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudyTask {
  id: string;
  planId?: string;
  userId: string;
  goalId?: string;
  title: string;
  description?: string;
  taskType: StudyTaskType;
  subjectId: SubjectId;
  chapterId?: string;
  topicId?: string;
  conceptId?: string;
  conceptTitle?: string;
  creatorResourceId?: string;
  creatorResourceTitle?: string;
  mentorshipTaskId?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledStartTime?: string; // HH:mm
  scheduledEndTime?: string; // HH:mm
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  priority: StudyTaskPriority;
  status: StudyTaskStatus;
  completedAt?: string;
  practiceQuestionCount?: number; // Must not exceed daily limit
  isSpacedRevision?: boolean;
  revisionCycle?: number;
  manualProgress?: number; // 0 - 100 manually input by user
  measuredProgress?: number; // 0 - 100 computed from real activity
  notes?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlan {
  id: string;
  userId: string;
  title: string;
  description?: string;
  goalIds: string[];
  subjects: SubjectId[];
  startDate: string;
  targetEndDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  version: number;
  totalTasksCount: number;
  completedTasksCount: number;
  totalEstimatedHours: number;
  completedHours: number;
  aiGenerated: boolean;
  generationPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlanVersion {
  id: string;
  planId: string;
  userId: string;
  version: number;
  title: string;
  changeSummary: string;
  snapshot: {
    plan: StudyPlan;
    tasks: StudyTask[];
    scheduleSettings?: StudyScheduleSettings;
  };
  createdAt: string;
  createdBy: 'USER' | 'AI';
}

export interface StudyActiveSession {
  id: string;
  userId: string;
  taskId?: string;
  title: string;
  subjectId: SubjectId;
  topicTitle?: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  completed: boolean;
  notes?: string;
}

export interface PlannerAnalytics {
  totalPlannedMinutes: number;
  completedMinutes: number;
  plannedTasksCount: number;
  completedTasksCount: number;
  completionRatePercent: number;
  consistencyStreakDays: number;
  overdueTasksCount: number;
  subjectBreakdown: Record<SubjectId, { plannedMinutes: number; completedMinutes: number; tasksCount: number }>;
  dailyWorkloadForecast: Array<{
    date: string;
    totalMinutes: number;
    tasksCount: number;
    isOverloaded: boolean;
  }>;
  weakAreaTasksCount: number;
  spacedRevisionTasksCount: number;
}

export interface ScheduleConflict {
  id: string;
  conflictType:
    | 'OVERLAPPING_TIME'
    | 'EXCEEDS_DAILY_LIMIT'
    | 'QUESTION_QUOTA_EXCEEDED'
    | 'UNAVAILABLE_DAY'
    | 'DEADLINE_IMPOSSIBLE';
  date: string;
  severity: 'WARNING' | 'ERROR';
  description: string;
  conflictingTaskIds: string[];
  suggestedResolution?: string;
}

export interface PlanGenerationInput {
  goalTitle: string;
  targetExamTrack: string;
  subjects: SubjectId[];
  targetDate: string;
  dailyAvailableMinutes: number;
  preferredStartTime: string;
  availableDays: DayOfWeek[];
  preferredSessionLength: number;
  priorityTopics?: string[];
  includeWeakMistakeRemediation?: boolean;
  includeSpacedRevision?: boolean;
  customPrompt?: string;
}

export interface PlannerAdaptationRecommendation {
  id: string;
  title: string;
  reason: string;
  type: 'RESCHEDULE_MISSED' | 'REINFORCE_WEAK_AREA' | 'LIGHTEN_LOAD' | 'ACCELERATE_PACING';
  impactDescription: string;
  suggestedAction: {
    taskIdsToMove?: string[];
    newTargetDates?: Record<string, string>;
    newTasksToInsert?: Partial<StudyTask>[];
  };
}
