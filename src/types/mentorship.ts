import { SubjectId } from './auth';

export type MentorshipCadence = 'weekly' | 'biweekly' | 'on_demand';

export type MentorshipRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';

export type MentorshipRelationshipStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'SUSPENDED';

export type MentorshipGoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';

export type MentorshipTaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export type MentorshipSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED';

export type MentorshipFormat = 'one_on_one' | 'async_review' | 'weekly_checkin';

export interface MentorAvailability {
  days: string[];
  timeSlots: string[];
  timezone: string;
  cadence: MentorshipCadence;
}

export interface MentorProfile {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string;
  headline: string;
  bio: string;
  subjects: SubjectId[];
  areasOfExpertise: string[];
  teachingExperienceYears: number;
  education: string;
  credentials: string[];
  supportedTracks: string[];
  availability: MentorAvailability;
  mentoringStyle: string;
  languages: string[];
  isVerified: boolean;
  acceptingNewMentees: boolean;
  maxMentees: number;
  activeMenteesCount: number;
  rating: number; // e.g. 4.9
  reviewCount: number;
  sessionsCompleted: number;
  responseRatePercent: number;
  format: MentorshipFormat[];
  pricingType: 'free_community' | 'pro_scholar';
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipPrivacySettings {
  shareMasteryProgress: boolean; // Concept masteries & completion percentage
  sharePracticeActivity: boolean; // Daily practice counts, streak, accuracy
  shareMistakesAndMisconceptions: boolean; // Recorded diagnostic gaps
  shareActiveGoals: boolean; // Active goals & targets
  shareCreatorStudioNotebooks: boolean; // Default false (private)
  shareCopilotSessions: boolean; // Default false (strictly private)
}

export interface MentorshipRequest {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerAvatar: string;
  learnerTargetExam?: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar: string;
  subjectId: SubjectId;
  targetTrack: string;
  goalDescription: string;
  initialMessage: string;
  preferredCadence: MentorshipCadence;
  status: MentorshipRequestStatus;
  mentorResponseNote?: string;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}

export interface MentorshipRelationship {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerAvatar: string;
  learnerEmail?: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar: string;
  mentorHeadline?: string;
  status: MentorshipRelationshipStatus;
  subjectId: SubjectId;
  targetTrack: string;
  startDate: string;
  lastInteractionDate: string;
  agreedCadence: MentorshipCadence;
  privacySettings: MentorshipPrivacySettings;
  notesCount: number;
  sessionsCount: number;
  goalsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipGoal {
  id: string;
  mentorshipId: string;
  learnerId: string;
  mentorId: string;
  subjectId: SubjectId;
  title: string;
  description: string;
  targetDate: string;
  linkedTopicId?: string;
  linkedConceptId?: string;
  status: MentorshipGoalStatus;
  progressPercent: number;
  establishedBy: 'learner' | 'mentor' | 'copilot_suggested';
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipTask {
  id: string;
  mentorshipId: string;
  learnerId: string;
  mentorId: string;
  title: string;
  description: string;
  dueDate: string;
  status: MentorshipTaskStatus;
  subjectId: SubjectId;
  linkedTopicId?: string;
  linkedResource?: {
    type: 'learning_concept' | 'creator_resource' | 'practice_drill';
    id: string;
    title: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface MentorshipSession {
  id: string;
  mentorshipId: string;
  learnerId: string;
  mentorId: string;
  title: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM (e.g. "17:00")
  durationMinutes: number; // e.g. 45
  status: MentorshipSessionStatus;
  topicsCovered: string[];
  inPlatformMeetingId: string;
  sharedNotes: string;
  privateMentorNotes: string;
  actionItemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipMessageAttachment {
  type: 'creator_note' | 'creator_quiz' | 'learning_concept' | 'goal' | 'task';
  id: string;
  title: string;
  snippet?: string;
}

export interface MentorshipMessage {
  id: string;
  mentorshipId: string;
  senderId: string;
  senderRole: 'learner' | 'mentor' | 'ai_assistant';
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  content: string;
  attachedResource?: MentorshipMessageAttachment;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface MentorshipFeedback {
  id: string;
  mentorshipId: string;
  sessionId?: string;
  giverId: string;
  giverName: string;
  giverRole: 'learner' | 'mentor';
  receiverId: string;
  overallRating: number; // 1 to 5
  pedagogicalClarityRating: number; // 1 to 5
  responsivenessRating: number; // 1 to 5
  domainMasteryRating: number; // 1 to 5
  feedbackText: string;
  isAnonymous: boolean;
  isPublicOnProfile: boolean;
  createdAt: string;
}

export interface MentorshipReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  mentorshipId?: string;
  reason: 'inappropriate_conduct' | 'harassment' | 'unsolicited_off_platform' | 'spam_abuse' | 'other';
  details: string;
  status: 'PENDING_REVIEW' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  adminResolutionNotes?: string;
  createdAt: string;
}

export interface MentorMatchRecommendation {
  mentor: MentorProfile;
  matchScore: number; // 0 - 100
  matchReasons: string[];
  sharedSubjects: SubjectId[];
  matchingTargetTrack: boolean;
  availabilityAlignment: string;
}

export interface AuthorizedLearnerInsights {
  learnerId: string;
  learnerName: string;
  learnerAvatar: string;
  targetExam: string;
  targetScore: string;
  studyTimeThisWeek: number;
  currentStreak: number;
  privacy: MentorshipPrivacySettings;
  // Included only if authorized
  masteryHighlights?: {
    strongConcepts: Array<{ id: string; title: string; score: number; subjectId: SubjectId }>;
    weakConcepts: Array<{ id: string; title: string; score: number; subjectId: SubjectId }>;
    averageRetention: number;
  };
  practiceActivity?: {
    totalAttempted: number;
    accuracyPercentage: number;
    dailyStreak: number;
    recentAccuracyTrend: number[];
  };
  mistakeDiagnostics?: Array<{
    id: string;
    topicId: string;
    subjectId: SubjectId;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
    resolved: boolean;
    date: string;
  }>;
  activeGoals?: MentorshipGoal[];
}
