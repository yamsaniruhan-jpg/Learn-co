import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  Award,
  Sparkles,
  Layers,
} from 'lucide-react';
import { StudyGoal } from '../../types/planner';
import { SubjectId } from '../../types/curriculum';

interface PlannerGoalsViewProps {
  goals: StudyGoal[];
  onSaveGoal: (goalData: Partial<StudyGoal>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

const ALL_SUBJECTS: { id: SubjectId; name: string }[] = [
  { id: 'math', name: 'Mathematics' },
  { id: 'cs', name: 'Computer Science' },
  { id: 'physics', name: 'Physics' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'biology', name: 'Biology' },
];

export const PlannerGoalsView: React.FC<PlannerGoalsViewProps> = ({
  goals,
  onSaveGoal,
  onDeleteGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<StudyGoal | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetExam, setTargetExam] = useState('Advanced STEM Mastery');
  const [targetScore, setTargetScore] = useState('95%');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectId[]>(['math', 'cs']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setTargetExam('Advanced STEM Mastery');
    setTargetScore('95%');
    setDeadline(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setSelectedSubjects(['math', 'cs']);
    setIsModalOpen(true);
  };

  const openEditModal = (g: StudyGoal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setDescription(g.description || '');
    setTargetExam(g.targetExam || 'Advanced STEM Mastery');
    setTargetScore(g.targetScore || '95%');
    setDeadline(g.deadline);
    setSelectedSubjects(g.subjects);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSaveGoal({
        id: editingGoal ? editingGoal.id : undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        targetExam,
        targetScore,
        deadline,
        subjects: selectedSubjects,
      });
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSubject = (sub: SubjectId) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Milestone Goals & Exam Targets</h3>
          </div>
          <p className="text-xs text-slate-400">
            Define high-impact milestones. Your study plan automatically tracks completion
            percentages from scheduled tasks.
          </p>
        </div>

        <button
          id="btn-create-goal"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-900/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Goal
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const daysLeft = Math.ceil(
            (new Date(g.deadline).getTime() - new Date().getTime()) / 86400000
          );

          return (
            <div
              key={g.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {g.targetExam || 'STEM Mastery'}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1.5">{g.title}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(g.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {g.description && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{g.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {g.subjects.map((sub) => (
                    <span
                      key={sub}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 uppercase"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Target Progress</span>
                  <span className="font-bold text-indigo-400">{g.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${g.progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>📅 Deadline: {g.deadline}</span>
                  <span className={daysLeft < 7 ? 'text-amber-400 font-semibold' : ''}>
                    {daysLeft > 0 ? `${daysLeft} days remaining` : 'Target reached'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-white text-base">
                {editingGoal ? 'Edit Milestone Goal' : 'Create Milestone Goal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Multivariable Calculus & Linear Algebra"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Exam / Focus
                  </label>
                  <input
                    type="text"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    placeholder="e.g. JEE Advanced"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Score / Grade
                  </label>
                  <input
                    type="text"
                    value={targetScore}
                    onChange={(e) => setTargetScore(e.target.value)}
                    placeholder="e.g. 95% / 5.0"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Deadline
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Associated Subjects
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SUBJECTS.map((sub) => {
                    const isSelected = selectedSubjects.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => toggleSubject(sub.id)}
                        className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key milestones, textbook chapters, or target mastery areas..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all"
                >
                  {editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
