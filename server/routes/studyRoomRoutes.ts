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

export default router;
