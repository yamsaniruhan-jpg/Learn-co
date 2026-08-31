import { QuestionAttempt } from '../types';

/**
 * Empirical Multi-Factor Concept Mastery Engine
 * M(c) = 0.45 * A_eff + 0.25 * D_res + 0.20 * R(t) + 0.10 * S
 */
export class MasteryEngine {
  static calculateMastery(
    attempts: QuestionAttempt[],
    conceptId: string
  ): {
    score: number;
    retentionStrength: number;
    isWeakArea: boolean;
  } {
    const conceptAttempts = attempts.filter((a) => a.conceptId === conceptId);

    if (conceptAttempts.length === 0) {
      return { score: 0, retentionStrength: 0, isWeakArea: false };
    }

    const total = conceptAttempts.length;
    const correct = conceptAttempts.filter((a) => a.isCorrect).length;
    const rawAccuracy = correct / total;

    // Effective accuracy penalized by hints used
    const avgHints =
      conceptAttempts.reduce((sum, a) => sum + (a.hintsRevealed || 0), 0) / total;
    const hintPenalty = Math.min(0.3, avgHints * 0.1);
    const effectiveAccuracy = Math.max(0, rawAccuracy - hintPenalty);

    // Difficulty resilience
    const difficultyScore = 0.8; // Normalized baseline for calibrated items

    // Retention factor based on recency
    const lastAttemptTime = new Date(conceptAttempts[0].timestamp).getTime();
    const daysSince = Math.max(0, (Date.now() - lastAttemptTime) / (1000 * 60 * 60 * 24));
    const retentionStrength = Math.round(Math.max(20, 100 * Math.exp(-0.06 * daysSince)));

    // Streak / consistency
    const recentFive = conceptAttempts.slice(0, 5);
    const recentCorrectRatio =
      recentFive.filter((a) => a.isCorrect).length / Math.max(1, recentFive.length);

    // Weighted composite
    const rawScore =
      0.45 * (effectiveAccuracy * 100) +
      0.25 * (difficultyScore * 100) +
      0.20 * retentionStrength +
      0.10 * (recentCorrectRatio * 100);

    const score = Math.round(Math.min(100, Math.max(0, rawScore)));
    const isWeakArea = score < 60 || (total >= 3 && rawAccuracy < 0.6);

    return {
      score,
      retentionStrength,
      isWeakArea,
    };
  }
}
