// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  GUEST_LIMITS,
  canConsumeGuestQuota,
  consumeGuestQuota,
  clearGuestSessionData,
  getGuestQuotaRemaining,
  generateGuestPracticeQuestions,
  generateGuestDoubtReply,
  generateGuestCreatorResource,
} from '../src/utils/guestMode';
import {
  DAILY_COPILOT_PHOTO_LIMIT,
  canUploadPhotoToday,
  getTodayPhotoUploadsRemaining,
  getTodayPhotoUploadsUsed,
  recordPhotoUploadToday,
} from '../src/utils/imageAttachment';

describe('Guest mode exploration limits and ephemeral synthesis', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearGuestSessionData();
  });

  it('enforces lower ephemeral guest limits (5 practice, 3 doubts, 2 creations)', () => {
    expect(GUEST_LIMITS.practiceQuestions).toBe(5);
    expect(GUEST_LIMITS.doubts).toBe(3);
    expect(GUEST_LIMITS.creations).toBe(2);

    for (let i = 0; i < 3; i++) {
      expect(canConsumeGuestQuota('doubts', 1)).toBe(true);
      consumeGuestQuota('doubts', 1);
    }
    expect(canConsumeGuestQuota('doubts', 1)).toBe(false);
    expect(getGuestQuotaRemaining().doubtsRemaining).toBe(0);

    for (let i = 0; i < 2; i++) {
      expect(canConsumeGuestQuota('creations', 1)).toBe(true);
      consumeGuestQuota('creations', 1);
    }
    expect(canConsumeGuestQuota('creations', 1)).toBe(false);
    expect(getGuestQuotaRemaining().creationsRemaining).toBe(0);

    for (let i = 0; i < 5; i++) {
      expect(canConsumeGuestQuota('practiceQuestions', 1)).toBe(true);
      consumeGuestQuota('practiceQuestions', 1);
    }
    expect(canConsumeGuestQuota('practiceQuestions', 1)).toBe(false);
    expect(getGuestQuotaRemaining().practiceRemaining).toBe(0);

    clearGuestSessionData();
    expect(getGuestQuotaRemaining()).toMatchObject({
      practiceRemaining: 5,
      doubtsRemaining: 3,
      creationsRemaining: 2,
    });
  });

  it('synthesizes guest practice, doubts, and creator resources without writing permanent practice keys', async () => {
    const questions = await generateGuestPracticeQuestions({ subjectId: 'math', questionCount: 5, timed: false });
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(5);
    expect(questions[0].questionText).toBeTruthy();

    const reply = generateGuestDoubtReply('Explain SN2 Walden inversion', { hintFirst: false });
    expect(reply).toContain('Guest Preview');
    expect(reply).toContain('Walden');

    const res = generateGuestCreatorResource({
      sourceType: 'text',
      sourceText: 'Chain rule relates composite derivatives. Conservation laws keep invariants fixed.',
      resourceType: 'quiz',
      title: 'Guest Calculus Quiz',
      subjectId: 'math',
      difficulty: 'medium',
    });
    expect(res.id).toMatch(/^res-guest-/);
    expect(res.content.quiz?.length).toBeGreaterThan(0);

    const lsKeys = Object.keys(localStorage).filter((k) => k.startsWith('learnco_practice_v2'));
    expect(lsKeys).toHaveLength(0);
  });

  it('enforces 3 photos per day limit in OmniCopilot image attachments', () => {
    expect(DAILY_COPILOT_PHOTO_LIMIT).toBe(3);
    expect(getTodayPhotoUploadsUsed()).toBe(0);
    expect(getTodayPhotoUploadsRemaining()).toBe(3);
    expect(canUploadPhotoToday()).toBe(true);

    recordPhotoUploadToday();
    recordPhotoUploadToday();
    recordPhotoUploadToday();

    expect(getTodayPhotoUploadsUsed()).toBe(3);
    expect(getTodayPhotoUploadsRemaining()).toBe(0);
    expect(canUploadPhotoToday()).toBe(false);
  });
});
