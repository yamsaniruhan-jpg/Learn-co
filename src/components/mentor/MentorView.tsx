import React, { useState, useEffect } from 'react';
import {
  Compass,
  Users,
  Search,
  Calendar,
  Sparkles,
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Plus,
  Play,
  Clock,
} from 'lucide-react';
import { UserProfile, ConceptMastery, QuestionAttempt, SubjectId } from '../../types';
import {
  MentorProfile,
  MentorMatchRecommendation,
  MentorshipRequest,
  MentorshipRelationship,
  MentorshipGoal,
  MentorshipTask,
  MentorshipSession,
  MentorshipMessage,
  AuthorizedLearnerInsights,
  MentorshipPrivacySettings,
} from '../../types/mentorship';
import { MentorshipClient } from '../../services/mentorshipClient';
import { MentorDiscovery } from './MentorDiscovery';
import { ActiveMentorshipHub } from './ActiveMentorshipHub';
import { MentorProfileModal } from './MentorProfileModal';
import { SessionRoomModal } from './SessionRoomModal';
import { PrivacySettingsModal } from './PrivacySettingsModal';
import { SafetyReportModal } from './SafetyReportModal';
import { MentorPortal } from './MentorPortal';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { MasteryIndicator } from '../ui/GamificationIndicators';

interface MentorViewProps {
  user: UserProfile;
  masteries: ConceptMastery[];
  attempts: QuestionAttempt[];
  onStartRevision: (conceptId: string) => void;
  onNavigateToCopilot?: (initialPrompt?: string) => void;
}

