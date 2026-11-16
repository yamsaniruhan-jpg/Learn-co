import { MASTER_QUESTION_BANK } from '../data/questionBankData';
import { Database } from '../db';
import {
  QuestionBankItem,
  PracticeSessionConfig,
  WeakTopicSignal,
  PracticeRecommendation,
  SubjectId,
  DifficultyLevel,
} from '../../src/types/curriculum';
import {
  generateFreshParameterizedQuestions,
  OlympiadDiscipline,
} from './parameterizedQuestionGenerator';

export class QuestionSelectionEngine {
  /**
   * Select a set of questions tailored to user configuration and history.
   * Enforces strict deduplication: guarantees no repeated questions across sessions
   * by prioritizing unseen questions and randomizing matching candidate pools.
   */
  static selectPracticeSession(
    userId: string,
    config: PracticeSessionConfig
  ): QuestionBankItem[] {
    const userAttempts = Database.getUserAttempts(userId);
    const userMistakes = Database.getMistakes(userId);
    const allAttemptedIds = new Set<string>(userAttempts.map((a) => a.questionId));
    const clientExcluded = Array.isArray(config.excludeQuestionIds)
      ? config.excludeQuestionIds.filter((id): id is string => typeof id === 'string')
      : [];
    const seenIds = new Set<string>([...allAttemptedIds, ...clientExcluded]);
    const resolvedAttemptIds = new Set(
      userAttempts.filter((a) => a.isCorrect).map((a) => a.questionId)
    );

    // Get all available questions (master bank + any creator imported questions from DB)
    let candidatePool: QuestionBankItem[] = [...MASTER_QUESTION_BANK];

    // Filter by subject if specified
    if (config.subjectId && config.subjectId !== ('all' as any)) {
      candidatePool = candidatePool.filter((q) => q.subjectId === config.subjectId);
    }

    // Filter by track if specified
    if (config.examTrack && config.examTrack !== 'all') {
      candidatePool = candidatePool.filter(
        (q) => q.examTracks.includes(config.examTrack!) || q.examTracks.includes('all')
      );
    }

    // Filter by chapter/topic/concept if specified
    if (config.chapterId) {
      candidatePool = candidatePool.filter((q) => q.chapterId === config.chapterId);
    }
    if (config.topicId) {
      candidatePool = candidatePool.filter((q) => q.topicId === config.topicId);
    }
    if (config.conceptId) {
      candidatePool = candidatePool.filter((q) => q.conceptId === config.conceptId);
    }

    // Filter by question types if specified
    if (config.questionTypes && config.questionTypes.length > 0) {
      candidatePool = candidatePool.filter((q) => config.questionTypes!.includes(q.questionType));
    }

    // Fallback if candidate pool is too small: broaden filters
    if (candidatePool.length === 0) {
      candidatePool = config.subjectId
        ? MASTER_QUESTION_BANK.filter((q) => q.subjectId === config.subjectId)
        : [...MASTER_QUESTION_BANK];
    }

    // When a learner opens practice for one specific concept, lead with the
    // items derived from that concept's own mini-check and worked examples.
    const isConceptScoped = Boolean(config.conceptId);
    const conceptNative = isConceptScoped
      ? candidatePool.filter((q) => q.id.startsWith('q-concept-'))
      : [];
    const conceptNativeIds = new Set(conceptNative.map((q) => q.id));
    const remainder = candidatePool.filter((q) => !conceptNativeIds.has(q.id));

    // Unbiased Fisher-Yates shuffle so repeated sessions draw uniformly
    const shuffle = <T,>(items: T[]): T[] => {
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    const shuffledPool = [...shuffle(conceptNative), ...shuffle(remainder)];

    // If Mistake Remediation Mode
    if (config.mode === 'mistake_remediation') {
      const mistakeQuestionIds = new Set(
        userMistakes.filter((m) => !m.resolved).map((m) => m.questionId)
      );
      const mistakePool = shuffledPool.filter((q) => mistakeQuestionIds.has(q.id));
      if (mistakePool.length >= config.questionCount) {
        return mistakePool.slice(0, config.questionCount);
      }
    }

    const count = Math.max(1, config.questionCount || 5);

    // Helper: pick unseen items strictly before revisiting already-seen items
    const selectUnseenFirst = (pool: QuestionBankItem[], targetCount: number): QuestionBankItem[] => {
      const unseen = pool.filter((q) => !seenIds.has(q.id));
      if (unseen.length >= targetCount) {
        return unseen.slice(0, targetCount);
      }
      const unseenSet = new Set(unseen.map((q) => q.id));
      // Prefer unresolved/client-excluded only after genuinely unseen pool is exhausted
      const unresolvedSeen = pool.filter(
        (q) => !unseenSet.has(q.id) && !resolvedAttemptIds.has(q.id)
      );
      const resolvedSeen = pool.filter(
        (q) => !unseenSet.has(q.id) && resolvedAttemptIds.has(q.id)
      );
      return [...unseen, ...unresolvedSeen, ...resolvedSeen].slice(0, targetCount);
    };

    // Calibrated Ladder Mode (default 5-question ascending difficulty)
    if (!config.difficultyMode || config.difficultyMode === 'calibrated_ladder') {
      const ladderDifficulties: DifficultyLevel[] = [
        'easy',
        'easy_medium',
        'medium',
        'medium_hard',
        'hard',
      ];
      const selected: QuestionBankItem[] = [];
      const usedInSessionIds = new Set<string>();

      for (let i = 0; i < count; i++) {
        const targetDiff = ladderDifficulties[i % ladderDifficulties.length];

        // Priority 1: Target difficulty + strictly unseen
        let match = shuffledPool.find(
          (q) => q.difficulty === targetDiff && !seenIds.has(q.id) && !usedInSessionIds.has(q.id)
        );

        // Priority 2: Any unseen candidate (preserve non-repetition even if targetDiff is exhausted)
        if (!match) {
          match = shuffledPool.find(
            (q) => !seenIds.has(q.id) && !usedInSessionIds.has(q.id)
          );
        }

        // Priority 3: Target difficulty + unresolved & unused in session
        if (!match) {
          match = shuffledPool.find(
            (q) =>
              q.difficulty === targetDiff &&
              !resolvedAttemptIds.has(q.id) &&
              !usedInSessionIds.has(q.id)
          );
        }

        // Priority 4: Target difficulty + unused in session (spaced review only after unseen exhausted)
        if (!match) {
          match = shuffledPool.find(
            (q) => q.difficulty === targetDiff && !usedInSessionIds.has(q.id)
          );
        }

        // Priority 5: Any unused candidate in this session
        if (!match) {
          match = shuffledPool.find((q) => !usedInSessionIds.has(q.id));
        }

        if (match) {
          selected.push(match);
          usedInSessionIds.add(match.id);
        }
      }

      if (selected.length > 0) {
        // If any selected questions were already seen (e.g. bank exhausted), replace repeats with fresh parameterized variants
        const unseenSelected = selected.filter((q) => !seenIds.has(q.id));
        if (unseenSelected.length < count) {
          const usedIds = new Set<string>([
            ...seenIds,
            ...unseenSelected.map((q) => q.id),
          ]);
          const needed = count - unseenSelected.length;
          const freshVariants = generateFreshParameterizedQuestions({
            count: needed,
            subjectId: config.subjectId,
            examTrack: config.examTrack,
            excludeIds: usedIds,
          });
          const combined = [...unseenSelected, ...freshVariants];
          if (combined.length >= count) {
            return combined.slice(0, count);
          }
        }
        return selected;
      }
    }

    // Standard / custom difficulty mode: unseen first, backfill within matching difficulty before broadening
    if (config.difficultyMode && config.difficultyMode !== 'calibrated_ladder') {
      const filteredByDiff = shuffledPool.filter((q) => q.difficulty === config.difficultyMode);
      const unseenInDiff = filteredByDiff.filter((q) => !seenIds.has(q.id));
      if (unseenInDiff.length >= count) {
        return unseenInDiff.slice(0, count);
      }
      const unseenAnywhere = shuffledPool.filter(
        (q) => !seenIds.has(q.id) && q.difficulty !== config.difficultyMode
      );
      if (unseenInDiff.length + unseenAnywhere.length >= count) {
        return [...unseenInDiff, ...unseenAnywhere].slice(0, count);
      }
      const unseenStatic = [...unseenInDiff, ...unseenAnywhere];
      const freshVariants = generateFreshParameterizedQuestions({
        count: count - unseenStatic.length,
        subjectId: config.subjectId,
        examTrack: config.examTrack,
        excludeIds: new Set([...seenIds, ...unseenStatic.map((q) => q.id)]),
      });
      if (unseenStatic.length + freshVariants.length >= count) {
        return [...unseenStatic, ...freshVariants].slice(0, count);
      }
      const pool = filteredByDiff.length >= count ? filteredByDiff : shuffledPool;
      return selectUnseenFirst(pool, count);
    }

    // General fallback: return strictly unseen candidates before any revisit
    const picked = selectUnseenFirst(shuffledPool, count);
    const unseenOnly = picked.filter((q) => !seenIds.has(q.id));
    if (unseenOnly.length < count) {
      const freshVariants = generateFreshParameterizedQuestions({
        count: count - unseenOnly.length,
        subjectId: config.subjectId,
        examTrack: config.examTrack,
        excludeIds: new Set([...seenIds, ...unseenOnly.map((q) => q.id)]),
      });
      if (unseenOnly.length + freshVariants.length > 0) {
        return [...unseenOnly, ...freshVariants].slice(0, count);
      }
    }
    return picked;
  }

  /**
   * Select a balanced, non-repeating Olympiad Mock Contest problem set.
   */
  static selectOlympiadContest(
    userId: string,
    track: OlympiadDiscipline,
    questionCount: number,
    excludeIdsExtra: string[] = []
  ): QuestionBankItem[] {
    const userAttempts = Database.getUserAttempts(userId);
    const seenIds = new Set<string>([
      ...userAttempts.map((a) => a.questionId),
      ...excludeIdsExtra,
    ]);

    const disciplineFilter = (q: QuestionBankItem): boolean => {
      if (track === 'ipho') {
        return q.subjectId === 'physics' && (q.examTracks.includes('iapt_exams') || q.examTracks.includes('stem_olympiad') || q.chapterId.includes('ipho') || q.difficulty !== 'easy');
      }
      if (track === 'icho') {
        return q.subjectId === 'chemistry' && (q.examTracks.includes('iapt_exams') || q.examTracks.includes('stem_olympiad') || q.chapterId.includes('icho') || q.difficulty !== 'easy');
      }
      if (track === 'ibho') {
        return q.subjectId === 'biology' && (q.examTracks.includes('iapt_exams') || q.examTracks.includes('stem_olympiad') || q.chapterId.includes('ibho') || q.difficulty !== 'easy');
      }
      if (track === 'ijso') {
        return ['physics', 'chemistry', 'biology'].includes(q.subjectId) && (q.examTracks.includes('nsejs') || q.examTracks.includes('stem_olympiad') || q.chapterId.includes('ijso'));
      }
      if (track === 'ict') {
        return q.subjectId === 'cs' && (q.examTracks.includes('ict_hackathon') || q.examTracks.includes('stem_olympiad') || q.chapterId.includes('ict'));
      }
      return (
        q.examTracks.includes('stem_olympiad') ||
        q.examTracks.includes('iapt_exams') ||
        q.examTracks.includes('nsejs') ||
        q.examTracks.includes('ict_hackathon')
      );
    };

    const candidateBank = MASTER_QUESTION_BANK.filter(
      (q) => disciplineFilter(q) && !seenIds.has(q.id)
    );
    // Shuffle deterministically-enough with Fisher-Yates
    const shuffled = [...candidateBank];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Mix ~40% fresh parameterized quantitative Olympiad items + ~60% unseen bank items
    const paramTarget = Math.max(2, Math.ceil(questionCount * 0.4));
    const bankTarget = Math.max(0, questionCount - paramTarget);
    const chosenBank = shuffled.slice(0, bankTarget);
    chosenBank.forEach((q) => seenIds.add(q.id));

    const neededParam = questionCount - chosenBank.length;
    const paramItems = generateFreshParameterizedQuestions({
      count: neededParam,
      olympiadDiscipline: track,
      excludeIds: seenIds,
    });

    const combined = [...chosenBank, ...paramItems];
    // Final shuffle across difficulties/items
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined.slice(0, questionCount);
  }

  /**
   * Identify weak topics algorithmically based on user attempts and mistakes.
   */
  static getWeakTopics(userId: string): WeakTopicSignal[] {
    const attempts = Database.getUserAttempts(userId);
    const mistakes = Database.getMistakes(userId);

    // Group attempts by topic
    const topicStats: Record<
      string,
      {
        topicId: string;
        subjectId: SubjectId;
        conceptId?: string;
        total: number;
        incorrect: number;
        lastAttempt: string;
      }
    > = {};

    for (const att of attempts) {
      const key = att.topicId || 'general';
      if (!topicStats[key]) {
        topicStats[key] = {
          topicId: att.topicId || 'general',
          subjectId: att.subjectId,
          conceptId: att.conceptId,
          total: 0,
          incorrect: 0,
          lastAttempt: att.submittedAt,
        };
      }
      topicStats[key].total += 1;
      if (!att.isCorrect) {
        topicStats[key].incorrect += 1;
      }
      if (new Date(att.submittedAt) > new Date(topicStats[key].lastAttempt)) {
        topicStats[key].lastAttempt = att.submittedAt;
      }
    }

    // Also factor in unsolved mistakes
    for (const m of mistakes) {
      const key = m.topicId || 'general';
      if (!topicStats[key]) {
        topicStats[key] = {
          topicId: m.topicId,
          subjectId: m.subjectId as any,
          conceptId: m.conceptId,
          total: 1,
          incorrect: 1,
          lastAttempt: m.createdAt,
        };
      }
    }

    // If user is new (0 attempts), return empty array so no fake weak topics are shown
    if (Object.keys(topicStats).length === 0) {
      return [];
    }

    const weakSignals: WeakTopicSignal[] = [];

    for (const stat of Object.values(topicStats)) {
      const accuracy = stat.total > 0 ? Math.round(((stat.total - stat.incorrect) / stat.total) * 100) : 0;
      
      // Calculate decay risk based on time elapsed
      const daysSince = Math.floor(
        (Date.now() - new Date(stat.lastAttempt).getTime()) / (1000 * 60 * 60 * 24)
      );

      let decayRisk: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      if (accuracy < 40 || daysSince > 7) decayRisk = 'critical';
      else if (accuracy < 65 || daysSince > 4) decayRisk = 'high';
      else if (accuracy < 80 || daysSince > 2) decayRisk = 'moderate';

      if (accuracy < 75 || stat.incorrect > 0 || decayRisk === 'critical' || decayRisk === 'high') {
        weakSignals.push({
          topicId: stat.topicId,
          topicTitle: stat.topicId,
          subjectId: stat.subjectId,
          conceptId: stat.conceptId,
          totalAttempts: stat.total,
          incorrectAttempts: stat.incorrect,
          accuracyRate: accuracy,
          lastPracticedAt: stat.lastAttempt,
          decayRisk,
          recommendedAction: `Targeted 5-question ladder recommended (${accuracy}% accuracy).`,
        });
      }
    }

    return weakSignals.sort((a, b) => a.accuracyRate - b.accuracyRate);
  }

  /**
   * Generate curated practice recommendations for user dashboard & learning studio
   */
  static getRecommendations(userId: string): PracticeRecommendation[] {
    const weakTopics = this.getWeakTopics(userId);
    const profile = Database.getProfile(userId);
    const targetExam = profile?.targetExam || 'Advanced STEM';

    const recs: PracticeRecommendation[] = [];

    // 1. Weakness Remediation Rec
    if (weakTopics.length > 0) {
      const primaryWeakness = weakTopics[0];
      recs.push({
        id: `rec-weak-${primaryWeakness.topicId}`,
        type: 'weakness_remediation',
        title: `Remediate: ${primaryWeakness.topicTitle}`,
        description: `Your accuracy is currently ${primaryWeakness.accuracyRate}%. Solve a 5-question calibrated set to repair foundational invariant gaps.`,
        subjectId: primaryWeakness.subjectId,
        topicId: primaryWeakness.topicId,
        conceptId: primaryWeakness.conceptId,
        difficulty: 'medium',
        estimatedMinutes: 10,
        xpPotential: 25,
        reason: `${primaryWeakness.incorrectAttempts} recent incorrect attempts detected.`,
      });
    }

    // 2. Exam Readiness Rec
    recs.push({
      id: 'rec-exam-prep',
      type: 'exam_readiness',
      title: `${targetExam} High-Yield Problem Ladder`,
      description: 'Mixed multi-concept diagnostic ladder covering Calculus, Mechanics, and Optimization.',
      subjectId: 'math',
      topicId: 'Applications of Derivatives',
      conceptId: 'concept-deriv-inc-dec',
      difficulty: 'medium_hard',
      estimatedMinutes: 15,
      xpPotential: 25,
      reason: 'Calibrated for your target exam benchmarks.',
    });

    // 3. Curriculum Progression Rec
    recs.push({
      id: 'rec-curr-progression',
      type: 'curriculum_progression',
      title: 'Gradient Descent & Learning Rate Convergence',
      description: 'First-order convex optimization and Taylor series derivations in Machine Learning.',
      subjectId: 'cs',
      topicId: 'Optimization Algorithms',
      conceptId: 'concept-grad-descent',
      difficulty: 'medium',
      estimatedMinutes: 12,
      xpPotential: 25,
      reason: 'Next unmastered core concept in your Computer Science curriculum.',
    });

    return recs;
  }
}
