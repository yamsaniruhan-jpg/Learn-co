import React from 'react';
import {
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { MentorProfile } from '../../types/mentorship';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface MentorCardProps {
  mentor: MentorProfile;
  matchScore?: number;
  matchReasons?: string[];
  onViewProfile: (mentor: MentorProfile) => void;
  onRequest: (mentor: MentorProfile) => void;
}

export const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  matchScore,
  matchReasons,
  onViewProfile,
  onRequest,
}) => {
  const getSubjectColor = (subj: string) => {
    switch (subj) {
      case 'math':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40';
      case 'cs':
        return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/40';
      case 'physics':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40';
      case 'chemistry':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
      case 'biology':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800/40';
    }
  };

  const getSubjectLabel = (subj: string) => {
    switch (subj) {
      case 'math':
        return 'Mathematics';
      case 'cs':
        return 'Computer Science & AI';
      case 'physics':
        return 'Physics';
      case 'chemistry':
        return 'Chemistry';
      case 'biology':
        return 'Biology';
      default:
        return subj;
    }
  };

  return (
    <Card
      id={`mentor-card-${mentor.id}`}
      variant="default"
      padding="md"
      className="flex flex-col justify-between hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all duration-200 group relative overflow-hidden"
    >
      {/* Optional AI Match Banner */}
      {matchScore !== undefined && (
        <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-b border-emerald-500/20 px-3 py-1.5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>AI Match Score: {matchScore}%</span>
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
            {matchReasons && matchReasons[0]}
          </span>
        </div>
      )}

      <div className={`space-y-3.5 ${matchScore !== undefined ? 'pt-5' : ''}`}>
        {/* Mentor Header */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <img
              src={mentor.avatarUrl}
              alt={mentor.name}
              className="w-13 h-13 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm"
            />
            {mentor.isVerified && (
              <span
                title="Verified Learn.co Educator"
                className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {mentor.name}
              </h3>
              <div className="flex items-center gap-1 shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-xs font-bold">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{mentor.rating.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 font-normal">({mentor.reviewCount})</span>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
              {mentor.headline}
            </p>

            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3 text-slate-400" />
                <span>{mentor.teachingExperienceYears}y teaching</span>
              </span>
              <span>•</span>
              <span>{mentor.sessionsCompleted} sessions</span>
            </div>
          </div>
        </div>

        {/* Bio snippet */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {mentor.bio}
        </p>

        {/* Subject badges */}
        <div className="flex flex-wrap gap-1.5">
          {mentor.subjects.map((sub) => (
            <span
              key={sub}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getSubjectColor(sub)}`}
            >
              {getSubjectLabel(sub)}
            </span>
          ))}
        </div>

        {/* Key Areas of Expertise */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Focus Areas
          </span>
          <div className="flex flex-wrap gap-1">
            {mentor.areasOfExpertise.slice(0, 2).map((exp, i) => (
              <span
                key={i}
                className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-ellipsis overflow-hidden truncate max-w-full"
              >
                {exp}
              </span>
            ))}
            {mentor.areasOfExpertise.length > 2 && (
              <span className="text-[10px] text-slate-400 px-1 py-0.5">
                +{mentor.areasOfExpertise.length - 2} more
              </span>
            )}
          </div>
        </div>

        {/* Availability & Cadence */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[140px]">
              {mentor.availability.days.slice(0, 2).join(', ')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {mentor.acceptingNewMentees ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Available ({mentor.maxMentees - mentor.activeMenteesCount} spots)
              </span>
            ) : (
              <span className="text-slate-400">Roster full</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Button
          id={`btn-view-mentor-${mentor.id}`}
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onViewProfile(mentor)}
        >
          View Profile
        </Button>

        <Button
          id={`btn-request-mentor-${mentor.id}`}
          variant="primary"
          size="sm"
          disabled={!mentor.acceptingNewMentees}
          className="flex-1 text-xs flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white"
          onClick={() => onRequest(mentor)}
        >
          <span>Request</span>
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
};
