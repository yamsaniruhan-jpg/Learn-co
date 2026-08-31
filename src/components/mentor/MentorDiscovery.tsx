import React, { useState } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  SlidersHorizontal,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react';
import { MentorProfile, MentorMatchRecommendation, MentorshipRequest } from '../../types/mentorship';
import { SubjectId } from '../../types';
import { MentorCard } from './MentorCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface MentorDiscoveryProps {
  mentors: MentorProfile[];
  recommendations: MentorMatchRecommendation[];
  pendingRequests: MentorshipRequest[];
  onViewProfile: (mentor: MentorProfile) => void;
  onRequestMentor: (mentor: MentorProfile) => void;
  onCancelRequest: (requestId: string) => Promise<void>;
  selectedSubject?: SubjectId;
  onSubjectChange: (subj: SubjectId | undefined) => void;
}

export const MentorDiscovery: React.FC<MentorDiscoveryProps> = ({
  mentors,
  recommendations,
  pendingRequests,
  onViewProfile,
  onRequestMentor,
  onCancelRequest,
  selectedSubject,
  onSubjectChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'experience'>('recommended');

  const tracks = [
    { id: 'all', label: 'All Tracks' },
    { id: 'Advanced STEM Mastery & JEE/AP', label: 'Advanced STEM & JEE/AP' },
    { id: 'Research & Olympiad Preparation', label: 'Research & Olympiad' },
    { id: 'College Calculus & Analysis', label: 'College Calculus' },
    { id: 'Organic Synthesis & Mechanisms', label: 'Organic Chemistry' },
  ];

  const subjects: Array<{ id: SubjectId | 'all'; label: string }> = [
    { id: 'all', label: 'All Subjects' },
    { id: 'math', label: 'Mathematics' },
    { id: 'cs', label: 'Computer Science' },
    { id: 'physics', label: 'Physics' },
    { id: 'chemistry', label: 'Chemistry' },
    { id: 'biology', label: 'Biology' },
  ];

  // Filter mentors
  const filteredMentors = mentors.filter((m) => {
    if (selectedSubject && !m.subjects.includes(selectedSubject)) return false;
    if (selectedTrack !== 'all' && !m.supportedTracks.some((t) => t.toLowerCase().includes(selectedTrack.toLowerCase()))) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchBio = m.bio.toLowerCase().includes(q);
      const matchExp = m.areasOfExpertise.some((e) => e.toLowerCase().includes(q));
      if (!matchName && !matchBio && !matchExp) return false;
    }
    return true;
  });

  // Sort mentors
  const sortedMentors = [...filteredMentors].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'experience') return b.teachingExperienceYears - a.teachingExperienceYears;
    return 0; // Default recommended order
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with AI Match Recommendations */}
      {recommendations.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  AI-Curated Mentor Matches for Your Learning Profile
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ranked using your diagnostic mistake patterns and target curriculum tracks
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 2).map((rec) => (
              <MentorCard
                key={rec.mentor.id}
                mentor={rec.mentor}
                matchScore={rec.matchScore}
                matchReasons={rec.matchReasons}
                onViewProfile={onViewProfile}
                onRequest={onRequestMentor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests Alert if any exist */}
      {pendingRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
            <Clock className="w-4 h-4" />
            <span>You have {pendingRequests.length} pending mentorship application(s)</span>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/40"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{req.mentorName}</span>
                  <span className="text-slate-500 text-[11px] ml-2">({req.subjectId.toUpperCase()} • {req.targetTrack})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded-full">
                    Under Review
                  </span>
                  <button
                    onClick={() => onCancelRequest(req.id)}
                    className="text-[11px] text-slate-400 hover:text-rose-500"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="input-mentor-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mentors by name, research topic, university, or concept..."
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </div>
            <select
              id="select-mentor-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              <option value="recommended">Best Matched</option>
              <option value="rating">Highest Rating</option>
              <option value="experience">Most Experience</option>
            </select>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {subjects.map((sub) => {
            const isSelected = (!selectedSubject && sub.id === 'all') || selectedSubject === sub.id;
            return (
              <button
                key={sub.id}
                id={`filter-subject-${sub.id}`}
                onClick={() => onSubjectChange(sub.id === 'all' ? undefined : (sub.id as SubjectId))}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Verified Mentor Directory Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Verified STEM Mentors ({sortedMentors.length})
          </h3>
          <span className="text-xs text-slate-500">
            All mentors undergo identity & pedagogy accreditation
          </span>
        </div>

        {sortedMentors.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
            <GraduationCap className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No mentors match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing search filters or selecting another subject.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onViewProfile={onViewProfile}
                onRequest={onRequestMentor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