export const MentorView: React.FC<MentorViewProps> = ({
  user,
  masteries,
  attempts,
  onStartRevision,
  onNavigateToCopilot,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'my_mentorship' | 'discover' | 'sessions' | 'portal' | 'diagnostics'>('my_mentorship');

  // Core Data State
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [recommendations, setRecommendations] = useState<MentorMatchRecommendation[]>([]);
  const [relationships, setRelationships] = useState<MentorshipRelationship[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<MentorshipRelationship | null>(null);
  const [requests, setRequests] = useState<{ sent: MentorshipRequest[]; received: MentorshipRequest[] }>({
    sent: [],
    received: [],
  });

  // Relationship Sub-Entities
  const [goals, setGoals] = useState<MentorshipGoal[]>([]);
  const [tasks, setTasks] = useState<MentorshipTask[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [messages, setMessages] = useState<MentorshipMessage[]>([]);
  const [insights, setInsights] = useState<AuthorizedLearnerInsights | null>(null);

  // Educator Portal State
  const [portalData, setPortalData] = useState<{
    mentorProfile: MentorProfile | null;
    activeMentees: Array<{
      relationship: MentorshipRelationship;
      insights: AuthorizedLearnerInsights | null;
    }>;
    pendingRequests: MentorshipRequest[];
    upcomingSessions: MentorshipSession[];
  }>({
    mentorProfile: null,
    activeMentees: [],
    pendingRequests: [],
    upcomingSessions: [],
  });

  // Filter State
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<SubjectId | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [selectedMentorForProfile, setSelectedMentorForProfile] = useState<MentorProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [activeSessionForRoom, setActiveSessionForRoom] = useState<MentorshipSession | null>(null);
  const [isSessionRoomOpen, setIsSessionRoomOpen] = useState(false);

  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportedUser, setReportedUser] = useState<{ id: string; name: string } | null>(null);

  // Load initial data
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [mentorRes, recs, rels, reqs, port] = await Promise.all([
        MentorshipClient.getMentors({ limit: 12 }),
        MentorshipClient.getRecommendations(),
        MentorshipClient.getRelationships(),
        MentorshipClient.getRequests(),
        MentorshipClient.getMentorDashboard().catch(() => ({
          mentorProfile: null,
          activeMentees: [],
          pendingRequests: [],
          upcomingSessions: [],
        })),
      ]);

      setMentors(mentorRes.mentors);
      setRecommendations(recs);
      setRelationships(rels);
      setRequests(reqs);
      setPortalData(port);

      if (rels.length > 0) {
        setSelectedRelationship(rels[0]);
      }
    } catch (err) {
      console.error('Failed to load mentorship data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load sub-entities when selected relationship changes
  useEffect(() => {
    if (!selectedRelationship) {
      setGoals([]);
      setTasks([]);
      setSessions([]);
      setMessages([]);
      setInsights(null);
      return;
    }

    const loadRelationshipDetails = async () => {
      try {
        const [g, t, s, m, ins] = await Promise.all([
          MentorshipClient.getGoals(selectedRelationship.id),
          MentorshipClient.getTasks(selectedRelationship.id),
          MentorshipClient.getSessions(selectedRelationship.id),
          MentorshipClient.getMessages(selectedRelationship.id),
          MentorshipClient.getAuthorizedInsights(selectedRelationship.id).catch(() => null),
        ]);
        setGoals(g);
        setTasks(t);
        setSessions(s);
        setMessages(m);
        setInsights(ins);
      } catch (err) {
        console.error('Failed to load relationship sub-entities:', err);
      }
    };

    loadRelationshipDetails();
  }, [selectedRelationship?.id]);

  // Handlers
  const handleSendMessage = async (content: string, attachedResource?: any) => {
    if (!selectedRelationship) return;
    const newMsg = await MentorshipClient.sendMessage(selectedRelationship.id, content, attachedResource);
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleCreateGoal = async (goalData: any) => {
    if (!selectedRelationship) return;
    const newGoal = await MentorshipClient.createGoal(selectedRelationship.id, goalData);
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<MentorshipGoal>) => {
    const updated = await MentorshipClient.updateGoal(goalId, updates);
    setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
  };

  const handleCreateTask = async (taskData: any) => {
    if (!selectedRelationship) return;
    const newTask = await MentorshipClient.createTask(selectedRelationship.id, taskData);
    setTasks((prev) => [...prev, newTask]);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<MentorshipTask>) => {
    const updated = await MentorshipClient.updateTask(taskId, updates);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  const handleScheduleSession = async (sessionData: any) => {
    const newSession = await MentorshipClient.scheduleSession(sessionData);
    setSessions((prev) => [...prev, newSession]);
  };

  const handleUpdateSession = async (sessionId: string, updates: Partial<MentorshipSession>) => {
    const updated = await MentorshipClient.updateSession(sessionId, updates);
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
    if (activeSessionForRoom?.id === sessionId) {
      setActiveSessionForRoom(updated);
    }
  };

  const handleSubmitFeedback = async (feedbackData: any) => {
    await MentorshipClient.submitFeedback(feedbackData);
  };

  const handleSubmitRequest = async (requestData: any) => {
    const req = await MentorshipClient.createRequest(requestData);
    setRequests((prev) => ({
      ...prev,
      sent: [req, ...prev.sent],
    }));
  };

  const handleCancelRequest = async (requestId: string) => {
    await MentorshipClient.cancelRequest(requestId);
    setRequests((prev) => ({
      ...prev,
      sent: prev.sent.filter((r) => r.id !== requestId),
    }));
  };

  const handleRespondRequest = async (requestId: string, action: 'ACCEPT' | 'DECLINE', note?: string) => {
    const result = await MentorshipClient.respondToRequest(requestId, action, note);
    setPortalData((prev) => ({
      ...prev,
      pendingRequests: prev.pendingRequests.filter((r) => r.id !== requestId),
    }));
    if (result.relationship) {
      setRelationships((prev) => [result.relationship!, ...prev]);
    }
  };

  const handleSavePrivacySettings = async (settings: Partial<MentorshipPrivacySettings>) => {
    if (!selectedRelationship) return;
    const updated = await MentorshipClient.updatePrivacySettings(selectedRelationship.id, settings);
    setSelectedRelationship((prev) => (prev ? { ...prev, privacySettings: updated } : null));
  };

  const handleTogglePause = async () => {
    if (!selectedRelationship) return;
    const nextStatus = selectedRelationship.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const updated = await MentorshipClient.updateRelationshipStatus(selectedRelationship.id, nextStatus);
    setSelectedRelationship(updated);
    setRelationships((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handlePrepareSessionWithCopilot = (sessionTopic?: string) => {
    if (onNavigateToCopilot && selectedRelationship) {
      onNavigateToCopilot(
        `Help me prepare for my 1-on-1 mentorship study session with ${selectedRelationship.mentorName} on ${sessionTopic || selectedRelationship.subjectId}. Synthesize my active goals and recent weak areas into an interactive meeting agenda.`
      );
    }
  };

  // Diagnostics calculations from Volume 6
  const averageRetention = Math.round(
    masteries.reduce((sum, m) => sum + m.retentionStrength, 0) / Math.max(1, masteries.length)
  );
  const atRiskConcepts = masteries.filter((m) => m.retentionStrength < 75 || m.isWeakArea);

  const weeklyPrescriptions = [
    {
      id: 'rx-1',
      title: 'Active Recall Drill on SN2 Walden Inversion',
      subject: 'Chemistry',
      estimatedMinutes: 10,
      priority: 'high',
      dueIn: 'Today',
      description: 'Stereochemical reversal conditions have dropped below 65% memory half-life.',
    },
    {
      id: 'rx-2',
      title: 'Calculus Monotonicity Boundary Tests',
      subject: 'Mathematics',
      estimatedMinutes: 15,
      priority: 'medium',
      dueIn: 'Tomorrow',
      description: 'Reinforce critical value testing on open vs closed intervals.',
    },
    {
      id: 'rx-3',
      title: 'Gradient Descent Momentum Stability',
      subject: 'Computer Science',
      estimatedMinutes: 12,
      priority: 'low',
      dueIn: 'In 3 days',
      description: 'Review oscillation dampening in high-curvature quadratic ravines.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Accredited STEM Mentorship Network</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
            Mentorship & Cognitive Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Connect with verified STEM mentors, schedule 1-on-1 study rooms, and review cognitive retention forecasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {relationships.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{relationships.length} Active Mentor(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto pb-0.5">
        <button
          id="main-tab-my-mentorship"
          onClick={() => setActiveMainTab('my_mentorship')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeMainTab === 'my_mentorship'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>My Mentorship</span>
        </button>

        <button
          id="main-tab-discover-mentors"
          onClick={() => setActiveMainTab('discover')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeMainTab === 'discover'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Discover Mentors ({mentors.length})</span>
        </button>

        <button
          id="main-tab-sessions"
          onClick={() => setActiveMainTab('sessions')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeMainTab === 'sessions'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Sessions & Rooms</span>
        </button>

        <button
          id="main-tab-portal"
          onClick={() => setActiveMainTab('portal')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeMainTab === 'portal'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Educator Portal</span>
          {portalData.pendingRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {portalData.pendingRequests.length}
            </span>
          )}
        </button>

        <button
          id="main-tab-diagnostics"
          onClick={() => setActiveMainTab('diagnostics')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeMainTab === 'diagnostics'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Cognitive Forecast</span>
        </button>
      </div>

      {/* TAB 1: My Mentorship */}
      {activeMainTab === 'my_mentorship' && (
        <div className="space-y-6">
          {relationships.length === 0 ? (
            <div className="space-y-6">
              {/* Onboarding Empty State */}
              <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Compass className="w-8 h-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                  Elevate Your Understanding with 1-on-1 Mentorship
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Work directly with accredited STEM mentors to solve difficult invariant proofs, prepare for competitive exams, and receive personalized study agendas.
                </p>
                <div className="pt-2">
                  <Button
                    id="btn-discover-mentors-cta"
                    variant="primary"
                    size="md"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 shadow-sm"
                    onClick={() => setActiveMainTab('discover')}
                  >
                    <span>Browse Verified Mentors</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>

              {/* Recommended Mentors Carousel */}
              {recommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Recommended Mentors for Your Curriculum Focus
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.slice(0, 2).map((rec) => (
                      <Card
                        key={rec.mentor.id}
                        variant="default"
                        padding="md"
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={rec.mentor.avatarUrl}
                            alt={rec.mentor.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {rec.mentor.name}
                            </h4>
                            <p className="text-xs text-slate-500">{rec.mentor.headline}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-emerald-600">
                            {rec.matchScore}% Match Score
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setSelectedMentorForProfile(rec.mentor);
                              setIsProfileModalOpen(true);
                            }}
                          >
                            View & Request
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Relationship Switcher if multiple */}
              {relationships.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-slate-400 shrink-0">Your Mentors:</span>
                  {relationships.map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => setSelectedRelationship(rel)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                        selectedRelationship?.id === rel.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <img src={rel.mentorAvatar} alt={rel.mentorName} className="w-4 h-4 rounded-full object-cover" />
                      <span>{rel.mentorName}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Active Hub */}
              {selectedRelationship && (
                <ActiveMentorshipHub
                  relationship={selectedRelationship}
                  goals={goals}
                  tasks={tasks}
                  sessions={sessions}
                  messages={messages}
                  insights={insights}
                  currentUserId={user.id}
                  onSendMessage={handleSendMessage}
                  onCreateGoal={handleCreateGoal}
                  onUpdateGoal={handleUpdateGoal}
                  onCreateTask={handleCreateTask}
                  onUpdateTask={handleUpdateTask}
                  onScheduleSession={handleScheduleSession}
                  onOpenSessionRoom={(sess) => {
                    setActiveSessionForRoom(sess);
                    setIsSessionRoomOpen(true);
                  }}
                  onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
                  onOpenReportModal={() => {
                    setReportedUser({ id: selectedRelationship.mentorId, name: selectedRelationship.mentorName });
                    setIsReportModalOpen(true);
                  }}
                  onTogglePauseStatus={handleTogglePause}
                  onPrepareWithCopilot={handlePrepareSessionWithCopilot}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Discover Mentors */}
      {activeMainTab === 'discover' && (
        <MentorDiscovery
          mentors={mentors}
          recommendations={recommendations}
          pendingRequests={requests.sent}
          selectedSubject={selectedSubjectFilter}
          onSubjectChange={setSelectedSubjectFilter}
          onViewProfile={(mentor) => {
            setSelectedMentorForProfile(mentor);
            setIsProfileModalOpen(true);
          }}
          onRequestMentor={(mentor) => {
            setSelectedMentorForProfile(mentor);
            setIsProfileModalOpen(true);
          }}
          onCancelRequest={handleCancelRequest}
        />
      )}

      {/* TAB 3: Sessions & Meeting Rooms */}
      {activeMainTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                1-on-1 Study Sessions & Meeting History
              </h3>
              <p className="text-xs text-slate-500">
                Scheduled consultations, interactive problem-solving rooms, and shared notes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                No sessions scheduled yet. Connect with a mentor to schedule your first 1-on-1 session.
              </div>
            ) : (
              sessions.map((sess) => (
                <Card
                  key={sess.id}
                  variant="default"
                  padding="md"
                  className="space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {sess.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {sess.scheduledDate} at {sess.startTime} UTC • {sess.durationMinutes} mins
                      </p>
                    </div>
                    <Badge variant={sess.status === 'SCHEDULED' ? 'success' : 'default'} size="sm">
                      {sess.status}
                    </Badge>
                  </div>

                  {sess.sharedNotes && (
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {sess.sharedNotes}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handlePrepareSessionWithCopilot(sess.title)}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Prep with Copilot</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                      onClick={() => {
                        setActiveSessionForRoom(sess);
                        setIsSessionRoomOpen(true);
                      }}
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>{sess.status === 'SCHEDULED' ? 'Enter Room' : 'View Notes'}</span>
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Educator Portal */}
      {activeMainTab === 'portal' && (
        <MentorPortal
          mentorProfile={portalData.mentorProfile}
          activeMentees={portalData.activeMentees}
          pendingRequests={portalData.pendingRequests}
          upcomingSessions={portalData.upcomingSessions}
          onRespondRequest={handleRespondRequest}
          onUpdateProfile={async (prof) => {
            await MentorshipClient.updateMentorProfile(prof);
          }}
          onSelectMentee={(rel) => {
            setSelectedRelationship(rel);
            setActiveMainTab('my_mentorship');
          }}
          onOpenSessionRoom={(sess) => {
            setActiveSessionForRoom(sess);
            setIsSessionRoomOpen(true);
          }}
        />
      )}

      {/* TAB 5: Memory Forecast & Diagnostics (from Volume 6) */}
      {activeMainTab === 'diagnostics' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Top 3 Diagnostic Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card variant="default" padding="md" className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Mean Memory Stability
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-500">{averageRetention}%</span>
                <span className="text-xs text-slate-400">composite retention</span>
              </div>
              <Progress value={averageRetention} variant="success" size="sm" />
            </Card>

            <Card variant="default" padding="md" className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                At-Risk Concepts
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-500">{atRiskConcepts.length}</span>
                <span className="text-xs text-slate-400">decaying past threshold</span>
              </div>
              <p className="text-[11px] text-slate-500">Scheduled for spaced repetition</p>
            </Card>

            <Card variant="default" padding="md" className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Mastered Nodes
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-500">
                  {masteries.filter((m) => m.retentionStrength >= 85).length}
                </span>
                <span className="text-xs text-slate-400">above 85% retention</span>
              </div>
              <p className="text-[11px] text-slate-500">Solidified long-term memory</p>
            </Card>
          </div>

          {/* Weekly Prescriptions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Targeted Adaptive Prescriptions
                </h3>
                <p className="text-xs text-slate-500">
                  Recommended recall sessions generated from your diagnostic failure patterns.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {weeklyPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" size="sm" className="text-[11px] font-bold">
                        {rx.subject}
                      </Badge>
                      <span className="text-xs text-slate-400">Due {rx.dueIn} • {rx.estimatedMinutes} mins</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {rx.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {rx.description}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs shrink-0"
                    onClick={() => onStartRevision(rx.id)}
                  >
                    <span>Start Drill</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <MentorProfileModal
        mentor={selectedMentorForProfile}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onRequestSubmitted={handleSubmitRequest}
      />

      {activeSessionForRoom && selectedRelationship && (
        <SessionRoomModal
          session={activeSessionForRoom}
          relationship={selectedRelationship}
          isOpen={isSessionRoomOpen}
          onClose={() => setIsSessionRoomOpen(false)}
          onUpdateSession={handleUpdateSession}
          onSubmitFeedback={handleSubmitFeedback}
        />
      )}

      {selectedRelationship && (
        <PrivacySettingsModal
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
          mentorName={selectedRelationship.mentorName}
          currentSettings={selectedRelationship.privacySettings}
          onSave={handleSavePrivacySettings}
        />
      )}

      {reportedUser && (
        <SafetyReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportedUserName={reportedUser.name}
          reportedUserId={reportedUser.id}
          mentorshipId={selectedRelationship?.id}
          onSubmitReport={async (report) => {
            await MentorshipClient.submitReport(report);
          }}
        />
      )}
    </div>
  );
};
