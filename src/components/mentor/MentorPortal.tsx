import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  BookOpen,
  Settings,
  ShieldCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  Star,
} from 'lucide-react';
import {
  MentorProfile,
  MentorshipRequest,
  MentorshipRelationship,
  AuthorizedLearnerInsights,
  MentorshipSession,
} from '../../types/mentorship';
import { SubjectId } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface MentorPortalProps {
  mentorProfile: MentorProfile | null;
  activeMentees: Array<{
    relationship: MentorshipRelationship;
    insights: AuthorizedLearnerInsights | null;
  }>;
  pendingRequests: MentorshipRequest[];
  upcomingSessions: MentorshipSession[];
  onRespondRequest: (requestId: string, action: 'ACCEPT' | 'DECLINE', note?: string) => Promise<void>;
  onUpdateProfile: (profile: Partial<MentorProfile>) => Promise<void>;
  onSelectMentee: (relationship: MentorshipRelationship) => void;
  onOpenSessionRoom: (session: MentorshipSession) => void;
}

export const MentorPortal: React.FC<MentorPortalProps> = ({
  mentorProfile,
  activeMentees,
  pendingRequests,
  upcomingSessions,
  onRespondRequest,
  onUpdateProfile,
  onSelectMentee,
  onOpenSessionRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'requests' | 'profile'>('roster');
  const [responseNote, setResponseNote] = useState<Record<string, string>>({});
  const [isResponding, setIsResponding] = useState<string | null>(null);

  // Profile Edit State
  const [headline, setHeadline] = useState(mentorProfile?.headline || '');
  const [bio, setBio] = useState(mentorProfile?.bio || '');
  const [mentoringStyle, setMentoringStyle] = useState(mentorProfile?.mentoringStyle || '');
  const [acceptingMentees, setAcceptingMentees] = useState(mentorProfile?.acceptingNewMentees ?? true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const handleResponse = async (requestId: string, action: 'ACCEPT' | 'DECLINE') => {
    setIsResponding(requestId);
    try {
      await onRespondRequest(requestId, action, responseNote[requestId]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResponding(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        headline,
        bio,
        mentoringStyle,
        acceptingNewMentees: acceptingMentees,
      });
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Mentor Overview Bar */}
      <Card
        variant="default"
        padding="md"
        className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-700"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-display">
                  Educator & Mentor Command Center
                </h2>
                <span className="text-[11px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">
                  Accredited Mentor
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Manage your active mentee cohort, review applications, and coordinate sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Mentees</span>
              <span className="text-lg font-black text-emerald-400">{activeMentees.length}</span>
            </div>
            <div className="text-right border-l border-slate-700 pl-4">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Review</span>
              <span className="text-lg font-black text-amber-400">{pendingRequests.length}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        <button
          id="tab-mentor-roster"
          onClick={() => setActiveTab('roster')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Mentee Cohort ({activeMentees.length})</span>
        </button>

        <button
          id="tab-mentor-requests"
          onClick={() => setActiveTab('requests')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Applications</span>
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          id="tab-mentor-profile-settings"
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Profile & Availability</span>
        </button>
      </div>

      {/* TAB 1: Roster */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {activeMentees.length === 0 ? (
            <div className="p-10 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Users className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active mentees currently</p>
              <p className="text-xs text-slate-400 mt-1">Pending student applications will appear in the Requests tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeMentees.map(({ relationship, insights }) => (
                <Card
                  key={relationship.id}
                  id={`mentee-card-${relationship.id}`}
                  variant="default"
                  padding="md"
                  className="space-y-3 hover:border-emerald-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={relationship.learnerAvatar}
                        alt={relationship.learnerName}
                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {relationship.learnerName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {relationship.subjectId.toUpperCase()} • {relationship.targetTrack}
                        </p>
                      </div>
                    </div>

                    <Badge variant="success" size="sm">
                      {relationship.status}
                    </Badge>
                  </div>

                  {/* Goal and Insight Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Agreed Cadence: <strong>{relationship.agreedCadence}</strong></span>
                      <span>Since: {new Date(relationship.startDate).toLocaleDateString()}</span>
                    </div>

                    {insights?.masteryHighlights && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                        <span className="font-bold text-amber-600 dark:text-amber-400">Diagnostic Weak Focus: </span>
                        {insights.masteryHighlights.weakConcepts.map((c) => c.title).join(', ') || 'High retention on all drills'}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <Button
                      id={`btn-open-mentee-hub-${relationship.id}`}
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 text-white text-xs w-full flex items-center justify-center gap-1"
                      onClick={() => onSelectMentee(relationship)}
                    >
                      <span>Open Mentee Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Applications */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
              No pending applications to review.
            </div>
          ) : (
            pendingRequests.map((req) => (
              <Card
                key={req.id}
                id={`request-review-card-${req.id}`}
                variant="default"
                padding="md"
                className="space-y-3.5 border-amber-500/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.learnerAvatar}
                      alt={req.learnerName}
                      className="w-11 h-11 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {req.learnerName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Subject: <strong className="text-slate-700 dark:text-slate-300">{req.subjectId.toUpperCase()}</strong> • Target: {req.targetTrack}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Received: {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Stated Learning Goal */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Stated Milestone Target:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    "{req.goalDescription}"
                  </p>
                  <p className="text-[11px] text-slate-500 italic pt-1">
                    Introduction note: "{req.initialMessage}"
                  </p>
                </div>

                {/* Optional Welcome Note Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Add a personalized acceptance / introduction message..."
                    value={responseNote[req.id] || ''}
                    onChange={(e) => setResponseNote({ ...responseNote, [req.id]: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    id={`btn-decline-req-${req.id}`}
                    variant="outline"
                    size="sm"
                    className="text-xs text-slate-500 hover:text-rose-600"
                    disabled={isResponding === req.id}
                    onClick={() => handleResponse(req.id, 'DECLINE')}
                  >
                    Decline
                  </Button>

                  <Button
                    id={`btn-accept-req-${req.id}`}
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                    disabled={isResponding === req.id}
                    onClick={() => handleResponse(req.id, 'ACCEPT')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept Learner Application</span>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Profile Settings */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
          {profileSaveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20">
              Mentor profile and availability settings saved successfully!
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Professional Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              About & Research Bio
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Mentoring & Pedagogical Style
            </label>
            <input
              type="text"
              value={mentoringStyle}
              onChange={(e) => setMentoringStyle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Accepting New Mentees
              </span>
              <p className="text-[11px] text-slate-500">
                When enabled, your profile is listed in the Discover Mentors directory.
              </p>
            </div>
            <input
              type="checkbox"
              checked={acceptingMentees}
              onChange={(e) => setAcceptingMentees(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSavingProfile}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        </form>
      )}
    </div>
  );
};
