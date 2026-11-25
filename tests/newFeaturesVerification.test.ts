import { createRequire } from 'node:module';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import {
  getDefaultStreakData,
  getRecentStudyMinutes,
  getStreakHeatmapDays,
  getStreakMilestoneInfo,
  mergeStreakData,
} from '../src/utils/streakManager';
import { retryDynamicImport } from '../src/utils/lazyNamed';

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock('../server/services/firebaseAdmin', () => ({ adminAuth: { verifyIdToken }, adminDb: null }));

let app: Express;
let learnerToken: string;
let ownerToken: string;
let mentorCandidateToken: string;

const OWNER_EMAIL = 'yamsaniruhan@gmail.com';
const LEARNER_EMAIL = `learner_verify_${Date.now()}@example.test`;
const MENTOR_EMAIL = `mentor_verify_${Date.now()}@example.test`;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  const mod = await import('../server');
  app = await mod.createApp();
  const { Database } = await import('../server/db');
  createRequire(import.meta.url)('../middleware/auth').setSessionResolver((value: string) => Database.getSessionUser(value));

  const learnerRes = await request(app)
    .post('/api/auth/signup')
    .send({ email: LEARNER_EMAIL, password: 'Password123!', fullName: 'Learner Verify' });
  expect(learnerRes.status).toBe(201);
  learnerToken = learnerRes.body.token;

  const mentorSignup = await request(app)
    .post('/api/auth/signup')
    .send({ email: MENTOR_EMAIL, password: 'Password123!', fullName: 'Dr. Euler Mentor' });
  expect(mentorSignup.status).toBe(201);
  mentorCandidateToken = mentorSignup.body.token;

  verifyIdToken.mockResolvedValue({
    uid: 'verified-owner-test',
    email: OWNER_EMAIL,
    email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
  });
  const ownerRes = await request(app).post('/api/auth/google').send({
    email: OWNER_EMAIL,
    name: 'Platform Owner',
    idToken: 'owner-verify-token',
    intent: 'auto',
  });
  expect(ownerRes.status).toBe(200);
  ownerToken = ownerRes.body.token;
}, 60_000);

describe('Real Course Marketplace curriculum & progress', () => {
  it('returns multi-module lessons, formulas, and concept quizzes for courses', async () => {
    const searchRes = await request(app).get('/api/marketplace/search?limit=6');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.courses.length).toBeGreaterThanOrEqual(4);

    const firstId = searchRes.body.courses[0].id;
    const detailRes = await request(app).get(`/api/marketplace/course/${firstId}`);
    expect(detailRes.status).toBe(200);
    expect(Array.isArray(detailRes.body.course.lessons)).toBe(true);
    expect(detailRes.body.course.lessons.length).toBeGreaterThan(0);
    expect(detailRes.body.course.lessons[0].quiz).toBeTruthy();
    expect(Array.isArray(detailRes.body.course.lessons[0].quiz.options)).toBe(true);
  });

  it('enrolls, grades lesson quizzes server-side, and persists completion percent', async () => {
    const detailRes = await request(app).get('/api/marketplace/course/course-calc-mastery');
    const firstLesson = detailRes.body.course.lessons[0];

    const enrollRes = await request(app)
      .post('/api/marketplace/enroll/course-calc-mastery')
      .set('Authorization', `Bearer ${learnerToken}`);
    expect(enrollRes.status).toBe(200);

    const progRes = await request(app)
      .post('/api/marketplace/progress/course-calc-mastery')
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({
        lessonId: firstLesson.id,
        completed: true,
        quizChoiceIndex: firstLesson.quiz.correctIndex,
      });

    expect(progRes.status).toBe(200);
    expect(progRes.body.success).toBe(true);
    expect(progRes.body.quizEvaluation?.correct).toBe(true);
    expect(progRes.body.progress.completedLessonIds).toContain(firstLesson.id);
    expect(progRes.body.progress.completionPercent).toBeGreaterThan(0);

    const allProgRes = await request(app)
      .get('/api/marketplace/progress')
      .set('Authorization', `Bearer ${learnerToken}`);
    expect(allProgRes.status).toBe(200);
    expect(allProgRes.body.progressByCourse['course-calc-mastery'].completedLessonIds).toContain(firstLesson.id);
  });
});

