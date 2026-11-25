import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
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
import { MentorAccessPanel } from './MentorAccessPanel';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { EmptyState } from '../ui/EmptyState';
import { ScreenSkeleton } from '../ui/Skeleton';
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
  const [activeMainTab, setActiveMainTab] = useState<'my_mentorship' | 'discover' | 'sessions' | 'portal' | 'diagnostics' | 'mentor_access'>('my_mentorship');
  const isOwnerOrAdmin = user.role === 'admin';
  const [isMentorRole, setIsMentorRole] = useState(
    user.role === 'educator' || user.role === 'admin'
  );

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

  // Filter & Live Sync State
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<SubjectId | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'error' | 'success';
    message: string;
    mailtoUrl?: string;
    mailtoLabel?: string;
  } | null>(null);

  // Modal State
  const [selectedMentorForProfile, setSelectedMentorForProfile] = useState<MentorProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [activeSessionForRoom, setActiveSessionForRoom] = useState<MentorshipSession | null>(null);
  const [isSessionRoomOpen, setIsSessionRoomOpen] = useState(false);

  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportedUser, setReportedUser] = useState<{ id: string; name: string } | null>(null);

  const notifyAction = (
    message: string,
    type: 'error' | 'success' = 'success',
    mailtoUrl?: string,
    mailtoLabel?: string
  ) => {
    setActionFeedback({ type, message, mailtoUrl, mailtoLabel });
    if (!mailtoUrl) {
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const syncOverviewData = useCallback(async (silent = false) => {
    if (silent) {
      setIsSyncing(true);
    } else {
      setIsLoading(true);
      setLoadError(null);
    }
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
      setLoadError(null);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      setSelectedRelationship((prev) => {
        if (prev && rels.some((r) => r.id === prev.id)) {
          return rels.find((r) => r.id === prev.id) || prev;
        }
        return rels.length > 0 ? rels[0] : null;
      });
    } catch (err: any) {
      console.error('Failed to load mentorship data:', err);
      const msg = err?.message || 'Unable to reach live mentorship service.';
      if (!silent) {
        setLoadError(msg);
        notifyAction(msg, 'error');
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  const syncRelationshipDetails = useCallback(async (relationshipId: string) => {
    try {
      const [g, t, s, m, ins] = await Promise.all([
        MentorshipClient.getGoals(relationshipId),
        MentorshipClient.getTasks(relationshipId),
        MentorshipClient.getSessions(relationshipId),
        MentorshipClient.getMessages(relationshipId),
        MentorshipClient.getAuthorizedInsights(relationshipId).catch(() => null),
      ]);
      setGoals(g);
      setTasks(t);
      setSessions(s);
      setMessages(m);
      setInsights(ins);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load relationship sub-entities:', err);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    await syncOverviewData(false);
  }, [syncOverviewData]);

  useEffect(() => {
    syncOverviewData(false);
  }, [syncOverviewData]);

  useEffect(() => {
    setIsMentorRole(
      user.role === 'educator' ||
        user.role === 'admin' ||
        Boolean(portalData.mentorProfile)
    );
  }, [user.role, portalData.mentorProfile]);

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

    syncRelationshipDetails(selectedRelationship.id);
  }, [selectedRelationship?.id, syncRelationshipDetails]);

  // Live background synchronization (active chat/sessions + directory/requests + window focus)
  useEffect(() => {
    const overviewTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncOverviewData(true);
      }
    }, 20000);

    const detailsTimer = selectedRelationship?.id
      ? window.setInterval(() => {
          if (document.visibilityState === 'visible') {
            syncRelationshipDetails(selectedRelationship.id);
          }
        }, 8000)
      : undefined;

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        syncOverviewData(true);
        if (selectedRelationship?.id) {
          syncRelationshipDetails(selectedRelationship.id);
        }
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.clearInterval(overviewTimer);
      if (detailsTimer) window.clearInterval(detailsTimer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [selectedRelationship?.id, syncOverviewData, syncRelationshipDetails]);

  // Handlers
  const handleSendMessage = async (content: string, attachedResource?: any) => {
    if (!selectedRelationship) return;
    try {
      const newMsg = await MentorshipClient.sendMessage(selectedRelationship.id, content, attachedResource);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err: any) {
      notifyAction(err?.message || 'Failed to send mentorship message.', 'error');
      throw err;
    }
  };

  const handleCreateGoal = async (goalData: any) => {
    if (!selectedRelationship) return;
    try {
      const newGoal = await MentorshipClient.createGoal(selectedRelationship.id, goalData);
      setGoals((prev) => [...prev, newGoal]);
      notifyAction('Mentorship milestone created.');
    } catch (err: any) {
      notifyAction(err?.message || 'Failed to create goal.', 'error');
    }
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<MentorshipGoal>) => {
    try {
      const updated = await MentorshipClient.updateGoal(goalId, updates);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    } catch (err: any) {
      notifyAction(err?.message || 'Failed to update goal.', 'error');
    }
  };

  const handleCreateTask = async (taskData: any) => {
    if (!selectedRelationship) return;
    try {
      const newTask = await MentorshipClient.createTask(selectedRelationship.id, taskData);
      setTasks((prev) => [...prev, newTask]);
    } catch (err: any) {
      notifyAction(err?.message || 'Failed to create task.', 'error');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<MentorshipTask>) => {
    try {
      const updated = await MentorshipClient.updateTask(taskId, updates);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err: any) {
      notifyAction(err?.message || 'Failed to update task.', 'error');
    }
  };

  const handleScheduleSession = async (sessionData: any) => {
    try {
      const newSession = await MentorshipClient.scheduleSession(sessionData);
      setSessions((prev) => [...prev, newSession]);
      notifyAction('Study session scheduled.');
    } catch (err: any) {
      notifyAction(err?.message || 'Failed to schedule session.', 'error');
    }
  };

  const handleUpdateSession = async (sessionId: string, updates: Partial<MentorshipSession>) => {
    try {
      const updated = await MentorshipClient.updateSession(sessionId, updates);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      if (activeSessionForRoom?.id === sessionId) {
        setActiveSessionForRoom(updated);
      }
    } catch (err: any) {
      notifyAction(err?.message || 'Failed to update session.', 'error');
    }
  };

  const handleSubmitFeedback = async (feedbackData: any) => {
    await MentorshipClient.submitFeedback(feedbackData);
    notifyAction('Session feedback recorded.');
  };

  const handleSubmitRequest = async (requestData: any) => {
    const res = await MentorshipClient.createRequest(requestData);
    setRequests((prev) => ({
      ...prev,
      sent: [res.request, ...prev.sent],
    }));
    notifyAction(
      res.emailDispatched
        ? `Mentorship request emailed to ${res.mentorEmail || res.request.mentorName}.`
        : `Mentorship request saved in Educator Portal. No server mail relay configured.`,
      'success',
      !res.emailDispatched ? res.mailtoUrl : undefined,
      'Send via Email App'
    );
    syncOverviewData(true);
    return {
      emailDispatched: res.emailDispatched,
      mentorEmail: res.mentorEmail,
      mailtoUrl: res.mailtoUrl,
    };
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await MentorshipClient.cancelRequest(requestId);
      setRequests((prev) => ({
        ...prev,
        sent: prev.sent.filter((r) => r.id !== requestId),
      }));
      notifyAction('Mentorship request withdrawn.');
    } catch (err: any) {
      notifyAction(err?.message || 'Failed to withdraw request.', 'error');
    }
  };

  const handleRespondRequest = async (requestId: string, action: 'ACCEPT' | 'DECLINE', note?: string) => {
    try {
      const result = await MentorshipClient.respondToRequest(requestId, action, note);
      setPortalData((prev) => ({
        ...prev,
        pendingRequests: prev.pendingRequests.filter((r) => r.id !== requestId),
      }));
      if (result.relationship) {
        setRelationships((prev) => [result.relationship!, ...prev]);
      }
      const actionLabel = action === 'ACCEPT' ? 'accepted' : 'declined';
      notifyAction(
        result.emailDispatched
          ? `Mentorship request ${actionLabel} and confirmation emailed to ${result.studentEmail}.`
          : `Mentorship request ${actionLabel} and saved in Learn.co.${result.studentEmail ? ` (Server email relay unset for ${result.studentEmail}.)` : ''}`,
        'success',
        !result.emailDispatched ? result.mailtoUrl : undefined,
        result.studentEmail ? `Email ${result.studentEmail}` : undefined
      );
      syncOverviewData(true);
    } catch (err: any) {
      notifyAction(err?.message || 'Could not process mentorship decision.', 'error');
    }
  };

  const handleSavePrivacySettings = async (settings: Partial<MentorshipPrivacySettings>) => {
    if (!selectedRelationship) return;
    const updated = await MentorshipClient.updatePrivacySettings(selectedRelationship.id, settings);
    setSelectedRelationship((prev) => (prev ? { ...prev, privacySettings: updated } : null));
    notifyAction('Privacy controls updated.');
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
      {actionFeedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs font-semibold flex flex-wrap items-center justify-between gap-2 ${
            actionFeedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          <span>{actionFeedback.message}</span>
          <div className="flex items-center gap-3">
            {actionFeedback.mailtoUrl && (
              <a
                href={actionFeedback.mailtoUrl}
                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
              >
                {actionFeedback.mailtoLabel || 'Open Email App'}
              </a>
            )}
            <button type="button" onClick={() => setActionFeedback(null)} className="underline cursor-pointer">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#00B8A9]/12 text-[#008C80] dark:text-[#4DE0D3] font-bold text-xs flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>STEM Mentorship Network</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#4CAF8E]/15 text-[#247A5E] dark:text-[#7ADEC0] text-[11px] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4CAF8E]" />
              <span>Live Sync{lastSyncedAt ? ` • ${lastSyncedAt}` : ''}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
            Mentor &amp; Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6890] dark:text-[#B4B0D5]">
            Connect with verified STEM mentors, schedule 1-on-1 study rooms, and review retention forecasts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {relationships.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00B8A9]/12 text-[#008C80] dark:text-[#4DE0D3] text-xs font-bold border border-[#00B8A9]/25">
              <ShieldCheck className="w-4 h-4" />
              <span>{relationships.length} Active Mentor(s)</span>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={isSyncing || isLoading}
            onClick={() => {
              syncOverviewData(true);
              if (selectedRelationship?.id) syncRelationshipDetails(selectedRelationship.id);
            }}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-[#E3DFF5] dark:border-[#3D3861] space-x-2 overflow-x-auto pb-0.5">
        <button
          id="main-tab-my-mentorship"
          onClick={() => setActiveMainTab('my_mentorship')}
          className={`min-h-[44px] py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMainTab === 'my_mentorship'
              ? 'border-[#00B8A9] text-[#008C80] dark:text-[#4DE0D3]'
              : 'border-transparent text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>My Mentorship</span>
        </button>

        <button
          id="main-tab-discover-mentors"
          onClick={() => setActiveMainTab('discover')}
          className={`min-h-[44px] py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMainTab === 'discover'
              ? 'border-[#00B8A9] text-[#008C80] dark:text-[#4DE0D3]'
              : 'border-transparent text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Discover Mentors ({mentors.length})</span>
        </button>

        <button
          id="main-tab-sessions"
          onClick={() => setActiveMainTab('sessions')}
          className={`min-h-[44px] py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMainTab === 'sessions'
              ? 'border-[#00B8A9] text-[#008C80] dark:text-[#4DE0D3]'
              : 'border-transparent text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Sessions &amp; Rooms</span>
        </button>

        <button
          id="main-tab-portal"
          onClick={() => setActiveMainTab('portal')}
          className={`min-h-[44px] py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMainTab === 'portal'
              ? 'border-[#00B8A9] text-[#008C80] dark:text-[#4DE0D3]'
              : 'border-transparent text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Educator Portal</span>
          {portalData.pendingRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#FFB84D] text-[#2D2A4A] text-[10px] font-bold flex items-center justify-center">
              {portalData.pendingRequests.length}
            </span>
          )}
        </button>

        <button
          id="main-tab-diagnostics"
          onClick={() => setActiveMainTab('diagnostics')}
          className={`min-h-[44px] py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMainTab === 'diagnostics'
              ? 'border-[#00B8A9] text-[#008C80] dark:text-[#4DE0D3]'
              : 'border-transparent text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Cognitive Forecast</span>
        </button>

        <button
          id="main-tab-mentor-access"
          onClick={() => setActiveMainTab('mentor_access')}
          className={`min-h-[44px] py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMainTab === 'mentor_access'
              ? 'border-[#00B8A9] text-[#008C80] dark:text-[#4DE0D3]'
              : 'border-transparent text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Mentor Access &amp; Approvals</span>
          {isOwnerOrAdmin ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#6C5CE7]/15 text-[#6C5CE7] dark:text-[#A99DF5]">
              Owner Queue
            </span>
          ) : (
            !isMentorRole && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFB84D]/20 text-[#9A6300] dark:text-[#FFD68A]">
                Apply
              </span>
            )
          )}
        </button>
      </div>

      {isLoading ? (
        <ScreenSkeleton rows={4} />
      ) : loadError ? (
        <EmptyState
          variant="error"
          title="Could not load mentorship hub"
          description={loadError}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => syncOverviewData(false)}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retry
            </Button>
          }
        />
      ) : (
        <>
      {/* TAB 1: My Mentorship */}
      {activeMainTab === 'my_mentorship' && (
        <div className="space-y-6">
          {relationships.length === 0 ? (
            <div className="space-y-6">
              {/* Onboarding Empty State */}
              <div className="p-8 sm:p-12 rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#00B8A9] text-white flex items-center justify-center mx-auto shadow-sm">
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
              <div className="col-span-2">
                <EmptyState
                  icon={<Calendar className="w-6 h-6" />}
                  title="No sessions scheduled yet"
                  description="Connect with a mentor to book your first 1-on-1 study room and shared agenda."
                  action={
                    <Button variant="primary" size="md" onClick={() => setActiveMainTab('discover')}>
                      Browse Verified Mentors
                    </Button>
                  }
                />
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

      {/* TAB 4: Educator Portal (Accredited Mentors Only) */}
      {activeMainTab === 'portal' && (
        isMentorRole ? (
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
        ) : (
          <Card variant="default" padding="lg" className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Owner Approval Required to Join as Mentor
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Submit a Formal Mentor Application first. Your application is saved in Firestore and reviewed by the platform owner (<strong>yamsaniruhan@gmail.com</strong>). Once approved, your Educator Portal and mentor listing unlock automatically.
              </p>
            </div>
            <div className="pt-1">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                onClick={() => setActiveMainTab('mentor_access')}
              >
                <span>Open Mentor Application &amp; Status</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        )
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

      {/* TAB 6: Mentor Access & Approvals */}
      {activeMainTab === 'mentor_access' && (
        <MentorAccessPanel
          user={user}
          isMentor={isMentorRole}
          isOwnerOrAdmin={isOwnerOrAdmin}
          onApplicationsChanged={loadInitialData}
          onOpenPortal={() => setActiveMainTab('portal')}
        />
      )}
        </>
      )}

      {/* Modals */}
      <MentorProfileModal
        mentor={selectedMentorForProfile}
        learnerEmailDefault={user.email}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onRequestSubmitted={handleSubmitRequest}
      />

      {(() => {
        const sessionRelationship = activeSessionForRoom
          ? relationships.find((r) => r.id === activeSessionForRoom.mentorshipId) ||
            portalData.activeMentees.find((m) => m.relationship.id === activeSessionForRoom.mentorshipId)?.relationship ||
            selectedRelationship
          : selectedRelationship;
        if (!activeSessionForRoom || !sessionRelationship) return null;
        return (
          <SessionRoomModal
            session={activeSessionForRoom}
            relationship={sessionRelationship}
            isOpen={isSessionRoomOpen}
            onClose={() => setIsSessionRoomOpen(false)}
            onUpdateSession={handleUpdateSession}
            onSubmitFeedback={handleSubmitFeedback}
          />
        );
      })()}

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
