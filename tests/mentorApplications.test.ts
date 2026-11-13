import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;
let studentToken: string;
let ownerToken: string;

const STUDENT_EMAIL = `mentor_applicant_${Date.now()}@learn.co`;
const OWNER_EMAIL = 'yamsaniruhan@gmail.com';
const PASSWORD = 'Str0ngPass!23';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  const mod = await import('../server.js');
  app = await mod.createApp();

  // Create regular student user
  const studentRes = await request(app)
    .post('/api/auth/signup')
    .send({ email: STUDENT_EMAIL, password: PASSWORD, fullName: 'Ada Applicant' });
  expect(studentRes.status).toBe(201);
  expect(studentRes.body.user.role).toBe('student');
  studentToken = studentRes.body.token;

  // Sign up or sign in as platform owner
  const ownerSignupRes = await request(app)
    .post('/api/auth/signup')
    .send({ email: OWNER_EMAIL, password: PASSWORD, fullName: 'Ruhan Yamsani' });

  if (ownerSignupRes.status === 201) {
    ownerToken = ownerSignupRes.body.token;
    expect(ownerSignupRes.body.user.role).toBe('admin');
  } else {
    const ownerSigninRes = await request(app)
      .post('/api/auth/signin')
      .send({ email: OWNER_EMAIL, password: PASSWORD });
    expect(ownerSigninRes.status).toBe(200);
    ownerToken = ownerSigninRes.body.token;
    expect(ownerSigninRes.body.user.role).toBe('admin');
  }
}, 60_000);

describe('Mentor applications workflow & owner routing', () => {
  let submittedAppId: string;

  it('rejects unauthenticated mentor application submissions', async () => {
    const res = await request(app)
      .post('/api/mentorship/applications')
      .send({
        fullName: 'Anon User',
        degree: 'Ph.D Physics',
        institution: 'Test Uni',
        subjectId: 'physics',
        experienceYears: 3,
        capacity: 5,
        bio: 'I want to teach physics concepts.',
      });
    expect(res.status).toBe(401);
  });

  it('rejects direct mentor profile creation by an unapproved student', async () => {
    const res = await request(app)
      .post('/api/mentorship/mentors/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Self Promoted Mentor', bio: 'Bypass attempt' });
    expect(res.status).toBe(403);
  });

  it('validates application input and submits directly to yamsaniruhan@gmail.com', async () => {
    const badRes = await request(app)
      .post('/api/mentorship/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ fullName: 'A', degree: '', institution: '', bio: 'short' });
    expect(badRes.status).toBe(400);

    const res = await request(app)
      .post('/api/mentorship/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        fullName: 'Ada Applicant',
        degree: 'M.Sc Applied Mathematics',
        institution: 'Institute of STEM Research',
        subjectId: 'math',
        experienceYears: 4,
        capacity: 6,
        hourlyRate: 0,
        bio: 'Specializing in Socratic calculus derivations and linear algebra proofs for exam mastery.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.routedToEmail).toBe(OWNER_EMAIL);
    expect(res.body.application.status).toBe('PENDING');
    expect(res.body.application.routedToEmail).toBe(OWNER_EMAIL);
    expect(res.body.application.applicantEmail).toBe(STUDENT_EMAIL);
    submittedAppId = res.body.application.id;
  });

  it('allows the applicant to view their own submitted applications but forbids viewing all applications', async () => {
    const mineRes = await request(app)
      .get('/api/mentorship/applications/mine')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(mineRes.status).toBe(200);
    expect(mineRes.body.applications.some((a: any) => a.id === submittedAppId)).toBe(true);

    const allForbiddenRes = await request(app)
      .get('/api/mentorship/applications')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(allForbiddenRes.status).toBe(403);

    const approveForbiddenRes = await request(app)
      .post(`/api/mentorship/applications/${submittedAppId}/decision`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ action: 'APPROVE' });
    expect(approveForbiddenRes.status).toBe(403);
  });

  it('allows platform owner (yamsaniruhan@gmail.com) to list all applications and approve the applicant into the Mentor directory', async () => {
    const listRes = await request(app)
      .get('/api/mentorship/applications')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.routedToEmail).toBe(OWNER_EMAIL);
    const found = listRes.body.applications.find((a: any) => a.id === submittedAppId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('PENDING');

    const decisionRes = await request(app)
      .post(`/api/mentorship/applications/${submittedAppId}/decision`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ action: 'APPROVE', note: 'Welcome to the STEM mentor roster!' });

    expect(decisionRes.status).toBe(200);
    expect(decisionRes.body.success).toBe(true);
    expect(decisionRes.body.application.status).toBe('APPROVED');
    expect(decisionRes.body.mentorProfile).toBeTruthy();

    // Applicant role is now educator and can update their mentor profile
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.role).toBe('educator');

    const mentorsRes = await request(app).get('/api/mentorship/mentors');
    expect(mentorsRes.status).toBe(200);
    expect(mentorsRes.body.mentors.some((m: any) => m.name === 'Ada Applicant')).toBe(true);
  });
});
