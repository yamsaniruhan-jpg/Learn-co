import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import { MentorshipPrivacySettings } from '../../types/mentorship';
import { Button } from '../ui/Button';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorName: string;
  currentSettings: MentorshipPrivacySettings;
  onSave: (newSettings: Partial<MentorshipPrivacySettings>) => Promise<void>;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  isOpen,
  onClose,
  mentorName,
  currentSettings,
  onSave,
}) => {
  const [settings, setSettings] = useState<MentorshipPrivacySettings>(currentSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key: keyof MentorshipPrivacySettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const privacyOptions = [
    {
      key: 'shareMasteryProgress' as const,
      title: 'Concept Masteries & Retention Scores',
      description: `Allows ${mentorName} to see your Ebbinghaus retention percentages and strong vs weak concept breakdown in the curriculum.`,
      category: 'Recommended for effective pedagogical guidance',
      isSensitive: false,
    },
    {
      key: 'sharePracticeActivity' as const,
      title: 'Practice Activity & Daily Accuracy',
      description: `Shares your question attempt volume, practice streak, and diagnostic accuracy trends across topics.`,
      category: 'Recommended for study schedule planning',
      isSensitive: false,
    },
    {
      key: 'shareMistakesAndMisconceptions' as const,
      title: 'Diagnostic Mistake Records & Invariant Gaps',
      description: `Allows ${mentorName} to review specific missed questions and identified misconceptions (e.g. SN2 inversion traps) to prepare 1-on-1 sessions.`,
      category: 'High-yield for targeted 1-on-1 coaching',
      isSensitive: false,
    },
    {
      key: 'shareActiveGoals' as const,
      title: 'Active Study Goals & Milestones',
      description: `Allows ${mentorName} to view and track progress on shared exam targets and target completion dates.`,
      category: 'Collaboration alignment',
      isSensitive: false,
    },
    {
      key: 'shareCreatorStudioNotebooks' as const,
      title: 'Private Creator Studio Notes & Sources',
      description: `Grants ${mentorName} read access to your draft summaries and personal notes created in Creator Studio. Default is OFF.`,
      category: 'Private content',
      isSensitive: true,
    },
    {
      key: 'shareCopilotSessions' as const,
      title: 'Private Omni Copilot Chat Logs',
      description: `Grants access to your full AI chat transcripts. Learn.co keeps Copilot conversations strictly private by default.`,
      category: 'Strictly private by default',
      isSensitive: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="modal-privacy-settings"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Mentorship Privacy Controls
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage data sharing permissions for your relationship with {mentorName}
              </p>
            </div>
          </div>

          <button
            id="btn-close-privacy-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Toggles */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              You maintain full sovereignty over your learning data. Changing permissions takes effect immediately and restricts what {mentorName} can access during sessions.
            </span>
          </div>

          <div className="space-y-3">
            {privacyOptions.map((opt) => {
              const enabled = settings[opt.key];
              return (
                <div
                  key={opt.key}
                  id={`privacy-row-${opt.key}`}
                  className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    enabled
                      ? 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-950/10'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {opt.title}
                      </span>
                      {opt.isSensitive ? (
                        <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold px-1.5 py-0.2 rounded">
                          Strictly Private
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-1.5 py-0.2 rounded">
                          Learning Insight
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    id={`toggle-${opt.key}`}
                    onClick={() => handleToggle(opt.key)}
                    className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                      enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <Button
            id="btn-cancel-privacy"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            id="btn-save-privacy"
            variant="primary"
            size="sm"
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
            onClick={handleSave}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : isSaving ? (
              <span>Saving Changes...</span>
            ) : (
              <span>Save Privacy Settings</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
