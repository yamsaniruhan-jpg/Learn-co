import { Router, Request, Response } from 'express';
import { studyRoomHub } from '../services/studyRoomHub';
import { adminDb } from '../services/firebaseAdmin';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// GET /api/study-rooms - list active study rooms (private details redacted unless peer is authorized)
router.get('/', (req: Request, res: Response) => {
  const peerId = typeof req.query.peerId === 'string' ? req.query.peerId : null;
  res.json({
    success: true,
    rooms: studyRoomHub.listRooms(peerId),
  });
});

// POST /api/study-rooms/join-private - verify roomCode + password and issue an HMAC accessTicket
router.post('/join-private', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }), (req: Request, res: Response) => {
  try {
    const { roomCode, password, roomId, peerId, displayName } = req.body || {};
    const result = studyRoomHub.joinPrivateRoom({
      roomCode: String(roomCode || ''),
      password: String(password || ''),
      roomId: typeof roomId === 'string' ? roomId : undefined,
      peerId: String(peerId || ''),
      displayName: typeof displayName === 'string' ? displayName : undefined,
    });
    res.json({ success: true, room: result.room, accessTicket: result.accessTicket });
  } catch (err: any) {
    const status = [400, 403, 404].includes(err?.statusCode) ? err.statusCode : 400;
    res.status(status).json({ success: false, error: err?.message || 'Unable to join private room.' });
  }
});

// GET /api/study-rooms/:roomId - full synchronized room snapshot
router.get('/:roomId', (req: Request, res: Response) => {
  const peerId = typeof req.query.peerId === 'string' ? req.query.peerId : null;
  const ticket =
    (typeof req.query.ticket === 'string' ? req.query.ticket : null) ||
    (typeof req.headers['x-room-ticket'] === 'string' ? req.headers['x-room-ticket'] : null);

  if (!studyRoomHub.canAccessRoom(req.params.roomId, peerId, ticket)) {
    const exists = studyRoomHub.getRoom(req.params.roomId);
    if (!exists) {
      res.status(404).json({ success: false, error: 'Study room not found.' });
      return;
    }
    res.status(403).json({
      success: false,
      code: 'PRIVATE_ROOM_LOCKED',
      error: 'Room code and password are required to access this private study room.',
    });
    return;
  }

  const room = studyRoomHub.getRoom(req.params.roomId, peerId, ticket);
  if (!room) {
    res.status(404).json({ success: false, error: 'Study room not found.' });
    return;
  }
  res.json({ success: true, room });
});

// POST /api/study-rooms - create a new collaborative study room (public or private)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, topic, color, visibility, roomCode, password, peerId, hostName } = req.body || {};
    const { room, accessTicket } = studyRoomHub.createRoom(title, topic, color, {
      visibility: visibility === 'private' ? 'private' : 'public',
      roomCode,
      password,
      hostPeerId: peerId,
      hostName,
    });

    // Mirror metadata only (never plaintext passwords or hashes) to Firestore when Admin SDK is available
    if (adminDb && room.roomCode) {
      try {
        await adminDb.collection('study_rooms').doc(room.id).set({
          id: room.id,
          title: room.title,
          topic: room.topic,
          color: room.color,
          visibility: room.visibility,
          roomCode: room.roomCode,
          hostUid: typeof peerId === 'string' && peerId ? peerId : 'host',
          hostName: room.hostName,
          memberCount: room.peerCount || 1,
          createdAt: room.createdAt,
          updatedAt: room.createdAt,
        });
      } catch {
        // Non-fatal fallback; client Firestore SDK also persists when user is Firebase-authenticated
      }
    }

    res.status(201).json({ success: true, room, accessTicket });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message || 'Invalid room details.' });
  }
});

// DELETE /api/study-rooms/:roomId - delete a user-created study room (host only)
router.delete('/:roomId', async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const peerId =
    (typeof req.query.peerId === 'string' ? req.query.peerId : null) ||
    (typeof req.body?.peerId === 'string' ? req.body.peerId : null) ||
    (typeof req.headers['x-peer-id'] === 'string' ? req.headers['x-peer-id'] : null);
  const ticket =
    (typeof req.query.ticket === 'string' ? req.query.ticket : null) ||
    (typeof req.headers['x-room-ticket'] === 'string' ? req.headers['x-room-ticket'] : null);

  const outcome = studyRoomHub.deleteRoom(roomId, peerId, ticket);
  if (!outcome.deleted) {
    if (outcome.reason === 'not_found') {
      res.status(404).json({ success: false, error: 'Study room not found.' });
      return;
    }
    if (outcome.reason === 'protected') {
      res.status(403).json({ success: false, error: 'Default faculty study rooms cannot be deleted.' });
      return;
    }
    res.status(403).json({ success: false, error: 'Only the room host can delete this study room.' });
    return;
  }

  if (adminDb) {
    try {
      await adminDb.collection('study_rooms').doc(roomId).delete();
    } catch {
      // Non-fatal cleanup
    }
  }

  res.json({ success: true, deletedRoomId: roomId });
});

