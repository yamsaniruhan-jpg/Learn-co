import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Edit2,
  Calendar,
  Clock,
  BookOpen,
  Tag,
  Flame,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { SubjectId } from '../../types/curriculum';
import { StudyTask, StudyTaskType, StudyTaskPriority } from '../../types/planner';

interface TaskModalProps {
  task: StudyTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<StudyTask>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

const TASK_TYPES: { id: StudyTaskType; label: string; icon: string }[] = [
  { id: 'LEARN_CONCEPT', label: 'Concept Learning', icon: '📖' },
  { id: 'PRACTICE_QUESTIONS', label: 'Practice Questions', icon: '✍️' },
  { id: 'REVIEW_MISTAKES', label: 'Review Mistakes', icon: '🩺' },
  { id: 'REVISION', label: 'Spaced Revision', icon: '🔄' },
  { id: 'FLASHCARDS', label: 'Flashcards Review', icon: '🃏' },
  { id: 'QUIZ', label: 'Diagnostic Quiz', icon: '⚡' },
  { id: 'WORKSHEET', label: 'Derivation Worksheet', icon: '📝' },
  { id: 'MIND_MAP', label: 'Concept Mind Map', icon: '🧠' },
];

const SUBJECTS: { id: SubjectId; name: string }[] = [
  { id: 'math', name: 'Mathematics' },
  { id: 'cs', name: 'Computer Science' },
  { id: 'physics', name: 'Physics' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'biology', name: 'Biology' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<StudyTaskType>('LEARN_CONCEPT');
  const [subjectId, setSubjectId] = useState<SubjectId>('math');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState('17:30');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(45);
  const [priority, setPriority] = useState<StudyTaskPriority>('NORMAL');
  const [practiceQuestionCount, setPracticeQuestionCount] = useState<number>(0);
  const [conceptTitle, setConceptTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setTaskType(task.taskType);
      setSubjectId(task.subjectId);
      setScheduledDate(task.scheduledDate);
      setScheduledStartTime(task.scheduledStartTime || '17:30');
      setEstimatedDurationMinutes(task.estimatedDurationMinutes || 45);
      setPriority(task.priority);
      setPracticeQuestionCount(task.practiceQuestionCount || 0);
      setConceptTitle(task.conceptTitle || '');
    } else {
      setTitle('');
      setDescription('');
      setTaskType('LEARN_CONCEPT');
      setSubjectId('math');
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setScheduledStartTime('17:30');
      setEstimatedDurationMinutes(45);
      setPriority('NORMAL');
      setPracticeQuestionCount(0);
      setConceptTitle('');
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const [h, m] = scheduledStartTime.split(':').map(Number);
      const totalM = h * 60 + m + estimatedDurationMinutes;
      const scheduledEndTime = `${String(Math.floor(totalM / 60) % 24).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;

      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        taskType,
        subjectId,
        scheduledDate,
        scheduledStartTime,
        scheduledEndTime,
        estimatedDurationMinutes,
        priority,
        practiceQuestionCount: practiceQuestionCount > 0 ? practiceQuestionCount : undefined,
        conceptTitle: conceptTitle.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <h3 className="font-semibold text-slate-100 text-base">
              {task ? 'Edit Study Task' : 'Create New Study Task'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Task Title *
              </label>
              <input
                id="input-task-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Chain Rule Proof & Derivations"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Subject
                </label>
                <select
                  id="select-task-subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value as SubjectId)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Task Category
                </label>
                <select
                  id="select-task-type"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as StudyTaskType)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Scheduled Date
                </label>
                <input
                  id="input-task-date"
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Start Time
                </label>
                <input
                  id="input-task-time"
                  type="time"
                  value={scheduledStartTime}
                  onChange={(e) => setScheduledStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Duration (mins)
                </label>
                <select
                  id="select-task-duration"
                  value={estimatedDurationMinutes}
                  onChange={(e) => setEstimatedDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value={20}>20 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                  <option value={90}>90 mins</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Priority
                </label>
                <div className="flex gap-1.5">
                  {(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as StudyTaskPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                        priority === p
                          ? p === 'CRITICAL'
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : p === 'HIGH'
                              ? 'bg-amber-600 border-amber-500 text-white'
                              : 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Practice Questions (Optional)
                </label>
                <input
                  id="input-task-practice-count"
                  type="number"
                  min="0"
                  max="10"
                  value={practiceQuestionCount}
                  onChange={(e) => setPracticeQuestionCount(Number(e.target.value))}
                  placeholder="0 (max 10 questions/task)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description & Invariant Checknotes
              </label>
              <textarea
                id="input-task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key concepts to review, derivation goals, or textbook problems..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {task && onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete Task
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-study-task"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> {task ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
