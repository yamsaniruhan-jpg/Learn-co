import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Target,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Brain,
  Clock,
  CheckCircle2,
  Calendar,
  BookOpen,
  ArrowRight,
  Layers,
  Flame,
  Zap,
} from 'lucide-react';
import {
  LearnerAnalyticsDashboardData,
  ConceptMasteryEstimate,
  TopicAnalyticsDetail,
} from '../../types/analytics';
import { SubjectId, ExamTrackId } from '../../types/curriculum';
import { ConceptMastery, QuestionAttempt, UserProfile } from '../../types';
import { AnalyticsClient } from '../../services/analyticsClient';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Tabs } from '../ui/Tabs';
import { NextBestActionsList } from './NextBestActionsList';
import { ExamReadinessCard } from './ExamReadinessCard';
import { MistakeNotebookView } from './MistakeNotebookView';
import { TopicAnalyticsTree } from './TopicAnalyticsTree';
import { ProgressTrendsChart } from './ProgressTrendsChart';
import { AiDiagnosticModal } from './AiDiagnosticModal';

interface IntelligenceViewProps {
  user: UserProfile;
  masteries: ConceptMastery[];
  attempts: QuestionAttempt[];
  onNavigateTab?: (tab: string, context?: any) => void;
}

export const IntelligenceView: React.FC<IntelligenceViewProps> = ({
  user,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  const [dashboardData, setDashboardData] = useState<LearnerAnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('math');
  const [selectedExamTrack, setSelectedExamTrack] = useState<ExamTrackId>('jee_advanced');
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);

  // Mastery list filtering
  const [masterySubjectFilter, setMasterySubjectFilter] = useState<string>('all');
  const [masteryLabelFilter, setMasteryLabelFilter] = useState<string>('all');
  const [weakOnlyFilter, setWeakOnlyFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      const data = await AnalyticsClient.getDashboard();
      setDashboardData(data);
      if (data.examReadiness?.examTrackId) {
        setSelectedExamTrack(data.examReadiness.examTrackId);
      }
    } catch (err) {
      console.error('Failed to load learner analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSelectExamTrack = async (track: ExamTrackId) => {
    setSelectedExamTrack(track);
    try {
      const updatedReadiness = await AnalyticsClient.getExamReadiness(track);
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          examReadiness: updatedReadiness,
        });
      }
    } catch (err) {
      console.error('Failed to update exam readiness for track:', err);
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse p-4">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  const data = dashboardData!;
  const masteriesList = data?.masteryList || [];

  // Filtered concepts in the Mastery Explorer tab
  const filteredMasteries = masteriesList.filter((m) => {
    const matchesSubject =
      masterySubjectFilter === 'all' || m.subjectId === masterySubjectFilter;
    const matchesLabel =
      masteryLabelFilter === 'all' || m.masteryLabel === masteryLabelFilter;
    const matchesWeak = weakOnlyFilter ? m.isWeakArea : true;
    const matchesSearch =
      m.conceptTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subjectId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesLabel && matchesWeak && matchesSearch;
  });

  const subTabs = [
    { id: 'overview', label: 'Overview Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    {
      id: 'mastery',
      label: 'Concept Mastery Matrix',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: masteriesList.length,
    },
    { id: 'topics', label: 'Topic Breakdown', icon: <Layers className="w-4 h-4" /> },
    {
      id: 'readiness',
      label: 'Exam Readiness',
      icon: <Target className="w-4 h-4" />,
      badge: `${data?.examReadiness?.estimatedReadinessScore || 0}%`,
    },
    {
      id: 'mistakes',
      label: 'Mistake Notebook',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: data?.mistakeSummary?.unresolvedCount,
    },
    { id: 'trends', label: 'Progress & Retention', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Header & Global Diagnostic Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" />
              <span>Volume 9 Adaptive Analytics Engine</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
            Adaptive Learning & Cognitive Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Multi-factor empirical mastery: M(c) = 0.40 A_eff + 0.25 D_res + 0.20 R(t) + 0.15 Rec - MistakePenalty.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchDashboard(true)}
            disabled={isRefreshing}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDiagnosticOpen(true)}
            className="text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Synthesize Socratic Diagnostic
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Composite Mastery */}
        <Card variant="default" padding="md" className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Composite Mastery Index
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
              {data.overallMasteryScore}%
            </span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +3.8% wk
            </span>
          </div>
          <Progress value={data.overallMasteryScore} color="indigo" size="xs" />
        </Card>

        {/* Calibrated Accuracy */}
        <Card variant="default" padding="md" className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Calibrated Accuracy
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-display">
              {data.overallAccuracy !== null ? `${data.overallAccuracy}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {data.totalAttemptsCount} questions
            </span>
          </div>
          <Progress value={data.overallAccuracy || 0} color="emerald" size="xs" />
        </Card>

        {/* Target Exam Readiness */}
        <Card
          variant="default"
          padding="md"
          className="space-y-1.5 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
          onClick={() => setActiveSubTab('readiness')}
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {data.examReadiness.examName}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-display">
              {data.examReadiness.estimatedReadinessScore}%
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {data.examReadiness.readinessBand.replace('_', ' ')}
            </span>
          </div>
          <Progress value={data.examReadiness.estimatedReadinessScore} color="indigo" size="xs" />
        </Card>

        {/* Mistake Backlog */}
        <Card
          variant="default"
          padding="md"
          className="space-y-1.5 cursor-pointer hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
          onClick={() => setActiveSubTab('mistakes')}
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Unresolved Misconceptions
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-rose-500 font-display">
              {data.mistakeSummary.unresolvedCount}
            </span>
            <span className="text-xs text-slate-400">
              {data.mistakeSummary.remediationRate}% resolved
            </span>
          </div>
          <Progress value={data.mistakeSummary.remediationRate} color="rose" size="xs" />
        </Card>
      </div>

      {/* Segmented Navigation Tabs */}
      <Tabs
        tabs={subTabs}
        activeTab={activeSubTab}
        onChange={setActiveSubTab}
        variant="segmented"
      />

      {/* 1. OVERVIEW DASHBOARD VIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Next Best Actions Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Recommended Next Best Actions
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Algorithmically ranked by urgency & cognitive decay
              </span>
            </div>

            <NextBestActionsList
              actions={data.nextBestActions}
              onNavigateTab={onNavigateTab}
              onRefresh={() => fetchDashboard(true)}
            />
          </div>

          {/* 5 Subjects Summary Matrix Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Subject Mastery & Stability Matrix
              </h2>
              <button
                onClick={() => setActiveSubTab('topics')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View Full Topic Trees</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.subjectSummaries.map((s) => (
                <Card
                  key={s.subjectId}
                  variant="default"
                  padding="md"
                  className="space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedSubject(s.subjectId);
                    setActiveSubTab('topics');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={s.subjectId} size="sm">
                      {s.name.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {s.masteryPercentage}% Mastery
                    </span>
                  </div>

                  <Progress value={s.masteryPercentage} color={s.subjectId as any} size="xs" />

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block">Concepts</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {s.masteredConceptCount} / {s.totalConceptCount} Mastered
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Accuracy</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {s.accuracyPercentage !== null ? `${s.accuracyPercentage}%` : 'No attempts'}
                      </span>
                    </div>
                  </div>

                  {s.weakTopics.length > 0 && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 px-2 py-1 rounded-lg">
                      <span className="font-bold">Focus: </span>
                      {s.weakTopics.slice(0, 2).join(', ')}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Exam Readiness & Trends Teasers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExamReadinessCard
              readiness={data.examReadiness}
              selectedTrack={selectedExamTrack}
              onSelectTrack={handleSelectExamTrack}
              onNavigateTab={onNavigateTab}
            />

            <ProgressTrendsChart
              daily={data.progressTrends.daily}
              weekly={data.progressTrends.weekly}
              monthly={data.progressTrends.monthly}
            />
          </div>
        </div>
      )}

      {/* 2. CONCEPT MASTERY MATRIX VIEW */}
      {activeSubTab === 'mastery' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Search & Multi-Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search concepts or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Weak Only Toggle */}
              <button
                onClick={() => setWeakOnlyFilter(!weakOnlyFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  weakOnlyFilter
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Weak Areas Only</span>
              </button>

              {/* Status Filter */}
              <select
                value={masteryLabelFilter}
                onChange={(e) => setMasteryLabelFilter(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl border-none focus:outline-none"
              >
                <option value="all">All Mastery Levels</option>
                <option value="MASTERED">Mastered (&gt;80%)</option>
                <option value="PROFICIENT">Proficient (65-80%)</option>
                <option value="FAMILIAR">Familiar (50-65%)</option>
                <option value="LEARNING">Learning (&lt;50%)</option>
                <option value="DECAYED">Decay Risk</option>
              </select>

              {/* Subject Filter */}
              <div className="flex gap-1 overflow-x-auto">
                {['all', 'math', 'cs', 'physics', 'chemistry', 'biology'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setMasterySubjectFilter(sub)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                      masterySubjectFilter === sub
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Concepts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMasteries.map((m) => (
              <Card
                key={m.conceptId}
                variant="default"
                padding="md"
                className="space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={m.subjectId} size="sm">
                        {m.subjectId.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {m.masteryLabel}
                      </span>
                      {m.isWeakArea && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Weak Area
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {m.conceptTitle}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-display">
                      {m.masteryScore}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <Progress
                  value={m.masteryScore}
                  color={
                    m.masteryScore >= 80
                      ? 'emerald'
                      : m.masteryScore >= 60
                      ? 'indigo'
                      : m.masteryScore >= 40
                      ? 'amber'
                      : 'rose'
                  }
                  size="xs"
                />

                {/* 4 Factor Sub-metrics */}
                <div className="grid grid-cols-4 gap-1 text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg">
                    <span className="text-slate-400 block">Accuracy</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {m.accuracy}%
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg">
                    <span className="text-slate-400 block">Diff. Res.</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {m.difficultyResilience}%
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg">
                    <span className="text-slate-400 block">Retention</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {m.retentionStrength}%
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg">
                    <span className="text-slate-400 block">Recency</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {m.recencyFactor}%
                    </span>
                  </div>
                </div>

                {/* Practice & Copilot actions */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {m.correctCount}/{m.attemptsCount} solved correct
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (onNavigateTab) {
                          onNavigateTab('practice', {
                            subjectId: m.subjectId,
                            conceptId: m.conceptId,
                            topicId: m.conceptTitle,
                          });
                        }
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 py-1 px-2.5"
                    >
                      <span>Practice</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 3. TOPIC BREAKDOWN TREE VIEW */}
      {activeSubTab === 'topics' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <TopicAnalyticsTree
            topics={data.topicDetails || []}
            selectedSubject={selectedSubject}
            onSelectSubject={async (sub) => {
              setSelectedSubject(sub);
              try {
                const updatedTopics = await AnalyticsClient.getSubjectAnalytics(sub);
                setDashboardData({
                  ...data,
                  topicDetails: updatedTopics,
                });
              } catch (e) {
                console.error(e);
              }
            }}
            onNavigateTab={onNavigateTab}
          />
        </div>
      )}

      {/* 4. EXAM READINESS VIEW */}
      {activeSubTab === 'readiness' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <ExamReadinessCard
            readiness={data.examReadiness}
            selectedTrack={selectedExamTrack}
            onSelectTrack={handleSelectExamTrack}
            onNavigateTab={onNavigateTab}
          />
        </div>
      )}

      {/* 5. MISTAKE NOTEBOOK VIEW */}
      {activeSubTab === 'mistakes' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <MistakeNotebookView
            summary={data.mistakeSummary}
            mistakes={data.recentMistakes || []}
            onNavigateTab={onNavigateTab}
            onRefresh={() => fetchDashboard(true)}
          />
        </div>
      )}

      {/* 6. PROGRESS & RETENTION TRENDS VIEW */}
      {activeSubTab === 'trends' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <ProgressTrendsChart
            daily={data.progressTrends.daily}
            weekly={data.progressTrends.weekly}
            monthly={data.progressTrends.monthly}
          />
        </div>
      )}

      {/* Socratic AI Diagnostic Modal */}
      <AiDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