describe('Voice Exam zero-cost offline rubric scoring', () => {
  it('grades spoken transcript deterministically with 0 API token cost', async () => {
    const res = await request(app)
      .post('/api/ai/voice-exam-eval')
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({
        question: 'State and prove the fundamental conservation principle in oscillatory mechanics.',
        rubric: 'energy, equilibrium, derivative, amplitude, restoring',
        transcript:
          'In simple harmonic motion, the restoring force is proportional to displacement from equilibrium, so the derivative of potential energy balances kinetic energy and total mechanical energy remains conserved across maximum amplitude.',
      });

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('deterministic_offline');
    expect(res.body.apiCostTokens).toBe(0);
    expect(res.body.score).toBeGreaterThanOrEqual(70);
    expect(res.body.verdict).toBe('PASS');
    expect(res.body.rubricBreakdown).toBeTruthy();
  });

  it('rejects empty spoken submissions cleanly with 400', async () => {
    const res = await request(app)
      .post('/api/ai/voice-exam-eval')
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ rubric: 'energy, momentum', transcript: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('Public & Private Study Rooms authentication & redaction', () => {
  it('requires password for private rooms, redacts details when locked, and unlocks with code + password', async () => {
    const badCreate = await request(app)
      .post('/api/study-rooms')
      .send({ title: 'Locked Room', topic: 'Quantum', visibility: 'private', password: '12' });
    expect(badCreate.status).toBe(400);

    const createRes = await request(app)
      .post('/api/study-rooms')
      .send({
        title: 'Olympiad Geometry Sprint',
        topic: 'Inversion & Radical Axis',
        color: 'indigo',
        visibility: 'private',
        roomCode: 'LC-GEO99',
        password: 'gauss-proof-42',
        peerId: 'host-peer-1',
        hostName: 'Host Scholar',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.room.visibility).toBe('private');
    expect(createRes.body.room.roomCode).toBe('LC-GEO99');
    expect(createRes.body.accessTicket).toBeTruthy();

    const roomId = createRes.body.room.id;

    // Non-member listing redacts sensitive private fields
    const listRes = await request(app).get('/api/study-rooms?peerId=outsider-peer');
    expect(listRes.status).toBe(200);
    const listedPrivate = listRes.body.rooms.find((r: any) => r.id === roomId);
    expect(listedPrivate).toBeTruthy();
    expect(listedPrivate.roomCode).toBeNull();
    expect(listedPrivate.messages).toEqual([]);

    // Direct GET without authorization returns 403 PRIVATE_ROOM_LOCKED
    const lockedGet = await request(app).get(`/api/study-rooms/${roomId}?peerId=outsider-peer`);
    expect(lockedGet.status).toBe(403);
    expect(lockedGet.body.code).toBe('PRIVATE_ROOM_LOCKED');

    // Wrong password rejected
    const wrongJoin = await request(app).post('/api/study-rooms/join-private').send({
      roomCode: 'LC-GEO99',
      password: 'wrong-password',
      peerId: 'outsider-peer',
      displayName: 'Guest Scholar',
    });
    expect(wrongJoin.status).toBe(403);

    // Correct roomCode + password unlocks and returns accessTicket
    const goodJoin = await request(app).post('/api/study-rooms/join-private').send({
      roomCode: 'LC-GEO99',
      password: 'gauss-proof-42',
      peerId: 'outsider-peer',
      displayName: 'Guest Scholar',
    });
    expect(goodJoin.status).toBe(200);
    expect(goodJoin.body.accessTicket).toBeTruthy();

    const unlockedGet = await request(app)
      .get(`/api/study-rooms/${roomId}?peerId=outsider-peer&ticket=${encodeURIComponent(goodJoin.body.accessTicket)}`);
    expect(unlockedGet.status).toBe(200);
    expect(unlockedGet.body.room.roomCode).toBe('LC-GEO99');
  });
});

describe('Mentor End-to-End Flow without Cloud SQL', () => {
  it('completes application -> owner approval -> mentorship request -> accept -> goal, task, session & chat', async () => {
    const appRes = await request(app)
      .post('/api/mentorship/applications')
      .set('Authorization', `Bearer ${mentorCandidateToken}`)
      .send({
        fullName: 'Dr. Euler Mentor',
        degree: 'Ph.D Pure Mathematics',
        institution: 'Zurich Institute',
        subjectId: 'math',
        experienceYears: 6,
        capacity: 5,
        bio: 'Dedicated to building rigorous problem-solving habits through first-principles dialogue.',
      });
    expect(appRes.status).toBe(201);

    const approveRes = await request(app)
      .post(`/api/mentorship/applications/${appRes.body.application.id}/decision`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ action: 'APPROVE', note: 'Approved!' });
    expect(approveRes.status).toBe(200);
    const mentorId = approveRes.body.mentorProfile.id;

    // Learner requests mentorship
    const reqRes = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({
        mentorId,
        subjectId: 'math',
        targetTrack: 'Olympiad & University Calculus',
        goalDescription: 'Master Vector Calculus',
        initialMessage: 'Looking for weekly first-principles coaching.',
        preferredCadence: 'Weekly 45m',
      });
    expect(reqRes.status).toBe(201);
    const requestId = reqRes.body.request.id;

    // Mentor accepts request
    const respondRes = await request(app)
      .post(`/api/mentorship/requests/${requestId}/respond`)
      .set('Authorization', `Bearer ${mentorCandidateToken}`)
      .send({ action: 'ACCEPT' });
    expect(respondRes.status).toBe(200);
    expect(respondRes.body.relationship.status).toBe('ACTIVE');
    const relationshipId = respondRes.body.relationship.id;

    // Create goal, task, session & message
    const goalRes = await request(app)
      .post(`/api/mentorship/relationships/${relationshipId}/goals`)
      .set('Authorization', `Bearer ${mentorCandidateToken}`)
      .send({
        title: 'Derive Stokes Theorem',
        description: 'Achieve 90% accuracy on vector field circulation drills',
        targetDate: '2026-12-31',
        subjectId: 'math',
      });
    expect(goalRes.status).toBe(201);

    const taskRes = await request(app)
      .post(`/api/mentorship/relationships/${relationshipId}/tasks`)
      .set('Authorization', `Bearer ${mentorCandidateToken}`)
      .send({
        title: 'Solve 5 surface integral proofs',
        description: 'Complete drill set and submit written steps',
        dueDate: '2026-12-15',
        subjectId: 'math',
      });
    expect(taskRes.status).toBe(201);

    const sessionRes = await request(app)
      .post('/api/mentorship/sessions')
      .set('Authorization', `Bearer ${mentorCandidateToken}`)
      .send({
        mentorshipId: relationshipId,
        title: 'Stokes Weekly Coaching',
        scheduledDate: '2026-12-01',
        startTime: '15:00',
        durationMinutes: 45,
        sharedNotes: 'Boundary orientation and curl flux intuition',
      });
    expect(sessionRes.status).toBe(201);

    const msgRes = await request(app)
      .post(`/api/mentorship/relationships/${relationshipId}/messages`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ content: 'Prepared the curl derivation notes for review.' });
    expect(msgRes.status).toBe(201);
  });
});

describe('Streak Heatmap, Milestones, Merge & Dynamic Import Recovery', () => {
  it('builds 84 heatmap days, merges Firestore telemetry cleanly, and preserves zero-minute default', () => {
    const defaults = getDefaultStreakData();
    expect(getRecentStudyMinutes(defaults)).toBe(0);

    const heatmap = getStreakHeatmapDays(defaults, 84);
    expect(heatmap).toHaveLength(84);
    expect(heatmap[heatmap.length - 1].isToday).toBe(true);

    const milestone = getStreakMilestoneInfo(defaults);
    expect(milestone.nextMilestone).toBe(3);

    const merged = mergeStreakData(defaults, {
      currentStreak: 4,
      longestStreak: 12,
      streakHistory: ['2026-11-20', '2026-11-19'],
      dailyActivities: {
        '2026-11-20': { questionsSolved: 8, xpEarned: 40, minutesStudied: 25, sessionsCompleted: 1 },
      },
      freezeDaysRemaining: 2,
    });
    expect(merged.longestStreak).toBe(12);
    expect(merged.freezeDaysRemaining).toBe(2);
    expect(merged.streakHistory).toContain('2026-11-20');
  });

  it('retries transient dynamic import failures before succeeding', async () => {
    let calls = 0;
    const mod = await retryDynamicImport(async () => {
      calls += 1;
      if (calls < 2) {
        throw new TypeError('Failed to fetch dynamically imported module: /src/components/practice/PracticeView.tsx');
      }
      return { PracticeView: () => null };
    }, 2, 10);
    expect(calls).toBe(2);
    expect(typeof mod.PracticeView).toBe('function');
  });
});
