// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import http from 'http';
import request from 'supertest';
import WebSocket from 'ws';
import { createApp } from '../server';
import { Database } from '../server/db';
import {
  AdaptiveAnalyticsEngine,
  MAX_ANALYTICS_CACHE_ENTRIES,
  clearAnalyticsCache,
  getAnalyticsCacheStats,
} from '../server/services/adaptiveAnalyticsEngine';
import { studyRoomHub, computeRemainingSec } from '../server/services/studyRoomHub';
import { calculateNextSM2Review, SM2CardState } from '../src/utils/spacedRepetition';

describe('Security, Analytics Cache, SM-2, and Real-Time Study Rooms', () => {
  beforeEach(() => {
    clearAnalyticsCache();
    studyRoomHub.resetForTests();
  });

  it('blocks direct client calls to POST /api/gamification/award-xp with 403', async () => {
    const app = await createApp();
    createRequire(import.meta.url)('../middleware/auth').setSessionResolver((value: string) =>
      Database.getSessionUser(value)
    );
    const signup = await request(app).post('/api/auth/signup').send({
      email: `xp_guard_${Date.now()}@example.com`,
      password: 'Password123!',
      fullName: 'XP Guard Tester',
    });
    expect(signup.status).toBe(201);
    const token = signup.body.token;

    const res = await request(app)
      .post('/api/gamification/award-xp')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'publishCourse', metadata: { count: 100 } });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_CLIENT_XP_AWARD');
  });

  it('requires the private room ticket even when an attacker knows the host peer id', async () => {
    const app = await createApp();
    const created = await request(app).post('/api/study-rooms').send({
      title: 'Private', topic: 'Study', visibility: 'private',
      roomCode: 'PRIVATE-1', password: 'long-password', peerId: 'known-host',
    });
    expect(created.status).toBe(201);
    const { room, accessTicket } = created.body;
    const withoutTicket = await request(app).get(`/api/study-rooms/${room.id}`).query({ peerId: 'known-host' });
    expect(withoutTicket.status).toBe(403);
    const catalog = await request(app).get('/api/study-rooms').query({ peerId: 'known-host' });
    expect(catalog.body.rooms.find((entry: any) => entry.id === room.id).isLocked).toBe(true);
    const withTicket = await request(app).get(`/api/study-rooms/${room.id}`).query({ peerId: 'known-host' }).set('x-room-ticket', accessTicket);
    expect(withTicket.status).toBe(200);
    expect(withTicket.body.room.isLocked).toBe(false);
    expect(studyRoomHub.joinPeer(room.id, { peerId: 'known-host', displayName: 'Spoof', color: '#000', joinedAt: '' })).toBeNull();
    expect(studyRoomHub.joinPeer(room.id, { peerId: 'known-host', displayName: 'Host', color: '#000', joinedAt: '' }, accessTicket)?.isLocked).toBe(false);
  });

  it('bounds analyticsCache to MAX_ANALYTICS_CACHE_ENTRIES without unbounded heap growth', () => {
    // Populate beyond MAX_ANALYTICS_CACHE_ENTRIES using distinct user IDs
    const totalCalls = MAX_ANALYTICS_CACHE_ENTRIES + 25;
    for (let i = 0; i < totalCalls; i++) {
      const uid = `cache-bound-user-${i}`;
      AdaptiveAnalyticsEngine.getDashboard(uid);
    }

    const stats = getAnalyticsCacheStats();
    expect(stats.size).toBeLessThanOrEqual(MAX_ANALYTICS_CACHE_ENTRIES);
    expect(stats.size).toBe(MAX_ANALYTICS_CACHE_ENTRIES);
  });

  it('computes accurate SuperMemo SM-2 intervals and resets on Again', () => {
    const now = new Date('2026-11-21T10:00:00.000Z');
    const baseCard: SM2CardState = {
      conceptId: 'calc-derivatives-chain',
      conceptTitle: 'Chain Rule',
      subjectId: 'math',
      repetitions: 0,
      intervalDays: 1,
      easeFactor: 2.5,
      nextReviewAt: now.toISOString(),
      lastReviewedAt: now.toISOString(),
      lastQuality: null,
    };

    const step1 = calculateNextSM2Review(baseCard, 4, now);
    expect(step1.repetitions).toBe(1);
    expect(step1.intervalDays).toBe(1);

    const step2 = calculateNextSM2Review(step1, 4, now);
    expect(step2.repetitions).toBe(2);
    expect(step2.intervalDays).toBe(6);

    const step3 = calculateNextSM2Review(step2, 5, now);
    expect(step3.repetitions).toBe(3);
    expect(step3.intervalDays).toBeGreaterThanOrEqual(14);
    expect(step3.easeFactor).toBeGreaterThan(2.5);

    // Again (quality 0) resets repetitions and schedules 1-day retry
    const failed = calculateNextSM2Review(step3, 0, now);
    expect(failed.repetitions).toBe(0);
    expect(failed.intervalDays).toBe(1);
    expect(failed.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('synchronizes Study Room presence, chat (idempotent), timer, and polls over real WebSockets', async () => {
    const app = await createApp();
    const server = http.createServer(app);
    studyRoomHub.attachWebSocketServer(server);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as { port: number };
    const baseUrl = `http://127.0.0.1:${addr.port}`;
    const wsBase = `ws://127.0.0.1:${addr.port}/ws/study-rooms`;

    try {
      // Create a room via REST
      const createRes = await fetch(`${baseUrl}/api/study-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Quantum Audit Room', topic: 'Wave Functions' }),
      });
      expect(createRes.status).toBe(201);
      const { room: createdRoom } = await createRes.json();
      expect(createdRoom.title).toBe('Quantum Audit Room');

      const ws1 = new WebSocket(`${wsBase}?peerId=peer-a&name=Alice`);
      const ws2 = new WebSocket(`${wsBase}?peerId=peer-b&name=Bob`);

      const waitForOpen = (ws: WebSocket) =>
        new Promise<void>((resolve, reject) => {
          ws.once('open', () => resolve());
          ws.once('error', reject);
        });

      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      const ws2Events: any[] = [];
      ws2.on('message', (raw) => {
        try {
          ws2Events.push(JSON.parse(raw.toString()));
        } catch {
          // ignore
        }
      });

      // Join both peers to createdRoom
      ws1.send(JSON.stringify({ type: 'room:join', roomId: createdRoom.id, displayName: 'Alice' }));
      ws2.send(JSON.stringify({ type: 'room:join', roomId: createdRoom.id, displayName: 'Bob' }));

      // Wait briefly for joins to propagate
      await new Promise((r) => setTimeout(r, 100));

      // Send duplicate chat message with same id -> should only be stored/broadcast once
      ws1.send(JSON.stringify({ type: 'chat:send', roomId: createdRoom.id, id: 'dup-1', text: 'Hello Bob!' }));
      ws1.send(JSON.stringify({ type: 'chat:send', roomId: createdRoom.id, id: 'dup-1', text: 'Hello Bob!' }));

      // Start synced Pomodoro timer and launch + vote poll
      ws1.send(JSON.stringify({ type: 'timer:control', roomId: createdRoom.id, action: 'start' }));
      ws1.send(
        JSON.stringify({
          type: 'poll:create',
          roomId: createdRoom.id,
          id: 'poll-q1',
          question: 'Best ODE solver?',
          options: ['RK4', 'Euler'],
        })
      );
      await new Promise((r) => setTimeout(r, 80));
      ws2.send(
        JSON.stringify({
          type: 'poll:vote',
          roomId: createdRoom.id,
          pollId: 'poll-q1',
          optionIndex: 0,
        })
      );

      await new Promise((r) => setTimeout(r, 120));

      // Verify state via REST endpoint
      const roomRes = await fetch(`${baseUrl}/api/study-rooms/${createdRoom.id}`);
      const { room: synced } = await roomRes.json();

      expect(synced.peerCount).toBe(2);
      expect(synced.messages.filter((m: any) => m.id === 'dup-1')).toHaveLength(1);
      expect(synced.timer.isRunning).toBe(true);
      expect(computeRemainingSec(synced.timer)).toBeLessThanOrEqual(25 * 60);
      expect(synced.activePoll?.votes?.[0]).toContain('peer-b');
      expect(ws2Events.some((e) => e.type === 'chat:message' && e.message.text === 'Hello Bob!')).toBe(true);

      ws1.close();
      ws2.close();
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
