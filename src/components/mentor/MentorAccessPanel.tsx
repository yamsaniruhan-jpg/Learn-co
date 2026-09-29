import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  UserCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Send,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { UserProfile, SubjectId } from '../../types';
import { MentorProfile } from '../../types/mentorship';

export interface MentorApplicationData {
  name: string;
  education: string;
  subjects: SubjectId[];
  bio: string;
  teachingExperienceYears: number;
}

interface MentorAccessPanelProps {
  user: UserProfile;
  isMentor: boolean;
  onGrantMentorAccess: (mentorProfileData?: Partial<MentorApplicationData>) => Promise<void>;
  onRevokeMentorAccess?: () => Promise<void>;
  onOpenPortal: () => void;
}

export const MentorAccessPanel: React.FC<MentorAccessPanelProps> = ({
  user,
  isMentor,
  onGrantMentorAccess,
  onRevokeMentorAccess,
  onOpenPortal,
}) => {
  // Application Form State
  const [fullName, setFullName] = useState(user.fullName || user.displayName || '');
  const [institution, setInstitution] = useState('Stanford University / MIT OCW Alum');
  const [degree, setDegree] = useState('M.Sc in Applied Mathematics & Computing');
  const [subject, setSubject] = useState<SubjectId>('math');
  const [experienceYears, setExperienceYears] = useState('4');
  const [bio, setBio] = useState(
    'Passionate about Socratic problem solving, first-principles derivations, and preparing students for competitive STEM exams.'
  );
  const [capacity, setCapacity] = useState('5');
  const [hourlyRate, setHourlyRate] = useState('0'); // Free / Community by default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [pendingApplication, setPendingApplication] = useState<{
    submittedAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  } | null>(null);

  // Check stored application status from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`learnco_mentor_app_${user.userId}`);
      if (stored) {
        setPendingApplication(JSON.parse(stored));
      }
    } catch (_) {}
  }, [user.userId]);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const appRecord = {
        submittedAt: new Date().toISOString(),
        status: 'PENDING' as const,
        fullName,
        institution,
        degree,
        subject,
        experienceYears,
        bio,
      };

      localStorage.setItem(`learnco_mentor_app_${user.userId}`, JSON.stringify(appRecord));
      setPendingApplication(appRecord);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to submit application', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantGrant = async () => {
    setIsSubmitting(true);
    try {
      await onGrantMentorAccess({
        name: fullName || user.fullName || 'Accredited STEM Mentor',
        education: `${degree}, ${institution}`,
        subjects: [subject],
        bio,
        teachingExperienceYears: parseInt(experienceYears, 10) || 3,
      });

      const approvedRecord = {
        submittedAt: new Date().toISOString(),
        status: 'APPROVED' as const,
      };
      localStorage.setItem(`learnco_mentor_app_${user.userId}`, JSON.stringify(approvedRecord));
      setPendingApplication(approvedRecord);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-emerald-900/40 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mentor Access Control</span>
            </span>
            {isMentor ? (
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
            Mentor Accreditation & Permissions
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Personal mentors guide students through 1-on-1 sessions, assign custom goals, and analyze cognitive retention curves. Request mentor privileges or grant instant access below.
          </p>
        </div>

        {isMentor && (
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

      {/* 2. Instant Access Grant Panel (Admin / Peer Accreditation) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Instant Mentor Credential Grant</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enable full educator capabilities immediately. This grants access to the Educator Portal, allows you to accept mentee study requests, and publishes your profile in Discover Mentors.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isMentor ? (
              <button
                type="button"
                onClick={onRevokeMentorAccess}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all cursor-pointer"
              >
                Revoke Mentor Status
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstantGrant}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Grant 1-Click Mentor Access</span>
              </button>
            )}
          </div>
        </div>

        {isMentor && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Your account currently possesses full Mentor credentials. You can view student inquiries, schedule live study rooms, and review learner diagnostics in the <strong>Educator Portal</strong> tab.
            </span>
          </div>
        )}
      </div>

      {/* 3. Formal Mentor Application Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <span>Formal Mentor Application & Verification</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Submit your background, teaching philosophy, and subject specialization for community review.
          </p>
        </div>

        {submitSuccess && (
          <div className="p-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Application submitted successfully! Your application is under review.</span>
          </div>
        )}

        {pendingApplication && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Application Status:
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  pendingApplication.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                }`}
              >
                {pendingApplication.status === 'APPROVED' ? 'Approved & Active' : 'Under Review'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Submitted on: {new Date(pendingApplication.submittedAt).toLocaleDateString()}
            </p>
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
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Academic Degree & Institution
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                required
                placeholder="e.g. Ph.D in Theoretical Physics, Cambridge"
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
                placeholder="e.g. MIT / Caltech"
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
                max="40"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Student Capacity (Concurrent Mentees)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mentorship Statement & Teaching Methodology
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your pedagogical approach, experience with competitive exams, or research background..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Formal Application</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
