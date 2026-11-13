import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Mail,
  GraduationCap,
  Building2,
  Users,
  AlertCircle,
  Sparkles,
  Database as DatabaseIcon,
} from 'lucide-react';
import { MentorApplicationRecord, MentorApplicationStatus } from '../../types/mentorship';
import { MentorshipClient } from '../../services/mentorshipClient';
import { Button } from '../ui/Button';

interface OwnerMentorApplicationsQueueProps {
  onApplicationDecided?: () => Promise<void> | void;
  compact?: boolean;
}

export const OwnerMentorApplicationsQueue: React.FC<OwnerMentorApplicationsQueueProps> = ({
  onApplicationDecided,
  compact = false,
}) => {
  const [applications, setApplications] = useState<MentorApplicationRecord[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [routedToEmail, setRoutedToEmail] = useState('yamsaniruhan@gmail.com');
  const [storageMode, setStorageMode] = useState<string>('postgresql');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | MentorApplicationStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notesByAppId, setNotesByAppId] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await MentorshipClient.getAllMentorApplications();
      setApplications(data.applications);
      setCounts(data.counts);
      setRoutedToEmail(data.routedToEmail || 'yamsaniruhan@gmail.com');
      if (data.storage) setStorageMode(data.storage);
    } catch (err: any) {
      setError(err?.message || 'Unable to load mentor applications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleDecision = async (appId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingId(appId);
    setError(null);
    try {
      const note = notesByAppId[appId]?.trim() || undefined;
      const result = await MentorshipClient.decideMentorApplication(appId, action, note);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? result.application : a))
      );
      setCounts((prev) => {
        const nextList = applications.map((a) => (a.id === appId ? result.application : a));
        return {
          total: nextList.length,
          pending: nextList.filter((a) => a.status === 'PENDING').length,
          approved: nextList.filter((a) => a.status === 'APPROVED').length,
          rejected: nextList.filter((a) => a.status === 'REJECTED').length,
        };
      });
      setFeedbackBanner(
        action === 'APPROVE'
          ? `Approved ${result.application.fullName} (${result.application.applicantEmail}). Mentor profile is now live in Discover Mentors.`
          : `Declined application from ${result.application.fullName}.`
      );
      setTimeout(() => setFeedbackBanner(null), 5000);
      if (onApplicationDecided) {
        await onApplicationDecided();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to record decision.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matches =
          app.fullName.toLowerCase().includes(q) ||
          app.applicantEmail.toLowerCase().includes(q) ||
          app.institution.toLowerCase().includes(q) ||
          app.degree.toLowerCase().includes(q) ||
          app.subjectId.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [applications, statusFilter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs ${compact ? 'p-5' : 'p-6'} space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Owner Review Queue</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                <DatabaseIcon className="w-3 h-3" />
                <span>{storageMode === 'postgresql' ? 'PostgreSQL + Firestore Synced' : 'Persistent Store'}</span>
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Submitted Mentor Applications
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every formal mentor application is routed directly to{' '}
              <strong className="text-slate-800 dark:text-slate-200">{routedToEmail}</strong>{' '}
              and stored permanently for review.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadApplications}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh List
          </Button>
        </div>

        {/* Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Applications
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{counts.total}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
              Pending Review
            </span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300">{counts.pending}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              Approved Mentors
            </span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{counts.approved}</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
              Declined
            </span>
            <span className="text-xl font-black text-rose-700 dark:text-rose-300">{counts.rejected}</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {status === 'ALL'
                  ? `All (${counts.total})`
                  : status === 'PENDING'
                  ? `Pending (${counts.pending})`
                  : status === 'APPROVED'
                  ? `Approved (${counts.approved})`
                  : `Declined (${counts.rejected})`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, degree..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {feedbackBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Applications List */}
      {isLoading ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          Loading mentor applications from PostgreSQL...
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Matching Mentor Applications
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {applications.length === 0
              ? 'When a user submits the Formal Mentor Application form, their complete profile will appear here immediately.'
              : 'Try adjusting your status filter or search query.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs space-y-4 ${
                app.status === 'PENDING'
                  ? 'border-amber-300/80 dark:border-amber-800/70'
                  : app.status === 'APPROVED'
                  ? 'border-emerald-300/80 dark:border-emerald-800/70'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      {app.fullName}
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        app.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : app.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {app.status === 'PENDING' && <Clock className="w-3 h-3" />}
                      {app.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                      {app.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                      <span>{app.status}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      {app.subjectId}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" />
                      {app.applicantEmail}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                      {app.degree}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {app.institution}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] text-slate-400 shrink-0 space-y-0.5">
                  <div>Submitted {new Date(app.submittedAt).toLocaleString()}</div>
                  <div className="font-mono text-[10px]">ID: {app.id}</div>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Experience</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {app.experienceYears} {app.experienceYears === 1 ? 'Year' : 'Years'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Mentee Capacity</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-500" />
                    {app.capacity} concurrent
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Pricing Tier</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {app.hourlyRate > 0 ? `$${app.hourlyRate}/hr` : 'Free Community'}
                  </span>
                </div>
              </div>

              {/* Statement */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Mentorship Statement
                </span>
                {app.bio}
              </div>

              {/* Decision Controls / Review Audit */}
              {app.status === 'PENDING' ? (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="text"
                    value={notesByAppId[app.id] || ''}
                    onChange={(e) =>
                      setNotesByAppId((prev) => ({ ...prev, [app.id]: e.target.value }))
                    }
                    placeholder="Optional reviewer note for the applicant..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={processingId === app.id}
                      onClick={() => handleDecision(app.id, 'REJECT')}
                      className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={processingId === app.id}
                      onClick={() => handleDecision(app.id, 'APPROVE')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {processingId === app.id ? 'Saving...' : 'Approve & Make Mentor'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div>
                    Reviewed by <strong>{app.reviewerEmail || routedToEmail}</strong>
                    {app.reviewedAt ? ` on ${new Date(app.reviewedAt).toLocaleString()}` : ''}
                    {app.reviewerNote ? ` — "${app.reviewerNote}"` : ''}
                  </div>
                  {app.status === 'REJECTED' && (
                    <button
                      type="button"
                      disabled={processingId === app.id}
                      onClick={() => handleDecision(app.id, 'APPROVE')}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Reconsider & Approve
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
