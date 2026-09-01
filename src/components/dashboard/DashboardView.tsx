import React, { useState, useEffect } from 'react';
import {
  Zap,
  Flame,
  Target,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Compass,
  ChevronRight,
  BarChart2,
  Trophy,
  Shield,
} from 'lucide-react';
import { UserProfile, ConceptMastery, QuestionAttempt, SubjectId } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { XPIndicator, StreakIndicator, MasteryIndicator } from '../ui/GamificationIndicators';
import { SEED_SUBJECTS, SEED_STUDY_SESSIONS } from '../../data/seedData';
import { Leaderboard } from '../leaderboard/Leaderboard';
import { loadUserStreak, getWeeklyStreakPills, StreakData } from '../../utils/streakManager';

interface DashboardViewProps {
  user: UserProfile;
  masteries: ConceptMastery[];
  attempts?: QuestionAttempt[];
  onNavigate: (tabId: string, context?: any) => void;
  onLaunchPractice?: () => void;
  onSelectSubject?: (subjectId: SubjectId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  masteries,
  attempts = [],
  onNavigate,
  onLaunchPractice = () => onNavigate('practice'),
  onSelectSubject,
}) => {
  const [streakData, setStreakData] = useState<StreakData>(() =>
    loadUserStreak(user.id || 'default_user', user.currentStreak ?? 0)
  );

  useEffect(() => {
    const fresh = loadUserStreak(user.id || 'default_user', user.currentStreak ?? 0);
    setStreakData(fresh);
  }, [user.id, user.currentStreak]);

  const weeklyPills = getWeeklyStreakPills(streakData);
  const activeStreakCount = streakData.currentStreak ?? user.currentStreak ?? 0;
  const longestStreakCount = Math.max(streakData.longestStreak ?? 0, user.longestStreak ?? 0);

  const allowanceRemaining = Math.max(
    0,
    user.dailyAllowanceLimit - user.dailyQuestionsSolvedToday
  );
  const dailyProgressPercent = Math.min(
    100,
    (user.dailyQuestionsSolvedToday / user.dailyAllowanceLimit) * 100
  );

  const averageMastery = Math.round(
    masteries.reduce((acc, m) => acc + m.masteryScore, 0) / Math.max(1, masteries.length)
  );

  const weakConcepts = masteries.filter((m) => m.isWeakArea || m.masteryScore < 60);

  const upcomingSessions = SEED_STUDY_SESSIONS.filter((s) => !s.isCompleted).slice(0, 3);

  const quickPrompts = [
    { title: 'Derive First Derivative Test', category: 'Math', tab: 'copilot', prompt: 'Derive the first derivative test for local extrema from first principles.' },
    { title: 'Explain Gradient Descent Divergence', category: 'CS', tab: 'copilot', prompt: 'Why does learning rate step size cause oscillation in ravines?' },
    { title: 'Stereochemistry of Walden Inversion', category: 'Chemistry', tab: 'copilot', prompt: 'Why does SN2 always invert tetrahedral chiral center geometry?' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome Banner & Goal Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 lg:p-10 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-12 w-64 h-64 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-bold text-indigo-200 border border-white/15">
                Level {user.level} Scholar
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-200 text-xs font-bold border border-orange-400/30">
                <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                <span>{activeStreakCount > 0 ? `${activeStreakCount}-Day Active Streak` : '0-Day Streak (Start Today)'}</span>
              </div>
              <span className="text-xs text-indigo-200/80 font-medium">
                Target: {user.targetExam || 'Advanced STEM Mastery'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white">
              Welcome back, {user.fullName.split(' ')[0]}
            </h1>
            <p className="text-sm sm:text-base text-indigo-100/80 leading-relaxed">
              {activeStreakCount > 0
                ? `Your ${activeStreakCount}-day study streak is active. Complete today's calibrated diagnostic ladder to reinforce your retention curve.`
                : `Ready to begin your journey? Complete your first diagnostic practice session today to ignite your study streak.`}
            </p>

            {/* Streak Week Visualizer */}
            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-indigo-200 font-semibold mr-1">Weekly Streak:</span>
              <div className="flex items-center gap-1.5">
                {weeklyPills.map((pill) => (
                  <div
                    key={pill.dateKey}
                    title={`${pill.dayName} (${pill.dateKey}): ${pill.isCompleted ? 'Completed' : 'Pending'}`}
                    className={`flex flex-col items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold border transition-all ${
                      pill.isCompleted
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                        : pill.isToday
                        ? 'bg-white/15 text-white border-white/40 ring-1 ring-amber-300'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                  >
                    <span>{pill.dayName.slice(0, 1)}</span>
                    {pill.isCompleted && <Flame className="w-2.5 h-2.5 fill-current" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Launch Practice CTA Box */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center gap-4 shrink-0 shadow-lg">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-amber-300 mb-0.5">
                <Flame className="w-4 h-4 fill-amber-300" />
                <span>Daily Quota</span>
              </div>
              <p className="text-lg font-black text-white">
                {allowanceRemaining} Problems Left
              </p>
            </div>
            <Button
              onClick={onLaunchPractice}
              variant="xp"
              size="lg"
              leftIcon={<Play className="w-4 h-4 fill-current" />}
              className="w-full sm:w-auto shadow-lg shadow-amber-500/25"
            >
              Start Practice Arena
            </Button>
          </div>
        </div>

        {/* Hero Goal Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs text-indigo-200/70 mb-0.5">
              <span>Study Streak</span>
              <span className="text-[10px] text-amber-300 font-bold">Best: {longestStreakCount}d</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <Flame className="w-4 h-4 fill-orange-400 text-orange-400 inline shrink-0 self-center" />
              <span className="text-xl font-black text-amber-300">{activeStreakCount}</span>
              <span className="text-xs text-indigo-200">consecutive days</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
              <div
                className="bg-orange-400 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (activeStreakCount / 7) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <span className="text-xs text-indigo-200/70 block">Average Mastery</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-emerald-400">{averageMastery}%</span>
              <span className="text-xs text-indigo-200">empirically verified</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-400 h-1.5 rounded-full"
                style={{ width: `${averageMastery}%` }}
              />
            </div>
          </div>

          <div>
            <span className="text-xs text-indigo-200/70 block">Weekly Study Time</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-white">{user.studyTimeMinutesThisWeek}m</span>
              <span className="text-xs text-indigo-200">of 240m goal</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
              <div
                className="bg-cyan-400 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (user.studyTimeMinutesThisWeek / 240) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <span className="text-xs text-indigo-200/70 block">Total Experience</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-amber-300">{user.xp.toLocaleString()}</span>
              <span className="text-xs text-indigo-200">XP</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
              <div className="bg-amber-400 h-1.5 rounded-full w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Core STEM Tracks & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Columns: STEM Curriculum Progress & Weak Topics */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEM Subject Exploration Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                  STEM Curriculum Tracks
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Concept decks, derivations, and interactive visual proofs
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => onNavigate('learn')}
              >
                View all curriculum
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SEED_SUBJECTS.map((subject) => {
                const subjectMasteries = masteries.filter((m) => m.subjectId === subject.id);
                const actualMastery =
                  subjectMasteries.length > 0
                    ? Math.round(
                        subjectMasteries.reduce((sum, m) => sum + m.masteryScore, 0) /
                          subjectMasteries.length
                      )
                    : 0;

                return (
                  <Card
                    key={subject.id}
                    variant="interactive"
                    padding="md"
                    onClick={() => onNavigate('learn', { subjectId: subject.id })}
                    className="group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
                          style={{ backgroundColor: subject.color }}
                        >
                          {subject.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {subject.name}
                          </h3>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {subject.courseCount} courses • {subject.conceptCount} concepts
                          </span>
                        </div>
                      </div>
                      <Badge variant="default" size="sm">
                        {actualMastery}% Mastered
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                      {subject.description}
                    </p>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${actualMastery}%`,
                          backgroundColor: subject.color,
                        }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Weak Topics Triage Banner */}
          {weakConcepts.length > 0 && (
            <Card
              variant="subtle"
              padding="md"
              className="border-l-4 border-l-rose-500 bg-rose-50/40 dark:bg-rose-950/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Cognitive Weak Areas Identified ({weakConcepts.length})
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {weakConcepts[0].conceptTitle} currently has low retention. Targeted drill recommended before decay occurs.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {weakConcepts.map((w) => (
                        <span
                          key={w.conceptId}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-1.5"
                        >
                          <span>{w.conceptTitle}</span>
                          <span className="font-bold opacity-80">({w.masteryScore}%)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onNavigate('practice')}
                  className="shrink-0"
                >
                  Remediate
                </Button>
              </div>
            </Card>
          )}

          {/* Quick First-Principles Inquiries for Copilot */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Socratic First-Principles Prompts</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate(item.tab, { initialPrompt: item.prompt })}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 text-left transition-all hover:shadow-xs group cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                    {item.category}
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {item.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Timetable, AI Studio Quick Links & Mentor Summary */}
        <div className="space-y-6">
          {/* Upcoming Study Schedule */}
          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Study Timetable
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('planner')}
                className="text-xs p-1"
              >
                Full schedule
              </Button>
            </div>

            <div className="space-y-2.5">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {session.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {session.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{session.topicTitle}</span>
                    <span>{session.durationMinutes} mins</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Creator Studio Spotlight */}
          <Card
            variant="default"
            padding="md"
            className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  AI Creator Studio
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Turn lecture PDFs, textbook chapters, or Markdown notes into interactive flashcards and calibrated quizzes.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('create')}
                  className="mt-2 text-xs"
                >
                  Open Creator Studio
                </Button>
              </div>
            </div>
          </Card>

          {/* Personal Mentor Snapshot */}
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Personal Mentor Note
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              "Your monotonicity calculus retention is at 92%. Solidify your edge by reviewing Walden Inversion stereochemistry today."
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              onClick={() => onNavigate('mentor')}
            >
              Open Retention Diagnostics
            </Button>
          </Card>

          {/* Quick Cohort Leaderboard Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Cohort Rankings
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('leaderboard')}
                className="text-xs p-1"
              >
                View all
              </Button>
            </div>
            <Leaderboard
              compact
              limit={4}
              showPodium={false}
              showSearch={false}
              showPrivacyNotice={false}
              onSelectScholar={() => onNavigate('leaderboard')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
