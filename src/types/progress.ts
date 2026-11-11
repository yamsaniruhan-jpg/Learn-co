// src/types/progress.ts

export interface QuizScoreEntry {
  quizId: string;
  score: number;
  date: string;
}

export interface CourseProgressRecord {
  courseId: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  currentLesson: string;
  lastStudied: string; // ISO timestamp or Firestore timestamp
  streakDays: number;
  quizScores: QuizScoreEntry[];
  weakTopics: string[];
  strongTopics: string[];
  timeSpentMinutes: number;
}

export interface SpacedRepetitionCardRecord {
  id?: string;
  cardId?: string;
  topic: string;
  question: string;
  answer: string;
  easeFactor: number; // default: 2.5
  interval: number; // days, default: 1
  repetitions: number; // default: 0
  nextReview: string; // ISO timestamp
  lastReviewed: string; // ISO timestamp
}
