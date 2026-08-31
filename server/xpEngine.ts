import {
  Database,
  withUserLock,
  getDateInTimezone,
} from './db';
import {
  DAILY_PRACTICE_LIMIT,
  XP_PER_CORRECT_QUESTION,
  XP_PER_INCORRECT_QUESTION,
  XP_PER_ABANDONED_QUESTION,
  QuestionAttemptRecord,
  MistakeRecord,
  XPTransaction,
  calculateLevelFromXp,
  DailyPracticeQuota,
} from '../src/types/auth';

export interface SubmitAttemptRequest {
  attemptId: string;
  questionId: string;
  subjectId: 'math' | 'cs' | 'physics' | 'chemistry' | 'biology';
  topicId: string;
  subtopicId?: string;
  conceptId?: string;
  difficulty: 'easy' | 'easy_medium' | 'medium' | 'medium_hard' | 'hard';
  questionText: string;
  selectedAnswer: string | number;
  correctAnswer: string | number;
  explanation: string;
  stepByStepSolution?: string[];
  solvingTimeSeconds: number;
  hintsRevealedCount: number;
}

export interface SubmitAttemptResult {
  attempt: QuestionAttemptRecord;
  isCorrect: boolean;
  xpAwarded: number;
  newTotalXp: number;
  newLevel: number;
  currentStreak: number;
  longestStreak: number;
  dailyQuestionsSolvedToday: number;
  dailyAllowanceRemaining: number;
  quota: DailyPracticeQuota;
  mistakeRecorded: boolean;
  xpTransaction?: XPTransaction;
}

export class XpEngine {
  /**
   * Get authoritative daily quota for user
   */
  static getDailyQuota(userId: string): DailyPracticeQuota {
    const profile = Database.getProfile(userId);
    const gam = Database.getGamification(userId);

    const userTimezone = profile?.timezone || 'UTC';
    const today = getDateInTimezone(userTimezone);

    let questionsSolvedToday = 0;
    if (gam) {
      if (gam.lastActiveDate === today) {
        questionsSolvedToday = gam.dailyQuestionsSolvedToday;
      } else {
        // New calendar day in user timezone
        questionsSolvedToday = 0;
      }
    }

    const remaining = Math.max(0, DAILY_PRACTICE_LIMIT - questionsSolvedToday);
    const isLimitReached = remaining === 0;

    // Calculate next local midnight ISO string
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);

