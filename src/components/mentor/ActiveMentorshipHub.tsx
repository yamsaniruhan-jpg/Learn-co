import React, { useState } from 'react';
import {
  Target,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Play,
  FileText,
  Lock,
  PauseCircle,
  PlayCircle,
  Flag,
  Share2,
} from 'lucide-react';
import {
  MentorshipRelationship,
  MentorshipGoal,
  MentorshipTask,
  MentorshipSession,
  MentorshipMessage,
  AuthorizedLearnerInsights,
} from '../../types/mentorship';
import { MentorshipChat } from './MentorshipChat';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';

interface ActiveMentorshipHubProps {
  relationship: MentorshipRelationship;
  goals: MentorshipGoal[];
  tasks: MentorshipTask[];
  sessions: MentorshipSession[];
  messages: MentorshipMessage[];
  insights: AuthorizedLearnerInsights | null;
  currentUserId: string;
  onSendMessage: (content: string, attachedResource?: any) => Promise<void>;
  onCreateGoal: (data: any) => Promise<void>;
  onUpdateGoal: (goalId: string, updates: Partial<MentorshipGoal>) => Promise<void>;
  onCreateTask: (data: any) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<MentorshipTask>) => Promise<void>;
  onScheduleSession: (data: any) => Promise<void>;
  onOpenSessionRoom: (session: MentorshipSession) => void;
  onOpenPrivacyModal: () => void;
  onOpenReportModal: () => void;
  onTogglePauseStatus: () => Promise<void>;
  onPrepareWithCopilot: (sessionTopic?: string) => void;
}

