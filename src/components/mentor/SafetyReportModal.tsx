import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface SafetyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserName: string;
  reportedUserId: string;
  mentorshipId?: string;
  onSubmitReport: (data: {
    reportedUserId: string;
    mentorshipId?: string;
    reason: string;
    details: string;
  }) => Promise<void>;
}

export const SafetyReportModal: React.FC<SafetyReportModalProps> = ({
  isOpen,
  onClose,
  reportedUserName,
  reportedUserId,
  mentorshipId,
  onSubmitReport,
}) => {
  const [reason, setReason] = useState<string>('inappropriate_conduct');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setError('Please provide specific details regarding this report.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmitReport({
        reportedUserId,
        mentorshipId,
        reason,
        details,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="modal-safety-report"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-rose-500/5 dark:bg-rose-950/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Safety & Conduct Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confidential report regarding {reportedUserName}
              </p>
            </div>
          </div>

          <button
            id="btn-close-report-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {submitted ? (
            <div className="p-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Report Submitted Confidentially
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Our safety and moderation team will review the logs immediately.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs border border-rose-500/20">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Report
                </label>
                <select
                  id="select-report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                >
                  <option value="inappropriate_conduct">Inappropriate Conduct or Language</option>
                  <option value="harassment">Harassment or Intimidation</option>
                  <option value="unsolicited_off_platform">Unsolicited Off-Platform Requests or Solicitations</option>
                  <option value="spam_abuse">Spam or Non-Academic Misuse</option>
                  <option value="other">Other Safety Concern</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Incident Description & Context
                </label>
                <textarea
                  id="textarea-report-details"
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe what occurred, including relevant session or message timestamps..."
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  All reports are encrypted and strictly reviewed by Learn.co trust & safety administrators. The reported user will not be informed of your identity.
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <Button
            id="btn-cancel-report"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>

          {!submitted && (
            <Button
              id="btn-submit-safety-report"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-500 text-white"
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Confidential Report'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
