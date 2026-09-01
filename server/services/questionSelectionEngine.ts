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

export class QuestionSelectionEngine {
  /**
   * Select a set of questions tailored to user configuration and history.
   * Default mode is the 5-Question Calibrated Ladder:
   * [Easy, Easy/Medium, Medium, Medium/Hard, Hard]
   */
  static selectPracticeSession(
    userId: string,
    config: PracticeSessionConfig
  ): QuestionBankItem[] {
    const userAttempts = Database.getUserAttempts(userId);
    const userMistakes = Database.getMistakes(userId);
    const resolvedAttemptIds = new Set(userAttempts.filter((a) => a.isCorrect).map((a) => a.questionId));

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

    // If Mistake Remediation Mode
    if (config.mode === 'mistake_remediation') {
      const mistakeQuestionIds = new Set(userMistakes.filter((m) => !m.resolved).map((m) => m.questionId));
      const mistakePool = candidatePool.filter((q) => mistakeQuestionIds.has(q.id));
      if (mistakePool.length >= config.questionCount) {
        return mistakePool.slice(0, config.questionCount);
      }
    }

    const count = config.questionCount || 5;

    // Calibrated Ladder Mode (default 5-question ascending difficulty)
    if (!config.difficultyMode || config.difficultyMode === 'calibrated_ladder') {
      const ladderDifficulties: DifficultyLevel[] = ['easy', 'easy_medium', 'medium', 'medium_hard', 'hard'];
      const selected: QuestionBankItem[] = [];
      const usedIds = new Set<string>();

      for (let i = 0; i < count; i++) {
        const targetDiff = ladderDifficulties[i % ladderDifficulties.length];
        
        // Find matching difficulty in candidates not yet used
        let match = candidatePool.find(
          (q) => q.difficulty === targetDiff && !usedIds.has(q.id) && !resolvedAttemptIds.has(q.id)
        );

        // Fallback: match difficulty even if previously solved
        if (!match) {
          match = candidatePool.find((q) => q.difficulty === targetDiff && !usedIds.has(q.id));
        }

        // Fallback: any unused candidate
        if (!match) {
          match = candidatePool.find((q) => !usedIds.has(q.id));
        }

        // Fallback: cycle candidatePool
        if (!match && candidatePool.length > 0) {
          match = candidatePool[i % candidatePool.length];
        }

        if (match) {
          selected.push(match);
          usedIds.add(match.id);
        }
      }

      if (selected.length > 0) {
        return selected;
      }
    }

    // Standard / custom difficulty mode
    if (config.difficultyMode && config.difficultyMode !== 'calibrated_ladder') {
      const filteredByDiff = candidatePool.filter((q) => q.difficulty === config.difficultyMode);
      const pool = filteredByDiff.length >= count ? filteredByDiff : candidatePool;
      return pool.slice(0, count);
    }

    return candidatePool.slice(0, count);
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
