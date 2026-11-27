import React, { useState, useEffect, useRef } from 'react';
import {
  SubjectId,
  ExamTrackId,
  SubjectCurriculum,
  PracticeSessionConfig,
  QuestionBankItem,
  PracticeRecommendation,
  WeakTopicSignal,
} from '../../types/curriculum';
import { LearningClient } from '../../services/learningClient';
import { AuthClient } from '../../services/authClient';
import { useAuth } from '../../context/AuthContext';
import { PracticeArena } from './PracticeArena';
import { ConfidenceSummary } from './ConfidenceSummary';
import { useLocalPractice } from '../../utils/localPractice';
import { OfflineStorageManager } from '../../utils/offlineStorage';
import {
  creatorPracticeTransferKey,
  readCreatorPracticeTransfer,
  clearGuestCreatorPracticeTransfer,
} from '../../utils/creatorPracticeTransfer';
import {
  GUEST_LIMITS,
  GUEST_QUOTA_UPDATED_EVENT,
  getGuestQuotaRemaining,
} from '../../utils/guestMode';
import { PracticeResultsView } from './PracticeResultsView';
import { PracticeConfigModal } from '../learn/PracticeConfigModal';
import { RecommendedPracticeView } from './RecommendedPracticeView';
import { WeakTopicsView } from './WeakTopicsView';
import { PracticeHistoryView } from './PracticeHistoryView';
import { OlympiadContestView } from './OlympiadContestView';
import { ICTCodeRunnerLab } from './ICTCodeRunnerLab';
import { FormattedMathText } from '../common/FormattedMathText';
import {
  Target,
  Zap,
  Sparkles,
  ShieldAlert,
  History,
  BookOpen,
  Filter,
  Search,
  ChevronRight,
  Bot,
  ShieldCheck,
  Award,
  Trophy,
  Code2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { ScreenSkeleton } from '../ui/Skeleton';

export interface PracticeNavigationContext {
  subjectId?: SubjectId;
  topicId?: string;
  subtopicId?: string;
  conceptId?: string;
  title?: string;
}

interface PracticeViewProps {
  onOpenCopilotWithContext: (context: string) => void;
  initialPracticeContext?: PracticeNavigationContext | null;
  onConsumePracticeContext?: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  onOpenCopilotWithContext,
  initialPracticeContext,
  onConsumePracticeContext,
}) => {
  const { gamification, refreshUserData, user, isAuthenticated } = useAuth();
  const { attempts: localAttempts } = useLocalPractice(user?.id || null);
  const [activeTab, setActiveTab] = useState<
    'hub' | 'contest' | 'ict_runner' | 'recommendations' | 'weak_topics' | 'history' | 'bank'
  >('hub');
  
  // Practice Session State
  const [activePracticeSession, setActivePracticeSession] = useState<{
    config: PracticeSessionConfig;
    questions: QuestionBankItem[];
  } | null>(null);

  const [sessionResults, setSessionResults] = useState<any | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [modalSubject, setModalSubject] = useState<SubjectId>('math');
  const [modalTopic, setModalTopic] = useState<string | undefined>(undefined);
  const [modalSubtopic, setModalSubtopic] = useState<string | undefined>(undefined);
  const [modalConcept, setModalConcept] = useState<string | undefined>(undefined);
  const [modalTitle, setModalTitle] = useState<string>('Calibrated 5-Question Ladder');

  // Consume navigation context (e.g. from Intelligence / Mistake Notebook / Dashboard)
  useEffect(() => {
    if (initialPracticeContext) {
      const subj = initialPracticeContext.subjectId || 'math';
      setModalSubject(subj);
      setModalTopic(initialPracticeContext.topicId);
      setModalSubtopic(initialPracticeContext.subtopicId);
      setModalConcept(initialPracticeContext.conceptId);
      setModalTitle(
        initialPracticeContext.title ||
          (initialPracticeContext.topicId
            ? `Targeted Drill: ${initialPracticeContext.topicId}`
            : `${subj.toUpperCase()} Calibrated 5-Question Ladder`)
      );
      setActivePracticeSession(null);
      setSessionResults(null);
      setIsConfigModalOpen(true);
      onConsumePracticeContext?.();
    }
  }, [initialPracticeContext, onConsumePracticeContext]);

  // Creator Studio transfer session state
  const [creatorImportSession, setCreatorImportSession] = useState<{
    resourceTitle: string;
    questions: QuestionBankItem[];
    resourceId?: string;
    accountId: string;
  } | null>(null);

  const [guestPracticeRemaining, setGuestPracticeRemaining] = useState<number>(
    () => getGuestQuotaRemaining().practiceRemaining
  );
  const [lastFailedConfig, setLastFailedConfig] = useState<PracticeSessionConfig | null>(null);
  const [drillNeedsGuestRetry, setDrillNeedsGuestRetry] = useState<boolean>(false);

  useEffect(() => {
    const syncGuest = () => setGuestPracticeRemaining(getGuestQuotaRemaining().practiceRemaining);
    syncGuest();
    window.addEventListener(GUEST_QUOTA_UPDATED_EVENT, syncGuest);
    return () => window.removeEventListener(GUEST_QUOTA_UPDATED_EVENT, syncGuest);
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    const checkCreatorSession = () => {
      const accountId = typeof user?.id === 'string' ? user.id : null;
      const parsed = readCreatorPracticeTransfer(accountId);
      setCreatorImportSession(
        parsed
          ? {
              resourceTitle: parsed.resourceTitle || 'Creator Studio Custom Resource',
              questions: parsed.questions,
              resourceId: parsed.resourceId,
              accountId: accountId || 'guest',
            }
          : null
      );
    };

    checkCreatorSession();
    window.addEventListener('focus', checkCreatorSession);
    return () => window.removeEventListener('focus', checkCreatorSession);
  }, [user?.id]);

  // Async data
  const [recommendations, setRecommendations] = useState<PracticeRecommendation[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopicSignal[]>([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState<SubjectCurriculum[]>([]);
  const [drillSubjectId, setDrillSubjectId] = useState<SubjectId>('math');
  const [drillExamTrack, setDrillExamTrack] = useState<ExamTrackId>('all');
  const [drillTopicId, setDrillTopicId] = useState<string>('');
  const [drillSubtopicId, setDrillSubtopicId] = useState<string>('');
  const [drillCount, setDrillCount] = useState<number>(10);
  const [drillDifficulty, setDrillDifficulty] = useState<'calibrated_ladder' | 'easy' | 'medium' | 'hard'>('calibrated_ladder');
  const [drillError, setDrillError] = useState<string | null>(null);
  const [launchingDrill, setLaunchingDrill] = useState<boolean>(false);
  const [bankQuestions, setBankQuestions] = useState<QuestionBankItem[]>([]);
  const [bankSubjectFilter, setBankSubjectFilter] = useState<string>('all');
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');
  const [isLoadingBank, setIsLoadingBank] = useState<boolean>(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [isLoadingHub, setIsLoadingHub] = useState<boolean>(true);
  const [hubError, setHubError] = useState<string | null>(null);

  const dailyQuotaRemaining =
    isAuthenticated && user
      ? Math.max(0, 25 - (gamification?.dailyQuestionsSolvedToday || 0))
      : guestPracticeRemaining;

  const loadHubData = async () => {
    setIsLoadingHub(true);
    setHubError(null);
    try {
      const [recs, weak, subjects] = await Promise.all([
        LearningClient.getRecommendations(),
        LearningClient.getWeakTopics(),
        LearningClient.getCurriculum('all'),
      ]);
      setRecommendations(recs);
      setWeakTopics(weak);
      if (Array.isArray(subjects) && subjects.length > 0) {
        setCurriculumSubjects(subjects);
      }
    } catch (err: any) {
      console.error('Failed to load practice hub data:', err);
      setHubError(err?.message || 'Could not load practice modules right now.');
    } finally {
      setIsLoadingHub(false);
    }
  };

  // Load recommendations, weak topics, and curriculum hierarchy for Guided Drill Builder
  useEffect(() => {
    void loadHubData();
  }, []);

  // Load Question Bank when Bank tab selected
  useEffect(() => {
    if (activeTab === 'bank') {
      void loadBank();
    }
  }, [activeTab, bankSubjectFilter, bankSearchQuery]);

  const loadBank = async () => {
    setIsLoadingBank(true);
    setBankError(null);
    try {
      const data = await LearningClient.getQuestionBank({
        subjectId: bankSubjectFilter !== 'all' ? (bankSubjectFilter as SubjectId) : undefined,
        searchQuery: bankSearchQuery || undefined,
        limit: 30,
      });
      setBankQuestions(data.questions);
    } catch (err: any) {
      console.error('Failed to load bank:', err);
      setBankError(err?.message || 'Failed to load question bank.');
    } finally {
      setIsLoadingBank(false);
    }
  };

  const seenQuestionIdsRef = useRef<Set<string>>(new Set());

  // Cross-device solved ID sync from backend / Cloud SQL
  useEffect(() => {
    let active = true;
    LearningClient.syncSolvedQuestionIds()
      .then((ids) => {
        if (!active) return;
        for (const id of ids) {
          if (id) seenQuestionIdsRef.current.add(id);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Offline Olympiad Pack launch listener & handoff consumer
  useEffect(() => {
    const startPackSession = (packQuestions: QuestionBankItem[]) => {
      if (!packQuestions || packQuestions.length === 0) return;
      setSessionResults(null);
      setActivePracticeSession({
        config: {
          sessionTitle: 'Offline Olympiad Study Pack',
          examTrack: 'stem_olympiad',
          questionCount: packQuestions.length,
          timed: false,
          mode: 'standard',
        },
        questions: packQuestions,
      });
    };

    const pendingPack = OfflineStorageManager.consumeOfflinePackLaunch();
    if (pendingPack) {
      startPackSession(pendingPack.questions);
    }

    const handleOfflineLaunch = (ev: Event) => {
      const pack = (ev as CustomEvent<{ questions?: QuestionBankItem[] }>).detail || OfflineStorageManager.getOlympiadPack();
      if (pack?.questions?.length) {
        OfflineStorageManager.consumeOfflinePackLaunch();
        startPackSession(pack.questions);
      }
    };

    window.addEventListener('learnco-launch-offline-olympiad-pack', handleOfflineLaunch);
    return () => window.removeEventListener('learnco-launch-offline-olympiad-pack', handleOfflineLaunch);
  }, []);

  useEffect(() => {
    for (const att of localAttempts) {
      if (att.questionId) seenQuestionIdsRef.current.add(att.questionId);
    }
  }, [localAttempts]);

  const handleLaunchSession = async (config: PracticeSessionConfig, allowGuestFallback = false) => {
    setIsConfigModalOpen(false);
    setDrillError(null);
    setLaunchingDrill(true);
    try {
      const mergedExcluded = Array.from(
        new Set([
          ...seenQuestionIdsRef.current,
          ...(config.excludeQuestionIds ?? []),
        ])
      ).slice(-1200);
      const session = await LearningClient.startPracticeSession(
        {
          ...config,
          excludeQuestionIds: mergedExcluded,
        },
        { allowGuestFallback }
      );
      if (session && session.questions && session.questions.length > 0) {
        session.questions.forEach((q) => seenQuestionIdsRef.current.add(q.id));
        setLastFailedConfig(null);
        setDrillNeedsGuestRetry(false);
        setActivePracticeSession({
          config: { ...config, questionCount: session.questions.length },
          questions: session.questions,
        });
        setSessionResults(null);
      } else {
        setDrillError('No questions matched that selection. Try resetting filters.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Unable to generate sub-questions right now.';
      const canGuestRetry = !allowGuestFallback && (!AuthClient.hasSession() || /auth|401|retry|sign in/i.test(msg));
      setLastFailedConfig(config);
      setDrillNeedsGuestRetry(canGuestRetry);
      setDrillError(msg);
    } finally {
      setLaunchingDrill(false);
    }
  };

  // Derived Guided Drill Builder selections: Subject -> Topic -> Subtopic -> Create Sub-Questions
  const activeDrillSubject =
    curriculumSubjects.find((s) => s.id === drillSubjectId) || curriculumSubjects[0];
  const trackMatchingChapters = activeDrillSubject
    ? activeDrillSubject.chapters.filter(
        (ch) =>
          drillExamTrack === 'all' ||
          ch.examTracks.includes(drillExamTrack) ||
          ch.examTracks.includes('all')
      )
    : [];
  const effectiveDrillChapters =
    trackMatchingChapters.length > 0 ? trackMatchingChapters : activeDrillSubject?.chapters || [];
  const availableDrillTopics = effectiveDrillChapters.flatMap((ch) =>
    ch.topics.map((t) => ({ ...t, chapterTitle: ch.title }))
  );
  const activeDrillTopic =
    availableDrillTopics.find((t) => t.id === drillTopicId) || availableDrillTopics[0];
  const availableDrillSubtopics = activeDrillTopic?.subtopics || [];
  const activeDrillSubtopic =
    availableDrillSubtopics.find((st) => st.id === drillSubtopicId) || availableDrillSubtopics[0];

  useEffect(() => {
    if (availableDrillTopics.length > 0 && !availableDrillTopics.some((t) => t.id === drillTopicId)) {
      setDrillTopicId(availableDrillTopics[0].id);
    }
  }, [drillSubjectId, drillExamTrack, curriculumSubjects]);

  useEffect(() => {
    if (availableDrillSubtopics.length > 0 && !availableDrillSubtopics.some((st) => st.id === drillSubtopicId)) {
      setDrillSubtopicId(availableDrillSubtopics[0].id);
    }
  }, [activeDrillTopic?.id]);

  const handleStartQuickSubject = (subjectId: SubjectId) => {
    setModalSubject(subjectId);
    setModalTopic(undefined);
    setModalSubtopic(undefined);
    setModalConcept(undefined);
    setModalTitle(`${subjectId.toUpperCase()} Calibrated 5-Question Ladder`);
    setIsConfigModalOpen(true);
  };

  const handleLaunchRecommendation = (rec: PracticeRecommendation) => {
    handleLaunchSession({
      sessionTitle: rec.title,
      subjectId: rec.subjectId,
      topicId: rec.topicId,
      conceptId: rec.conceptId,
      difficultyMode: 'calibrated_ladder',
      questionCount: 5,
      timed: false,
      mode: 'standard',
    });
  };

  const handleStartWeakTopicDrill = (topicId: string, subjectId: SubjectId, topicTitle: string) => {
    handleLaunchSession({
      sessionTitle: `Remediation Drill: ${topicTitle}`,
      subjectId,
      topicId,
      difficultyMode: 'calibrated_ladder',
      questionCount: 5,
      timed: false,
      mode: 'weak_topics_remediation',
    });
  };

  const handleFinishPractice = (results: any) => {
    setActivePracticeSession(null);
    setSessionResults(results);
    refreshUserData();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. Active Practice Arena */}
      {activePracticeSession && (
        <PracticeArena
          questions={activePracticeSession.questions}
          config={activePracticeSession.config}
          onFinishSession={handleFinishPractice}
          onExit={() => setActivePracticeSession(null)}
        />
      )}

      {/* 2. Session Scorecard */}
      {!activePracticeSession && sessionResults && (
        <PracticeResultsView
          results={sessionResults}
          onRestart={() => handleLaunchSession(sessionResults.config || { questionCount: 5 })}
          onReturnToCurriculum={() => setSessionResults(null)}
        />
      )}

      {/* 3. Main Practice Hub */}
      {!activePracticeSession && !sessionResults && (
        <div className="space-y-6">
          {/* Header Banner */}
          <Card variant="elevated" padding="lg" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary" size="sm">
                  Practice
                </Badge>
                <span className="flex items-center gap-1 text-xs text-[#4CAF8E] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Non-repeating calibrated sets</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display tracking-tight">
                Practice
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6890] dark:text-[#B4B0D5] max-w-2xl leading-relaxed">
                Pick a subject, topic, and subtopic for adaptive drills, timed Olympiad contests, or coding labs.
              </p>

              {/* Quick Actions */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="xp"
                  size="md"
                  onClick={() => window.dispatchEvent(new CustomEvent('learnco-open-flash-check'))}
                  leftIcon={<Zap className="w-4 h-4 fill-current" />}
                >
                  60s Flash Check (+15 XP)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => window.dispatchEvent(new CustomEvent('learnco-toggle-zen-mode'))}
                >
                  Zen Study Mode
                </Button>
              </div>
            </div>

            {/* Daily Practice Limit Live Quota */}
            <div className="p-4 rounded-2xl bg-[#F7F5FF] dark:bg-[#16161C] border border-[#E3DFF5] dark:border-[#232329] shrink-0 text-center min-w-[176px]">
              <div className="text-[11px] uppercase tracking-wider text-[#6B6890] dark:text-[#9D9BB8] font-bold mb-1">
                {isAuthenticated && user ? 'Daily Quota' : 'Guest Practice Limit'}
              </div>
              <div className="text-2xl font-black text-[#2D2A4A] dark:text-white tabular-nums">
                <span className="text-[#6C5CE7] dark:text-[#CCFF00]">
                  {isAuthenticated && user ? dailyQuotaRemaining : guestPracticeRemaining}
                </span>{' '}
                / {isAuthenticated && user ? 25 : GUEST_LIMITS.practiceQuestions}
              </div>
              <div className="text-[11px] text-[#6B6890] dark:text-[#9D9BB8] mt-0.5">
                {isAuthenticated && user ? 'Questions left today' : 'Guest questions left (not saved)'}
              </div>
            </div>
          </Card>

          {/* Creator Studio Imported Resource Banner */}
          {creatorImportSession && creatorImportSession.accountId === (user?.id || 'guest') && (
            <div className="p-5 rounded-2xl bg-[#F3F0FF] dark:bg-[#16161C] border-2 border-[#6C5CE7]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#6C5CE7] text-white shadow-sm shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#6C5CE7]/15 dark:bg-[#6C5CE7]/30 text-[#6C5CE7] dark:text-[#C5BAFF]">
                      {user?.id ? 'Creator Studio Import' : 'Creator Guest Preview'}
                    </span>
                    <h3 className="text-sm font-bold text-[#2D2A4A] dark:text-white">
                      {creatorImportSession.resourceTitle}
                    </h3>
                  </div>
                  <p className="text-xs text-[#6B6890] dark:text-[#9D9BB8] mt-0.5">
                    {creatorImportSession.questions.length} problems transferred and ready to solve in Practice Arena.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (user?.id) {
                      localStorage.removeItem(creatorPracticeTransferKey(creatorImportSession.accountId));
                    } else {
                      clearGuestCreatorPracticeTransfer();
                    }
                    setCreatorImportSession(null);
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl text-[#6B6890] dark:text-[#9D9BB8] hover:bg-[#EDE9FE] dark:hover:bg-[#232329] transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePracticeSession({
                      config: {
                        subjectId: creatorImportSession.questions[0]?.subjectId || 'math',
                        questionTypes: ['single_choice'],
                        difficultyMode: 'easy',
                        timed: false,
                        questionCount: creatorImportSession.questions.length,
                      },
                      questions: creatorImportSession.questions,
                    });
                    if (user?.id) {
                      localStorage.removeItem(creatorPracticeTransferKey(creatorImportSession.accountId));
                    } else {
                      clearGuestCreatorPracticeTransfer();
                    }
                    setCreatorImportSession(null);
                  }}
                  className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BD6] text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Start Practice Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub Navigation Bar */}
          <div className="flex border-b border-[#E3DFF5] dark:border-[#232329] gap-1 overflow-x-auto pb-1">
            {[
              { id: 'hub', label: 'Practice Hub & Ladders', icon: Target },
              { id: 'contest', label: 'Olympiad Mock Contest', icon: Trophy },
              { id: 'ict_runner', label: 'ICT Code Runner', icon: Code2 },
              { id: 'recommendations', label: `Recommended (${recommendations.length})`, icon: Sparkles },
              { id: 'weak_topics', label: `Weak Topics (${weakTopics.length})`, icon: ShieldAlert },
              { id: 'history', label: 'Attempt History', icon: History },
              { id: 'bank', label: 'Question Bank Explorer', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#6C5CE7] text-white shadow-sm'
                      : 'text-[#6B6890] dark:text-[#9D9BB8] hover:bg-[#F3F0FF] dark:hover:bg-[#16161C]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: PRACTICE HUB & QUICK LADDERS */}
          {activeTab === 'hub' && (
            <div className="space-y-6">
              {isLoadingHub ? (
                <ScreenSkeleton label="Loading practice modules and recommendations..." />
              ) : hubError ? (
                <EmptyState
                  variant="error"
                  icon={<AlertCircle className="w-6 h-6" />}
                  title="Practice hub unavailable"
                  description={hubError}
                  action={
                    <Button type="button" variant="primary" size="md" onClick={loadHubData} leftIcon={<RefreshCw className="w-4 h-4" />}>
                      Retry
                    </Button>
                  }
                />
              ) : (
                <>
              <ConfidenceSummary attempts={localAttempts} />

              {/* Guided 4-Step Subtopic Drill Workflow: Subject -> Topic -> Subtopic -> Create Sub-Questions */}
              {curriculumSubjects.length > 0 && (
                <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3DFF5] dark:border-[#232329] pb-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6C5CE7] dark:text-[#A594FF]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Guided Subtopic Generator · 100+ Multi-Model Problems per Topic</span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-[#2D2A4A] dark:text-white mt-0.5">
                        Select Subject → Topic → Subtopic → Create Sub-Questions
                      </h2>
                    </div>
                    <select
                      aria-label="Exam track filter"
                      value={drillExamTrack}
                      onChange={(e) => setDrillExamTrack(e.target.value as ExamTrackId)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#16161C] text-xs font-semibold text-[#2D2A4A] dark:text-[#E2E0F0] cursor-pointer"
                    >
                      <option value="all">All Exams (Universal)</option>
                      <option value="jee_advanced">JEE Advanced</option>
                      <option value="jee_main">JEE Main</option>
                      <option value="ap_stem">AP Calculus &amp; AP STEM</option>
                      <option value="ict_hackathon">ICT Coding Test</option>
                      <option value="iapt_exams">IPhO · IChO · IBO</option>
                      <option value="nsejs">NSEJS · IJSO</option>
                    </select>
                  </div>

                  {drillError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-200 font-semibold"
                    >
                      <span>{drillError}</span>
                      {lastFailedConfig && (
                        <button
                          type="button"
                          onClick={() => handleLaunchSession(lastFailedConfig, drillNeedsGuestRetry)}
                          className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#CCFF00] hover:bg-[#B8E600] text-[#09090B] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>
                            {drillNeedsGuestRetry
                              ? 'Retry & Generate in Guest Mode'
                              : 'Retry'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Step 1: Subject */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B6890] dark:text-[#9D9BB8]">
                        1. Subject
                      </label>
                      <select
                        aria-label="Select Subject"
                        value={activeDrillSubject?.id || drillSubjectId}
                        onChange={(e) => setDrillSubjectId(e.target.value as SubjectId)}
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#16161C] text-xs font-bold text-[#2D2A4A] dark:text-white cursor-pointer"
                      >
                        {curriculumSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.chapters.reduce((acc, c) => acc + c.topics.length, 0)} Topics)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Step 2: Topic */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B6890] dark:text-[#9D9BB8]">
                        2. Topic
                      </label>
                      <select
                        aria-label="Select Topic"
                        value={activeDrillTopic?.id || ''}
                        onChange={(e) => setDrillTopicId(e.target.value)}
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#16161C] text-xs font-bold text-[#2D2A4A] dark:text-white cursor-pointer"
                      >
                        {availableDrillTopics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} (100+ problems)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Step 3: Subtopic */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B6890] dark:text-[#9D9BB8]">
                        3. Subtopic
                      </label>
                      <select
                        aria-label="Select Subtopic"
                        value={activeDrillSubtopic?.id || ''}
                        onChange={(e) => setDrillSubtopicId(e.target.value)}
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#16161C] text-xs font-bold text-[#2D2A4A] dark:text-white cursor-pointer"
                      >
                        {availableDrillSubtopics.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.title} ({st.concepts.length} concept{st.concepts.length === 1 ? '' : 's'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step 4: Concepts preview + Count + Difficulty + Create Sub-Questions CTA */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
                    <div className="space-y-1.5 min-w-0">
                      {activeDrillSubtopic && activeDrillSubtopic.concepts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-[#6B6890] dark:text-[#9D9BB8]">
                            Concepts covered:
                          </span>
                          {activeDrillSubtopic.concepts.map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 rounded-lg bg-[#F3F0FF] dark:bg-[#1C1A2E] text-[#6C5CE7] dark:text-[#C5BAFF] text-[11px] font-semibold border border-[#6C5CE7]/25"
                            >
                              {c.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        aria-label="Question count"
                        value={drillCount}
                        onChange={(e) => setDrillCount(Number(e.target.value))}
                        className="min-h-[44px] px-3 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#16161C] text-xs font-bold text-[#2D2A4A] dark:text-[#E2E0F0] cursor-pointer"
                      >
                        {[5, 10, 15, 20].map((cnt) => (
                          <option key={cnt} value={cnt}>
                            {cnt} Sub-Questions
                          </option>
                        ))}
                      </select>

                      <select
                        aria-label="Difficulty mode"
                        value={drillDifficulty}
                        onChange={(e) => setDrillDifficulty(e.target.value as any)}
                        className="min-h-[44px] px-3 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#16161C] text-xs font-bold text-[#2D2A4A] dark:text-[#E2E0F0] cursor-pointer"
                      >
                        <option value="calibrated_ladder">Multi-Model Ladder</option>
                        <option value="easy">Easy Foundation</option>
                        <option value="medium">Standard Exam</option>
                        <option value="hard">Advanced Olympiad</option>
                      </select>

                      <button
                        type="button"
                        disabled={launchingDrill || !activeDrillTopic}
                        onClick={() => {
                          if (!activeDrillSubject || !activeDrillTopic) return;
                          handleLaunchSession({
                            sessionTitle: activeDrillSubtopic
                              ? `${activeDrillTopic.title} · ${activeDrillSubtopic.title}`
                              : activeDrillTopic.title,
                            subjectId: activeDrillSubject.id,
                            examTrack: drillExamTrack !== 'all' ? drillExamTrack : undefined,
                            chapterId: activeDrillTopic.chapterId,
                            topicId: activeDrillTopic.id,
                            subtopicId: activeDrillSubtopic?.id,
                            difficultyMode: drillDifficulty,
                            questionCount: drillCount,
                            timed: false,
                            mode: 'standard',
                          });
                        }}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BD6] disabled:opacity-60 text-white text-xs font-extrabold shadow-md flex items-center gap-2 transition cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-current text-[#CCFF00]" />
                        <span>{launchingDrill ? 'Creating...' : '4. Create Sub-Questions'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Olympiad & ICT Dedicated Launch Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('contest')}
                  className="min-h-[44px] p-5 rounded-2xl bg-white dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] hover:border-[#6C5CE7] text-left shadow-sm flex items-center justify-between gap-4 transition-all cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6C5CE7] dark:text-[#A594FF]">
                      Timed Simulation &middot; IPhO &middot; IChO &middot; IBHO &middot; IJSO &middot; ICT
                    </div>
                    <div className="text-base font-black text-[#2D2A4A] dark:text-white">
                      Launch Olympiad Mock Contest
                    </div>
                    <p className="text-xs text-[#6B6890] dark:text-[#9D9BB8]">
                      30 / 60 / 120 min timed papers with question flagging palette, sealed keys until submission, and medal standing.
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-[#F3F0FF] dark:bg-[#1C1A2E] flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-[#6C5CE7] dark:text-[#A594FF]" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('ict_runner')}
                  className="min-h-[44px] p-5 rounded-2xl bg-white dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] hover:border-emerald-400 dark:hover:border-emerald-500 text-left shadow-sm flex items-center justify-between gap-4 transition-all cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      ICT Coding Lab &middot; Isolated Web Worker Sandbox
                    </div>
                    <div className="text-base font-black text-[#2D2A4A] dark:text-white">
                      Open ICT In-Browser Code Runner
                    </div>
                    <p className="text-xs text-[#6B6890] dark:text-[#9D9BB8]">
                      Write JavaScript solutions for Kadane DP, Rotated Binary Search, Knapsack, Dijkstra &amp; Fenwick Tree and run hidden test suites offline.
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                    <Code2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </button>
              </div>

              {/* Subject 5-Question Ladder Starters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#2D2A4A] dark:text-white uppercase tracking-wider">
                    Launch Calibrated 5-Question Ladders by Subject
                  </h3>
                  <span className="text-xs text-[#6B6890] dark:text-[#9D9BB8]">Easy &rarr; Medium &rarr; Hard progression</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                  {[
                    { id: 'math', name: 'Mathematics', desc: 'Calculus, Linear Algebra, Series', color: 'from-blue-600 to-indigo-600' },
                    { id: 'cs', name: 'CS & AI', desc: 'Algorithms, Gradient Descent, PyTorch', color: 'from-emerald-600 to-teal-600' },
                    { id: 'physics', name: 'Physics', desc: 'Mechanics, Energy, Electromagnetism', color: 'from-purple-600 to-indigo-600' },
                    { id: 'chemistry', name: 'Chemistry', desc: 'Organic Mechanisms, Thermodynamics', color: 'from-amber-600 to-orange-600' },
                    { id: 'biology', name: 'Biology', desc: 'Genetics, Transcription, Respiration', color: 'from-rose-600 to-pink-600' },
                    { id: 'english', name: 'English', desc: 'Rhetoric, Syntactic Parallelism, Tropes', color: 'from-violet-600 to-purple-600' },
                    { id: 'data_science', name: 'Data Science', desc: 'Inference, Lasso/Ridge, ROC-AUC', color: 'from-cyan-600 to-teal-600' },
                  ].map((subj) => (
                    <button
                      key={subj.id}
                      onClick={() => handleStartQuickSubject(subj.id as SubjectId)}
                      className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] text-left hover:border-[#6C5CE7] shadow-sm flex flex-col justify-between space-y-3 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#2D2A4A] dark:text-white mb-1">
                          {subj.name}
                        </div>
                        <div className="text-[11px] text-[#6B6890] dark:text-[#9D9BB8] line-clamp-2">
                          {subj.desc}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E3DFF5] dark:border-[#232329] text-[11px] text-[#6C5CE7] dark:text-[#A594FF] font-bold">
                        <span>Start 5-Q Ladder</span>
                        <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended Practice Section */}
              {recommendations.length > 0 && (
                <RecommendedPracticeView
                  recommendations={recommendations}
                  onLaunchRecommendation={handleLaunchRecommendation}
                />
              )}

              {/* Weak Topics Quick Widget */}
              {weakTopics.length > 0 && (
                <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4" />
                      <span>{weakTopics.length} Knowledge Decay Anomalies Detected</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('weak_topics')}
                      className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                    >
                      View Weak Topics &gt;
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {weakTopics.slice(0, 2).map((w) => (
                      <div
                        key={w.topicId}
                        className="p-3 rounded-xl bg-white dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#2D2A4A] dark:text-white">{w.topicTitle}</div>
                          <div className="text-[11px] text-rose-500 font-medium">Accuracy: {w.accuracyRate}%</div>
                        </div>
                        <button
                          onClick={() => handleStartWeakTopicDrill(w.topicId, w.subjectId, w.topicTitle)}
                          className="min-h-[44px] px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Remediate
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          )}

          {/* TAB: OLYMPIAD MOCK CONTEST */}
          {activeTab === 'contest' && <OlympiadContestView />}

          {/* TAB: ICT CODE RUNNER */}
          {activeTab === 'ict_runner' && <ICTCodeRunnerLab />}

          {/* TAB 2: RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <RecommendedPracticeView
              recommendations={recommendations}
              onLaunchRecommendation={handleLaunchRecommendation}
            />
          )}

          {/* TAB 3: WEAK TOPICS */}
          {activeTab === 'weak_topics' && (
            <WeakTopicsView
              weakTopics={weakTopics}
              onStartTargetedDrill={handleStartWeakTopicDrill}
            />
          )}

          {/* TAB 4: ATTEMPT HISTORY */}
          {activeTab === 'history' && <PracticeHistoryView />}

          {/* TAB 5: QUESTION BANK EXPLORER */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111114] p-4 rounded-xl border border-[#E3DFF5] dark:border-[#232329]">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#6B6890] dark:text-[#9D9BB8]" />
                  <select
                    value={bankSubjectFilter}
                    onChange={(e) => setBankSubjectFilter(e.target.value)}
                    className="text-xs bg-[#F7F5FF] dark:bg-[#16161C] border border-[#E3DFF5] dark:border-[#232329] rounded-lg px-2.5 py-1.5 text-[#2D2A4A] dark:text-[#E2E0F0] cursor-pointer"
                  >
                    <option value="all">All Subjects</option>
                    <option value="math">Mathematics</option>
                    <option value="cs">Computer Science & AI</option>
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="biology">Biology</option>
                    <option value="english">English</option>
                    <option value="data_science">Data Science</option>
                  </select>
                </div>

                <div className="relative flex-1 max-w-sm ml-auto">
                  <Search className="w-4 h-4 text-[#6B6890] dark:text-[#9D9BB8] absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search question bank..."
                    value={bankSearchQuery}
                    onChange={(e) => setBankSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-1.5 bg-[#F7F5FF] dark:bg-[#16161C] border border-[#E3DFF5] dark:border-[#232329] rounded-lg text-[#2D2A4A] dark:text-[#E2E0F0] placeholder-[#6B6890]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {isLoadingBank ? (
                  <ScreenSkeleton label="Loading question bank..." />
                ) : bankError ? (
                  <EmptyState
                    variant="error"
                    icon={<AlertCircle className="w-6 h-6" />}
                    title="Could not load question bank"
                    description={bankError}
                    action={
                      <Button type="button" variant="primary" size="md" onClick={loadBank} leftIcon={<RefreshCw className="w-4 h-4" />}>
                        Retry
                      </Button>
                    }
                  />
                ) : bankQuestions.length > 0 ? (
                  bankQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="bg-[#FFFFFF] dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] rounded-2xl p-5 shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="primary" size="sm">
                            {q.subjectId.toUpperCase()}
                          </Badge>
                          <span className="text-xs font-semibold text-[#2D2A4A] dark:text-white">
                            {q.topicId}
                          </span>
                          <Badge variant="outline" size="sm">
                            {q.difficulty.replace('_', ' ')}
                          </Badge>
                        </div>

                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setActivePracticeSession({
                              config: {
                                sessionTitle: `Problem: ${q.topicId}`,
                                subjectId: q.subjectId,
                                questionCount: 1,
                                timed: false,
                              },
                              questions: [q],
                            });
                          }}
                          leftIcon={<Zap className="w-3.5 h-3.5 fill-current text-[#FFB84D]" />}
                          className="min-h-[44px]"
                        >
                          Solve Problem
                        </Button>
                      </div>

                      <div className="text-sm text-[#2D2A4A] dark:text-[#F1EFFF] leading-relaxed">
                        <FormattedMathText text={q.questionText} />
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={<Search className="w-6 h-6" />}
                    title="No matching questions"
                    description="Try clearing the search query or switching to All Subjects."
                    actionLabel="Reset filters"
                    onAction={() => {
                      setBankSubjectFilter('all');
                      setBankSearchQuery('');
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Practice Configuration Modal */}
      <PracticeConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onStart={handleLaunchSession}
        initialSubjectId={modalSubject}
        initialTopicId={modalTopic}
        initialSubtopicId={modalSubtopic}
        initialConceptId={modalConcept}
        initialTitle={modalTitle}
        dailyQuotaRemaining={dailyQuotaRemaining}
      />
    </div>
  );
};