function extractRoomAuth(req: Request) {
  const peerId =
    (typeof req.query.peerId === 'string' ? req.query.peerId : null) ||
    (typeof req.body?.peerId === 'string' ? req.body.peerId : null) ||
    (typeof req.headers['x-peer-id'] === 'string' ? req.headers['x-peer-id'] : null);
  const ticket =
    (typeof req.query.ticket === 'string' ? req.query.ticket : null) ||
    (typeof req.body?.ticket === 'string' ? req.body.ticket : null) ||
    (typeof req.headers['x-room-ticket'] === 'string' ? req.headers['x-room-ticket'] : null);
  return { peerId, ticket };
}

function verifyRoomWriteAccess(req: Request, res: Response): { roomId: string; peerId: string } | null {
  const { roomId } = req.params;
  const { peerId, ticket } = extractRoomAuth(req);
  if (!studyRoomHub.canAccessRoom(roomId, peerId, ticket)) {
    const exists = studyRoomHub.getRoom(roomId);
    if (!exists) {
      res.status(404).json({ success: false, error: 'Study room not found.' });
      return null;
    }
    res.status(403).json({
      success: false,
      code: 'PRIVATE_ROOM_LOCKED',
      error: 'Room code and password are required to interact with this private study room.',
    });
    return null;
  }
  return { roomId, peerId: peerId || `rest-${Date.now()}` };
}

// POST /api/study-rooms/:roomId/messages - HTTP fallback when WebSocket is unavailable
router.post('/:roomId/messages', (req: Request, res: Response) => {
  const access = verifyRoomWriteAccess(req, res);
  if (!access) return;

  const { id, displayName, text } = req.body || {};
  const msg = studyRoomHub.addMessage(
    access.roomId,
    typeof id === 'string' ? id : '',
    access.peerId,
    typeof displayName === 'string' ? displayName : 'Scholar',
    typeof text === 'string' ? text : ''
  );
  if (!msg) {
    res.status(400).json({ success: false, error: 'Message text is required.' });
    return;
  }
  res.status(201).json({ success: true, message: msg });
});

// POST /api/study-rooms/:roomId/timer - HTTP fallback for synced timer control
router.post('/:roomId/timer', (req: Request, res: Response) => {
  const access = verifyRoomWriteAccess(req, res);
  if (!access) return;

  const { action, mode, displayName } = req.body || {};
  if (!['start', 'pause', 'reset', 'set_mode'].includes(action)) {
    res.status(400).json({ success: false, error: 'Invalid timer action.' });
    return;
  }
  const timer = studyRoomHub.controlTimer(
    access.roomId,
    action,
    typeof displayName === 'string' ? displayName : 'Scholar',
    mode
  );
  if (!timer) {
    res.status(404).json({ success: false, error: 'Study room not found.' });
    return;
  }
  res.json({ success: true, timer });
});

// POST /api/study-rooms/:roomId/polls - HTTP fallback for creating a live poll
router.post('/:roomId/polls', (req: Request, res: Response) => {
  const access = verifyRoomWriteAccess(req, res);
  if (!access) return;

  const { id, question, options, displayName } = req.body || {};
  const poll = studyRoomHub.createPoll(
    access.roomId,
    typeof id === 'string' ? id : '',
    typeof question === 'string' ? question : '',
    Array.isArray(options) ? options : [],
    typeof displayName === 'string' ? displayName : 'Scholar'
  );
  if (!poll) {
    res.status(400).json({ success: false, error: 'Poll question and at least 2 options are required.' });
    return;
  }
  res.status(201).json({ success: true, activePoll: poll });
});

// POST /api/study-rooms/:roomId/polls/vote - HTTP fallback for voting in a live poll
router.post('/:roomId/polls/vote', (req: Request, res: Response) => {
  const access = verifyRoomWriteAccess(req, res);
  if (!access) return;

  const { pollId, optionIndex } = req.body || {};
  const poll = studyRoomHub.votePoll(
    access.roomId,
    String(pollId || ''),
    Number(optionIndex),
    access.peerId
  );
  if (!poll) {
    res.status(400).json({ success: false, error: 'Unable to record vote on active poll.' });
    return;
  }
  res.json({ success: true, activePoll: poll });
});

export default router;
