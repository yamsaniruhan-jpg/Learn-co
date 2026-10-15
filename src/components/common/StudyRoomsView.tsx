import React, { useState } from 'react';
import { Users, Video, MessageSquare, Play, Sparkles, Trophy, Clock, CheckCircle2, Plus, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface StudyRoomsViewProps {
  onNavigateToTab: (tabId: string) => void;
}

interface Room {
  id: string;
  title: string;
  peers: number;
  topic: string;
  color: string;
}

export const StudyRoomsView: React.FC<StudyRoomsViewProps> = ({ onNavigateToTab }) => {
  const [rooms, setRooms] = useState<Room[]>([
    { id: 'room-calculus', title: 'Advanced Calculus & 3D Surfaces', peers: 4, topic: 'Multivariable Optimization', color: 'indigo' },
    { id: 'room-physics', title: 'Classical Mechanics & Oscillators', peers: 3, topic: 'Phase Space Dynamics', color: 'amber' },
    { id: 'room-chem', title: 'Organic Chemistry SN2 Mechanism', peers: 5, topic: 'Stereochemical Inversion', color: 'rose' },
    { id: 'room-cs', title: 'Algorithms & Machine Learning', peers: 6, topic: 'Gradient Descent Landscapes', color: 'purple' },
  ]);

  const [activeRoomId, setActiveRoomId] = useState<string>('room-calculus');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Room Form state
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');

  const [messages, setMessages] = useState<Array<{ id: string; roomId: string; user: string; text: string; time: string }>>([
    { id: '1', roomId: 'room-calculus', user: 'Alex C.', text: 'Hey everyone! Working on multivariable optimization problems in Calculus room.', time: '10:14 AM' },
    { id: '2', roomId: 'room-calculus', user: 'Maria S.', text: 'Does anyone have the step-by-step derivation for Lagrange multipliers?', time: '10:16 AM' },
    { id: '3', roomId: 'room-physics', user: 'David K.', text: 'Simulating harmonic oscillator phase orbits with damping.', time: '09:45 AM' },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];
  const currentMessages = messages.filter((m) => m.roomId === activeRoomId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        roomId: activeRoomId,
        user: 'You (Scholar)',
        text: inputMsg.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputMsg('');
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTopic.trim()) return;

    const newId = `room-${Date.now()}`;
    const createdRoom: Room = {
      id: newId,
      title: newTitle.trim(),
      peers: 1,
      topic: newTopic.trim(),
      color: 'indigo',
    };

    setRooms((prev) => [createdRoom, ...prev]);
    setActiveRoomId(newId);
    setNewTitle('');
    setNewTopic('');
    setIsCreateModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-300 border border-white/15">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Peer Collaborative Study Rooms (+10% Streak Multiplier)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Live STEM Study Rooms
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Join cohort peers in real-time virtual rooms or create your own custom room to collaborate on problem solving and maintain synchronized streaks.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
          >
            Create Room
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigateToTab('practice')}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Practice Arena
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rooms Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Cohort Rooms ({rooms.length})
            </h3>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Room</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeRoomId === room.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h4 className="font-bold text-sm">{room.title}</h4>
                  </div>
                  <p className={`text-[11px] ${activeRoomId === room.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                    Topic: {room.topic}
                  </p>
                </div>
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold ${activeRoomId === room.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  {room.peers} Peers
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Room Chat & Collaboration Area */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-[520px]">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                {activeRoom?.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                Group Streak Bonus: +10% XP Active
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {currentMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 opacity-40" />
                <p className="text-xs">No messages in this custom room yet. Start the conversation!</p>
              </div>
            ) : (
              currentMessages.map((m) => (
                <div key={m.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{m.user}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{m.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{m.text}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder={`Chat in ${activeRoom?.title}, share equations or derivation notes...`}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <Button type="submit" variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
              Send
            </Button>
          </form>
        </div>
      </div>

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Create Custom Study Room</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Room Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Quantum Physics & Wave Packets"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject / Focus Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Schrödinger Equation Derivation"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Create & Join Room
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