export const ActiveMentorshipHub: React.FC<ActiveMentorshipHubProps> = ({
  relationship,
  goals,
  tasks,
  sessions,
  messages,
  insights,
  currentUserId,
  onSendMessage,
  onCreateGoal,
  onUpdateGoal,
  onCreateTask,
  onUpdateTask,
  onScheduleSession,
  onOpenSessionRoom,
  onOpenPrivacyModal,
  onOpenReportModal,
  onTogglePauseStatus,
  onPrepareWithCopilot,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'chat' | 'sessions' | 'insights'>('overview');
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');

  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('16:00');
  const [sessionDuration, setSessionDuration] = useState(45);

  const handleCreateGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !newGoalDate) return;
    await onCreateGoal({
      title: newGoalTitle,
      description: newGoalDescription,
      targetDate: newGoalDate,
      subjectId: relationship.subjectId,
    });
    setNewGoalTitle('');
    setNewGoalDescription('');
    setNewGoalDate('');
    setShowNewGoalForm(false);
  };

  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim() || !sessionDate) return;
    await onScheduleSession({
      mentorshipId: relationship.id,
      title: sessionTitle,
      scheduledDate: sessionDate,
      startTime: sessionTime,
      durationMinutes: sessionDuration,
      topicsCovered: [sessionTitle],
    });
    setSessionTitle('');
    setSessionDate('');
    setShowNewSessionForm(false);
  };

  const completedGoalsCount = goals.filter((g) => g.status === 'COMPLETED').length;
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progressPercent, 0) / goals.length)
    : 0;

  const nextSession = sessions.find((s) => s.status === 'SCHEDULED');

  return (
    <div className="space-y-6">
      {/* Active Mentorship Relationship Card Header */}
      <Card
        variant="default"
        padding="md"
        className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-slate-500/5 border-emerald-500/30 dark:border-emerald-500/20"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src={relationship.mentorAvatar}
                alt={relationship.mentorName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
                  {relationship.mentorName}
                </h2>
                <Badge
                  variant={relationship.status === 'ACTIVE' ? 'success' : 'default'}
                  size="sm"
                  className="capitalize font-bold"
                >
                  {relationship.status} Mentorship
                </Badge>
                <span className="text-xs text-slate-500">
                  Cadence: {relationship.agreedCadence}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                {relationship.mentorHeadline || 'STEM Domain Specialist & Research Mentor'}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Subject: <strong className="text-slate-700 dark:text-slate-300">{relationship.subjectId.toUpperCase()}</strong></span>
                <span>•</span>
                <span>Track: <strong className="text-slate-700 dark:text-slate-300">{relationship.targetTrack}</strong></span>
                <span>•</span>
                <span>Active Since: {new Date(relationship.startDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              id="btn-schedule-session-header"
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
              onClick={() => setShowNewSessionForm(true)}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Session</span>
            </Button>

            <Button
              id="btn-privacy-settings-header"
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
              onClick={onOpenPrivacyModal}
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Privacy Controls</span>
            </Button>

            <Button
              id="btn-toggle-pause"
              variant="outline"
              size="sm"
              className="text-xs text-slate-500"
              onClick={onTogglePauseStatus}
            >
              {relationship.status === 'ACTIVE' ? (
                <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </Button>

            <Button
              id="btn-report-safety"
              variant="outline"
              size="sm"
              className="text-xs text-slate-400 hover:text-rose-500"
              onClick={onOpenReportModal}
            >
              <Flag className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Subtab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 overflow-x-auto">
        <button
          id="subtab-overview-goals"
          onClick={() => setActiveSubTab('overview')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'overview'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Goals & Tasks ({goals.length})</span>
        </button>

        <button
          id="subtab-chat-messages"
          onClick={() => setActiveSubTab('chat')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'chat'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>1-on-1 Messages</span>
        </button>

        <button
          id="subtab-sessions-notes"
          onClick={() => setActiveSubTab('sessions')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'sessions'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Sessions & Notes ({sessions.length})</span>
        </button>

        <button
          id="subtab-authorized-insights"
          onClick={() => setActiveSubTab('insights')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'insights'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Authorized Diagnostics</span>
        </button>
      </div>

      {/* SUBTAB 1: Overview & Goals */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Upcoming Session Banner if present */}
          {nextSession && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-sm shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Upcoming Mentorship Session
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {nextSession.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {nextSession.scheduledDate} at {nextSession.startTime} UTC ({nextSession.durationMinutes} mins)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  id="btn-prep-copilot-banner"
                  variant="outline"
                  size="sm"
                  className="text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  onClick={() => onPrepareWithCopilot(nextSession.title)}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Prep Agenda</span>
                </Button>

                <Button
                  id="btn-join-session-banner"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  onClick={() => onOpenSessionRoom(nextSession)}
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Launch Study Room</span>
                </Button>
              </div>
            </div>
          )}

          {/* Goal Progress Metric Bar */}
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Mentorship Milestone Progress
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {completedGoalsCount} of {goals.length} Goals Achieved
                </h3>
              </div>
              <span className="text-2xl font-black text-emerald-500">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} size="md" variant="success" />
          </Card>

          {/* Goals List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Active Milestones & Conceptual Goals
                </h3>
                <p className="text-xs text-slate-500">
                  Target competencies established with {relationship.mentorName}
                </p>
              </div>

              <Button
                id="btn-add-goal"
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1"
                onClick={() => setShowNewGoalForm(!showNewGoalForm)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </Button>
            </div>

            {/* New Goal Form Inline */}
            {showNewGoalForm && (
              <form onSubmit={handleCreateGoalSubmit} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Create New Mentorship Milestone
                </h4>
                <input
                  type="text"
                  id="input-new-goal-title"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Master Lagrange Multipliers on Constrained Extrema"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  required
                />
                <textarea
                  rows={2}
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  placeholder="Specific derivation conditions or success criteria..."
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    id="input-new-goal-date"
                    value={newGoalDate}
                    onChange={(e) => setNewGoalDate(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    required
                  />
                  <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 text-white text-xs">
                    Save Goal
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setShowNewGoalForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <Card
                  key={goal.id}
                  id={`goal-card-${goal.id}`}
                  variant="default"
                  padding="md"
                  className="space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {goal.title}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      goal.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-blue-500/10 text-blue-600'
                    }`}>
                      {goal.status}
                    </span>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {goal.description}
                    </p>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Progress: {goal.progressPercent}%</span>
                      <span>Target: {goal.targetDate}</span>
                    </div>
                    <Progress value={goal.progressPercent} size="sm" variant={goal.progressPercent === 100 ? 'success' : 'primary'} />
                  </div>

                  {/* Progress slider adjustment */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">Update Progress:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={goal.progressPercent}
                      onChange={(e) => onUpdateGoal(goal.id, { progressPercent: parseInt(e.target.value, 10) })}
                      className="w-28 accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Assigned Tasks & Drills Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Assigned Actions & Practice Drills
                </h3>
                <p className="text-xs text-slate-500">
                  Remediation tasks and active recall exercises
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No pending action items assigned.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    id={`task-row-${task.id}`}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        id={`btn-toggle-task-${task.id}`}
                        onClick={() => onUpdateTask(task.id, {
                          status: task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED',
                        })}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                        }`}
                      >
                        {task.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div className="space-y-0.5">
                        <span className={`text-xs font-bold ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="text-[11px] text-slate-500">
                            {task.description}
                          </p>
                        )}
                        {task.linkedResource && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                            <FileText className="w-3 h-3" />
                            {task.linkedResource.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-[11px] text-slate-400">
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: 1-on-1 Messages */}
      {activeSubTab === 'chat' && (
        <MentorshipChat
          relationship={relationship}
          messages={messages}
          currentUserId={currentUserId}
          onSendMessage={onSendMessage}
          onPrepareSessionWithCopilot={() => onPrepareWithCopilot()}
        />
      )}

      {/* SUBTAB 3: Sessions & Notes */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                1-on-1 Mentorship Sessions & In-Platform Meeting Logs
              </h3>
              <p className="text-xs text-slate-500">
                Schedule meetings and access collaborative shared study notes
              </p>
            </div>

            <Button
              id="btn-schedule-session-tab"
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
              onClick={() => setShowNewSessionForm(!showNewSessionForm)}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Session</span>
            </Button>
          </div>

          {/* Schedule Session Form Inline */}
          {showNewSessionForm && (
            <form onSubmit={handleCreateSessionSubmit} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Schedule 1-on-1 Study Session
              </h4>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. Calculus Extrema Diagnostics & Inconclusive Second Derivatives"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  required
                />
                <input
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  required
                />
                <select
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(parseInt(e.target.value, 10))}
                  className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 text-white text-xs">
                  Confirm Schedule
                </Button>
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setShowNewSessionForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {sessions.map((sess) => (
              <Card
                key={sess.id}
                id={`session-card-${sess.id}`}
                variant="default"
                padding="md"
                className="space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white shrink-0 ${sess.status === 'SCHEDULED' ? 'bg-emerald-600' : 'bg-slate-500'}`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {sess.title}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          sess.status === 'SCHEDULED'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {sess.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sess.scheduledDate} at {sess.startTime} UTC • Duration: {sess.durationMinutes} min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => onPrepareWithCopilot(sess.title)}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Prep Agenda</span>
                    </Button>

                    <Button
                      id={`btn-open-room-${sess.id}`}
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                      onClick={() => onOpenSessionRoom(sess)}
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{sess.status === 'SCHEDULED' ? 'Enter Room' : 'View Notes'}</span>
                    </Button>
                  </div>
                </div>

                {/* Topics & Shared Notes Snippet */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex flex-wrap gap-1">
                    {sess.topicsCovered.map((t, i) => (
                      <span key={i} className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                  {sess.sharedNotes && (
                    <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px] line-clamp-2">
                      {sess.sharedNotes}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: Authorized Diagnostics */}
      {activeSubTab === 'insights' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Authorized Diagnostic Profile (Mentor View)
              </h3>
              <p className="text-xs text-slate-500">
                Live preview of learning metrics and mistake records shared with {relationship.mentorName}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1.5"
              onClick={onOpenPrivacyModal}
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit Permissions</span>
            </Button>
          </div>

          {insights?.masteryHighlights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card variant="default" padding="md" className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Strong Mastery Areas</span>
                </span>
                <div className="space-y-2">
                  {insights.masteryHighlights.strongConcepts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-500/5">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{c.title}</span>
                      <span className="font-bold text-emerald-600">{c.score}%</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card variant="default" padding="md" className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Diagnostic Focus Areas</span>
                </span>
                <div className="space-y-2">
                  {insights.masteryHighlights.weakConcepts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-500/5">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{c.title}</span>
                      <span className="font-bold text-amber-600">{c.score}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              Mastery progress sharing is currently disabled in your privacy settings.
            </div>
          )}

          {/* Recent Mistake Records */}
          {insights?.mistakeDiagnostics && (
            <Card variant="default" padding="md" className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Recent Diagnostic Misconception Records
              </span>
              <div className="space-y-2">
                {insights.mistakeDiagnostics.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>{m.topicId}</span>
                      <span className="text-slate-400 text-[10px]">{new Date(m.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{m.questionText}</p>
                    <div className="pt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <strong>Invariant Solution: </strong>{m.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
