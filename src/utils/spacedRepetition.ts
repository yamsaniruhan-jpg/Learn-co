import { ConceptMastery, QuestionAttempt, SubjectId } from '../types';
import { STARTER_CONCEPTS } from '../data/curriculumMeta';

export type SM2Quality = 0 | 2 | 4 | 5; // 0: Again, 2: Hard, 4: Good, 5: Easy

export interface SM2CardState {
  conceptId: string;
  conceptTitle: string;
  subjectId: SubjectId;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: string; // ISO string
  lastReviewedAt: string;
  lastQuality: SM2Quality | null;
}

const STORAGE_PREFIX = 'learnco_sm2_schedule_v1_';

/**
 * Pure SuperMemo SM-2 algorithm step.
 * - Quality < 3 resets repetitions to 0 and schedules review in 1 day.
 * - Quality >= 3 advances interval: 1d -> 6d -> round(prev * EF).
 * - Minimum Ease Factor clamped at 1.3.
 */
export function calculateNextSM2Review(
  card: SM2CardState,
  quality: SM2Quality,
  now = new Date()
): SM2CardState {
  let repetitions = card.repetitions;
  let intervalDays = card.intervalDays;
  let easeFactor = card.easeFactor;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    }
    repetitions += 1;
  }

  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  easeFactor = Math.max(1.3, Number((easeFactor + delta).toFixed(2)));

  const nextDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    ...card,
    repetitions,
    intervalDays,
    easeFactor,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextDue.toISOString(),
    lastQuality: quality,
  };
}

function getCatalogConcepts(): Array<{ id: string; title: string; subjectId: SubjectId }> {
  return STARTER_CONCEPTS;
}

export function loadSM2Schedule(userId: string): Record<string, SM2CardState> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId || 'guest'}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSM2Schedule(userId: string, map: Record<string, SM2CardState>): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId || 'guest'}`, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

export function recordSM2Review(
  userId: string,
  card: SM2CardState,
  quality: SM2Quality,
  now = new Date()
): SM2CardState {
  const schedule = loadSM2Schedule(userId);
  const updated = calculateNextSM2Review(card, quality, now);
  schedule[card.conceptId] = updated;
  saveSM2Schedule(userId, schedule);
  return updated;
}

/**
 * Returns concepts due for SM-2 review right now, prioritized by:
 * 1. Weak or recently missed practiced concepts
 * 2. Already scheduled overdue cards
 * 3. Foundational starter concepts if the user hasn't built history yet
 */
export function getDueReviewQueue(
  userId: string,
  masteries: ConceptMastery[],
  attempts: QuestionAttempt[] = [],
  now = new Date(),
  limit = 6
): { dueCards: SM2CardState[]; totalDueCount: number } {
  const saved = loadSM2Schedule(userId);
  const nowMs = now.getTime();
  const candidates = new Map<string, SM2CardState>();

  // 1. Seed from existing SM-2 entries
  for (const card of Object.values(saved)) {
    candidates.set(card.conceptId, card);
  }

  // 2. Seed practiced/weak masteries that aren't scheduled yet
  for (const m of masteries) {
    if (!candidates.has(m.conceptId)) {
      const dueOffsetDays = m.isWeakArea || m.masteryScore < 65 ? 0 : 1;
      const dueAt = new Date(nowMs + dueOffsetDays * 24 * 60 * 60 * 1000).toISOString();
      candidates.set(m.conceptId, {
        conceptId: m.conceptId,
        conceptTitle: m.conceptTitle,
        subjectId: m.subjectId,
        repetitions: m.masteryScore >= 80 ? 2 : 0,
        intervalDays: m.masteryScore >= 80 ? 6 : 1,
        easeFactor: m.masteryScore >= 80 ? 2.5 : 2.1,
        nextReviewAt: dueAt,
        lastReviewedAt: m.lastPracticedAt || now.toISOString(),
        lastQuality: null,
      });
    }
  }

  // 3. Seed concepts from recent incorrect attempts
  const catalog = getCatalogConcepts();
  for (const att of attempts) {
    if (!att.isCorrect && att.conceptId && !candidates.has(att.conceptId)) {
      const found = catalog.find((c) => c.id === att.conceptId);
      candidates.set(att.conceptId, {
        conceptId: att.conceptId,
        conceptTitle: found?.title || att.conceptId,
        subjectId: (att.subjectId || found?.subjectId || 'math') as SubjectId,
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.0,
        nextReviewAt: now.toISOString(),
        lastReviewedAt: att.timestamp || now.toISOString(),
        lastQuality: 0,
      });
    }
  }

  // 4. Starter queue when user has zero saved cards yet
  if (candidates.size === 0) {
    for (const c of catalog.slice(0, limit)) {
      candidates.set(c.id, {
        conceptId: c.id,
        conceptTitle: c.title,
        subjectId: c.subjectId,
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewAt: now.toISOString(),
        lastReviewedAt: now.toISOString(),
        lastQuality: null,
      });
    }
  }

  const allDue = Array.from(candidates.values())
    .filter((card) => new Date(card.nextReviewAt).getTime() <= nowMs + 60 * 1000)
    .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());

  return {
    dueCards: allDue.slice(0, limit),
    totalDueCount: allDue.length,
  };
}
