import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

const { verifyIdToken, mockFirestoreSet, mockFirestoreDoc, mockFirestoreAdd } = vi.hoisted(() => {
  const mockFirestoreSet = vi.fn().mockResolvedValue(undefined);
  const mockFirestoreDoc = vi.fn(() => ({ set: mockFirestoreSet }));
  const mockFirestoreAdd = vi.fn().mockResolvedValue({ id: 'mock-notif-1' });
  return {
    verifyIdToken: vi.fn(),
    mockFirestoreSet,
    mockFirestoreDoc,
    mockFirestoreAdd,
  };
});

vi.mock('../server/services/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken },
  adminDb: {
    collection: vi.fn(() => ({ doc: mockFirestoreDoc, add: mockFirestoreAdd })),
  },
}));

let app: Express;
let ownerToken: string;
let mentorUserToken: string;
let studentToken: string;
let mentorId: string;

const OWNER_EMAIL = 'yamsaniruhan@gmail.com';
const MENTOR_EMAIL = `mentor_e2e_${Date.now()}@example.edu`;
const STUDENT_EMAIL = `student_e2e_${Date.now()}@example.edu`;
const STUDENT_CONTACT_EMAIL = `student_reply_${Date.now()}@gmail.com`;
const PASSWORD = 'Str0ngPass!23';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  delete process.env.RESEND_API_KEY;
  delete process.env.SMTP_URL;

  const mod = await import('../server.js');
  app = await mod.createApp();

  // Sign up mentor candidate as regular user
  const mSign = await request(app)
    .post('/api/auth/signup')
    .send({ email: MENTOR_EMAIL, password: PASSWORD, fullName: 'Dr. Priya Ramanujan' });
  expect(mSign.status).toBe(201);
  mentorUserToken = mSign.body.token;

  // Sign up student requester
  const sSign = await request(app)
    .post('/api/auth/signup')
    .send({ email: STUDENT_EMAIL, password: PASSWORD, fullName: 'Sam Learner' });
  expect(sSign.status).toBe(201);
  studentToken = sSign.body.token;

  // Sign in owner (yamsaniruhan@gmail.com) via mocked Google token
  verifyIdToken.mockResolvedValue({
    uid: 'owner-uid',
    email: OWNER_EMAIL,
    email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
  });
  const oSign = await request(app).post('/api/auth/google').send({
    email: OWNER_EMAIL,
    name: 'Platform Owner',
    idToken: 'owner-test-token',
    intent: 'auto',
  });
  expect(oSign.status).toBe(200);
  expect(oSign.body.user.role).toBe('admin');
  ownerToken = oSign.body.token;
}, 60_000);

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.MAIL_FROM;
  vi.restoreAllMocks();
});

