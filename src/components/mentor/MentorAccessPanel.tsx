import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  GraduationCap,
  Send,
  AlertCircle,
  XCircle,
  Mail,
  Database as DatabaseIcon,
} from 'lucide-react';
import { UserProfile, SubjectId } from '../../types';
import { MentorApplicationRecord } from '../../types/mentorship';
import { MentorshipClient } from '../../services/mentorshipClient';
import { OwnerMentorApplicationsQueue } from './OwnerMentorApplicationsQueue';

interface MentorAccessPanelProps {
  user: UserProfile;
  isMentor: boolean;
  isOwnerOrAdmin: boolean;
  onApplicationsChanged?: () => Promise<void> | void;
  onOpenPortal: () => void;
}

export const MentorAccessPanel: React.FC<MentorAccessPanelProps> = ({
  user,
  isMentor,
  isOwnerOrAdmin,
  onApplicationsChanged,
  onOpenPortal,
}) => {
  // Application Form State — clean inputs without hardcoded fake school credentials
  const [fullName, setFullName] = useState(user.fullName || user.displayName || '');
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [subject, setSubject] = useState<SubjectId>('math');
  const [experienceYears, setExperienceYears] = useState('2');
  const [bio, setBio] = useState('');
  const [capacity, setCapacity] = useState('5');
  const [hourlyRate, setHourlyRate] = useState('0');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitBanner, setSubmitBanner] = useState<string | null>(null);

  const [myApplications, setMyApplications] = useState<MentorApplicationRecord[]>([]);
  const [isLoadingMine, setIsLoadingMine] = useState(true);
  const [routedToEmail, setRoutedToEmail] = useState('yamsaniruhan@gmail.com');

  useEffect(() => {
    if (user.fullName && !fullName) {
      setFullName(user.fullName);
    }
  }, [user.fullName]);

  const loadMyApplications = useCallback(async () => {
    setIsLoadingMine(true);
    try {
      const data = await MentorshipClient.getMyMentorApplications();
      setMyApplications(data.applications);
      if (data.routedToEmail) setRoutedToEmail(data.routedToEmail);
    } catch (err) {
      console.debug('Could not load applicant history:', err);
    } finally {
      setIsLoadingMine(false);
    }
  }, []);

  useEffect(() => {
    loadMyApplications();
  }, [loadMyApplications, user.id]);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitBanner(null);

    const cleanName = fullName.trim();
    const cleanDegree = degree.trim();
    const cleanInstitution = institution.trim();
    const cleanBio = bio.trim();

    if (cleanName.length < 2) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (cleanDegree.length < 2) {
      setSubmitError('Please enter your academic degree or certification.');
      return;
    }
    if (cleanInstitution.length < 2) {
      setSubmitError('Please enter your current affiliation or university.');
      return;
    }
    if (cleanBio.length < 15) {
      setSubmitError('Please write a brief mentorship statement (at least 15 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await MentorshipClient.submitMentorApplication({
        fullName: cleanName,
        degree: cleanDegree,
        institution: cleanInstitution,
        subjectId: subject,
        experienceYears: Math.max(0, parseInt(experienceYears, 10) || 0),
        capacity: Math.max(1, parseInt(capacity, 10) || 5),
        hourlyRate: Math.max(0, parseFloat(hourlyRate) || 0),
        bio: cleanBio,
      });

      setMyApplications((prev) => [res.application, ...prev]);
      setRoutedToEmail(res.routedToEmail);
      setSubmitBanner(
        `Application ${res.application.id} saved permanently to PostgreSQL and sent directly to ${res.routedToEmail} for review.`
      );
      setDegree('');
      setInstitution('');
      setBio('');
      if (onApplicationsChanged) {
        await onApplicationsChanged();
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit mentor application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const latestApplication = myApplications[0] || null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-emerald-900/40 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mentor Accreditation</span>
            </span>
            {isOwnerOrAdmin ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500 text-white">
                Platform Owner / Reviewer
              </span>
            ) : isMentor ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white">
                Status: Accredited Mentor
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700 text-slate-300">
                Status: Learner Account
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isOwnerOrAdmin
              ? 'Mentor Applications & Owner Review'
              : 'Mentor Accreditation & Application'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isOwnerOrAdmin
              ? `All mentor applications submitted across Learn.co are saved in PostgreSQL & Firestore and routed directly to ${routedToEmail} for approval.`
              : `Apply to join the Learn.co accredited mentor roster. Your application is saved permanently and delivered directly to ${routedToEmail} for review.`}
          </p>
        </div>

        {(isMentor || isOwnerOrAdmin) && (
          <button
            type="button"
            onClick={onOpenPortal}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Open Educator Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Owner / Admin Live Review Queue (visible ONLY to yamsaniruhan@gmail.com / admin) */}
      {isOwnerOrAdmin && (
        <OwnerMentorApplicationsQueue onApplicationDecided={onApplicationsChanged} />
      )}

      {/* 3. Applicant's Submitted Application Status Tracker */}
      {!isLoadingMine && myApplications.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DatabaseIcon className="w-4 h-4 text-indigo-500" />
                <span>Your Submitted Mentor Applications ({myApplications.length})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sent directly to <strong>{routedToEmail}</strong> for accreditation review.
              </p>
            </div>
            {latestApplication?.status === 'APPROVED' && (
              <button
                type="button"
                onClick={onOpenPortal}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Open Educator Portal
              </button>
            )}
          </div>

          <div className="space-y-3">
            {myApplications.map((app) => (
              <div
                key={app.id}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  app.status === 'APPROVED'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : app.status === 'REJECTED'
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                    : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    {app.status === 'PENDING' && <Clock className="w-4 h-4 text-amber-500" />}
                    {app.status === 'APPROVED' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {app.status === 'REJECTED' && <XCircle className="w-4 h-4 text-rose-500" />}
                    <span>
                      {app.degree} — {app.institution} ({app.subjectId.toUpperCase()})
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      app.status === 'APPROVED'
                        ? 'bg-emerald-600 text-white'
                        : app.status === 'REJECTED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {app.status === 'PENDING' ? 'Pending Owner Review' : app.status}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{app.bio}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>
                    Submitted {new Date(app.submittedAt).toLocaleString()} • Sent to {app.routedToEmail}
                  </span>
                  {app.reviewerNote && (
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Reviewer Note: "{app.reviewerNote}"
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Formal Mentor Application Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <span>Formal Mentor Application Form</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Complete your credentials and teaching statement below. Submissions are stored in PostgreSQL and delivered directly to{' '}
              <strong className="text-slate-700 dark:text-slate-300">{routedToEmail}</strong>.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            <Mail className="w-3.5 h-3.5 text-emerald-500" />
            <span>Direct Recipient: {routedToEmail}</span>
          </div>
        </div>

        {submitBanner && (
          <div className="p-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{submitBanner}</span>
          </div>
        )}

        {submitError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitApplication} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Legal Name / Professional Title
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="e.g. Dr. Jane Doe"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Primary Subject Specialization
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectId)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="math">Mathematics (Pure & Applied)</option>
                <option value="physics">Physics & Dynamics</option>
                <option value="cs">Computer Science & AI</option>
                <option value="chemistry">Chemistry & Thermodynamics</option>
                <option value="biology">Biology & Systems Genetics</option>
                <option value="data_science">Data Science & Statistics</option>
                <option value="english">Academic Writing & Rhetoric</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Academic Degree & Credentials
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                required
                placeholder="e.g. M.Sc in Applied Mathematics"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Current Affiliation / University
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
                placeholder="e.g. University or Research Institute"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Years of STEM Tutoring / Mentoring
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mentee Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hourly Rate ($0 = Free)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mentorship Statement & Teaching Methodology
            </label>
            <textarea
              rows={3}
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your pedagogical approach, experience with competitive exams, or research background..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Submitting as <strong>{user.email}</strong>
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting Application...' : 'Submit Application to Owner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
