import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Zap,
  RefreshCw,
  Plus,
  Layers,
} from 'lucide-react';
import { SubjectId } from '../../types/curriculum';
import {
  DayOfWeek,
  PlanGenerationInput,
  StudyPlan,
  StudyTask,
  StudyGoal,
  TopicSubtopicGroup,
} from '../../types/planner';
import { PlannerClient } from '../../services/plannerClient';

interface AiPlanWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGeneratedAndApplied: (plan: StudyPlan, tasks: StudyTask[]) => void;
}

const ALL_SUBJECTS: { id: SubjectId; name: string; icon: string }[] = [
  { id: 'math', name: 'Mathematics', icon: '📐' },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪' },
  { id: 'physics', name: 'Physics', icon: '⚛️' },
  { id: 'cs', name: 'Computer Science', icon: '💻' },
  { id: 'biology', name: 'Biology', icon: '🧬' },
];

const DAYS_OF_WEEK: { id: DayOfWeek; label: string }[] = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

const EXAM_TRACKS = [
  'Advanced STEM Mastery',
  'JEE Advanced Sprint',
  'AP Physics & Calculus',
  'NEET Biology & Chemistry',
  'Computer Science Olympiad',
  'General High School Honors',
];

export const AiPlanWizardModal: React.FC<AiPlanWizardModalProps> = ({
  isOpen,
  onClose,
  onPlanGeneratedAndApplied,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [goalTitle, setGoalTitle] = useState('30-Day Chemistry & Calculus Mastery Plan');
  const [targetExamTrack, setTargetExamTrack] = useState('Advanced STEM Mastery');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectId[]>(['chemistry', 'math']);

  // Step 2: AI Identified Topics & Subtopics State
  const [topicGroups, setTopicGroups] = useState<TopicSubtopicGroup[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<Record<string, boolean>>({});
  const [isIdentifyingTopics, setIsIdentifyingTopics] = useState(false);
  const [topicSource, setTopicSource] = useState<'ai' | 'curated' | null>(null);
  const [topicIdentifyError, setTopicIdentifyError] = useState<string | null>(null);
  const [customSubtopicInputs, setCustomSubtopicInputs] = useState<Record<string, string>>({});

  // Step 3: Schedule & Pedagogy
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>([
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
  ]);
  const [dailyAvailableMinutes, setDailyAvailableMinutes] = useState(120);
  const [preferredStartTime, setPreferredStartTime] = useState('17:30');
  const [preferredSessionLength, setPreferredSessionLength] = useState(45);
  const [includeWeakMistakeRemediation, setIncludeWeakMistakeRemediation] = useState(true);
  const [includeSpacedRevision, setIncludeSpacedRevision] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');

  // Generation Preview State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<Partial<StudyPlan> | null>(null);
  const [previewTasks, setPreviewTasks] = useState<Partial<StudyTask>[]>([]);
  const [previewGoal, setPreviewGoal] = useState<Partial<StudyGoal> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subKey = (subjectId: string, topic: string, subtopic: string) =>
    `${subjectId}::${topic}::${subtopic}`;

  const runIdentifyTopics = useCallback(
    async (subjectsOverride?: SubjectId[]) => {
      const targetSubjects = subjectsOverride || selectedSubjects;
      setIsIdentifyingTopics(true);
      setTopicIdentifyError(null);
      try {
        const res = await PlannerClient.identifyTopTopics({
          subjects: targetSubjects,
          targetExamTrack,
          customFocus: customPrompt.trim() || undefined,
        });
        const groups = res.topics || [];
        setTopicGroups(groups);
        setTopicSource(res.source);
        const initialSelection: Record<string, boolean> = {};
        groups.forEach((grp) => {
          grp.subtopics.forEach((sub) => {
            initialSelection[subKey(grp.subjectId, grp.topic, sub)] = true;
          });
        });
        setSelectedSubtopics(initialSelection);
      } catch (err: any) {
        setTopicIdentifyError(
          err?.message || 'Could not identify top topics automatically. Check your session or try again.'
        );
      } finally {
        setIsIdentifyingTopics(false);
      }
    },
    [selectedSubjects, targetExamTrack, customPrompt]
  );

  // Automatically identify topics when entering Step 2 if empty
  useEffect(() => {
    if (isOpen && step === 2 && topicGroups.length === 0 && !isIdentifyingTopics) {
      void runIdentifyTopics();
    }
  }, [isOpen, step, topicGroups.length, isIdentifyingTopics, runIdentifyTopics]);

  if (!isOpen) return null;

  const toggleSubject = (sub: SubjectId) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
        setTopicGroups([]);
      }
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
      setTopicGroups([]);
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    if (availableDays.includes(day)) {
      if (availableDays.length > 1) {
        setAvailableDays(availableDays.filter((d) => d !== day));
      }
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const toggleSubtopic = (subjectId: string, topic: string, subtopic: string) => {
    const key = subKey(subjectId, topic, subtopic);
    setSelectedSubtopics((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleEntireTopicGroup = (grp: TopicSubtopicGroup) => {
    const allSelected = grp.subtopics.every(
      (s) => selectedSubtopics[subKey(grp.subjectId, grp.topic, s)]
    );
    setSelectedSubtopics((prev) => {
      const next = { ...prev };
      grp.subtopics.forEach((s) => {
        next[subKey(grp.subjectId, grp.topic, s)] = !allSelected;
      });
      return next;
    });
  };

  const handleAddCustomSubtopic = (grpIdx: number) => {
    const grp = topicGroups[grpIdx];
    const groupId = `${grp.subjectId}::${grp.topic}`;
    const raw = (customSubtopicInputs[groupId] || '').trim();
    if (!raw) return;
    setTopicGroups((prev) =>
      prev.map((item, idx) =>
        idx === grpIdx && !item.subtopics.includes(raw)
          ? { ...item, subtopics: [...item.subtopics, raw] }
          : item
      )
    );
    setSelectedSubtopics((prev) => ({
      ...prev,
      [subKey(grp.subjectId, grp.topic, raw)]: true,
    }));
    setCustomSubtopicInputs((prev) => ({ ...prev, [groupId]: '' }));
  };

  const getActiveIdentifiedGroups = (): TopicSubtopicGroup[] => {
    return topicGroups
      .map((grp) => ({
        ...grp,
        subtopics: grp.subtopics.filter(
          (sub) => selectedSubtopics[subKey(grp.subjectId, grp.topic, sub)]
        ),
      }))
      .filter((grp) => grp.subtopics.length > 0);
  };

  const totalSelectedSubtopicsCount = Object.values(selectedSubtopics).filter(Boolean).length;

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setError(null);
    setStep(4);

    const activeGroups = getActiveIdentifiedGroups();
    const priorityTopics = activeGroups.flatMap((grp) =>
      grp.subtopics.map((sub) => `${grp.topic}: ${sub}`)
    );

    const payload: PlanGenerationInput = {
      goalTitle,
      targetExamTrack,
      targetDate,
      subjects: selectedSubjects,
      availableDays,
      dailyAvailableMinutes,
      preferredStartTime,
      preferredSessionLength,
      priorityTopics,
      identifiedTopicGroups: activeGroups,
      includeWeakMistakeRemediation,
      includeSpacedRevision,
      customPrompt: customPrompt.trim() || undefined,
    };

    try {
      const data = await PlannerClient.generateAiPlan(payload);
      setPreviewPlan(data.plan);
      setPreviewTasks(data.tasks || []);
      setPreviewGoal(data.goal ?? null);
    } catch (err: any) {
      setError(err.message || 'Error generating plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!previewPlan) return;
    setIsApplying(true);
    setError(null);

    try {
      const data = await PlannerClient.applyGeneratedPlan({
        plan: previewPlan,
        tasks: previewTasks,
        goal: previewGoal,
        summaryText: 'Generated AI Study Plan',
      });
      onPlanGeneratedAndApplied(data.plan, (previewTasks as StudyTask[]) || []);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error applying plan.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D2A4A]/75 dark:bg-[#100E1C]/90">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-3xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-3xl shadow-[0_12px_36px_rgba(45,42,74,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] p-5 sm:p-7 text-[#2D2A4A] dark:text-[#F1EFFF] overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E3DFF5] dark:border-[#3D3861] shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#6C5CE7]/15 dark:bg-indigo-500/20 border border-[#6C5CE7]/30 text-[#6C5CE7] dark:text-[#A598FF]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-[#2D2A4A] dark:text-[#F1EFFF] text-base sm:text-lg font-display">
                  AI Study Plan Generator
                </h3>
                <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                  Step {step} of 4 •{' '}
                  {step === 1
                    ? 'Subjects & Goal'
                    : step === 2
                    ? 'AI Top Topics & Subtopics'
                    : step === 3
                    ? 'Schedule & Preferences'
                    : 'Study Plan Preview'}
                </p>
              </div>
            </div>
            <button
              id="btn-close-ai-plan-wizard"
              type="button"
              onClick={onClose}
              aria-label="Close AI plan generator"
              className="p-2 rounded-xl text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-white hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Progression Bar */}
          <div className="grid grid-cols-4 gap-2 my-3.5 shrink-0">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-[#6C5CE7] dark:bg-indigo-500'
                    : s < step
                    ? 'bg-emerald-500'
                    : 'bg-[#E3DFF5] dark:bg-[#1E1B33]'
                }`}
              />
            ))}
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* STEP 1: GOAL & SUBJECTS */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider mb-1.5">
                    1. Study Goal Title
                  </label>
                  <input
                    id="input-ai-goal-title"
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. Chemistry (Organic/Inorganic/Physical) & Calculus Mastery"
                    className="w-full px-3.5 py-2.5 bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] placeholder-[#8E8BAF] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider mb-1.5">
                    2. Target Exam Track / Curriculum Focus
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EXAM_TRACKS.map((track) => (
                      <button
                        key={track}
                        type="button"
                        onClick={() => setTargetExamTrack(track)}
                        className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          targetExamTrack === track
                            ? 'bg-[#6C5CE7]/15 border-[#6C5CE7] text-[#6C5CE7] dark:bg-indigo-600/25 dark:text-indigo-200'
                            : 'bg-[#F7F5FF] dark:bg-[#1E1B33] border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#B4B0D5] hover:border-[#6C5CE7]/60'
                        }`}
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider mb-1.5">
                      Target Milestone Date
                    </label>
                    <input
                      id="input-ai-target-date"
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider mb-1.5">
                      Target Subjects
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_SUBJECTS.map((sub) => {
                        const isSelected = selectedSubjects.includes(sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => toggleSubject(sub.id)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#6C5CE7] text-white border-[#6C5CE7] shadow-xs'
                                : 'bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5] border-[#E3DFF5] dark:border-[#3D3861] hover:text-[#2D2A4A] dark:hover:text-white'
                            }`}
                          >
                            <span className="mr-1">{sub.icon}</span> {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: AI TOP TOPICS & SUBTOPICS */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                      <Layers className="w-4 h-4 text-[#6C5CE7] dark:text-[#A598FF]" />
                      <span>Identified Top Topics &amp; Subtopics</span>
                      {topicSource && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00B8A9]/15 text-[#00897B] dark:text-[#2DD4BF]">
                          {topicSource === 'ai' ? 'AI Generated' : 'Syllabus Map'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                      Select the Chemistry branches (Organic, Inorganic, Physical) &amp; Math Calculus topics (Limits, Continuity, Differentiability, Differentiation, Integration, Applications) to build your plan.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isIdentifyingTopics}
                    onClick={() => void runIdentifyTopics()}
                    className="px-3 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isIdentifyingTopics ? 'animate-spin' : ''}`} />
                    <span>{isIdentifyingTopics ? 'Identifying...' : 'Re-identify with AI'}</span>
                  </button>
                </div>

                {topicIdentifyError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
                    <span>{topicIdentifyError}</span>
                    <button
                      type="button"
                      onClick={() => void runIdentifyTopics()}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {isIdentifyingTopics ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-9 h-9 rounded-full border-4 border-[#6C5CE7]/25 border-t-[#6C5CE7] animate-spin" />
                    <p className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                      Asking AI to map top topics and subtopics for {selectedSubjects.join(', ').toUpperCase()}...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topicGroups.map((grp, grpIdx) => {
                      const activeCount = grp.subtopics.filter(
                        (s) => selectedSubtopics[subKey(grp.subjectId, grp.topic, s)]
                      ).length;
                      const groupId = `${grp.subjectId}::${grp.topic}`;
                      return (
                        <div
                          key={`${grp.subjectId}-${grp.topic}-${grpIdx}`}
                          className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  grp.subjectId === 'chemistry'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : grp.subjectId === 'math'
                                    ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                                    : 'bg-[#6C5CE7]/15 text-[#6C5CE7] dark:text-[#A598FF]'
                                }`}
                              >
                                {grp.subjectId}
                              </span>
                              <h4 className="text-xs sm:text-sm font-black text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
                                {grp.topic}
                              </h4>
                              {grp.weight && (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                  {grp.weight}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleEntireTopicGroup(grp)}
                              className="text-[11px] font-bold text-[#6C5CE7] dark:text-[#A598FF] hover:underline shrink-0 cursor-pointer"
                            >
                              {activeCount === grp.subtopics.length
                                ? `Deselect (${activeCount})`
                                : `Select all (${grp.subtopics.length})`}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {grp.subtopics.map((sub) => {
                              const checked = Boolean(selectedSubtopics[subKey(grp.subjectId, grp.topic, sub)]);
                              return (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => toggleSubtopic(grp.subjectId, grp.topic, sub)}
                                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all text-left cursor-pointer ${
                                    checked
                                      ? 'bg-[#6C5CE7] text-white border-[#6C5CE7] shadow-2xs'
                                      : 'bg-white dark:bg-[#2A2647] text-[#6B6890] dark:text-[#B4B0D5] border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7]'
                                  }`}
                                >
                                  {sub}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              value={customSubtopicInputs[groupId] || ''}
                              onChange={(e) =>
                                setCustomSubtopicInputs((prev) => ({
                                  ...prev,
                                  [groupId]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomSubtopic(grpIdx);
                                }
                              }}
                              placeholder={`Add custom ${grp.topic} subtopic...`}
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-[11px] text-[#2D2A4A] dark:text-[#F1EFFF] placeholder-[#8E8BAF]"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddCustomSubtopic(grpIdx)}
                              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7] text-[11px] font-bold text-[#6C5CE7] dark:text-[#A598FF] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: SCHEDULE, TIME CONSTRAINTS & PEDAGOGY */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider mb-1.5">
                    Available Study Days
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS_OF_WEEK.map((d) => {
                      const active = availableDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDay(d.id)}
                          className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white shadow-xs'
                              : 'bg-[#F7F5FF] dark:bg-[#1E1B33] border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5]'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                        Daily Available Study Time
                      </label>
                      <span className="text-xs font-mono font-bold text-[#6C5CE7] dark:text-[#A598FF]">
                        {dailyAvailableMinutes} mins ({Math.floor(dailyAvailableMinutes / 60)}h{' '}
                        {dailyAvailableMinutes % 60}m)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="240"
                      step="15"
                      value={dailyAvailableMinutes}
                      onChange={(e) => setDailyAvailableMinutes(Number(e.target.value))}
                      className="w-full h-2 bg-[#E3DFF5] dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#6C5CE7]"
                    />
                    <div className="flex justify-between text-[10px] text-[#6B6890] dark:text-[#B4B0D5] mt-1 font-mono">
                      <span>30m</span>
                      <span>1h</span>
                      <span>2h</span>
                      <span>3h</span>
                      <span>4h</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1">
                        Preferred Start Time
                      </label>
                      <input
                        type="time"
                        value={preferredStartTime}
                        onChange={(e) => setPreferredStartTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1">
                        Single Session Length
                      </label>
                      <select
                        value={preferredSessionLength}
                        onChange={(e) => setPreferredSessionLength(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] text-xs"
                      >
                        <option value={30}>30 mins (Quick Sprint)</option>
                        <option value={45}>45 mins (Balanced Focus)</option>
                        <option value={60}>60 mins (Deep Derivation)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeWeakMistakeRemediation}
                      onChange={(e) => setIncludeWeakMistakeRemediation(e.target.checked)}
                      className="mt-0.5 rounded text-[#6C5CE7]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                        Mistake Remediation
                      </div>
                      <div className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                        Insert drills for weak mistakes
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSpacedRevision}
                      onChange={(e) => setIncludeSpacedRevision(e.target.checked)}
                      className="mt-0.5 rounded text-[#6C5CE7]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                        Spaced Repetition
                      </div>
                      <div className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                        Schedule Day 3, 7 &amp; 14 recall cycles
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider mb-1">
                    Custom Prompt or Pacing Notes
                  </label>
                  <textarea
                    id="input-ai-custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g. Prioritize Limits & Continuity before Integration; revise Organic reaction mechanisms on weekends..."
                    rows={2}
                    className="w-full px-3 py-2 text-xs bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] placeholder-[#8E8BAF] resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/25 text-[#2D2A4A] dark:text-indigo-200 text-xs">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Building from <strong>{totalSelectedSubtopicsCount} selected subtopics</strong> while respecting Learn.co&apos;s 25 questions/day practice limit.
                  </span>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PREVIEW & APPLY */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-[#6C5CE7]/30 border-t-[#6C5CE7] animate-spin mb-4" />
                    <h4 className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                      Synthesizing Topic-Based Study Plan...
                    </h4>
                    <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1 max-w-md">
                      Scheduling {totalSelectedSubtopicsCount} Chemistry &amp; Math subtopics across {availableDays.length} weekly study days.
                    </p>
                  </div>
                ) : error ? (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Plan Generation Error</p>
                      <p className="mt-0.5">{error}</p>
                      <button
                        type="button"
                        onClick={handleGeneratePlan}
                        className="mt-2.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-medium text-xs hover:bg-rose-500 cursor-pointer"
                      >
                        Retry Generation
                      </button>
                    </div>
                  </div>
                ) : (
                  previewPlan && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861]">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                            {previewPlan.title}
                          </h4>
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#6C5CE7]/15 text-[#6C5CE7] dark:text-[#A598FF]">
                            {previewPlan.totalTasksCount} Scheduled Tasks
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1">
                          {previewPlan.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E3DFF5] dark:border-[#3D3861] text-xs text-[#2D2A4A] dark:text-[#F1EFFF]">
                          <span>
                            Total: <strong>{previewPlan.totalEstimatedHours}h</strong>
                          </span>
                          <span>
                            Target: <strong>{previewPlan.targetEndDate}</strong>
                          </span>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider mb-2">
                          Scheduled Tasks Preview ({previewTasks.length})
                        </h5>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {previewTasks.map((t, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[#6B6890] dark:text-[#B4B0D5] text-[11px] shrink-0">
                                  {t.scheduledDate}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#6C5CE7]/15 text-[#6C5CE7] dark:text-[#A598FF] uppercase shrink-0">
                                  {t.subjectId}
                                </span>
                                <span className="font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
                                  {t.title}
                                </span>
                              </div>
                              <span className="text-[#6B6890] dark:text-[#B4B0D5] font-mono text-[11px] shrink-0 ml-2">
                                {t.estimatedDurationMinutes}m
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E3DFF5] dark:border-[#3D3861] shrink-0">
            {step > 1 && step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as any)}
                disabled={step === 2 && totalSelectedSubtopicsCount === 0 && topicGroups.length > 0}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#6C5CE7] hover:bg-[#5B4BC4] disabled:opacity-50 text-white transition-colors cursor-pointer"
              >
                {step === 1 ? 'Identify Topics with AI' : 'Next: Schedule'} <ArrowRight className="w-4 h-4" />
              </button>
            ) : step === 3 ? (
              <button
                id="btn-trigger-ai-generate"
                type="button"
                onClick={handleGeneratePlan}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#6C5CE7] to-[#8577ED] hover:from-[#5B4BC4] hover:to-[#6C5CE7] text-white shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Generate AI Study Plan
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] transition-colors cursor-pointer"
                >
                  Adjust Topics
                </button>
                <button
                  id="btn-apply-ai-plan"
                  type="button"
                  disabled={isApplying || !previewPlan}
                  onClick={handleApplyPlan}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Apply to My Schedule
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