describe('Email relay diagnostics, Firestore mentor gate, and signed student request email flow', () => {
  it('reports mail relay status accurately across auth and mentorship endpoints', async () => {
    const authMailOff = await request(app).get('/api/auth/mail-status');
    expect(authMailOff.status).toBe(200);
    expect(authMailOff.body.configured).toBe(false);
    expect(authMailOff.body.provider).toBe('none');

    const mentorMailOff = await request(app).get('/api/mentorship/mail-status');
    expect(mentorMailOff.status).toBe(200);
    expect(mentorMailOff.body.configured).toBe(false);

    process.env.RESEND_API_KEY = 're_test_key_123';
    process.env.MAIL_FROM = 'Learn.co <no-reply@learnco.test>';
    const mentorMailOn = await request(app).get('/api/mentorship/mail-status');
    expect(mentorMailOn.status).toBe(200);
    expect(mentorMailOn.body.configured).toBe(true);
    expect(mentorMailOn.body.provider).toBe('resend');
  });

  it('stores mentor application in Firestore and blocks mentor directory entry until yamsaniruhan@gmail.com approves', async () => {
    const applyRes = await request(app)
      .post('/api/mentorship/applications')
      .set('Authorization', `Bearer ${mentorUserToken}`)
      .send({
        fullName: 'Dr. Priya Ramanujan',
        degree: 'Ph.D. Applied Mathematics',
        institution: 'Trinity STEM Academy',
        subjectId: 'math',
        experienceYears: 8,
        capacity: 5,
        hourlyRate: 0,
        bio: 'Specializing in AP Calculus BC infinite series, Taylor remainder proofs, and differential equations.',
      });

    expect(applyRes.status).toBe(201);
    expect(applyRes.body.routedToEmail).toBe(OWNER_EMAIL);
    expect(applyRes.body.firestoreSynced).toBe(true);
    expect(mockFirestoreSet).toHaveBeenCalled();
    const appId = applyRes.body.application.id;

    // Before approval: still student, cannot appear in mentors roster
    const beforeMentors = await request(app).get('/api/mentorship/mentors');
    expect(beforeMentors.body.mentors.some((m: any) => m.name === 'Dr. Priya Ramanujan')).toBe(false);

    // Owner approves application
    const approveRes = await request(app)
      .post(`/api/mentorship/applications/${appId}/decision`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ action: 'APPROVE', note: 'Approved for AP Calculus BC mentoring.' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.application.status).toBe('APPROVED');
    expect(approveRes.body.mentorProfile.email).toBe(MENTOR_EMAIL);
    mentorId = approveRes.body.mentorProfile.id;

    const afterMentors = await request(app).get('/api/mentorship/mentors');
    expect(afterMentors.body.mentors.some((m: any) => m.id === mentorId && m.email === MENTOR_EMAIL)).toBe(true);
  });

  it('dispatches signed "Yes, Accept Student" email to the mentor when relay is configured and handles email acceptance cleanly', async () => {
    // 1. Without configured relay: returns honest emailDispatched=false + mailtoUrl
    const noRelayRes = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        mentorId,
        subjectId: 'math',
        targetTrack: 'ap_stem',
        learnerEmail: STUDENT_CONTACT_EMAIL,
        goalDescription: 'Master Taylor remainder bounds and polar integration in 4 weeks.',
        initialMessage: 'Hello Dr. Ramanujan, could we review AP Calculus BC infinite series together?',
        preferredCadence: 'weekly',
      });

    expect(noRelayRes.status).toBe(201);
    expect(noRelayRes.body.emailDispatched).toBe(false);
    expect(noRelayRes.body.mentorEmail).toBe(MENTOR_EMAIL);
    expect(noRelayRes.body.mailtoUrl).toContain(`mailto:${encodeURIComponent(MENTOR_EMAIL)}`);

    // Cancel first pending request so student can submit a fresh request with live email relay active
    const cancelRes = await request(app)
      .post(`/api/mentorship/requests/${noRelayRes.body.request.id}/cancel`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(cancelRes.status).toBe(200);

    // 2. With RESEND_API_KEY configured: verify outbound Resend email includes mentor email, reply_to student, and signed Yes link
    process.env.RESEND_API_KEY = 're_test_live_stub';
    process.env.MAIL_FROM = 'Learn.co <no-reply@learnco.test>';

    const capturedEmails: Array<{ url: string; payload: any }> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url === 'https://api.resend.com/emails') {
        capturedEmails.push({ url, payload: JSON.parse(init.body) });
        return new Response(JSON.stringify({ id: 'resend-msg-1' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Unexpected external fetch in test: ${url}`);
    });

    const reqRes = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        mentorId,
        subjectId: 'math',
        targetTrack: 'ap_stem',
        learnerEmail: STUDENT_CONTACT_EMAIL,
        goalDescription: 'Prepare for AP Calculus BC free-response questions on differential equations.',
        initialMessage: 'Looking forward to structured guidance on Euler method and logistic models.',
        preferredCadence: 'biweekly',
      });

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.emailDispatched).toBe(true);
    expect(reqRes.body.emailProvider).toBe('resend');
    expect(capturedEmails).toHaveLength(1);

    const mentorMail = capturedEmails[0].payload;
    expect(mentorMail.to).toEqual([MENTOR_EMAIL]);
    expect(mentorMail.reply_to).toBe(STUDENT_CONTACT_EMAIL);

    const acceptMatch = String(mentorMail.text).match(/YES, Accept Student:\s*(https?:\/\/[^\s]+)/);
    expect(acceptMatch).toBeTruthy();
    const acceptUrl = new URL(acceptMatch![1]);
    const requestId = reqRes.body.request.id;

    // Student cannot self-accept via API
    const selfAccept = await request(app)
      .post(`/api/mentorship/requests/${requestId}/respond`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ action: 'ACCEPT' });
    expect(selfAccept.status).toBe(403);

    // Tampered token is rejected
    const badToken = await request(app)
      .post(`/api/mentorship/requests/${requestId}/email-respond`)
      .send({ token: 'tampered.token', action: 'ACCEPT' });
    expect(badToken.status).toBe(400);

    // GET confirmation page renders "Yes, Accept Student" form safely without auto-mutating
    const confirmPage = await request(app).get(`${acceptUrl.pathname}${acceptUrl.search}`);
    expect(confirmPage.status).toBe(200);
    expect(confirmPage.text).toContain('Yes, Accept Student');

    // Mentor clicks Yes (POST form / email action) -> creates active relationship & emails student
    const tokenParam = acceptUrl.searchParams.get('token')!;
    const acceptExec = await request(app)
      .post(`/api/mentorship/requests/${requestId}/email-respond`)
      .set('Accept', 'application/json')
      .send({ token: tokenParam, action: 'ACCEPT' });

    expect(acceptExec.status).toBe(200);
    expect(acceptExec.body.success).toBe(true);
    expect(acceptExec.body.request.status).toBe('ACCEPTED');
    expect(acceptExec.body.request.learnerEmail).toBe(STUDENT_CONTACT_EMAIL);
    expect(acceptExec.body.relationship).toBeTruthy();
    expect(acceptExec.body.relationship.status).toBe('ACTIVE');
    expect(acceptExec.body.relationship.mentorId).toBe(mentorId);
    expect(acceptExec.body.emailDispatched).toBe(true);
    expect(capturedEmails).toHaveLength(2);
    expect(capturedEmails[1].payload.to).toEqual([STUDENT_CONTACT_EMAIL]);

    // Repeat click is safely idempotent
    const repeatExec = await request(app)
      .post(`/api/mentorship/requests/${requestId}/email-respond`)
      .set('Accept', 'application/json')
      .send({ token: tokenParam, action: 'ACCEPT' });
    expect(repeatExec.status).toBe(200);
    expect(repeatExec.body.alreadyProcessed).toBe(true);
  });
});
