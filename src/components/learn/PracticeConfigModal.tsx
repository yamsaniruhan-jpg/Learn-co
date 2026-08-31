import React, { useState } from 'react';
import { PracticeSessionConfig, QuestionTypeId, SubjectId } from '../../types/curriculum';
import { Zap, Clock, ShieldCheck, X, CheckSquare, Sparkles } from 'lucide-react';

interface PracticeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: PracticeSessionConfig) => void;
  initialSubjectId?: SubjectId;
  initialTopicId?: string;
  initialConceptId?: string;
  initialTitle?: string;
  dailyQuotaRemaining: number;
}

export const PracticeConfigModal: React.FC<PracticeConfigModalProps> = ({
  isOpen,
  onClose,
  onStart,
  initialSubjectId = 'math',
  initialTopicId,
  initialConceptId,
  initialTitle,
  dailyQuotaRemaining,
}) => {
  const [sessionTitle, setSessionTitle] = useState(initialTitle || 'Calibrated 5-Question Ladder');
  const [difficultyMode, setDifficultyMode] = useState<'calibrated_ladder' | 'easy' | 'medium' | 'hard'>('calibrated_ladder');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isTimed, setIsTimed] = useState<boolean>(false);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(90);
  const [selectedTypes, setSelectedTypes] = useState<QuestionTypeId[]>([
    'single_choice',
    'multiple_choice',
    'numerical',
    'true_false',
    'assertion_reason',
    'code_output',
  ]);

  if (!isOpen) return null;

  const toggleType = (t: QuestionTypeId) => {
    if (selectedTypes.includes(t)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((x) => x !== t));
      }
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
  };

  const handleLaunch = () => {
    onStart({
      sessionTitle,
      subjectId: initialSubjectId,
      topicId: initialTopicId,
      conceptId: initialConceptId,
      difficultyMode,
      questionCount,
      timed: isTimed,
      timeLimitSeconds: isTimed ? timePerQuestion * questionCount : undefined,
      questionTypes: selectedTypes,
      mode: 'standard',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Zap className="w-5 h-5 fill-current text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Configure Practice Session</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tailor your problem ladder & constraints</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Daily Quota Notice */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Daily Limit Quota:</span>
          </div>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {dailyQuotaRemaining} / 25 remaining today
          </span>
        </div>

        {/* Difficulty Progression Mode */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Difficulty Archetype</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDifficultyMode('calibrated_ladder')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                difficultyMode === 'calibrated_ladder'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Calibrated Ladder</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                5 ascending questions (Easy → Easy/Med → Med → Med/Hard → Hard).
              </p>
            </button>

            <button
              onClick={() => setDifficultyMode('medium')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                difficultyMode === 'medium'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="font-bold text-xs mb-1">Standard Medium</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Balanced core exam-level questions.
              </p>
            </button>
          </div>
        </div>

        {/* Timed Drill Mode */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-500" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Timed Exam Simulation</div>
              <div className="text-[11px] text-slate-500">Live countdown with pace pacing indicators</div>
            </div>
          </div>
          <button
            onClick={() => setIsTimed(!isTimed)}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
              isTimed ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                isTimed ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Question Types Included */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Allowed Question Formats
          </label>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { id: 'single_choice', label: 'Single Choice MCQ' },
              { id: 'multiple_choice', label: 'Multi-Correct MCQ' },
              { id: 'numerical', label: 'Numerical Value Input' },
              { id: 'assertion_reason', label: 'Assertion & Reasoning' },
              { id: 'true_false', label: 'Conceptual True/False' },
              { id: 'code_output', label: 'Python / Code Output' },
            ].map((type) => {
              const isChecked = selectedTypes.includes(type.id as QuestionTypeId);
              return (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.id as QuestionTypeId)}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between text-[11px] transition-colors cursor-pointer ${
                    isChecked
                      ? 'border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <span>{type.label}</span>
                  {isChecked && <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            disabled={dailyQuotaRemaining <= 0}
            className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current text-amber-300" />
            <span>Launch {questionCount}-Question Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
