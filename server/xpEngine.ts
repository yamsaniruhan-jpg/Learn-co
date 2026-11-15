import {
  Database,
  withUserLock,
  getDateInTimezone,
  getDaysBetweenDateKeys,
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
  SubjectId,
} from '../src/types/auth';
import { MASTER_QUESTION_BANK } from './data/questionBankData';
import { flushCurrentState } from './services/flushCurrentState';
import { gradeQuestionAnswer, type SubmittedAnswer } from '../src/utils/gradeAnswer';
import { nextPracticeReset } from './services/practiceQuotaTime';

export interface SubmitAttemptRequest {
  attemptId: string;
  questionId: string;
  subjectId: SubjectId;
  topicId: string;
  subtopicId?: string;
  conceptId?: string;
  difficulty: 'easy' | 'easy_medium' | 'medium' | 'medium_hard' | 'hard';
  questionText: string;
  selectedAnswer: SubmittedAnswer;
  correctAnswer: string | number;
  /** For non-bank items only; callers may send a self-check result. */
  unverifiedCorrect?: boolean;
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
  verification: 'bank' | 'unverified';
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

    return {
      questionsSolvedToday,
      dailyLimit: DAILY_PRACTICE_LIMIT,
      remaining,
      isLimitReached,
      resetsAt: nextPracticeReset(userTimezone),
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
      if (Object.hasOwn(db.attemptsById, req.attemptId)) {
        const existingAttempt = db.attemptsById[req.attemptId];
        if (existingAttempt.userId !== userId) {
          const err: any = new Error('Attempt ID is already in use.');
          err.statusCode = 409;
          err.code = 'ATTEMPT_ID_CONFLICT';
          throw err;
        }
        // A prior response may have failed during disk flush. Retry the write
        // before acknowledging an idempotent replay.
        await flushCurrentState();
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
          verification: existingAttempt.verification === 'bank' ? 'bank' : 'unverified',
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

      // Only the server's bank can provide a verified answer key. Imported or
      // generated questions can still be practiced, but their correctness is
      // client-reported and must not mint competitive XP.
      const bankQuestion = MASTER_QUESTION_BANK.find(question => question.id === req.questionId);
      const verification = bankQuestion ? 'bank' as const : 'unverified' as const;
      const answerKey = bankQuestion
        ? (Array.isArray(bankQuestion.correctAnswer) ? bankQuestion.correctAnswer.join(', ') : bankQuestion.correctAnswer)
        : req.correctAnswer;
      const selectedText = Array.isArray(req.selectedAnswer) ? req.selectedAnswer.join(', ') : req.selectedAnswer;
      const isCorrect = bankQuestion
        ? gradeQuestionAnswer(bankQuestion, req.selectedAnswer)
        : (req.unverifiedCorrect ?? (String(selectedText).trim().toLowerCase() === String(answerKey).trim().toLowerCase()));
      const rewardedToday = db.questionAttempts.some(attempt => {
        if (attempt.userId !== userId || attempt.questionId !== req.questionId || !(attempt.xpAwarded > 0)) return false;
        const submittedAt = new Date(attempt.submittedAt);
        return Number.isFinite(submittedAt.getTime()) && getDateInTimezone(userTimezone, submittedAt) === todayDateStr;
      });
      // Repeating a correct bank question remains useful practice but does not
      // award XP repeatedly on the same local day.
      const xpAwarded = verification === 'bank' && isCorrect && !rewardedToday
        ? XP_PER_CORRECT_QUESTION : XP_PER_INCORRECT_QUESTION;

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
        selectedAnswer: selectedText,
        correctAnswer: answerKey,
        isCorrect,
        solvingTimeSeconds: req.solvingTimeSeconds || 0,
        hintsRevealedCount: req.hintsRevealedCount || 0,
        startedAt: new Date(Date.now() - (req.solvingTimeSeconds || 0) * 1000).toISOString(),
        submittedAt: now,
        status: isCorrect ? 'CORRECT' : 'INCORRECT',
        xpAwarded,
        verification,
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
        // First ever qualifying activity starts streak at 1
        gam.currentStreak = 1;
        gam.longestStreak = Math.max(gam.longestStreak, 1);
      } else if (gam.lastActiveDate === todayDateStr) {
        // Same calendar day: maintain current streak (at least 1)
        gam.currentStreak = Math.max(1, gam.currentStreak);
        gam.longestStreak = Math.max(gam.longestStreak, gam.currentStreak);
      } else {
        const diffDays = getDaysBetweenDateKeys(gam.lastActiveDate, todayDateStr);

        if (diffDays === 1) {
          // Consecutive calendar day -> Streak continues and increments (+1)
          gam.currentStreak = (gam.currentStreak || 0) + 1;
          gam.longestStreak = Math.max(gam.longestStreak, gam.currentStreak);
        } else {
          // Missed one or more days -> Streak broke, starts fresh at 1 today
          gam.currentStreak = 1;
          gam.longestStreak = Math.max(gam.longestStreak, 1);
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
          userAnswer: selectedText,
          correctAnswer: answerKey,
          explanation: req.explanation,
          resolved: false,
          createdAt: now,
        };
        db.mistakes.unshift(mistake);
        mistakeRecorded = true;
      }

      const quota = this.getDailyQuota(userId);
      // The engine mutates the in-memory store directly; mark it dirty and
      // flush before telling an offline queue that its attempt was accepted.
      await flushCurrentState();

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
        verification,
        xpTransaction: xpTx,
      };
    });
  }
}
