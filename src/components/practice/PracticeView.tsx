import React, { useState, useEffect } from 'react';
import {
  SubjectId,
  PracticeSessionConfig,
  QuestionBankItem,
  PracticeRecommendation,
  WeakTopicSignal,
} from '../../types/curriculum';
import { LearningClient } from '../../services/learningClient';
import { AuthClient } from '../../services/authClient';
import { useAuth } from '../../context/AuthContext';
import { PracticeArena } from './PracticeArena';
import { PracticeResultsView } from './PracticeResultsView';
import { PracticeConfigModal } from '../learn/PracticeConfigModal';
import { RecommendedPracticeView } from './RecommendedPracticeView';
import { WeakTopicsView } from './WeakTopicsView';
import { PracticeHistoryView } from './PracticeHistoryView';
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
} from 'lucide-react';

interface PracticeViewProps {
  onOpenCopilotWithContext: (context: string) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({ onOpenCopilotWithContext }) => {
  const { gamification, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'hub' | 'recommendations' | 'weak_topics' | 'history' | 'bank'>('hub');
  
  // Practice Session State
  const [activePracticeSession, setActivePracticeSession] = useState<{
    config: PracticeSessionConfig;
    questions: QuestionBankItem[];
  } | null>(null);

  const [sessionResults, setSessionResults] = useState<any | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [modalSubject, setModalSubject] = useState<SubjectId>('math');
  const [modalTopic, setModalTopic] = useState<string | undefined>(undefined);
  const [modalTitle, setModalTitle] = useState<string>('Calibrated 5-Question Ladder');

  // Async data
  const [recommendations, setRecommendations] = useState<PracticeRecommendation[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopicSignal[]>([]);
  const [bankQuestions, setBankQuestions] = useState<QuestionBankItem[]>([]);
  const [bankSubjectFilter, setBankSubjectFilter] = useState<string>('all');
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');
  const [isLoadingBank, setIsLoadingBank] = useState<boolean>(false);

  const dailyQuotaRemaining = Math.max(0, 25 - (gamification?.dailyQuestionsSolvedToday || 0));

  // Load recommendations and weak topics on mount
  useEffect(() => {
    async function loadHubData() {
      try {
        const [recs, weak] = await Promise.all([
          LearningClient.getRecommendations(),
          LearningClient.getWeakTopics(),
        ]);
        setRecommendations(recs);
        setWeakTopics(weak);
      } catch (err) {
        console.error('Failed to load practice hub data:', err);
      }
    }
    loadHubData();
  }, []);

  // Load Question Bank when Bank tab selected
  useEffect(() => {
    if (activeTab === 'bank') {
      loadBank();
    }
  }, [activeTab, bankSubjectFilter, bankSearchQuery]);

  const loadBank = async () => {
    setIsLoadingBank(true);
    try {
      const data = await LearningClient.getQuestionBank({
        subjectId: bankSubjectFilter !== 'all' ? (bankSubjectFilter as SubjectId) : undefined,
        searchQuery: bankSearchQuery || undefined,
        limit: 30,
      });
      setBankQuestions(data.questions);
    } catch (err) {
      console.error('Failed to load bank:', err);
    } finally {
      setIsLoadingBank(false);
    }
  };

  const handleLaunchSession = async (config: PracticeSessionConfig) => {
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
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleStartQuickSubject = (subjectId: SubjectId) => {
    setModalSubject(subjectId);
    setModalTopic(undefined);
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
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Calibrated Problem Ladders
                </span>
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authoritative Server Verification</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Practice & Diagnostic Engine
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Test STEM comprehension across Mathematics, CS & AI, Physics, Chemistry, and Biology. Earn +5 XP per correct question while reinforcing knowledge decay limits.
              </p>
            </div>

            {/* Daily Practice Limit Live Quota */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 shrink-0 text-center min-w-[180px]">
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold mb-1">
                Daily Limit Quota
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                <span className="text-amber-400">{dailyQuotaRemaining}</span> / 25
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Questions remaining today</div>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-1">
            {[
              { id: 'hub', label: 'Practice Hub & Ladders', icon: Target },
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
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
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
              {/* Subject 5-Question Ladder Starters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Launch Calibrated 5-Question Ladders by Subject
                  </h3>
                  <span className="text-xs text-slate-400">Easy → Medium → Hard progression</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { id: 'math', name: 'Mathematics', desc: 'Calculus, Linear Algebra, Series', color: 'from-blue-600 to-indigo-600' },
                    { id: 'cs', name: 'CS & AI', desc: 'Algorithms, Gradient Descent, PyTorch', color: 'from-emerald-600 to-teal-600' },
                    { id: 'physics', name: 'Physics', desc: 'Mechanics, Energy, Electromagnetism', color: 'from-purple-600 to-indigo-600' },
                    { id: 'chemistry', name: 'Chemistry', desc: 'Organic Mechanisms, Thermodynamics', color: 'from-amber-600 to-orange-600' },
                    { id: 'biology', name: 'Biology', desc: 'Genetics, Transcription, Cellular Respiration', color: 'from-rose-600 to-pink-600' },
                  ].map((subj) => (
                    <button
                      key={subj.id}
                      onClick={() => handleStartQuickSubject(subj.id as SubjectId)}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm flex flex-col justify-between space-y-3 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                          {subj.name}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-2">
                          {subj.desc}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
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
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{w.topicTitle}</div>
                          <div className="text-[11px] text-rose-500 font-medium">Accuracy: {w.accuracyRate}%</div>
                        </div>
                        <button
                          onClick={() => handleStartWeakTopicDrill(w.topicId, w.subjectId, w.topicTitle)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Remediate
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={bankSubjectFilter}
                    onChange={(e) => setBankSubjectFilter(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="all">All Subjects</option>
                    <option value="math">Mathematics</option>
                    <option value="cs">Computer Science & AI</option>
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="biology">Biology</option>
                  </select>
                </div>

                <div className="relative flex-1 max-w-sm ml-auto">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search question bank..."
                    value={bankSearchQuery}
                    onChange={(e) => setBankSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {isLoadingBank ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                    Loading questions...
                  </div>
                ) : bankQuestions.length > 0 ? (
                  bankQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 uppercase">
                            {q.subjectId}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {q.topicId}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 capitalize text-slate-500">
                            {q.difficulty.replace('_', ' ')}
                          </span>
                        </div>

                        <button
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
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Zap className="w-3 h-3 fill-current text-amber-300" />
                          <span>Solve Problem</span>
                        </button>
                      </div>

                      <div className="text-sm text-slate-800 dark:text-slate-200 font-serif leading-relaxed">
                        <FormattedMathText text={q.questionText} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                    No questions found matching your filter criteria.
                  </div>
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
        initialTitle={modalTitle}
        dailyQuotaRemaining={dailyQuotaRemaining}
      />
    </div>
  );
};
