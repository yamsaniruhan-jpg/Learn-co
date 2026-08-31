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
import { BookOpen, Sparkles, Zap, Bot, ArrowLeft, Brain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sounds } from '../../utils/sound';

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
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(initialSubjectId);
  const [selectedTrack, setSelectedTrack] = useState<ExamTrackId>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Concept View State
  const [activeConceptDetail, setActiveConceptDetail] = useState<ConceptDetail | null>(null);
  const [activeChapterTitle, setActiveChapterTitle] = useState<string>('');
  const [activeTopicTitle, setActiveTopicTitle] = useState<string>('');

  // Practice Modal & Active Session State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [modalTargetSubject, setModalTargetSubject] = useState<SubjectId>('math');
  const [modalTargetTopic, setModalTargetTopic] = useState<string | undefined>(undefined);
  const [modalTargetConcept, setModalTargetConcept] = useState<string | undefined>(undefined);
  const [modalTitle, setModalTitle] = useState<string>('Calibrated 5-Question Practice');

  const [activePracticeSession, setActivePracticeSession] = useState<{
    config: PracticeSessionConfig;
    questions: QuestionBankItem[];
  } | null>(null);

  const [sessionResults, setSessionResults] = useState<any | null>(null);
  const [isWarmUpOpen, setIsWarmUpOpen] = useState<boolean>(false);

  const dailyQuotaRemaining = Math.max(0, 25 - (gamification?.dailyQuestionsSolvedToday || 0));

  // Load Curriculum and Tracks
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [currData, tracksData] = await Promise.all([
          LearningClient.getCurriculum(selectedTrack),
          LearningClient.getExamTracks(),
        ]);
        setCurriculum(currData);
        setTracks(tracksData);
      } catch (err) {
        console.error('Failed to load curriculum:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedTrack]);

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
    topicTitle?: string
  ) => {
    setModalTargetSubject(subjectId);
    setModalTargetConcept(conceptId);
    setModalTargetTopic(topicTitle);
    setModalTitle(
      conceptId
        ? `Calibrated Ladder: ${activeConceptDetail?.title || 'Concept'}`
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
          onStartPractice={(cId, sId, top) => handleStartPracticeModal(cId, sId, top)}
          onNavigateConcept={(cId) => handleSelectConcept(cId)}
          onBack={() => setActiveConceptDetail(null)}
        />
      )}

      {/* 4. Main Curriculum Navigator */}
      {!activePracticeSession && !sessionResults && !activeConceptDetail && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Data-Driven STEM Curriculum
                </span>
                <span className="text-xs text-slate-400 font-mono">5,000+ Question Architecture</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Learning Studio
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Explore formal STEM theories, first-principles intuitions, interactive simulators, and calibrated problem ladders.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsWarmUpOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Brain className="w-4 h-4 text-amber-500" />
                <span>Focus Warm-Up</span>
              </button>

              <button
                onClick={() =>
                  onOpenCopilotWithContext(
                    `I am studying the ${selectedSubject.toUpperCase()} curriculum on Learn.co. Guide me through key foundational theorems and exam heuristics.`
                  )
                }
                className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Bot className="w-4 h-4 text-purple-500" />
                <span>Discuss with Copilot</span>
              </button>

              <button
                onClick={() => handleStartPracticeModal(undefined, selectedSubject)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                <span>Quick 5-Question Ladder</span>
              </button>
            </div>
          </div>

          {/* Curriculum Explorer */}
          {isLoading ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              Loading STEM curriculum hierarchy...
            </div>
          ) : (
            <CurriculumNavigator
              curriculum={curriculum}
              tracks={tracks}
              selectedSubject={selectedSubject}
              selectedTrack={selectedTrack}
              onSelectSubject={(subjId) => setSelectedSubject(subjId)}
              onSelectTrack={(trackId) => setSelectedTrack(trackId)}
              onSelectConcept={(conceptId) => handleSelectConcept(conceptId)}
              onStartTopicPractice={(subjId, topicId, topicTitle) =>
                handleStartPracticeModal(undefined, subjId, topicTitle)
              }
            />
          )}
        </div>
      )}

      {/* Practice Configuration Modal */}
      <PracticeConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onStart={handleLaunchPracticeSession}
        initialSubjectId={modalTargetSubject}
        initialTopicId={modalTargetTopic}
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
