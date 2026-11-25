import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users,
  Plus,
  X,
  Wifi,
  WifiOff,
  Play,
  Pause,
  RotateCcw,
  Timer,
  BarChart3,
  Send,
  Lock,
  Globe,
  KeyRound,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { buildApiHeaders } from '../../utils/csrf';
import {
  createFirestoreStudyRoom,
  deleteFirestoreStudyRoom,
  fetchFirestoreStudyRooms,
  generateRoomCode,
  joinFirestorePrivateRoom,
  normalizeRoomCode,
  postFirestoreRoomMessage,
  RoomVisibility,
  subscribeFirestoreRoomMessages,
} from '../../services/studyRoomFirestore';

interface StudyRoomsViewProps {
  onNavigateToTab: (tabId: string) => void;
}

type PomodoroMode = 'focus' | 'short_break' | 'long_break';

interface RoomPeer {
  peerId: string;
  displayName: string;
  color: string;
  joinedAt: string;
}

interface RoomMessage {
  id: string;
  roomId: string;
  peerId?: string;
  user: string;
  text: string;
  time: string;
}

interface RoomTimerState {
  mode: PomodoroMode;
  durationSec: number;
  remainingSecAtPause: number;
  startedAtMs: number | null;
  isRunning: boolean;
  updatedBy: string;
}

interface RoomPoll {
  id: string;
  question: string;
  options: string[];
  votes: Record<number, string[]>;
  createdBy: string;
  createdAt: string;
}

interface Room {
  id: string;
  title: string;
  topic: string;
  color: string;
  visibility?: RoomVisibility;
  roomCode?: string | null;
  hostName?: string;
  isHost?: boolean;
  isLocked?: boolean;
  peers: RoomPeer[];
  peerCount: number;
  messages: RoomMessage[];
  timer: RoomTimerState;
  activePoll: RoomPoll | null;
}

