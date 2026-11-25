import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { CURRICULUM_DATA } from '../src/data/curriculumData';
import { MASTER_QUESTION_BANK } from '../server/data/questionBankData';
import { QuestionSelectionEngine } from '../server/services/questionSelectionEngine';

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock('../server/services/firebaseAdmin', () => ({ adminAuth: { verifyIdToken }, adminDb: null }));

let app: Express;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  const mod = await import('../server');
  app = await mod.createApp();
}, 60_000);

describe('Deployment health & root routing', () => {
  it('GET /health returns HTTP 200 ok payload', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('Learn.co');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /api/health returns HTTP 200 with sqlHydrated flag', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.sqlHydrated).toBe('boolean');
  });
});

describe('Study room deletion workflow & host authorization', () => {
  it('allows host to delete their created room, blocks non-hosts and system rooms, and handles 404', async () => {
    const hostPeer = `host-${Date.now()}`;
    const otherPeer = `other-${Date.now()}`;

    // Create a room as hostPeer
    const createRes = await request(app)
      .post('/api/study-rooms')
      .send({
        title: 'Deletable Quantum Seminar',
        topic: 'Quantum Tunneling',
        visibility: 'public',
        peerId: hostPeer,
        hostName: 'Host Scholar',
      });
    expect(createRes.status).toBe(201);
    const roomId = createRes.body.room.id;
    expect(createRes.body.room.isHost).toBe(true);

    // Non-host cannot delete
    const nonHostDel = await request(app)
      .delete(`/api/study-rooms/${encodeURIComponent(roomId)}?peerId=${encodeURIComponent(otherPeer)}`);
    expect(nonHostDel.status).toBe(403);

    // System room cannot be deleted
    const sysDel = await request(app)
      .delete(`/api/study-rooms/room-calculus?peerId=${encodeURIComponent(hostPeer)}`);
    expect(sysDel.status).toBe(403);

    // Host can delete their own room
    const hostDel = await request(app)
      .delete(`/api/study-rooms/${encodeURIComponent(roomId)}?peerId=${encodeURIComponent(hostPeer)}`);
    expect(hostDel.status).toBe(200);
    expect(hostDel.body.deletedRoomId).toBe(roomId);

    // Deleted room is absent from catalog and subsequent delete returns 404
    const listRes = await request(app).get(`/api/study-rooms?peerId=${encodeURIComponent(hostPeer)}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.rooms.some((r: any) => r.id === roomId)).toBe(false);

    const secondDel = await request(app)
      .delete(`/api/study-rooms/${encodeURIComponent(roomId)}?peerId=${encodeURIComponent(hostPeer)}`);
    expect(secondDel.status).toBe(404);
  });
});

describe('Comprehensive exam syllabus & >=100 multi-model subtopic drill generation', () => {
  it('covers JEE Advanced, JEE Main, AP Calculus, ICT, IPhO, IChO, IBO, and NSEJS', () => {
    const requiredTracks = ['jee_advanced', 'jee_main', 'ap_stem', 'ict_hackathon', 'iapt_exams', 'nsejs'];
    for (const track of requiredTracks) {
      const chaptersForTrack = CURRICULUM_DATA.flatMap((s) =>
        s.chapters.filter((c) => c.examTracks.includes(track as any))
      );
      expect(chaptersForTrack.length, `Missing chapters for track ${track}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('provides at least 100 problems with multiple question types and varied models on every topic', () => {
    const byTopic = new Map<string, typeof MASTER_QUESTION_BANK>();
    for (const q of MASTER_QUESTION_BANK) {
      const arr = byTopic.get(q.topicId) || [];
      arr.push(q);
      byTopic.set(q.topicId, arr);
    }

    for (const subject of CURRICULUM_DATA) {
      for (const chapter of subject.chapters) {
        for (const topic of chapter.topics) {
          const items = byTopic.get(topic.id) || [];
          expect(items.length, `Topic ${topic.id} has < 100 questions`).toBeGreaterThanOrEqual(100);
          const uniqueTypes = new Set(items.map((q) => q.questionType));
          expect(uniqueTypes.size, `Topic ${topic.id} lacks question type variety`).toBeGreaterThanOrEqual(4);
          const modelTags = new Set(items.flatMap((q) => q.tags.filter((t) => t.startsWith('Model-'))));
          expect(modelTags.size, `Topic ${topic.id} lacks multiple problem models`).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it('filters practice drills accurately down to Subject -> Topic -> Subtopic', () => {
    const picked = QuestionSelectionEngine.selectPracticeSession('test-subtopic-user', {
      subjectId: 'math',
      topicId: 'math-topic-jee-complex-numbers',
      subtopicId: 'math-sub-argand-de-moivre',
      questionCount: 8,
      difficultyMode: 'calibrated_ladder',
      timed: false,
    });
    expect(picked.length).toBe(8);
    expect(picked.every((q) => q.subjectId === 'math' && q.topicId === 'math-topic-jee-complex-numbers' && q.subtopicId === 'math-sub-argand-de-moivre')).toBe(true);
  });
});
