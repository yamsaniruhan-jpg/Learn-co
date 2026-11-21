import crypto from 'crypto';
import type http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export type PomodoroMode = 'focus' | 'short_break' | 'long_break';
export type RoomVisibility = 'public' | 'private';

export interface StudyRoomPeer {
  peerId: string;
  displayName: string;
  color: string;
  joinedAt: string;
}

export interface StudyRoomMessage {
  id: string;
  roomId: string;
  peerId: string;
  user: string;
  text: string;
  time: string;
  createdAt: number;
}

export interface StudyRoomTimerState {
  mode: PomodoroMode;
  durationSec: number;
  remainingSecAtPause: number;
  startedAtMs: number | null;
  isRunning: boolean;
  updatedBy: string;
}

export interface StudyRoomPoll {
  id: string;
  question: string;
  options: string[];
  /** Map of optionIndex -> array of peerIds who voted for it */
  votes: Record<number, string[]>;
  createdBy: string;
  createdAt: string;
}

export interface StudyRoomRecord {
  id: string;
  title: string;
  topic: string;
  color: string;
  visibility: RoomVisibility;
  roomCode: string;
  hostPeerId: string;
  hostName: string;
  passwordSalt: string | null;
  passwordHash: string | null;
  authorizedPeers: Set<string>;
  createdAt: string;
  messages: StudyRoomMessage[];
  timer: StudyRoomTimerState;
  activePoll: StudyRoomPoll | null;
}

export interface StudyRoomPublicState {
  id: string;
  title: string;
  topic: string;
  color: string;
  visibility: RoomVisibility;
  roomCode: string | null;
  hostName: string;
  isLocked: boolean;
  createdAt: string;
  peers: StudyRoomPeer[];
  peerCount: number;
  messages: StudyRoomMessage[];
  timer: StudyRoomTimerState;
  activePoll: StudyRoomPoll | null;
}

const MODE_DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const PEER_COLORS = ['#6C5CE7', '#00B8A9', '#F59E0B', '#EC4899', '#3B82F6', '#10B981'];
const MAX_ROOMS = 100;
const MAX_MESSAGES_PER_ROOM = 100;
const ROOM_TICKET_SECRET = process.env.STUDY_ROOM_SECRET || crypto.randomBytes(32).toString('hex');

function createDefaultTimer(): StudyRoomTimerState {
  return {
    mode: 'focus',
    durationSec: MODE_DURATIONS.focus,
    remainingSecAtPause: MODE_DURATIONS.focus,
    startedAtMs: null,
    isRunning: false,
    updatedBy: 'Room Timer',
  };
}

function sanitizeText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

export function normalizeRoomCode(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 16);
}

export function generateRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return `LC-${suffix}`;
}

