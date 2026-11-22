import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  onSnapshot,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebaseClient';

export type RoomVisibility = 'public' | 'private';

export interface FirestoreStudyRoom {
  id: string;
  title: string;
  topic: string;
  color: string;
  visibility: RoomVisibility;
  roomCode: string;
  hostUid: string;
  hostName?: string;
  memberCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface FirestoreRoomMessage {
  id: string;
  roomId: string;
  senderUid: string;
  user: string;
  text: string;
  visibility: RoomVisibility;
  createdAt: string;
}

export function normalizeRoomCode(code: string): string {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 16);
}

export function generateRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `LC-${suffix}`;
}

export async function computeRoomInviteKey(roomCode: string, password: string): Promise<string> {
  const cleanCode = normalizeRoomCode(roomCode);
  const input = `${cleanCode}:${String(password || '')}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic ASCII hex key if subtle is unavailable in a non-secure test environment
  let h1 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return `inv_${(h1 >>> 0).toString(16)}`;
}

export async function fetchFirestoreStudyRooms(): Promise<FirestoreStudyRoom[]> {
  if (!isFirebaseConfigured() || !db) return [];
  const uid = auth?.currentUser?.uid;
  const results = new Map<string, FirestoreStudyRoom>();

  try {
    const publicSnap = await getDocs(query(collection(db, 'study_rooms'), where('visibility', '==', 'public'), limit(30)));
    publicSnap.docs.forEach((d) => {
      results.set(d.id, d.data() as FirestoreStudyRoom);
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, 'study_rooms');
    } catch {
      // Ignore if rules block offline/test
    }
  }

  if (uid) {
    try {
      const ownSnap = await getDocs(query(collection(db, 'study_rooms'), where('hostUid', '==', uid), limit(30)));
      ownSnap.docs.forEach((d) => {
        results.set(d.id, d.data() as FirestoreStudyRoom);
      });
    } catch {
      // Non-fatal
    }
  }

  return Array.from(results.values());
}

export async function createFirestoreStudyRoom(params: {
  roomId: string;
  title: string;
  topic: string;
  color: string;
  visibility: RoomVisibility;
  roomCode: string;
  password?: string;
  hostName: string;
}): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;
  const uid = auth?.currentUser?.uid;
  if (!uid) return false;

  const cleanCode = normalizeRoomCode(params.roomCode || generateRoomCode());
  const nowIso = new Date().toISOString();
  const roomDoc: FirestoreStudyRoom = {
    id: params.roomId,
    title: params.title.trim().slice(0, 80),
    topic: params.topic.trim().slice(0, 120),
    color: ['indigo', 'amber', 'rose', 'purple', 'emerald'].includes(params.color) ? params.color : 'indigo',
    visibility: params.visibility,
    roomCode: cleanCode,
    hostUid: uid,
    hostName: params.hostName.trim().slice(0, 80) || 'Scholar',
    memberCount: 1,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await setDoc(doc(db, 'study_rooms', params.roomId), roomDoc);
    if (params.visibility === 'private' && params.password) {
      const inviteKey = await computeRoomInviteKey(cleanCode, params.password);
      await setDoc(doc(db, 'study_room_invites', inviteKey), {
        roomId: params.roomId,
        roomCode: cleanCode,
        hostUid: uid,
        visibility: 'private',
        createdAt: nowIso,
      });
      await setDoc(doc(db, 'study_rooms', params.roomId, 'members', uid), {
        userId: uid,
        displayName: roomDoc.hostName || 'Host',
        inviteKey,
        joinedAt: nowIso,
      });
    } else {
      await setDoc(doc(db, 'study_rooms', params.roomId, 'members', uid), {
        userId: uid,
        displayName: roomDoc.hostName || 'Host',
        joinedAt: nowIso,
      });
    }
    return true;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.CREATE, `study_rooms/${params.roomId}`);
    } catch {
      return false;
    }
  }
}

export async function joinFirestorePrivateRoom(
  roomCode: string,
  password: string,
  displayName: string
): Promise<FirestoreStudyRoom | null> {
  if (!isFirebaseConfigured() || !db) return null;
  const uid = auth?.currentUser?.uid;
  if (!uid) return null;

  const inviteKey = await computeRoomInviteKey(roomCode, password);
  try {
    const inviteSnap = await getDoc(doc(db, 'study_room_invites', inviteKey));
    if (!inviteSnap.exists()) return null;
    const inviteData = inviteSnap.data() as { roomId: string };
    if (!inviteData?.roomId) return null;

    await setDoc(doc(db, 'study_rooms', inviteData.roomId, 'members', uid), {
      userId: uid,
      displayName: displayName.trim().slice(0, 80) || 'Scholar',
      inviteKey,
      joinedAt: new Date().toISOString(),
    });

    const roomSnap = await getDoc(doc(db, 'study_rooms', inviteData.roomId));
    return roomSnap.exists() ? (roomSnap.data() as FirestoreStudyRoom) : null;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.GET, `study_room_invites/${inviteKey}`);
    } catch {
      return null;
    }
  }
}

export async function postFirestoreRoomMessage(params: {
  roomId: string;
  messageId: string;
  user: string;
  text: string;
  visibility: RoomVisibility;
}): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  const uid = auth?.currentUser?.uid;
  if (!uid) return;

  const path = `study_rooms/${params.roomId}/messages/${params.messageId}`;
  try {
    await setDoc(doc(db, 'study_rooms', params.roomId, 'messages', params.messageId), {
      id: params.messageId,
      roomId: params.roomId,
      senderUid: uid,
      user: params.user.trim().slice(0, 80) || 'Scholar',
      text: params.text.trim().slice(0, 600),
      visibility: params.visibility,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.CREATE, path);
    } catch {
      // WebSocket message still succeeds
    }
  }
}

export function subscribeFirestoreRoomMessages(
  roomId: string,
  onMessages: (msgs: FirestoreRoomMessage[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) {
    return () => {};
  }
  const q = query(
    collection(db, 'study_rooms', roomId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(80)
  );
  return onSnapshot(
    q,
    (snap) => {
      onMessages(snap.docs.map((d) => d.data() as FirestoreRoomMessage));
    },
    () => {
      // Ignore permission snapshot errors for unjoined private rooms
    }
  );
}