    return {
      questionsSolvedToday,
      dailyLimit: DAILY_PRACTICE_LIMIT,
      remaining,
      isLimitReached,
      resetsAt: tomorrow.toISOString(),
    };
  }

  /**
   * Process a question practice attempt with server-side validation, mutex locks,
   * quota enforcement, +5 XP rule, streak update, and mistake archiving.
   */
  static async submitAttempt(
    userId: string,
    req: SubmitAttemptRequest
  ): Promise<SubmitAttemptResult> {
    return withUserLock(userId, async () => {
      const db = Database.getDb();
      const profile = Database.getProfile(userId);
      const gam = Database.getGamification(userId);

      if (!profile || !gam) {
        throw new Error('User profile or gamification record not found.');
      }

      // Check for Idempotency / Duplicate Replay Prevention
      if (db.attemptsById[req.attemptId]) {
        const existingAttempt = db.attemptsById[req.attemptId];
        const quota = this.getDailyQuota(userId);
        return {
          attempt: existingAttempt,
          isCorrect: existingAttempt.isCorrect,
          xpAwarded: 0, // Duplicate submissions award 0 XP
          newTotalXp: gam.xp,
          newLevel: gam.level,
          currentStreak: gam.currentStreak,
          longestStreak: gam.longestStreak,
          dailyQuestionsSolvedToday: gam.dailyQuestionsSolvedToday,
          dailyAllowanceRemaining: Math.max(0, DAILY_PRACTICE_LIMIT - gam.dailyQuestionsSolvedToday),
          quota,
          mistakeRecorded: false,
        };
      }

      const userTimezone = profile.timezone || 'UTC';
      const todayDateStr = getDateInTimezone(userTimezone);

      // Reset count if it's a new day in user's timezone
      if (gam.lastActiveDate !== todayDateStr) {
        gam.dailyQuestionsSolvedToday = 0;
      }

      // 1. Enforce Server-Side Daily Practice Limit (Max 25 questions per day)
      if (gam.dailyQuestionsSolvedToday >= DAILY_PRACTICE_LIMIT) {
        const err: any = new Error(
          `Daily practice limit of ${DAILY_PRACTICE_LIMIT} questions reached for today. Take a break and return tomorrow!`
        );
        err.statusCode = 429;
        err.code = 'DAILY_LIMIT_REACHED';
        throw err;
      }

      // 2. Validate Question Correctness
      const userAnsStr = String(req.selectedAnswer).trim().toLowerCase();
      const correctAnsStr = String(req.correctAnswer).trim().toLowerCase();
      const isCorrect = userAnsStr === correctAnsStr;

      // 3. Exact Learn.co XP Rule:
      // Correct = +5 XP
      // Incorrect = 0 XP
      const xpAwarded = isCorrect ? XP_PER_CORRECT_QUESTION : XP_PER_INCORRECT_QUESTION;

      const now = new Date().toISOString();

      // 4. Record Authoritative Question Attempt
      const attemptRecord: QuestionAttemptRecord = {
        id: req.attemptId,
        userId,
        questionId: req.questionId,
        subjectId: req.subjectId,
        topicId: req.topicId,
        subtopicId: req.subtopicId,
        conceptId: req.conceptId,
        difficulty: req.difficulty,
        selectedAnswer: req.selectedAnswer,
        correctAnswer: req.correctAnswer,
        isCorrect,
        solvingTimeSeconds: req.solvingTimeSeconds || 0,
        hintsRevealedCount: req.hintsRevealedCount || 0,
        startedAt: new Date(Date.now() - (req.solvingTimeSeconds || 0) * 1000).toISOString(),
        submittedAt: now,
        status: isCorrect ? 'CORRECT' : 'INCORRECT',
        xpAwarded,
        questionText: req.questionText,
        explanation: req.explanation,
        stepByStepSolution: req.stepByStepSolution,
      };

      db.questionAttempts.unshift(attemptRecord);
      db.attemptsById[req.attemptId] = attemptRecord;

      // 5. Create Auditable XP Transaction
      let xpTx: XPTransaction | undefined;
      if (xpAwarded > 0) {
        xpTx = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId,
          amount: xpAwarded,
          reason: 'QUESTION_CORRECT',
          relatedAttemptId: req.attemptId,
          metadata: {
            questionId: req.questionId,
            subjectId: req.subjectId,
          },
          timestamp: now,
        };
        db.xpTransactions.unshift(xpTx);
      }

      // 6. Update Gamification (XP, Level, Streak, Quota)
      gam.xp += xpAwarded;
      const { level } = calculateLevelFromXp(gam.xp);
      gam.level = level;
      gam.dailyQuestionsSolvedToday += 1;

      // Authoritative Streak Calculation
      if (!gam.lastActiveDate) {
        // First ever qualifying activity starts streak
        gam.currentStreak = 1;
        gam.longestStreak = Math.max(gam.longestStreak, 1);
      } else if (gam.lastActiveDate === todayDateStr) {
        // Same calendar day: do not increment streak again
        // Streak remains unchanged
      } else {
        // Calculate difference in calendar days
        const lastDate = new Date(gam.lastActiveDate);
        const curDate = new Date(todayDateStr);
        const diffDays = Math.round((curDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive calendar day -> Streak increments
          gam.currentStreak += 1;
          gam.longestStreak = Math.max(gam.longestStreak, gam.currentStreak);
        } else if (diffDays > 1) {
          // Missed one or more days -> Streak resets to 1
          gam.currentStreak = 1;
        }
      }

      gam.lastActiveDate = todayDateStr;

      // 7. Mistake Tracking (If incorrect answer)
      let mistakeRecorded = false;
      if (!isCorrect) {
        const mistake: MistakeRecord = {
          id: `mistake-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId,
          attemptId: req.attemptId,
          questionId: req.questionId,
          subjectId: req.subjectId,
          topicId: req.topicId,
          subtopicId: req.subtopicId,
          conceptId: req.conceptId,
          difficulty: req.difficulty,
          questionText: req.questionText,
          userAnswer: req.selectedAnswer,
          correctAnswer: req.correctAnswer,
          explanation: req.explanation,
          resolved: false,
          createdAt: now,
        };
        db.mistakes.unshift(mistake);
        mistakeRecorded = true;
      }

      const quota = this.getDailyQuota(userId);

      return {
        attempt: attemptRecord,
        isCorrect,
        xpAwarded,
        newTotalXp: gam.xp,
        newLevel: gam.level,
        currentStreak: gam.currentStreak,
        longestStreak: gam.longestStreak,
        dailyQuestionsSolvedToday: gam.dailyQuestionsSolvedToday,
        dailyAllowanceRemaining: Math.max(0, DAILY_PRACTICE_LIMIT - gam.dailyQuestionsSolvedToday),
        quota,
        mistakeRecorded,
        xpTransaction: xpTx,
      };
    });
  }
}
