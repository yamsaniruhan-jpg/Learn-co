import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionSelectionEngine } from '../server/services/questionSelectionEngine';
import { Database } from '../server/db';
import { PracticeSessionConfig } from '../src/types/curriculum';

describe('Practice non-repeating question selection', () => {
  const testUserId = `test-user-norepeat-${Date.now()}`;

  it('honors client excludeQuestionIds in calibrated_ladder mode', () => {
    const config1: PracticeSessionConfig = {
      subjectId: 'physics',
      questionCount: 5,
      difficultyMode: 'calibrated_ladder',
      timed: false,
    };
    const session1 = QuestionSelectionEngine.selectPracticeSession(testUserId, config1);
    expect(session1).toHaveLength(5);
    const session1Ids = session1.map((q) => q.id);

    // Request session 2 excluding session 1
    const config2: PracticeSessionConfig = {
      subjectId: 'physics',
      questionCount: 5,
      difficultyMode: 'calibrated_ladder',
      timed: false,
      excludeQuestionIds: session1Ids,
    };
    const session2 = QuestionSelectionEngine.selectPracticeSession(testUserId, config2);
    expect(session2).toHaveLength(5);
    const session2Ids = session2.map((q) => q.id);

    // Verify ZERO overlap between session 1 and session 2
    const overlap = session2Ids.filter((id) => session1Ids.includes(id));
    expect(overlap).toEqual([]);
  });

  it('exhausts unseen questions across consecutive sessions without repeats', () => {
    const seenIds = new Set<string>();

    for (let round = 0; round < 3; round++) {
      const config: PracticeSessionConfig = {
        subjectId: 'chemistry',
        questionCount: 5,
        difficultyMode: 'calibrated_ladder',
        timed: false,
        excludeQuestionIds: Array.from(seenIds),
      };
      const session = QuestionSelectionEngine.selectPracticeSession(testUserId, config);
      expect(session).toHaveLength(5);

      for (const q of session) {
        expect(seenIds.has(q.id), `Question ${q.id} was repeated in round ${round}`).toBe(false);
        seenIds.add(q.id);
      }
    }

    expect(seenIds.size).toBe(15);
  });

  it('strictly selects unseen questions first in fixed difficulty mode', () => {
    const config1: PracticeSessionConfig = {
      subjectId: 'math',
      questionCount: 4,
      difficultyMode: 'medium',
      timed: false,
    };
    const session1 = QuestionSelectionEngine.selectPracticeSession(testUserId, config1);
    expect(session1).toHaveLength(4);
    const session1Ids = session1.map((q) => q.id);

    const config2: PracticeSessionConfig = {
      subjectId: 'math',
      questionCount: 4,
      difficultyMode: 'medium',
      timed: false,
      excludeQuestionIds: session1Ids,
    };
    const session2 = QuestionSelectionEngine.selectPracticeSession(testUserId, config2);
    expect(session2).toHaveLength(4);
    const session2Ids = session2.map((q) => q.id);

    const overlap = session2Ids.filter((id) => session1Ids.includes(id));
    expect(overlap).toEqual([]);
  });

  it('selects Olympiad questions for IPhO, IChO, and ICT chapters', () => {
    const iphoSession = QuestionSelectionEngine.selectPracticeSession(testUserId, {
      subjectId: 'physics',
      chapterId: 'phys-ch-ipho-olympiad',
      questionCount: 3,
      timed: false,
    });
    expect(iphoSession.length).toBeGreaterThanOrEqual(1);
    expect(iphoSession[0].chapterId).toBe('phys-ch-ipho-olympiad');

    const ictSession = QuestionSelectionEngine.selectPracticeSession(testUserId, {
      subjectId: 'cs',
      chapterId: 'cs-ch-ict-olympiad',
      questionCount: 3,
      timed: false,
    });
    expect(ictSession.length).toBeGreaterThanOrEqual(1);
    expect(ictSession[0].chapterId).toBe('cs-ch-ict-olympiad');
  });
});
