import React, { useState, useEffect } from 'react';
import { SubjectId, SubjectCurriculum, ExamTrack, ExamTrackId, ConceptDetail, PracticeSessionConfig } from '../../types/curriculum';
import { LearningClient } from '../../services/learningClient';
import { CurriculumNavigator } from './CurriculumNavigator';
import { ConceptDetailView } from './ConceptDetailView';
import { PracticeConfigModal } from './PracticeConfigModal';
import { PracticeArena } from '../practice/PracticeArena';
import { PracticeResultsView } from '../practice/PracticeResultsView';
import { CognitiveWarmUpModal, UserMoodState } from './CognitiveWarmUpModal';
import { QuestionBankItem } from '../../types/curriculum';
import { BookOpen, Sparkles, Zap, Bot, ArrowLeft, Brain, Library, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sounds } from '../../utils/sound';
import { DigitalArchiveHub } from './DigitalArchiveHub';
import { XPIndicator } from '../ui/GamificationIndicators';
import { SubjectCurriculumSkeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { EXAM_TRACKS, SUBJECT_SUMMARIES } from '../../data/curriculumMeta';

interface LearnViewProps {
  initialSubjectId?: SubjectId;
  onCompleteConcept?: (conceptId: string, xpEarned: number) => void;
  onOpenCopilotWithContext: (context: string) => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  initialSubjectId = 'math',
  onCompleteConcept,
  onOpenCopilotWithContext,
}) => {
  const { gamification, refreshUserData } = useAuth();
  const [curriculum, setCurriculum] = useState<SubjectCurriculum[]>([]);
  const [tracks, setTracks] = useState<ExamTrack[]>(EXAM_TRACKS);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(initialSubjectId);
  const [selectedTrack, setSelectedTrack] = useState<ExamTrackId>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);
  const [activeTabMode, setActiveTabMode] = useState<'curriculum' | 'archives'>('curriculum');

  // Concept View State
  const [activeConceptDetail, setActiveConceptDetail] = useState<ConceptDetail | null>(null);
  const [activeChapterTitle, setActiveChapterTitle] = useState<string>('');
  const [activeTopicTitle, setActiveTopicTitle] = useState<string>('');

  // Practice Modal & Active Session State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [modalTargetSubject, setModalTargetSubject] = useState<SubjectId>('math');
  const [modalTargetTopic, setModalTargetTopic] = useState<string | undefined>(undefined);
  const [modalTargetSubtopic, setModalTargetSubtopic] = useState<string | undefined>(undefined);
  const [modalTargetConcept, setModalTargetConcept] = useState<string | undefined>(undefined);
  const [modalTitle, setModalTitle] = useState<string>('Calibrated 5-Question Practice');

  const [activePracticeSession, setActivePracticeSession] = useState<{
    config: PracticeSessionConfig;
    questions: QuestionBankItem[];
  } | null>(null);

  const [sessionResults, setSessionResults] = useState<any | null>(null);
  const [isWarmUpOpen, setIsWarmUpOpen] = useState<boolean>(false);

  const dailyQuotaRemaining = Math.max(0, 25 - (gamification?.dailyQuestionsSolvedToday || 0));

  useEffect(() => {
    LearningClient.getExamTracks().then(setTracks).catch(() => {});
  }, []);

  // Load ONLY the selected subject on demand (per-subject loading)
  useEffect(() => {
    let cancelled = false;
    async function loadSubjectData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const subjectData = await LearningClient.getSubjectCurriculum(selectedSubject, selectedTrack);
        if (!cancelled && subjectData) {
          setCurriculum((prev) => {
            const withoutCurrent = prev.filter((s) => s.id !== selectedSubject);
            return [...withoutCurrent, subjectData];
          });
        }
      } catch (err: any) {
        console.error('Failed to load subject curriculum:', err);
        if (!cancelled) {
          setLoadError(err?.message || 'Unable to load this subject curriculum right now.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadSubjectData();
    return () => {
      cancelled = true;
    };
  }, [selectedSubject, selectedTrack, reloadTick]);

  // Load Concept Detail
  const handleSelectConcept = async (conceptId: string) => {
    try {
      const detail = await LearningClient.getConcept(conceptId);
      if (detail) {
        // Find subject / chapter / topic metadata
        let foundChapter = '';
        let foundTopic = '';
        for (const subj of curriculum) {
          for (const ch of subj.chapters) {
            for (const top of ch.topics) {
              for (const sub of top.subtopics) {
                if (sub.concepts.some((c) => c.id === conceptId)) {
                  foundChapter = ch.title;
                  foundTopic = top.title;
                  break;
                }
              }
            }
          }
        }
        setActiveChapterTitle(foundChapter);
        setActiveTopicTitle(foundTopic);
        setActiveConceptDetail(detail);
      }
    } catch (err) {
      console.error('Failed to load concept detail:', err);
    }
  };

  const handleStartPracticeModal = (
    conceptId?: string,
    subjectId: SubjectId = selectedSubject,
    topicId?: string,
    topicTitle?: string,
    subtopicId?: string,
    subtopicTitle?: string
  ) => {
    setModalTargetSubject(subjectId);
    setModalTargetConcept(conceptId);
    setModalTargetTopic(topicId);
    setModalTargetSubtopic(subtopicId);
    setModalTitle(
      conceptId
        ? `Calibrated Ladder: ${activeConceptDetail?.title || 'Concept'}`
        : subtopicTitle
        ? `Subtopic Drill: ${subtopicTitle}`
        : topicTitle
        ? `Topic Ladder: ${topicTitle}`
        : `${subjectId.toUpperCase()} Problem Ladder`
    );
    setIsConfigModalOpen(true);
  };

  const handleLaunchPracticeSession = async (config: PracticeSessionConfig) => {
    setIsConfigModalOpen(false);
    try {
      const session = await LearningClient.startPracticeSession(config);
      if (session && session.questions && session.questions.length > 0) {
        setActivePracticeSession({
          config,
          questions: session.questions,
        });
        setSessionResults(null);
      }
    } catch (err: any) {
      console.error('Failed to start practice session:', err);
    }
  };

  const handleFinishPractice = (results: any) => {
    setActivePracticeSession(null);
    setSessionResults(results);
    refreshUserData();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. Active In-Progress Practice Session Arena */}
      {activePracticeSession && (
        <PracticeArena
          questions={activePracticeSession.questions}
          config={activePracticeSession.config}
          onFinishSession={handleFinishPractice}
          onExit={() => setActivePracticeSession(null)}
        />
      )}

      {/* 2. Practice Results Scorecard */}
      {!activePracticeSession && sessionResults && (
        <PracticeResultsView
          results={sessionResults}
          onRestart={() => handleLaunchPracticeSession(sessionResults.config || { questionCount: 5 })}
          onReturnToCurriculum={() => setSessionResults(null)}
        />
      )}

      {/* 3. Concept Detail Deep Dive View */}
      {!activePracticeSession && !sessionResults && activeConceptDetail && (
        <ConceptDetailView
          concept={activeConceptDetail}
          chapterTitle={activeChapterTitle}
          topicTitle={activeTopicTitle}
          subjectName={curriculum.find((s) => s.id === activeConceptDetail.subjectId)?.name}
          onStartPractice={(cId, sId, top) =>
            handleStartPracticeModal(
              cId,
              sId,
              activeConceptDetail.topicId,
              top,
              activeConceptDetail.subtopicId
            )
          }
          onNavigateConcept={(cId) => handleSelectConcept(cId)}
          onBack={() => setActiveConceptDetail(null)}
        />
      )}

      {/* 4. Main Curriculum Navigator */}
      {!activePracticeSession && !sessionResults && !activeConceptDetail && (
        <div className="space-y-6">
          {/* Header Banner */}
          <Card variant="elevated" padding="lg" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#A594FF] border border-[#E3DFF5] dark:border-[#3D3861]">
                  STEM Curriculum
                </span>
                <XPIndicator xp={gamification?.xp ?? 0} size="sm" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display tracking-tight">
                Learn
              </h1>
              <p className="text-sm text-[#6B6890] dark:text-[#B4B0D5] mt-1 max-w-2xl">
                Explore structured subjects, visual explanations, and topic problem ladders.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  sounds.playClick();
                  setIsWarmUpOpen(true);
                }}
                leftIcon={<Brain className="w-4 h-4 text-[#FFB84D]" />}
              >
                Warm-Up
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() =>
                  onOpenCopilotWithContext(
                    `I am studying the ${selectedSubject.toUpperCase()} curriculum on Learn.co. Guide me through key foundational theorems and exam heuristics.`
                  )
                }
                leftIcon={<Bot className="w-4 h-4 text-[#6C5CE7]" />}
              >
                Ask Doubt
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => handleStartPracticeModal(undefined, selectedSubject)}
                leftIcon={<Zap className="w-4 h-4 fill-current text-[#FFB84D]" />}
              >
                5-Q Ladder
              </Button>
            </div>
          </Card>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E3DFF5] dark:border-[#3D3861] pb-2">
            <button
              type="button"
              onClick={() => setActiveTabMode('curriculum')}
              className={`min-h-[44px] px-4 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
                activeTabMode === 'curriculum'
                  ? 'bg-[#6C5CE7] dark:bg-[#8577ED] text-white shadow-xs'
                  : 'text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] hover:bg-[#FFFFFF] dark:hover:bg-[#2A2647]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Curriculum</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabMode('archives')}
              className={`min-h-[44px] px-4 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
                activeTabMode === 'archives'
                  ? 'bg-[#6C5CE7] dark:bg-[#8577ED] text-white shadow-xs'
                  : 'text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] hover:bg-[#FFFFFF] dark:hover:bg-[#2A2647]'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>Archive &amp; Books</span>
            </button>
          </div>

          {/* View Content */}
          {activeTabMode === 'archives' ? (
            <DigitalArchiveHub selectedSubject={selectedSubject} />
          ) : isLoading && !curriculum.some((s) => s.id === selectedSubject) ? (
            <SubjectCurriculumSkeleton label={`Loading ${selectedSubject} curriculum hierarchy...`} />
          ) : loadError && !curriculum.some((s) => s.id === selectedSubject) ? (
            <EmptyState
              variant="error"
              icon={<AlertCircle className="w-6 h-6" />}
              title="Could not load curriculum"
              description={loadError}
              action={
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setReloadTick((t) => t + 1)}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Retry
                </Button>
              }
            />
          ) : (() => {
            const activeSubj = curriculum.find((s) => s.id === selectedSubject);
            if (!activeSubj || activeSubj.chapters.length === 0) {
              return (
                <EmptyState
                  icon={<BookOpen className="w-6 h-6" />}
                  title="No chapters match this filter"
                  description="Reset the exam track filter to see all chapters and concepts for this subject."
                  actionLabel="Reset filter"
                  onAction={() => setSelectedTrack('all')}
                />
              );
            }
            return (
              <CurriculumNavigator
                curriculum={curriculum}
                subjectSummaries={SUBJECT_SUMMARIES}
                isLoadingSubject={isLoading}
                tracks={tracks}
                selectedSubject={selectedSubject}
                selectedTrack={selectedTrack}
                onSelectSubject={(subjId) => setSelectedSubject(subjId)}
                onSelectTrack={(trackId) => setSelectedTrack(trackId)}
                onSelectConcept={(conceptId) => handleSelectConcept(conceptId)}
                onStartTopicPractice={(subjId, topicId, topicTitle) =>
                  handleStartPracticeModal(undefined, subjId, topicId, topicTitle)
                }
                onStartSubtopicPractice={(subjId, topicId, subtopicId, subtopicTitle) =>
                  handleStartPracticeModal(undefined, subjId, topicId, undefined, subtopicId, subtopicTitle)
                }
              />
            );
          })()}
        </div>
      )}

      {/* Practice Configuration Modal */}
      <PracticeConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onStart={handleLaunchPracticeSession}
        initialSubjectId={modalTargetSubject}
        initialTopicId={modalTargetTopic}
        initialSubtopicId={modalTargetSubtopic}
        initialConceptId={modalTargetConcept}
        initialTitle={modalTitle}
        dailyQuotaRemaining={dailyQuotaRemaining}
      />

      {/* Cognitive Focus & Warm-Up Modal */}
      <CognitiveWarmUpModal
        isOpen={isWarmUpOpen}
        onClose={() => setIsWarmUpOpen(false)}
        onWarmUpComplete={(xp, mood) => {
          refreshUserData();
          // Optionally trigger quick practice modal calibrated to mood
          handleStartPracticeModal(undefined, selectedSubject);
        }}
      />
    </div>
  );
};
