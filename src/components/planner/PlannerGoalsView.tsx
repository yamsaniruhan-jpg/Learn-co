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
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-[#6C5CE7] dark:text-[#A99DF5]" />
            <h3 className="font-bold text-[#2D2A4A] dark:text-[#F1EFFF] text-base">Milestone Goals &amp; Exam Targets</h3>
          </div>
          <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
            Define high-impact milestones. Your study plan automatically tracks completion
            percentages from scheduled tasks.
          </p>
        </div>

        <button
          id="btn-create-goal"
          onClick={openCreateModal}
          className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Goal
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-6 h-6" />}
          title="No milestone goals yet"
          description="Set an exam or mastery milestone to track long-term progress alongside daily tasks."
          action={
            <Button variant="primary" size="md" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
              Create Goal
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const daysLeft = Math.ceil(
              (new Date(g.deadline).getTime() - new Date().getTime()) / 86400000
            );

            return (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7]/40 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#6C5CE7]/12 text-[#6C5CE7] dark:text-[#A99DF5]">
                        {g.targetExam || 'STEM Mastery'}
                      </span>
                      <h4 className="text-base font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mt-1.5">{g.title}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(g)}
                        aria-label="Edit goal"
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] rounded-xl cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(g.id)}
                        aria-label="Delete goal"
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6890] dark:text-[#B4B0D5] hover:text-rose-600 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {g.description && (
                    <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-2 line-clamp-2">{g.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {g.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#E3DFF5] dark:border-[#3D3861] uppercase"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E3DFF5] dark:border-[#3D3861]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#6B6890] dark:text-[#B4B0D5]">Target Progress</span>
                    <span className="font-bold text-[#6C5CE7] dark:text-[#A99DF5]">{g.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-[#E3DFF5] dark:bg-[#3D3861] h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-[#6C5CE7] h-full rounded-full transition-all duration-500"
                      style={{ width: `${g.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                    <span>Deadline: {g.deadline}</span>
                    <span className={daysLeft < 7 ? 'text-[#D98200] dark:text-[#FFB84D] font-semibold' : ''}>
                      {daysLeft > 0 ? `${daysLeft} days remaining` : 'Target reached'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A4A]/80 dark:bg-[#100E1C]/90">
          <div className="relative w-full max-w-md bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-3xl shadow-[0_12px_36px_rgba(45,42,74,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] p-6 text-[#2D2A4A] dark:text-[#F1EFFF]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DFF5] dark:border-[#3D3861]">
              <h3 className="font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] text-base">
                {editingGoal ? 'Edit Milestone Goal' : 'Create Milestone Goal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close goal modal"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1.5">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Multivariable Calculus & Linear Algebra"
                  className="w-full min-h-[44px] px-3 py-2 bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1.5">
                    Target Exam / Focus
                  </label>
                  <input
                    type="text"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    placeholder="e.g. JEE Advanced"
                    className="w-full min-h-[44px] px-3 py-2 bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1.5">
                    Target Score / Grade
                  </label>
                  <input
                    type="text"
                    value={targetScore}
                    onChange={(e) => setTargetScore(e.target.value)}
                    placeholder="e.g. 95% / 5.0"
                    className="w-full min-h-[44px] px-3 py-2 bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1.5">
                  Target Deadline
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1.5">
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
                        className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6C5CE7] text-white border-[#6C5CE7]'
                            : 'bg-[#F7F5FF] dark:bg-[#1E1B33] border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5]'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key milestones, textbook chapters, or target mastery areas..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E3DFF5] dark:border-[#3D3861]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] px-5 py-2 text-xs font-semibold bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white rounded-xl shadow-sm transition-all cursor-pointer"
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
