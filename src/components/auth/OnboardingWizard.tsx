import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Target,
  Clock,
  Compass,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SubjectId } from '../../types/auth';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import confetti from 'canvas-confetti';

const ALL_SUBJECTS: Array<{ id: SubjectId; name: string; icon: string; desc: string }> = [
  { id: 'math', name: 'Mathematics', icon: '📐', desc: 'Calculus, Linear Algebra, Real Analysis' },
  { id: 'cs', name: 'Computer Science', icon: '💻', desc: 'Algorithms, Data Structures, Complexity' },
  { id: 'physics', name: 'Physics', icon: '⚡', desc: 'Classical Mechanics, Electromagnetism, Quantum' },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪', desc: 'Organic Synthesis, Thermodynamics, Kinetics' },
  { id: 'biology', name: 'Biology', icon: '🧬', desc: 'Molecular Genetics, Cellular Systems' },
];

const EDUCATION_LEVELS = [
  'High School / AP Prep',
  'Undergraduate STEM / Pre-Eng',
  'Graduate / Master / Ph.D.',
  'Independent Scholar / Researcher',
];

const TARGET_EXAMS = [
  'Advanced STEM Mastery & Diagnostics',
  'AP / IB Advanced Placement',
  'JEE Advanced / University Entrance',
  'GRE / Graduate Qualifications',
  'Competitive Algorithmic Olympiad',
];

export const OnboardingWizard: React.FC = () => {
  const { profile, saveOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [displayName, setDisplayName] = useState<string>(
    profile?.displayName || profile?.fullName || ''
  );
  const [educationLevel, setEducationLevel] = useState<string>(
    profile?.educationLevel || 'Undergraduate STEM / Pre-Eng'
  );
  const [targetExam, setTargetExam] = useState<string>(
    profile?.targetExam || 'Advanced STEM Mastery & Diagnostics'
  );
  const [targetScore, setTargetScore] = useState<string>(profile?.targetScore || 'Top 1% Percentile');
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectId[]>(
    profile?.subjects && profile.subjects.length > 0 ? profile.subjects : ['math', 'cs']
  );
  const [learningGoals, setLearningGoals] = useState<string[]>(
    profile?.learningGoals && profile.learningGoals.length > 0
      ? profile.learningGoals
      : ['Master first-principles mathematical intuition', 'Consolidate active recall with daily 25-question practice']
  );
  const [goalInput, setGoalInput] = useState<string>('');
  const [preferredStudyTime, setPreferredStudyTime] = useState<number>(
    profile?.preferredStudyTimeMinutes || 45
  );
  const [socraticLevel, setSocraticLevel] = useState<'high' | 'medium' | 'low'>('high');

  const toggleSubject = (subId: SubjectId) => {
    if (selectedSubjects.includes(subId)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== subId));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, subId]);
    }
  };

  const handleAddGoal = () => {
    if (goalInput.trim()) {
      setLearningGoals([...learningGoals, goalInput.trim()]);
      setGoalInput('');
    }
  };

  const handleRemoveGoal = (idx: number) => {
    setLearningGoals(learningGoals.filter((_, i) => i !== idx));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await saveOnboarding({
        displayName: displayName.trim() || 'Learn.co Scholar',
        educationLevel,
        targetExam,
        targetScore,
        subjects: selectedSubjects,
        learningGoals,
        preferredStudyTimeMinutes: preferredStudyTime,
        learningPreferences: {
          socraticGuidanceLevel: socraticLevel,
          showDetailedDerivations: true,
          timerVisible: true,
          soundEffects: true,
        },
      });

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Failed to complete onboarding', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl space-y-6">
        {/* Top Logo & Stepper Bar */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Learn.co Initial Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
            Personalize Your Learning Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Step {currentStep} of 4: Calibrating your curriculum and Socratic tutor settings
          </p>

          {/* Stepper Dots */}
          <div className="flex gap-2 justify-center pt-2 max-w-xs mx-auto">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step <= currentStep ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Card */}
        <Card variant="elevated" padding="lg" className="space-y-6">
          {/* STEP 1: Personal & Education */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Profile & Academic Level
                </h3>
                <p className="text-xs text-slate-500">
                  Set how you will appear in cohorts and what academic benchmark to apply.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Current Education Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EDUCATION_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setEducationLevel(level)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        educationLevel === level
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Target Exam & Focus */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Target Exam & Benchmark Score
                </h3>
                <p className="text-xs text-slate-500">
                  Learn.co calibrates problem difficulty against your target examination.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Exam Track
                </label>
                <div className="space-y-2">
                  {TARGET_EXAMS.map((exam) => (
                    <button
                      key={exam}
                      type="button"
                      onClick={() => setTargetExam(exam)}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                        targetExam === exam
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <span>{exam}</span>
                      {targetExam === exam && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Mastery / Score Goal
                </label>
                <input
                  type="text"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  placeholder="e.g. Top 1% Percentile / 100% Concept Mastery"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Core Subjects */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Select Active STEM Subjects
                </h3>
                <p className="text-xs text-slate-500">
                  Select one or more subjects to populate your initial diagnostic matrix.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_SUBJECTS.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubject(sub.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-2xl">{sub.icon}</span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{sub.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                        <p className="text-[11px] text-slate-400">{sub.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Goals & Socratic Tutor Settings */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Pace & Socratic Guidance
                </h3>
                <p className="text-xs text-slate-500">
                  Configure your daily pacing and how aggressively Copilot challenges your reasoning.
                </p>
              </div>

              {/* Study Time Slider */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Daily Targeted Study Session
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {preferredStudyTime} mins / day
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={120}
                  step={15}
                  value={preferredStudyTime}
                  onChange={(e) => setPreferredStudyTime(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Socratic Guidance Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Copilot Socratic Inquiry Depth
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['high', 'medium', 'low'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSocraticLevel(lvl)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        socraticLevel === lvl
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {lvl === 'high' ? 'First Principles' : lvl === 'medium' ? 'Balanced' : 'Direct'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Goals List */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Custom Learning Goals
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="e.g. Master Linear Operators & Hilbert Spaces"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                  />
                  <Button variant="outline" size="sm" onClick={handleAddGoal}>
                    Add
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {learningGoals.map((goal, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-between"
                    >
                      <span>{goal}</span>
                      <button
                        onClick={() => handleRemoveGoal(idx)}
                        className="text-slate-400 hover:text-rose-500 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                Previous Step
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => setCurrentStep((prev) => prev + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                disabled={isSubmitting}
                rightIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={handleComplete}
              >
                {isSubmitting ? 'Finalizing...' : 'Launch Learn.co Workspace'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