function hashPassword(password: string, saltHex?: string): { salt: string; hash: string } {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPasswordHash(password: string, salt: string, expectedHashHex: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHashHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function createAccessTicket(roomId: string, peerId: string): string {
  const payload = `${roomId}:${peerId}`;
  const sig = crypto.createHmac('sha256', ROOM_TICKET_SECRET).update(payload).digest('hex');
  return sig;
}

export function verifyAccessTicket(roomId: string, peerId: string, ticket?: string | null): boolean {
  if (!ticket || !roomId || !peerId) return false;
  try {
    const expected = Buffer.from(createAccessTicket(roomId, peerId), 'hex');
    const actual = Buffer.from(String(ticket).trim(), 'hex');
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function computeRemainingSec(timer: StudyRoomTimerState, nowMs = Date.now()): number {
  if (!timer.isRunning || timer.startedAtMs === null) {
    return Math.max(0, Math.min(timer.durationSec, Math.round(timer.remainingSecAtPause)));
  }
  const elapsedSec = Math.floor((nowMs - timer.startedAtMs) / 1000);
  return Math.max(0, timer.remainingSecAtPause - elapsedSec);
}

const DEFAULT_ROOMS_SEED: Array<{ id: string; title: string; topic: string; color: string; welcome: string; roomCode: string }> = [
  {
    id: 'room-calculus',
    title: 'Advanced Calculus & 3D Surfaces',
    topic: 'Multivariable Optimization & Lagrange Multipliers',
    color: 'indigo',
    roomCode: 'CALC-101',
    welcome: 'Calculus collaboration room ready. Sync the Pomodoro timer or post a derivation question!',
  },
  {
    id: 'room-physics',
    title: 'Classical Mechanics & Oscillators',
    topic: 'Phase Space Dynamics & Lagrangians',
    color: 'amber',
    roomCode: 'PHYS-201',
    welcome: 'Physics study cohort active. Share invariants or launch a timed focus sprint.',
  },
  {
    id: 'room-chem',
    title: 'Organic Chemistry SN2 & Stereochemistry',
    topic: 'Walden Inversion & Reaction Coordinates',
    color: 'rose',
    roomCode: 'CHEM-301',
    welcome: 'Chemistry room open for mechanism discussions and spaced-review sprints.',
  },
  {
    id: 'room-cs',
    title: 'Algorithms & Machine Learning',
    topic: 'Dynamic Programming & Gradient Descent',
    color: 'purple',
    roomCode: 'ALGO-401',
    welcome: 'CS & AI room ready. Share Big-O proofs, code invariants, or start a synchronized sprint.',
  },
];

interface ClientConnection {
  ws: WebSocket;
  peer: StudyRoomPeer;
  roomId: string | null;
}

class StudyRoomHubService {
  private rooms = new Map<string, StudyRoomRecord>();
  private roomPeers = new Map<string, Map<string, StudyRoomPeer>>();
  private clients = new Set<ClientConnection>();
  private wss: WebSocketServer | null = null;

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const now = new Date().toISOString();
    for (const seed of DEFAULT_ROOMS_SEED) {
      if (!this.rooms.has(seed.id)) {
        this.rooms.set(seed.id, {
          id: seed.id,
          title: seed.title,
          topic: seed.topic,
          color: seed.color,
          visibility: 'public',
          roomCode: seed.roomCode,
          hostPeerId: 'system',
          hostName: 'LearnCo Faculty',
          passwordSalt: null,
          passwordHash: null,
          authorizedPeers: new Set(),
          createdAt: now,
          messages: [
            {
              id: `sys-${seed.id}`,
              roomId: seed.id,
              peerId: 'system',
              user: 'Room Host',
              text: seed.welcome,
              time: 'Host',
              createdAt: Date.now(),
            },
          ],
          timer: createDefaultTimer(),
          activePoll: null,
        });
        this.roomPeers.set(seed.id, new Map());
      }
    }
  }

  canAccessRoom(roomId: string, peerId?: string | null, ticket?: string | null): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.visibility === 'public') return true;
    if (!peerId) return false;
    if (room.hostPeerId === peerId || room.authorizedPeers.has(peerId)) return true;
    return verifyAccessTicket(roomId, peerId, ticket);
  }

  listRooms(viewerPeerId?: string | null): StudyRoomPublicState[] {
    return Array.from(this.rooms.values()).map((r) => this.serializeRoom(r, viewerPeerId));
  }

  getRoom(roomId: string, viewerPeerId?: string | null, ticket?: string | null): StudyRoomPublicState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return this.serializeRoom(room, viewerPeerId, ticket);
  }

  createRoom(
    titleRaw: string,
    topicRaw: string,
    color = 'indigo',
    options?: {
      visibility?: RoomVisibility;
      roomCode?: string;
      password?: string;
      hostPeerId?: string;
      hostName?: string;
    }
  ): { room: StudyRoomPublicState; accessTicket: string | null } {
    const title = sanitizeText(titleRaw, 80);
    const topic = sanitizeText(topicRaw, 100);
    if (!title || !topic) {
      throw new Error('Room title and topic are required.');
    }

    const visibility: RoomVisibility = options?.visibility === 'private' ? 'private' : 'public';
    let passwordSalt: string | null = null;
    let passwordHash: string | null = null;

    if (visibility === 'private') {
      const password = typeof options?.password === 'string' ? options.password.trim() : '';
      if (password.length < 4 || password.length > 64) {
        throw new Error('Private rooms require a password between 4 and 64 characters.');
      }
      const hashed = hashPassword(password);
      passwordSalt = hashed.salt;
      passwordHash = hashed.hash;
    }

    let roomCode = normalizeRoomCode(options?.roomCode);
    if (roomCode && roomCode.length < 4) {
      throw new Error('Room code must be 4-16 alphanumeric characters or hyphens.');
    }
    if (!roomCode) {
      roomCode = generateRoomCode();
    }

    // Ensure unique room code among existing rooms
    const existingWithCode = Array.from(this.rooms.values()).find((r) => r.roomCode === roomCode);
    if (existingWithCode) {
      if (options?.roomCode) {
        throw new Error('That room code is already in use. Choose another code.');
      }
      roomCode = generateRoomCode();
    }

    if (this.rooms.size >= MAX_ROOMS) {
      const defaultIds = new Set(DEFAULT_ROOMS_SEED.map((d) => d.id));
      for (const [id] of this.rooms.entries()) {
        if (!defaultIds.has(id) && (this.roomPeers.get(id)?.size || 0) === 0) {
          this.rooms.delete(id);
          this.roomPeers.delete(id);
          break;
        }
      }
    }

    const hostPeerId = sanitizeText(options?.hostPeerId, 64) || `host-${Date.now()}`;
    const hostName = sanitizeText(options?.hostName, 40) || 'Room Host';
    const id = `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const authorizedPeers = new Set<string>();
    if (hostPeerId) authorizedPeers.add(hostPeerId);

    const room: StudyRoomRecord = {
      id,
      title,
      topic,
      color: ['indigo', 'amber', 'rose', 'purple', 'emerald'].includes(color) ? color : 'indigo',
      visibility,
      roomCode,
      hostPeerId,
      hostName,
      passwordSalt,
      passwordHash,
      authorizedPeers,
      createdAt: new Date().toISOString(),
      messages: [],
      timer: createDefaultTimer(),
      activePoll: null,
    };

    this.rooms.set(id, room);
    this.roomPeers.set(id, new Map());

    const serialized = this.serializeRoom(room, hostPeerId);
    const accessTicket = visibility === 'private' ? createAccessTicket(id, hostPeerId) : null;
    // Broadcast global room list with private room details redacted for peers
    this.broadcastRoomsCatalog();
    return { room: serialized, accessTicket };
  }

  joinPrivateRoom(params: {
    roomCode: string;
    password: string;
    roomId?: string;
    peerId: string;
    displayName?: string;
  }): { room: StudyRoomPublicState; accessTicket: string } {
    const cleanCode = normalizeRoomCode(params.roomCode);
    const password = typeof params.password === 'string' ? params.password.trim() : '';
    const peerId = sanitizeText(params.peerId, 64);

    if (!cleanCode || !password || !peerId) {
      throw new Error('Room code, password, and peer identity are required.');
    }

    const room = params.roomId
      ? this.rooms.get(params.roomId)
      : Array.from(this.rooms.values()).find((r) => r.roomCode === cleanCode);

    if (!room) {
      const err = new Error('Study room with that code was not found.');
      (err as any).statusCode = 404;
      throw err;
    }

    if (room.roomCode !== cleanCode) {
      const err = new Error('Invalid room code.');
      (err as any).statusCode = 403;
      throw err;
    }

    if (room.visibility === 'private') {
      if (!room.passwordSalt || !room.passwordHash || !verifyPasswordHash(password, room.passwordSalt, room.passwordHash)) {
        const err = new Error('Incorrect private room password.');
        (err as any).statusCode = 403;
        throw err;
      }
    }

    room.authorizedPeers.add(peerId);
    const accessTicket = createAccessTicket(room.id, peerId);
    return {
      room: this.serializeRoom(room, peerId, accessTicket),
      accessTicket,
    };
  }

  private serializeRoom(room: StudyRoomRecord, viewerPeerId?: string | null, ticket?: string | null): StudyRoomPublicState {
    const peersMap = this.roomPeers.get(room.id);
    const peers = peersMap ? Array.from(peersMap.values()) : [];
    const remaining = computeRemainingSec(room.timer);
    const timerSnapshot: StudyRoomTimerState =
      room.timer.isRunning && remaining === 0
        ? {
            ...room.timer,
            remainingSecAtPause: 0,
            startedAtMs: null,
            isRunning: false,
          }
        : room.timer;
    room.timer = timerSnapshot;

    const authorized =
      room.visibility === 'public' ||
      (Boolean(viewerPeerId) &&
        (room.hostPeerId === viewerPeerId ||
          room.authorizedPeers.has(viewerPeerId!) ||
          verifyAccessTicket(room.id, viewerPeerId!, ticket)));

    if (!authorized) {
      return {
        id: room.id,
        title: room.title,
        topic: room.topic,
        color: room.color,
        visibility: room.visibility,
        roomCode: null,
        hostName: room.hostName,
        isLocked: true,
        createdAt: room.createdAt,
        peers: [],
        peerCount: peers.length,
        messages: [],
        timer: createDefaultTimer(),
        activePoll: null,
      };
    }

    return {
      id: room.id,
      title: room.title,
      topic: room.topic,
      color: room.color,
      visibility: room.visibility,
      roomCode: room.roomCode,
      hostName: room.hostName,
      isLocked: false,
      createdAt: room.createdAt,
      peers,
      peerCount: peers.length,
      messages: room.messages,
      timer: timerSnapshot,
      activePoll: room.activePoll,
    };
  }

  private broadcastRoomsCatalog() {
    for (const client of this.clients) {
      this.sendSafe(client.ws, {
        type: 'rooms:list',
        rooms: this.listRooms(client.peer.peerId),
      });
    }
  }

  joinPeer(roomId: string, peer: StudyRoomPeer, accessTicket?: string | null): StudyRoomPublicState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (!this.canAccessRoom(roomId, peer.peerId, accessTicket)) {
      return null;
    }
    if (accessTicket && verifyAccessTicket(roomId, peer.peerId, accessTicket)) {
      room.authorizedPeers.add(peer.peerId);
    }

    let peersMap = this.roomPeers.get(roomId);
    if (!peersMap) {
      peersMap = new Map();
      this.roomPeers.set(roomId, peersMap);
    }
    peersMap.set(peer.peerId, peer);
    const state = this.serializeRoom(room, peer.peerId);
    this.broadcastToRoom(roomId, {
      type: 'room:presence',
      roomId,
      peers: state.peers,
      peerCount: state.peerCount,
    });
    this.broadcastRoomsCatalog();
    return state;
  }

  leavePeer(roomId: string, peerId: string) {
    const peersMap = this.roomPeers.get(roomId);
    if (!peersMap || !peersMap.has(peerId)) return;
    peersMap.delete(peerId);
    const peers = Array.from(peersMap.values());
    this.broadcastToRoom(roomId, {
      type: 'room:presence',
      roomId,
      peers,
      peerCount: peers.length,
    });
    this.broadcastRoomsCatalog();
  }

  addMessage(roomId: string, msgId: string, peerId: string, user: string, textRaw: string): StudyRoomMessage | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const text = sanitizeText(textRaw, 600);
    if (!text) return null;

    const safeId = sanitizeText(msgId, 80) || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const existing = room.messages.find((m) => m.id === safeId);
    if (existing) return existing;

    const message: StudyRoomMessage = {
      id: safeId,
      roomId,
      peerId,
      user: sanitizeText(user, 40) || 'Scholar',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
    };

    room.messages.push(message);
    if (room.messages.length > MAX_MESSAGES_PER_ROOM) {
      room.messages = room.messages.slice(-MAX_MESSAGES_PER_ROOM);
    }

    this.broadcastToRoom(roomId, { type: 'chat:message', roomId, message });
    return message;
  }

  controlTimer(
    roomId: string,
    action: 'start' | 'pause' | 'reset' | 'set_mode',
    actorName: string,
    mode?: PomodoroMode
  ): StudyRoomTimerState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const now = Date.now();
    const safeActor = sanitizeText(actorName, 40) || 'Peer';
    const currentRemaining = computeRemainingSec(room.timer, now);

    if (action === 'set_mode' && mode && MODE_DURATIONS[mode]) {
      const dur = MODE_DURATIONS[mode];
      room.timer = {
        mode,
        durationSec: dur,
        remainingSecAtPause: dur,
        startedAtMs: null,
        isRunning: false,
        updatedBy: safeActor,
      };
    } else if (action === 'reset') {
      const dur = MODE_DURATIONS[room.timer.mode] || MODE_DURATIONS.focus;
      room.timer = {
        ...room.timer,
        durationSec: dur,
        remainingSecAtPause: dur,
        startedAtMs: null,
        isRunning: false,
        updatedBy: safeActor,
      };
    } else if (action === 'start') {
      const startFrom = currentRemaining > 0 ? currentRemaining : room.timer.durationSec;
      room.timer = {
        ...room.timer,
        remainingSecAtPause: startFrom,
        startedAtMs: now,
        isRunning: true,
        updatedBy: safeActor,
      };
    } else if (action === 'pause') {
      room.timer = {
        ...room.timer,
        remainingSecAtPause: currentRemaining,
        startedAtMs: null,
        isRunning: false,
        updatedBy: safeActor,
      };
    }

    this.broadcastToRoom(roomId, {
      type: 'timer:update',
      roomId,
      timer: room.timer,
    });
    return room.timer;
  }

  createPoll(
    roomId: string,
    pollId: string,
    questionRaw: string,
    optionsRaw: string[],
    createdBy: string
  ): StudyRoomPoll | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const question = sanitizeText(questionRaw, 200);
    const options = (Array.isArray(optionsRaw) ? optionsRaw : [])
      .map((o) => sanitizeText(o, 80))
      .filter(Boolean)
      .slice(0, 4);

    if (!question || options.length < 2) return null;

    const safeId = sanitizeText(pollId, 80) || `poll-${Date.now()}`;
    if (room.activePoll && room.activePoll.id === safeId) {
      return room.activePoll;
    }

    const votes: Record<number, string[]> = {};
    options.forEach((_, idx) => {
      votes[idx] = [];
    });

    const poll: StudyRoomPoll = {
      id: safeId,
      question,
      options,
      votes,
      createdBy: sanitizeText(createdBy, 40) || 'Scholar',
      createdAt: new Date().toISOString(),
    };

    room.activePoll = poll;
    this.broadcastToRoom(roomId, { type: 'poll:update', roomId, activePoll: poll });
    return poll;
  }

  votePoll(roomId: string, pollId: string, optionIndex: number, peerId: string): StudyRoomPoll | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.activePoll || room.activePoll.id !== pollId) return null;
    if (optionIndex < 0 || optionIndex >= room.activePoll.options.length) return null;

    const votes = room.activePoll.votes;
    for (const key of Object.keys(votes)) {
      const idx = Number(key);
      votes[idx] = (votes[idx] || []).filter((id) => id !== peerId);
    }
    votes[optionIndex] = [...(votes[optionIndex] || []), peerId];

    this.broadcastToRoom(roomId, {
      type: 'poll:update',
      roomId,
      activePoll: room.activePoll,
    });
    return room.activePoll;
  }

  private sendSafe(ws: WebSocket, payload: unknown) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  private broadcastToRoom(roomId: string, payload: unknown) {
    for (const client of this.clients) {
      if (client.roomId === roomId) {
        this.sendSafe(client.ws, payload);
      }
    }
  }

  attachWebSocketServer(server: http.Server): WebSocketServer {
    if (this.wss) {
      return this.wss;
    }

    const wss = new WebSocketServer({ noServer: true });
    this.wss = wss;

    server.on('upgrade', (request, socket, head) => {
      const urlPath = (request.url || '').split('?')[0];
      if (urlPath !== '/ws/study-rooms') {
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

    wss.on('connection', (ws, request) => {
      const urlObj = new URL(request.url || '/ws/study-rooms', 'http://localhost');
      const peerId =
        sanitizeText(urlObj.searchParams.get('peerId'), 64) ||
        `peer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const displayName = sanitizeText(urlObj.searchParams.get('name'), 40) || 'Scholar';
      const color = PEER_COLORS[Math.abs(peerId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % PEER_COLORS.length];

      const conn: ClientConnection = {
        ws,
        roomId: null,
        peer: {
          peerId,
          displayName,
          color,
          joinedAt: new Date().toISOString(),
        },
      };
      this.clients.add(conn);

      this.sendSafe(ws, { type: 'rooms:list', rooms: this.listRooms(conn.peer.peerId), selfPeer: conn.peer });

      ws.on('message', (raw) => {
        let data: any;
        try {
          data = JSON.parse(raw.toString());
        } catch {
          return;
        }
        if (!data || typeof data.type !== 'string') return;

        switch (data.type) {
          case 'room:join': {
            const targetRoomId = sanitizeText(data.roomId, 80);
            if (!targetRoomId || !this.rooms.has(targetRoomId)) return;
            const accessTicket = typeof data.accessTicket === 'string' ? data.accessTicket : null;

            if (!this.canAccessRoom(targetRoomId, conn.peer.peerId, accessTicket)) {
              this.sendSafe(ws, {
                type: 'room:error',
                code: 'PRIVATE_ROOM_LOCKED',
                roomId: targetRoomId,
                error: 'Room code and password are required to join this private study room.',
              });
              return;
            }

            if (conn.roomId && conn.roomId !== targetRoomId) {
              this.leavePeer(conn.roomId, conn.peer.peerId);
            }
            if (typeof data.displayName === 'string' && sanitizeText(data.displayName, 40)) {
              conn.peer.displayName = sanitizeText(data.displayName, 40);
            }
            conn.roomId = targetRoomId;
            const state = this.joinPeer(targetRoomId, conn.peer, accessTicket);
            if (state) {
              this.sendSafe(ws, { type: 'room:state', room: state });
            }
            break;
          }
          case 'room:leave': {
            if (conn.roomId) {
              this.leavePeer(conn.roomId, conn.peer.peerId);
              conn.roomId = null;
            }
            break;
          }
          case 'chat:send': {
            const targetRoomId = sanitizeText(data.roomId, 80) || conn.roomId;
            if (!targetRoomId || !this.rooms.has(targetRoomId)) return;
            if (!this.canAccessRoom(targetRoomId, conn.peer.peerId)) {
              this.sendSafe(ws, {
                type: 'room:error',
                code: 'PRIVATE_ROOM_LOCKED',
                roomId: targetRoomId,
                error: 'Unauthorized to post messages in this private study room.',
              });
              return;
            }
            this.addMessage(targetRoomId, data.id, conn.peer.peerId, conn.peer.displayName, data.text);
            break;
          }
          case 'timer:control': {
            const targetRoomId = sanitizeText(data.roomId, 80) || conn.roomId;
            if (!targetRoomId || !this.canAccessRoom(targetRoomId, conn.peer.peerId)) return;
            if (['start', 'pause', 'reset', 'set_mode'].includes(data.action)) {
              this.controlTimer(targetRoomId, data.action, conn.peer.displayName, data.mode);
            }
            break;
          }
          case 'poll:create': {
            const targetRoomId = sanitizeText(data.roomId, 80) || conn.roomId;
            if (!targetRoomId || !this.canAccessRoom(targetRoomId, conn.peer.peerId)) return;
            this.createPoll(targetRoomId, data.id, data.question, data.options, conn.peer.displayName);
            break;
          }
          case 'poll:vote': {
            const targetRoomId = sanitizeText(data.roomId, 80) || conn.roomId;
            if (!targetRoomId || !this.canAccessRoom(targetRoomId, conn.peer.peerId)) return;
            this.votePoll(targetRoomId, data.pollId, Number(data.optionIndex), conn.peer.peerId);
            break;
          }
          case 'ping': {
            this.sendSafe(ws, { type: 'pong', now: Date.now() });
            break;
          }
        }
      });

      ws.on('close', () => {
        if (conn.roomId) {
          this.leavePeer(conn.roomId, conn.peer.peerId);
        }
        this.clients.delete(conn);
      });
    });

    return wss;
  }

  /** Helper for tests to reset room state cleanly */
  resetForTests() {
    this.rooms.clear();
    this.roomPeers.clear();
    this.seedDefaults();
  }
}

export const studyRoomHub = new StudyRoomHubService();
