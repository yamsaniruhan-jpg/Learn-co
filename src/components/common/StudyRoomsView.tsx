import React, { useState } from 'react';
import { Users, Video, MessageSquare, Play, Sparkles, Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface StudyRoomsViewProps {
  onNavigateToTab: (tabId: string) => void;
}

export const StudyRoomsView: React.FC<StudyRoomsViewProps> = ({ onNavigateToTab }) => {
  const [activeRoom, setActiveRoom] = useState<string | null>('room-calculus');
  const [messages, setMessages] = useState<Array<{ id: string; user: string; text: string; time: string }>>([
    { id: '1', user: 'Alex C.', text: 'Hey everyone! Working on multivariable optimization problems in Calculus room.', time: '10:14 AM' },
    { id: '2', user: 'Maria S.', text: 'Does anyone have the step-by-step derivation for Lagrange multipliers?', time: '10:16 AM' },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const rooms = [
    { id: 'room-calculus', title: 'Advanced Calculus & 3D Surfaces', peers: 4, topic: 'Multivariable Optimization', color: 'indigo' },
    { id: 'room-physics', title: 'Classical Mechanics & Oscillators', peers: 3, topic: 'Phase Space Dynamics', color: 'amber' },
    { id: 'room-chem', title: 'Organic Chemistry SN2 Mechanism', peers: 5, topic: 'Stereochemical Inversion', color: 'rose' },
    { id: 'room-cs', title: 'Algorithms & Machine Learning', peers: 6, topic: 'Gradient Descent Landscapes', color: 'purple' },
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), user: 'You (Scholar)', text: inputMsg.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setInputMsg('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
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
            Join cohort peers in real-time virtual rooms. Collaborate on whiteboard derivations, discuss calculus and chemistry problems, and maintain synchronized streaks.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigateToTab('practice')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shrink-0"
        >
          Practice Arena
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Active Cohort Rooms
          </h3>
          <div className="space-y-2.5">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeRoom === room.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h4 className="font-bold text-sm">{room.title}</h4>
                  </div>
                  <p className={`text-[11px] ${activeRoom === room.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                    Topic: {room.topic}
                  </p>
                </div>
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold ${activeRoom === room.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  {room.peers} Peers
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-[520px]">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Advanced Calculus & 3D Surfaces Room
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                Group Streak Bonus: +10% XP Active
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{m.user}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{m.time}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Chat with study peers, share LaTeX equations..."
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
    </div>
  );
};
