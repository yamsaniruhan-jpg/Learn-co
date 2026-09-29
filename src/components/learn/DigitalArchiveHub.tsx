import React, { useState } from 'react';
import {
  DIGITAL_ARCHIVE_RESOURCES,
  ChapterArchiveResource,
  ArchiveChapterQuestion,
} from '../../data/digitalArchiveData';
import { SubjectId } from '../../types/curriculum';
import {
  BookOpen,
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Zap,
  ChevronRight,
  Lightbulb,
  GraduationCap,
  Layers,
  Bookmark,
  Share2,
  Download,
  FileText,
} from 'lucide-react';
import { awardXp } from '../../utils/xpManager';
import { FormattedMathText } from '../common/FormattedMathText';
import { ZoteroCitationModal } from './ZoteroCitationModal';

interface DigitalArchiveHubProps {
  selectedSubject?: SubjectId;
  selectedChapterId?: string;
  onOpenPractice?: (subjectId: string, chapterId: string) => void;
  onAskCopilotToSynthesize?: (prompt: string) => void;
}

export const DigitalArchiveHub: React.FC<DigitalArchiveHubProps> = ({
  selectedSubject = 'math',
  selectedChapterId,
  onOpenPractice,
  onAskCopilotToSynthesize,
}) => {
  const [activeSubject, setActiveSubject] = useState<SubjectId | 'all'>(selectedSubject || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLevel, setActiveLevel] = useState<string>('all');
  const [selectedBook, setSelectedBook] = useState<ChapterArchiveResource | null>(null);

  // Citation & Zotero Modal State
  const [citationResource, setCitationResource] = useState<ChapterArchiveResource | null>(null);
  const [isCitationOpen, setIsCitationOpen] = useState(false);

  // Question solving state: map question id to chosen answer index
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [solvedQuestions, setSolvedQuestions] = useState<Record<string, boolean>>({});
  const [recentXpEarned, setRecentXpEarned] = useState<number | null>(null);

  const filteredResources = DIGITAL_ARCHIVE_RESOURCES.filter((res) => {
    if (activeSubject !== 'all' && res.subjectId !== activeSubject) return false;
    if (selectedChapterId && res.chapterId !== selectedChapterId) return false;
    if (activeLevel !== 'all' && res.level !== activeLevel) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        res.bookTitle.toLowerCase().includes(q) ||
        res.authors.toLowerCase().includes(q) ||
        res.chapterTitle.toLowerCase().includes(q) ||
        res.keyTopicsCovered.some((k) => k.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenCitation = (book: ChapterArchiveResource, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCitationResource(book);
    setIsCitationOpen(true);
  };

  const handleOpenBatchCitation = () => {
    setCitationResource(filteredResources[0] || DIGITAL_ARCHIVE_RESOURCES[0]);
    setIsCitationOpen(true);
  };

  const handleSelectOption = (
    question: ArchiveChapterQuestion,
    optionIndex: number,
    book: ChapterArchiveResource
  ) => {
    if (solvedQuestions[question.id]) return;

    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));

    if (optionIndex === question.correctAnswerIndex) {
      setSolvedQuestions((prev) => ({ ...prev, [question.id]: true }));
      awardXp(question.xpReward, `Solved question in ${book.chapterTitle}`);
      setRecentXpEarned(question.xpReward);
      setTimeout(() => setRecentXpEarned(null), 3500);
    }
  };

  const toggleHint = (questionId: string) => {
    setShowHints((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Curated STEM Textbooks & Interactive Chapter Library
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Master authoritative chapters across Mathematics, Computer Science, Physics, Chemistry, and Biology. Explore key theorems, first-principle derivations, and solve calibrated chapter problem sets to earn XP.
          </p>
        </div>

        {/* Global Action & XP Banner */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleOpenBatchCitation}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer shadow-xs"
          >
            <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Zotero & Citations</span>
          </button>

          {recentXpEarned && (
            <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>+{recentXpEarned} XP Earned!</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Subject Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'all', label: 'All Subjects' },
              { id: 'math', label: 'Mathematics' },
              { id: 'cs', label: 'Computer Science' },
              { id: 'physics', label: 'Physics' },
              { id: 'chemistry', label: 'Chemistry' },
              { id: 'biology', label: 'Biology' },
            ] as const
          ).map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubject(sub.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubject === sub.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chapters, theorems, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Textbook Chapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.map((item) => {
          const solvedCount = item.interactiveQuestions.filter((q) => solvedQuestions[q.id]).length;
          const totalQ = item.interactiveQuestions.length;

          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {item.subjectId.toUpperCase()} • {item.chapterTitle}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      item.level === 'Beginner'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : item.level === 'Intermediate'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : item.level === 'Advanced'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {item.level}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>{item.bookTitle}</span>
                </h3>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                  by {item.authors} ({item.editionOrYear})
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Key topics badges */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {item.keyTopicsCovered.map((topic, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>

                {/* Core Theorems Preview */}
                {item.coreTheorems && item.coreTheorems.length > 0 && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                    <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Key Theoretical Invariant:</span> {item.coreTheorems[0].name}
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-serif">
                      <FormattedMathText text={item.coreTheorems[0].statement} inline />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Controls & Chapter Questions */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {solvedCount}/{totalQ} Solved
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleOpenCitation(item, e)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                    title="Save to Zotero / Copy BibTeX citation"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedBook(item)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Read & Solve (+XP)</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive In-Chapter Modal & Practice Solver */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                    {selectedBook.subjectId} • {selectedBook.level}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {selectedBook.bookTitle}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedBook.chapterTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  By {selectedBook.authors} ({selectedBook.editionOrYear})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenCitation(selectedBook)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Cite / Zotero</span>
                </button>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* In-App Theory & Derivations */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Chapter Conceptual Framework</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-2 whitespace-pre-line leading-relaxed">
                <FormattedMathText text={selectedBook.chapterSummaryMarkdown} />
              </div>

              {/* Core Theorems & Proofs */}
              {selectedBook.coreTheorems && selectedBook.coreTheorems.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Core Theoretical Theorems & Proof Invariants:
                  </h4>
                  {selectedBook.coreTheorems.map((theorem, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/60 dark:border-indigo-900/60 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                          {theorem.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        <FormattedMathText text={theorem.statement} />
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          Intuition:
                        </strong>{' '}
                        <FormattedMathText text={theorem.intuition} inline />
                      </div>
                      {theorem.proofSnippet && (
                        <div className="text-[11px] p-2 rounded bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 text-slate-700 dark:text-slate-300">
                          <FormattedMathText text={theorem.proofSnippet} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Chapter Questions */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Interactive Chapter Check Questions</span>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  Earn +25 to +35 XP per question
                </span>
              </div>

              <div className="space-y-4">
                {selectedBook.interactiveQuestions.map((q, qIdx) => {
                  const selectedOpt = answers[q.id];
                  const isSolved = solvedQuestions[q.id];
                  const isCorrect = selectedOpt === q.correctAnswerIndex;
                  const isWrong = selectedOpt !== undefined && !isCorrect;

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-serif">
                          <span className="font-sans mr-1">{qIdx + 1}.</span>
                          <FormattedMathText text={q.questionText} inline />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                          +{q.xpReward} XP
                        </span>
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;
                          const isThisCorrect = optIdx === q.correctAnswerIndex;

                          let btnClasses =
                            'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400';

                          if (selectedOpt !== undefined) {
                            if (isThisCorrect) {
                              btnClasses =
                                'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-semibold';
                            } else if (isOptionSelected && !isThisCorrect) {
                              btnClasses =
                                'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200 font-semibold';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(q, optIdx, selectedBook)}
                              disabled={isSolved}
                              className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${btnClasses}`}
                            >
                              <div className="font-serif">
                                <FormattedMathText text={opt} inline />
                              </div>
                              {selectedOpt !== undefined && isThisCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                              {selectedOpt !== undefined && isOptionSelected && !isThisCorrect && (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Hint & Explanation */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => toggleHint(q.id)}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>{showHints[q.id] ? 'Hide Hint' : 'Need a Hint?'}</span>
                        </button>

                        {isSolved && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Correct! +{q.xpReward} XP Awarded
                          </span>
                        )}
                      </div>

                      {showHints[q.id] && (
                        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <FormattedMathText text={q.hint} />
                          </div>
                        </div>
                      )}

                      {selectedOpt !== undefined && (
                        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                          <strong className="text-slate-800 dark:text-slate-200 font-semibold block">
                            Explanation:
                          </strong>
                          <FormattedMathText text={q.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Zotero & Citation Modal */}
      {citationResource && (
        <ZoteroCitationModal
          resource={citationResource}
          isOpen={isCitationOpen}
          onClose={() => setIsCitationOpen(false)}
          onAskCopilotToSynthesize={onAskCopilotToSynthesize}
        />
      )}
    </div>
  );
};
