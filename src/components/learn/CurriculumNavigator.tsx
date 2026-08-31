import React, { useState } from 'react';
import { SubjectCurriculum, ExamTrack, ExamTrackId, SubjectId } from '../../types/curriculum';
import {
  Calculator,
  Terminal,
  Atom,
  FlaskConical,
  Dna,
  Search,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Zap,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface CurriculumNavigatorProps {
  curriculum: SubjectCurriculum[];
  tracks: ExamTrack[];
  selectedSubject: SubjectId;
  selectedTrack: ExamTrackId;
  onSelectSubject: (subjectId: SubjectId) => void;
  onSelectTrack: (trackId: ExamTrackId) => void;
  onSelectConcept: (conceptId: string) => void;
  onStartTopicPractice: (subjectId: SubjectId, topicId: string, topicTitle: string) => void;
}

export const CurriculumNavigator: React.FC<CurriculumNavigatorProps> = ({
  curriculum,
  tracks,
  selectedSubject,
  selectedTrack,
  onSelectSubject,
  onSelectTrack,
  onSelectConcept,
  onStartTopicPractice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'math-ch-diff-calc': true,
    'cs-ch-ml-opt': true,
    'phys-ch-mechanics': true,
    'chem-ch-organic': true,
    'bio-ch-genetics': true,
  });

  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className="w-4 h-4" />;
      case 'Terminal':
        return <Terminal className="w-4 h-4" />;
      case 'Atom':
        return <Atom className="w-4 h-4" />;
      case 'FlaskConical':
        return <FlaskConical className="w-4 h-4" />;
      case 'Dna':
      default:
        return <Dna className="w-4 h-4" />;
    }
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const activeSubjectData = curriculum.find((s) => s.id === selectedSubject) || curriculum[0];

  // Search filtering
  const filteredChapters = activeSubjectData?.chapters.filter((chapter) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesChapter = chapter.title.toLowerCase().includes(q) || chapter.description.toLowerCase().includes(q);
    const matchesTopic = chapter.topics.some(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtopics.some((st) =>
          st.concepts.some((c) => c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q))
        )
    );
    return matchesChapter || matchesTopic;
  });

  return (
    <div className="space-y-6">
      {/* Subject Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {curriculum.map((subject) => {
          const isSelected = subject.id === selectedSubject;
          return (
            <button
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {getSubjectIcon(subject.iconName)}
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {subject.chapters.length} Ch
                </span>
              </div>
              <div>
                <div className="text-xs font-bold truncate">{subject.name}</div>
                <div className={`text-[11px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {subject.tagline.split(',')[0]}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Control Bar: Track Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Track Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Exam Track:
          </span>
          <select
            value={selectedTrack}
            onChange={(e) => onSelectTrack(e.target.value as ExamTrackId)}
            className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topics, concepts, theorems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Chapter & Topics Hierarchy */}
      <div className="space-y-4">
        {filteredChapters && filteredChapters.length > 0 ? (
          filteredChapters.map((chapter, cIdx) => {
            const isExpanded = expandedChapters[chapter.id] ?? true;
            return (
              <div
                key={chapter.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Chapter Header Accordion */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                      {cIdx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {chapter.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {chapter.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {chapter.topics.reduce((acc, t) => acc + t.conceptCount, 0)} Concepts
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Chapter Topics */}
                {isExpanded && (
                  <div className="p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
                    {chapter.topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                              {topic.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{topic.description}</p>
                          </div>

                          <button
                            onClick={() => onStartTopicPractice(activeSubjectData.id, topic.id, topic.title)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Zap className="w-3 h-3 fill-current text-amber-500" />
                            <span>Practice Topic</span>
                          </button>
                        </div>

                        {/* Subtopics & Concepts */}
                        <div className="space-y-3 pt-1">
                          {topic.subtopics.map((subtopic) => (
                            <div key={subtopic.id} className="space-y-2">
                              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {subtopic.title}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {subtopic.concepts.map((concept) => (
                                  <div
                                    key={concept.id}
                                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col justify-between"
                                  >
                                    <div className="mb-2">
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                          {concept.title}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                                          {concept.difficulty}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                        {concept.summary}
                                      </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px]">
                                      <div className="flex items-center gap-1.5 text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{concept.estimatedMinutes}m</span>
                                        <span>•</span>
                                        <span className="text-amber-500 font-medium">+{concept.xpReward} XP</span>
                                      </div>

                                      <button
                                        onClick={() => onSelectConcept(concept.id)}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <span>Study Concept</span>
                                        <ChevronRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No concepts matched your search query. Try broadening your terms.
          </div>
        )}
      </div>
    </div>
  );
};
