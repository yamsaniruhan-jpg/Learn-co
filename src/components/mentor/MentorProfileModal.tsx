import React, { useState } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Award,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  Globe2,
  CheckCircle2,
  Send,
  MessageSquare,
  Sparkles,
  Lock,
} from 'lucide-react';
import { MentorProfile } from '../../types/mentorship';
import { SubjectId } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface MentorProfileModalProps {
  mentor: MentorProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: (data: any) => Promise<void>;
}

export const MentorProfileModal: React.FC<MentorProfileModalProps> = ({
  mentor,
  isOpen,
  onClose,
  onRequestSubmitted,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'request'>('overview');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('math');
  const [targetTrack, setTargetTrack] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [preferredCadence, setPreferredCadence] = useState<'weekly' | 'biweekly' | 'on_demand'>('weekly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen || !mentor) return null;

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalDescription.trim() || !initialMessage.trim()) {
      setSubmitError('Please describe your target goal and write an initial introduction message.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onRequestSubmitted({
        mentorId: mentor.id,
        subjectId: selectedSubject || mentor.subjects[0],
        targetTrack: targetTrack || mentor.supportedTracks[0] || 'General STEM',
        goalDescription,
        initialMessage,
        preferredCadence,
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('overview');
        onClose();
      }, 1800);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit mentorship request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        id="modal-mentor-profile"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src={mentor.avatarUrl}
                alt={mentor.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-800 shadow-md"
              />
              {mentor.isVerified && (
                <span
                  title="Verified Learn.co Educator"
                  className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                  {mentor.name}
                </h2>
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{mentor.rating.toFixed(2)}</span>
                  <span className="text-slate-400 font-normal">({mentor.reviewCount} reviews)</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                {mentor.headline}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>{mentor.education}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>{mentor.teachingExperienceYears} Years Mentoring</span>
                </span>
              </div>
            </div>
          </div>

          <button
            id="btn-close-mentor-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle (Overview vs Request) */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/20 dark:bg-slate-900/20">
          <button
            id="tab-mentor-overview"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Mentor Background & Credentials</span>
          </button>

          <button
            id="tab-mentor-request"
            onClick={() => setActiveTab('request')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'request'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Apply for Mentorship</span>
            {mentor.acceptingNewMentees && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* About Bio */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  About & Mentoring Philosophy
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {mentor.bio}
                </p>
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-800 dark:text-emerald-300">
                  <span className="font-bold">Pedagogical Approach: </span>
                  {mentor.mentoringStyle}
                </div>
              </div>

              {/* Areas of Expertise */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Specialized Topics & Research Focus
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mentor.areasOfExpertise.map((exp, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{exp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Credentials & Verified Honors */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Credentials & Accreditations
                </h4>
                <div className="space-y-1.5">
                  {mentor.credentials.map((cred, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{cred}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported Exam Tracks */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Supported Tracks & Standardized Exams
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.supportedTracks.map((track, i) => (
                    <Badge key={i} variant="outline" size="sm" className="text-xs font-semibold">
                      {track}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Availability & Languages Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Session Availability</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {mentor.availability.days.join(', ')}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Slots: {mentor.availability.timeSlots.join(' | ')}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Languages</span>
                  </div>
                  <p className="text-xs text-slate-500">{mentor.languages.join(', ')}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Free Community Mentorship Tier
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {submitSuccess ? (
                <div className="p-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in zoom-in-95">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Mentorship Request Submitted!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {mentor.name} has been notified and will review your conceptual goal and schedule availability.
                  </p>
                </div>
              ) : (
                <>
                  {submitError && (
                    <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                      {submitError}
                    </div>
                  )}

                  {/* Subject selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Subject Focus
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {mentor.subjects.map((subj) => (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => setSelectedSubject(subj as SubjectId)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            selectedSubject === subj
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-300'
                          }`}
                        >
                          {subj === 'cs' ? 'Computer Science' : subj.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Track */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Target Exam or Curriculum Track
                    </label>
                    <input
                      type="text"
                      id="input-request-track"
                      value={targetTrack}
                      onChange={(e) => setTargetTrack(e.target.value)}
                      placeholder="e.g. Advanced STEM Mastery & JEE/AP, College Calculus"
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  {/* Cadence */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Preferred Meeting Cadence
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'weekly', label: 'Weekly' },
                        { id: 'biweekly', label: 'Bi-Weekly' },
                        { id: 'on_demand', label: 'On Demand' },
                      ].map((cad) => (
                        <button
                          key={cad.id}
                          type="button"
                          onClick={() => setPreferredCadence(cad.id as any)}
                          className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                            preferredCadence === cad.id
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {cad.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Goal Description */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Primary Learning Goal or Conceptual Milestone
                    </label>
                    <textarea
                      id="textarea-request-goal"
                      rows={2}
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                      placeholder="e.g. Master second-derivative test inflection geometry and achieve 95% on JEE multivariable optimization."
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  {/* Initial Message */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Introduction & Context for {mentor.name}
                    </label>
                    <textarea
                      id="textarea-request-message"
                      rows={3}
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      placeholder="Introduce your background, current study routine, and specific challenges where mentorship will help..."
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  {/* Privacy Notice Banner */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Privacy Protected:</strong> Accepting mentorship shares only authorized learning progress (mastery matrix and practice stats). Private Creator Studio notebooks and Copilot conversations are never shared.
                    </span>
                  </div>
                </>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <Button
            id="btn-cancel-mentor-modal"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>

          {activeTab === 'overview' ? (
            <Button
              id="btn-apply-mentorship-tab"
              variant="primary"
              size="sm"
              disabled={!mentor.acceptingNewMentees}
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              onClick={() => setActiveTab('request')}
            >
              <span>Apply for Mentorship</span>
              <Send className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              id="btn-submit-mentorship-request"
              variant="primary"
              size="sm"
              disabled={isSubmitting || submitSuccess}
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              onClick={handleSubmitRequest}
            >
              {isSubmitting ? (
                <span>Submitting Request...</span>
              ) : (
                <>
                  <span>Send Mentorship Application</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