function getOrCreatePeerId(userId?: string): string {
  if (userId) return `user-${userId}`;
  try {
    const key = 'learnco_study_peer_id';
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const created = `peer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    sessionStorage.setItem(key, created);
    return created;
  } catch {
    return `peer-${Date.now()}`;
  }
}

function computeDisplaySeconds(timer?: RoomTimerState, nowMs = Date.now()): number {
  if (!timer) return 25 * 60;
  if (!timer.isRunning || timer.startedAtMs === null) {
    return Math.max(0, Math.round(timer.remainingSecAtPause));
  }
  const elapsed = Math.floor((nowMs - timer.startedAtMs) / 1000);
  return Math.max(0, timer.remainingSecAtPause - elapsed);
}

function formatMMSS(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const StudyRoomsView: React.FC<StudyRoomsViewProps> = ({ onNavigateToTab }) => {
  const { profile, user } = useAuth();
  const displayName = profile?.displayName || profile?.fullName || user?.fullName || 'Scholar';
  const peerIdRef = useRef<string>(getOrCreatePeerId(user?.id));

  const [rooms, setRooms] = useState<Room[]>([]);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [activeRoomId, setActiveRoomId] = useState<string>('room-calculus');
  const [activeRoomState, setActiveRoomState] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
  const [accessTickets, setAccessTickets] = useState<Record<string, string>>({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinPrivateModalOpen, setIsJoinPrivateModalOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);

  // Create room form state
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newVisibility, setNewVisibility] = useState<RoomVisibility>('public');
  const [newRoomCode, setNewRoomCode] = useState(() => generateRoomCode());
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Join private room modal state
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinTargetRoomId, setJoinTargetRoomId] = useState<string | undefined>(undefined);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joiningPrivate, setJoiningPrivate] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Delete room modal state
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [inputMsg, setInputMsg] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionsText, setPollOptionsText] = useState('Option A\nOption B\nOption C');
  const [displaySec, setDisplaySec] = useState<number>(25 * 60);

  const wsRef = useRef<WebSocket | null>(null);
  const activeRoomIdRef = useRef<string>(activeRoomId);
  const accessTicketsRef = useRef<Record<string, string>>({});
  const reconnectTimerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    accessTicketsRef.current = accessTickets;
  }, [accessTickets]);

  useEffect(() => {
    if (user?.id) {
      peerIdRef.current = `user-${user.id}`;
    }
  }, [user?.id]);

  // Initial HTTP + Firestore hydration
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch(`/api/study-rooms?peerId=${encodeURIComponent(peerIdRef.current)}`).then((r) => (r.ok ? r.json() : null)),
      fetchFirestoreStudyRooms(),
    ])
      .then(([apiData, fsRooms]) => {
        if (!mounted) return;
        const apiRooms: Room[] = Array.isArray(apiData?.rooms) ? apiData.rooms : [];
        const merged = new Map<string, Room>();
        apiRooms.forEach((r) => merged.set(r.id, r));
        fsRooms.forEach((fr) => {
          if (!merged.has(fr.id)) {
            merged.set(fr.id, {
              id: fr.id,
              title: fr.title,
              topic: fr.topic,
              color: fr.color || 'indigo',
              visibility: fr.visibility,
              roomCode: fr.visibility === 'public' ? fr.roomCode : null,
              hostName: fr.hostName || 'Host',
              isLocked: fr.visibility === 'private',
              peers: [],
              peerCount: fr.memberCount || 0,
              messages: [],
              timer: {
                mode: 'focus',
                durationSec: 25 * 60,
                remainingSecAtPause: 25 * 60,
                startedAtMs: null,
                isRunning: false,
                updatedBy: 'Room Timer',
              },
              activePoll: null,
            });
          }
        });
        const list = Array.from(merged.values());
        setRooms(list);
        const found = list.find((r) => r.id === activeRoomIdRef.current) || list.find((r) => !r.isLocked) || list[0];
        if (found) {
          setActiveRoomId(found.id);
          setActiveRoomState((prev) => prev || found);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Firestore message subscription backup when authenticated & unlocked
  useEffect(() => {
    if (!activeRoomId) return;
    const room = rooms.find((r) => r.id === activeRoomId);
    if (room?.isLocked && !accessTickets[activeRoomId]) return;
    const unsub = subscribeFirestoreRoomMessages(activeRoomId, (fsMsgs) => {
      if (!fsMsgs.length) return;
      setActiveRoomState((prev) => {
        if (!prev || prev.id !== activeRoomId) return prev;
        const existingIds = new Set(prev.messages.map((m) => m.id));
        const additions = fsMsgs
          .filter((m) => !existingIds.has(m.id))
          .map((m) => ({
            id: m.id,
            roomId: m.roomId,
            peerId: m.senderUid,
            user: m.user,
            text: m.text,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
        if (additions.length === 0) return prev;
        return { ...prev, messages: [...prev.messages, ...additions].slice(-100) };
      });
    });
    return () => unsub();
  }, [activeRoomId, accessTickets, rooms]);

  const sendWsEvent = useCallback((payload: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  // WebSocket connection + exponential backoff reconnect
  useEffect(() => {
    let unmounted = false;
    let attempt = 0;

    const connect = () => {
      if (unmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/ws/study-rooms?peerId=${encodeURIComponent(
        peerIdRef.current
      )}&name=${encodeURIComponent(displayName)}`;

      setConnectionState(attempt === 0 ? 'connecting' : 'reconnecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted) {
          ws.close();
          return;
        }
        attempt = 0;
        setConnectionState('connected');
        ws.send(
          JSON.stringify({
            type: 'room:join',
            roomId: activeRoomIdRef.current,
            displayName,
            accessTicket: accessTicketsRef.current[activeRoomIdRef.current],
          })
        );
      };

      ws.onmessage = (event) => {
        let msg: any;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!msg || typeof msg.type !== 'string') return;

        switch (msg.type) {
          case 'rooms:list': {
            if (Array.isArray(msg.rooms)) {
              setRooms(msg.rooms);
            }
            break;
          }
          case 'room:state': {
            if (msg.room && msg.room.id === activeRoomIdRef.current) {
              setActiveRoomState(msg.room);
            }
            break;
          }
          case 'room:error': {
            if (msg.code === 'PRIVATE_ROOM_LOCKED' && msg.roomId) {
              setJoinTargetRoomId(msg.roomId);
              setJoinError(msg.error || 'Enter room code and password to unlock.');
              setIsJoinPrivateModalOpen(true);
            }
            break;
          }
          case 'room:presence': {
            if (msg.roomId === activeRoomIdRef.current) {
              setActiveRoomState((prev) =>
                prev ? { ...prev, peers: msg.peers || [], peerCount: msg.peerCount ?? 0 } : prev
              );
            }
            break;
          }
          case 'chat:message': {
            if (msg.roomId === activeRoomIdRef.current && msg.message) {
              setActiveRoomState((prev) => {
                if (!prev) return prev;
                if (prev.messages.some((m) => m.id === msg.message.id)) return prev;
                return {
                  ...prev,
                  messages: [...prev.messages, msg.message].slice(-100),
                };
              });
            }
            break;
          }
          case 'timer:update': {
            if (msg.roomId === activeRoomIdRef.current && msg.timer) {
              setActiveRoomState((prev) => (prev ? { ...prev, timer: msg.timer } : prev));
            }
            break;
          }
          case 'poll:update': {
            if (msg.roomId === activeRoomIdRef.current) {
              setActiveRoomState((prev) => (prev ? { ...prev, activePoll: msg.activePoll || null } : prev));
            }
            break;
          }
          case 'room:deleted': {
            const deletedId = msg.roomId;
            if (typeof deletedId === 'string') {
              setRooms((prev) => {
                const next = prev.filter((r) => r.id !== deletedId);
                if (activeRoomIdRef.current === deletedId) {
                  const fallback = next.find((r) => !r.isLocked) || next[0] || null;
                  setActiveRoomId(fallback ? fallback.id : '');
                  setActiveRoomState(fallback);
                }
                return next;
              });
            }
            break;
          }
        }
      };

      ws.onclose = () => {
        if (unmounted) return;
        setConnectionState('reconnecting');
        const delayMs = Math.min(10000, 1000 * Math.pow(1.6, attempt));
        attempt += 1;
        reconnectTimerRef.current = window.setTimeout(connect, delayMs);
      };

      ws.onerror = () => {};
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [displayName]);

  const handleSelectRoom = (roomId: string, ticketOverride?: string) => {
    const candidate = rooms.find((r) => r.id === roomId);
    const ticket = ticketOverride || accessTickets[roomId];
    if (candidate?.visibility === 'private' && candidate.isLocked && !ticket) {
      setJoinTargetRoomId(roomId);
      setJoinCode('');
      setJoinPassword('');
      setJoinError(null);
      setIsJoinPrivateModalOpen(true);
      return;
    }

    setActiveRoomId(roomId);
    if (candidate) setActiveRoomState(candidate);

    const sent = sendWsEvent({
      type: 'room:join',
      roomId,
      displayName,
      accessTicket: ticket,
    });
    if (!sent) {
      fetch(`/api/study-rooms/${encodeURIComponent(roomId)}?peerId=${encodeURIComponent(peerIdRef.current)}`, {
        headers: ticket ? { 'x-room-ticket': ticket } : {},
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.room) setActiveRoomState(d.room);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    const updateClock = () => {
      setDisplaySec(computeDisplaySeconds(activeRoomState?.timer));
    };
    updateClock();
    if (!activeRoomState?.timer?.isRunning) return;
    const interval = window.setInterval(updateClock, 250);
    return () => window.clearInterval(interval);
  }, [activeRoomState?.timer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeRoomState?.messages?.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputMsg.trim();
    if (!trimmed) return;
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const sent = sendWsEvent({
      type: 'chat:send',
      roomId: activeRoomId,
      id: msgId,
      text: trimmed,
    });
    if (sent) {
      setInputMsg('');
      const vis: RoomVisibility = activeRoom?.visibility === 'private' ? 'private' : 'public';
      void postFirestoreRoomMessage({
        roomId: activeRoomId,
        messageId: msgId,
        user: displayName,
        text: trimmed,
        visibility: vis,
      });
    }
  };

  const handleTimerControl = (action: 'start' | 'pause' | 'reset' | 'set_mode', mode?: PomodoroMode) => {
    sendWsEvent({
      type: 'timer:control',
      roomId: activeRoomId,
      action,
      mode,
    });
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTopic.trim()) return;
    setCreateError(null);

    const codeToSend = newVisibility === 'private' ? normalizeRoomCode(newRoomCode || generateRoomCode()) : generateRoomCode();
    if (newVisibility === 'private' && newPassword.trim().length < 4) {
      setCreateError('Please choose a password of at least 4 characters for your private room.');
      return;
    }

    try {
      const res = await fetch('/api/study-rooms', {
        method: 'POST',
        credentials: 'include',
        headers: buildApiHeaders(),
        body: JSON.stringify({
          title: newTitle.trim(),
          topic: newTopic.trim(),
          color: newVisibility === 'private' ? 'purple' : 'indigo',
          visibility: newVisibility,
          roomCode: codeToSend,
          password: newVisibility === 'private' ? newPassword.trim() : undefined,
          peerId: peerIdRef.current,
          hostName: displayName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.room) {
        setCreateError(data?.error || 'Could not create room.');
        return;
      }

      if (data.accessTicket) {
        setAccessTickets((prev) => ({ ...prev, [data.room.id]: data.accessTicket }));
      }

      // Mirror cleanly to Firestore when Firebase user is authenticated
      void createFirestoreStudyRoom({
        roomId: data.room.id,
        title: newTitle.trim(),
        topic: newTopic.trim(),
        color: newVisibility === 'private' ? 'purple' : 'indigo',
        visibility: newVisibility,
        roomCode: data.room.roomCode || codeToSend,
        password: newVisibility === 'private' ? newPassword.trim() : undefined,
        hostName: displayName,
      });

      const createdRoom: Room = { ...data.room, isHost: data.room.isHost ?? true };
      setRooms((prev) => [createdRoom, ...prev.filter((r) => r.id !== createdRoom.id)]);
      setNewTitle('');
      setNewTopic('');
      setNewPassword('');
      setNewRoomCode(generateRoomCode());
      setIsCreateModalOpen(false);
      handleSelectRoom(createdRoom.id, data.accessTicket || undefined);
    } catch {
      setCreateError('Network error while creating study room.');
    }
  };

  const handleConfirmDeleteRoom = async () => {
    if (!deleteConfirmRoom) return;
    const target = deleteConfirmRoom;
    setDeletingRoom(true);
    setDeleteError(null);
    try {
      const ticket = accessTickets[target.id];
      const res = await fetch(
        `/api/study-rooms/${encodeURIComponent(target.id)}?peerId=${encodeURIComponent(peerIdRef.current)}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: buildApiHeaders(ticket ? { 'x-room-ticket': ticket } : undefined, false),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data?.error || 'Could not delete study room.');
        setDeletingRoom(false);
        return;
      }

      void deleteFirestoreStudyRoom(target.id);

      setRooms((prev) => {
        const next = prev.filter((r) => r.id !== target.id);
        if (activeRoomIdRef.current === target.id) {
          const fallback = next.find((r) => !r.isLocked) || next[0] || null;
          setActiveRoomId(fallback ? fallback.id : '');
          setActiveRoomState(fallback);
          if (fallback) {
            sendWsEvent({
              type: 'room:join',
              roomId: fallback.id,
              displayName,
              accessTicket: accessTicketsRef.current[fallback.id],
            });
          }
        }
        return next;
      });

      setAccessTickets((prev) => {
        const copy = { ...prev };
        delete copy[target.id];
        return copy;
      });
      setDeleteConfirmRoom(null);
    } catch {
      setDeleteError('Network error while deleting study room.');
    } finally {
      setDeletingRoom(false);
    }
  };

  const handleJoinPrivateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeRoomCode(joinCode);
    const cleanPassword = joinPassword.trim();
    if (!cleanCode || !cleanPassword) {
      setJoinError('Enter both the Room Code and Password.');
      return;
    }
    setJoiningPrivate(true);
    setJoinError(null);

    try {
      const res = await fetch('/api/study-rooms/join-private', {
        method: 'POST',
        credentials: 'include',
        headers: buildApiHeaders(),
        body: JSON.stringify({
          roomCode: cleanCode,
          password: cleanPassword,
          roomId: joinTargetRoomId,
          peerId: peerIdRef.current,
          displayName,
        }),
      });
      const data = await res.json();

      if (res.ok && data?.room && data?.accessTicket) {
        setAccessTickets((prev) => ({ ...prev, [data.room.id]: data.accessTicket }));
        setRooms((prev) => [data.room, ...prev.filter((r) => r.id !== data.room.id)]);
        void joinFirestorePrivateRoom(cleanCode, cleanPassword, displayName);
        setIsJoinPrivateModalOpen(false);
        setJoinCode('');
        setJoinPassword('');
        setJoinTargetRoomId(undefined);
        handleSelectRoom(data.room.id, data.accessTicket);
        return;
      }

      // Fallback verification directly against Firestore invite hash if room lives in Firestore only
      const fsRoom = await joinFirestorePrivateRoom(cleanCode, cleanPassword, displayName);
      if (fsRoom) {
        const unlockedRoom: Room = {
          id: fsRoom.id,
          title: fsRoom.title,
          topic: fsRoom.topic,
          color: fsRoom.color || 'purple',
          visibility: 'private',
          roomCode: fsRoom.roomCode,
          hostName: fsRoom.hostName || 'Host',
          isLocked: false,
          peers: [],
          peerCount: fsRoom.memberCount || 1,
          messages: [],
          timer: {
            mode: 'focus',
            durationSec: 25 * 60,
            remainingSecAtPause: 25 * 60,
            startedAtMs: null,
            isRunning: false,
            updatedBy: 'Room Timer',
          },
          activePoll: null,
        };
        setRooms((prev) => [unlockedRoom, ...prev.filter((r) => r.id !== unlockedRoom.id)]);
        setIsJoinPrivateModalOpen(false);
        setActiveRoomId(unlockedRoom.id);
        setActiveRoomState(unlockedRoom);
        return;
      }

      setJoinError(data?.error || 'Invalid room code or password.');
    } catch {
      setJoinError('Network error while verifying private room credentials.');
    } finally {
      setJoiningPrivate(false);
    }
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    const options = pollOptionsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 4);
    if (!pollQuestion.trim() || options.length < 2) return;
    sendWsEvent({
      type: 'poll:create',
      roomId: activeRoomId,
      id: `poll-${Date.now()}`,
      question: pollQuestion.trim(),
      options,
    });
    setPollQuestion('');
    setIsPollModalOpen(false);
  };

  const handleVotePoll = (optionIndex: number) => {
    if (!activeRoomState?.activePoll) return;
    sendWsEvent({
      type: 'poll:vote',
      roomId: activeRoomId,
      pollId: activeRoomState.activePoll.id,
      optionIndex,
    });
  };

  const filteredRooms = rooms.filter((r) => {
    if (visibilityFilter === 'public') return (r.visibility || 'public') === 'public';
    if (visibilityFilter === 'private') return r.visibility === 'private';
    return true;
  });

  const activeRoom = activeRoomState || rooms.find((r) => r.id === activeRoomId) || rooms[0];
  const currentMessages = activeRoom?.messages || [];
  const activePeers = activeRoom?.peers || [];
  const timer = activeRoom?.timer;
  const activePoll = activeRoom?.activePoll || null;

  const totalPollVotes = activePoll
    ? Object.values(activePoll.votes || {}).reduce((acc, arr) => acc + (arr?.length || 0), 0)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#2D2A4A] dark:bg-[#24203E] text-white p-6 sm:p-8 shadow-xl border border-[#3D3861] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#8577ED] border border-white/15">
              <Users className="w-3.5 h-3.5 text-[#00B8A9]" />
              <span>Public & Private Study Rooms • Firebase Synced</span>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                connectionState === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}
            >
              {connectionState === 'connected' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>
                {connectionState === 'connected'
                  ? 'Live Sync Active'
                  : connectionState === 'connecting'
                  ? 'Connecting...'
                  : 'Reconnecting...'}
              </span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Live STEM Study Rooms</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Study openly in public rooms or launch password-protected private rooms with an invite code and Firebase sync.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setJoinTargetRoomId(undefined);
              setJoinError(null);
              setIsJoinPrivateModalOpen(true);
            }}
            leftIcon={<KeyRound className="w-4 h-4" />}
            className="min-h-[44px] border-white/25 text-white hover:bg-white/10 font-bold"
          >
            Join Private Room
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setCreateError(null);
              setNewRoomCode(generateRoomCode());
              setIsCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="min-h-[44px] bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-bold"
          >
            Create Room
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rooms Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F0EDFA] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861]">
              {(['all', 'public', 'private'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setVisibilityFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize cursor-pointer transition ${
                    visibilityFilter === filter
                      ? 'bg-[#6C5CE7] text-white'
                      : 'text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setNewRoomCode(generateRoomCode());
                setIsCreateModalOpen(true);
              }}
              className="text-xs font-bold text-[#6C5CE7] dark:text-[#8577ED] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredRooms.map((room) => {
              const isPrivate = room.visibility === 'private';
              const isLocked = Boolean(isPrivate && room.isLocked && !accessTickets[room.id]);
              const isActive = activeRoomId === room.id;
              return (
                <div
                  key={room.id}
                  className={`w-full rounded-2xl border transition-all flex items-stretch gap-1 ${
                    isActive
                      ? 'bg-[#6C5CE7] text-white border-[#6C5CE7] shadow-md'
                      : 'bg-white dark:bg-[#2A2647] border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] hover:border-[#6C5CE7]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectRoom(room.id)}
                    className="flex-1 min-w-0 text-left p-4 cursor-pointer flex items-center justify-between"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        {isPrivate ? (
                          <Lock className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-200' : 'text-amber-500'}`} />
                        ) : (
                          <Globe className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-200' : 'text-emerald-500'}`} />
                        )}
                        <h4 className="font-bold text-sm truncate">{room.title}</h4>
                      </div>
                      <p className={`text-[11px] truncate ${isActive ? 'text-white/80' : 'text-[#6B6890] dark:text-[#B4B0D5]'}`}>
                        Topic: {room.topic}
                      </p>
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 tabular-nums ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5]'
                      }`}
                    >
                      {isLocked ? 'Locked' : `${room.peerCount} Online`}
                    </div>
                  </button>
                  {room.isHost && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteConfirmRoom(room);
                      }}
                      aria-label={`Delete ${room.title}`}
                      title="Delete your study room"
                      className={`px-3 flex items-center justify-center rounded-r-2xl transition cursor-pointer shrink-0 ${
                        isActive
                          ? 'text-white/85 hover:text-white hover:bg-rose-500/40'
                          : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Room Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Private Room Invite Code Banner */}
          {activeRoom?.visibility === 'private' && activeRoom.roomCode && (
            <div className="p-3.5 rounded-2xl bg-[#F0EDFA] dark:bg-[#2A2647] border border-[#6C5CE7]/35 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <Lock className="w-4 h-4 text-[#6C5CE7]" />
                <span className="font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">Private Room Invite Code:</span>
                <code className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-[#1E1B33] font-mono font-black text-[#6C5CE7] dark:text-[#8577ED] border border-[#E3DFF5] dark:border-[#3D3861]">
                  {activeRoom.roomCode}
                </code>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(activeRoom.roomCode || '');
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied Code' : 'Copy Code'}</span>
              </button>
            </div>
          )}

          {/* Synchronized Group Pomodoro Timer */}
          <div className="rounded-3xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F0EDFA] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-center text-[#6C5CE7] shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6B6890] dark:text-[#B4B0D5]">
                    Synced Room Timer
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED]">
                    {timer?.mode === 'short_break'
                      ? 'Short Break'
                      : timer?.mode === 'long_break'
                      ? 'Long Break'
                      : 'Deep Focus'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-2xl font-black font-mono tabular-nums text-[#2D2A4A] dark:text-white">
                    {formatMMSS(displaySec)}
                  </span>
                  <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                    Updated by {timer?.updatedBy || 'Room Timer'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['focus', 'short_break', 'long_break'] as PomodoroMode[]).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => handleTimerControl('set_mode', mode)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    timer?.mode === mode
                      ? 'bg-[#6C5CE7] text-white'
                      : 'bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5]'
                  }`}
                >
                  {mode === 'focus' ? '25m' : mode === 'short_break' ? '5m' : '15m'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleTimerControl(timer?.isRunning ? 'pause' : 'start')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                {timer?.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{timer?.isRunning ? 'Pause' : 'Start'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleTimerControl('reset')}
                aria-label="Reset synchronized timer"
                className="p-1.5 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] hover:text-[#2D2A4A] dark:hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Room Poll */}
          {activePoll && (
            <div className="rounded-2xl bg-[#F0EDFA] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#6C5CE7]" />
                  <span>Live Room Poll: {activePoll.question}</span>
                </div>
                <span className="text-[11px] font-bold text-[#6C5CE7] dark:text-[#8577ED] tabular-nums">
                  {totalPollVotes} vote{totalPollVotes === 1 ? '' : 's'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activePoll.options.map((opt, idx) => {
                  const voters = activePoll.votes?.[idx] || [];
                  const pct = totalPollVotes > 0 ? Math.round((voters.length / totalPollVotes) * 100) : 0;
                  const votedHere = voters.includes(peerIdRef.current);
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleVotePoll(idx)}
                      className={`relative overflow-hidden text-left p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        votedHere
                          ? 'border-[#6C5CE7] bg-white dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED] ring-1 ring-[#6C5CE7]'
                          : 'border-[#E3DFF5] dark:border-[#3D3861] bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF]'
                      }`}
                    >
                      <div className="relative flex items-center justify-between gap-2">
                        <span className="truncate">{opt}</span>
                        <span className="font-mono text-[11px] font-bold shrink-0 tabular-nums">{pct}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chat Container */}
          <div className="rounded-3xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-xl flex flex-col h-[460px]">
            <div className="p-4 sm:p-5 border-b border-[#E3DFF5] dark:border-[#3D3861] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-black text-[#2D2A4A] dark:text-[#F1EFFF] text-sm sm:text-base truncate">
                    {activeRoom?.title || 'Study Room'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {activePeers.length === 0 ? (
                      <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">Ready for peer collaboration</span>
                    ) : (
                      activePeers.slice(0, 6).map((p) => (
                        <span
                          key={p.peerId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF]"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span>{p.displayName}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPollModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED] text-xs font-bold flex items-center gap-1.5 border border-[#E3DFF5] dark:border-[#3D3861] cursor-pointer shrink-0"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Launch Poll</span>
                </button>
                {activeRoom?.isHost && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteConfirmRoom(activeRoom);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Room</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {currentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#8E8BAF] space-y-2">
                  <Users className="w-8 h-8 opacity-40" />
                  <p className="text-xs">No messages in this room yet. Say hello or share a derivation!</p>
                </div>
              ) : (
                currentMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl border space-y-1 ${
                      m.peerId === peerIdRef.current
                        ? 'bg-[#F0EDFA] dark:bg-[#1E1B33] border-[#6C5CE7]/40'
                        : 'bg-[#FAF9FF] dark:bg-[#1E1B33] border-[#E3DFF5] dark:border-[#3D3861]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">{m.user}</span>
                      <span className="text-[10px] text-[#8E8BAF] font-mono tabular-nums">{m.time}</span>
                    </div>
                    <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">{m.text}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-[#E3DFF5] dark:border-[#3D3861] flex gap-2">
              <input
                type="text"
                placeholder={`Chat live in ${activeRoom?.title || 'Study Room'}...`}
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={connectionState !== 'connected'}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FAF9FF] dark:bg-[#1E1B33] text-xs text-[#2D2A4A] dark:text-[#F1EFFF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] disabled:opacity-60"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={connectionState !== 'connected' || !inputMsg.trim()}
                leftIcon={<Send className="w-3.5 h-3.5" />}
                className="min-h-[44px] bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white"
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Create Room Modal (Public or Private with Room Code & Password) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2D2A4A]/80 dark:bg-[#100E1C]/90 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E3DFF5] dark:border-[#3D3861] pb-4">
              <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#6C5CE7]" />
                <span>Create Collaborative Study Room</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-[#6B6890] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] cursor-pointer"
                aria-label="Close create room dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-600 dark:text-rose-300 font-semibold">
                  {createError}
                </div>
              )}

              {/* Visibility Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewVisibility('public')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    newVisibility === 'public'
                      ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white'
                      : 'bg-[#F7F5FF] dark:bg-[#1E1B33] border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Globe className="w-4 h-4" /> Public Room
                  </div>
                  <p className={`text-[10px] mt-0.5 ${newVisibility === 'public' ? 'text-white/80' : 'text-[#6B6890]'}`}>
                    Open to all scholars
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setNewVisibility('private')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    newVisibility === 'private'
                      ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white'
                      : 'bg-[#F7F5FF] dark:bg-[#1E1B33] border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Lock className="w-4 h-4" /> Private Room
                  </div>
                  <p className={`text-[10px] mt-0.5 ${newVisibility === 'private' ? 'text-white/80' : 'text-[#6B6890]'}`}>
                    Code & password locked
                  </p>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">Room Title</label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  placeholder="e.g., Quantum Physics & Wave Packets"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FAF9FF] dark:bg-[#1E1B33] text-xs text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">Subject / Focus Topic</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g., Schrodinger Equation Derivation"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FAF9FF] dark:bg-[#1E1B33] text-xs text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>

              {newVisibility === 'private' && (
                <div className="p-4 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] block mb-1">
                      Room Access Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={newRoomCode}
                      onChange={(e) => setNewRoomCode(normalizeRoomCode(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-white dark:bg-[#2A2647] font-mono text-xs font-bold text-[#6C5CE7]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] block mb-1">
                      Private Room Password (min 4 chars)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      maxLength={64}
                      placeholder="Set secret passphrase..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-white dark:bg-[#2A2647] text-xs text-[#2D2A4A] dark:text-[#F1EFFF]"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="min-h-[44px] bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-bold">
                  Create &amp; Join Room
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Private Room Modal */}
      {isJoinPrivateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2D2A4A]/80 dark:bg-[#100E1C]/90 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E3DFF5] dark:border-[#3D3861] pb-3">
              <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#6C5CE7]" />
                <span>Unlock Private Study Room</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsJoinPrivateModalOpen(false)}
                className="p-1.5 rounded-xl text-[#6B6890] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] cursor-pointer"
                aria-label="Close join private room modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleJoinPrivateRoom} className="space-y-4">
              {joinError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-600 dark:text-rose-300 font-semibold">
                  {joinError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">Room Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., LC-8F2K9P"
                  value={joinCode}
                  onChange={(e) => setJoinCode(normalizeRoomCode(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FAF9FF] dark:bg-[#1E1B33] font-mono text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter room password..."
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FAF9FF] dark:bg-[#1E1B33] text-xs text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsJoinPrivateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={joiningPrivate} variant="primary" size="sm" className="min-h-[44px] bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-bold">
                  {joiningPrivate ? 'Verifying...' : 'Unlock & Enter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Launch Live Poll Modal */}
      {isPollModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2D2A4A]/80 dark:bg-[#100E1C]/90 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E3DFF5] dark:border-[#3D3861] pb-3">
              <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#6C5CE7]" />
                <span>Launch Room Poll</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPollModalOpen(false)}
                className="p-1.5 rounded-xl text-[#6B6890] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] cursor-pointer"
                aria-label="Close poll modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">Question or Quick Check</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  placeholder="e.g., What is the time complexity of HeapSort?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FAF9FF] dark:bg-[#1E1B33] text-xs text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">Options (one per line, up to 4)</label>
                <textarea
                  rows={4}
                  required
                  value={pollOptionsText}
                  onChange={(e) => setPollOptionsText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FAF9FF] dark:bg-[#1E1B33] text-xs text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsPollModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="min-h-[44px] bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-bold">
                  Broadcast Poll
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Room Confirmation Modal */}
      {deleteConfirmRoom && (
        <div className="fixed inset-0 z-50 bg-[#2D2A4A]/80 dark:bg-[#100E1C]/90 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E3DFF5] dark:border-[#3D3861] pb-3">
              <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span>Delete Study Room?</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeleteConfirmRoom(null)}
                disabled={deletingRoom}
                className="p-1.5 rounded-xl text-[#6B6890] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] cursor-pointer"
                aria-label="Close delete room confirmation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-600 dark:text-rose-300 font-semibold">
                  {deleteError}
                </div>
              )}
              <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
                This will permanently close{' '}
                <strong className="text-[#2D2A4A] dark:text-[#F1EFFF]">{deleteConfirmRoom.title}</strong>, disconnect active participants, and remove it from the study room catalog.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deletingRoom}
                onClick={() => setDeleteConfirmRoom(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={deletingRoom}
                onClick={handleConfirmDeleteRoom}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {deletingRoom ? 'Deleting...' : 'Delete Room'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
