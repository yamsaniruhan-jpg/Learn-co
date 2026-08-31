import React, { useState } from 'react';
import { ConceptDetail, SubjectId } from '../../types/curriculum';
import { InteractiveWidgets } from './InteractiveWidgets';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  ChevronRight,
  HelpCircle,
  XCircle,
} from 'lucide-react';

interface ConceptDetailViewProps {
  concept: ConceptDetail;
  chapterTitle?: string;
  topicTitle?: string;
  subjectName?: string;
  onStartPractice: (conceptId: string, subjectId: SubjectId, topicTitle?: string) => void;
  onNavigateConcept: (conceptId: string) => void;
  onBack: () => void;
}

export const ConceptDetailView: React.FC<ConceptDetailViewProps> = ({
  concept,
  chapterTitle,
  topicTitle,
  subjectName,
  onStartPractice,
  onNavigateConcept,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'theory' | 'examples' | 'pitfalls' | 'simulator' | 'graph'>('theory');
  const [selectedMiniAnswer, setSelectedMiniAnswer] = useState<number | null>(null);
  const [showMiniExplanation, setShowMiniExplanation] = useState<boolean>(false);
  const [revealedSolutionSteps, setRevealedSolutionSteps] = useState<Record<string, boolean>>({});

  const toggleSolution = (exampleId: string) => {
    setRevealedSolutionSteps((prev) => ({ ...prev, [exampleId]: !prev[exampleId] }));
  };

  const isMiniCorrect =
    selectedMiniAnswer !== null &&
    concept.miniCheckQuestion &&
    selectedMiniAnswer === concept.miniCheckQuestion.correctIndex;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={onBack} className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
            Curriculum
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{subjectName || 'STEM'}</span>
          {chapterTitle && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="truncate max-w-[160px]">{chapterTitle}</span>
            </>
          )}
          {topicTitle && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="truncate max-w-[160px] text-slate-700 dark:text-slate-200 font-medium">{topicTitle}</span>
            </>
          )}
        </div>

        <button
          onClick={() => onStartPractice(concept.id, concept.subjectId, topicTitle)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Practice This Concept (5 Questions)</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-md">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
            {concept.subjectId.toUpperCase()} Core Concept
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 capitalize">
            {concept.difficulty.replace('_', ' ')}
          </span>
          <div className="flex items-center gap-1 text-slate-300 text-xs ml-auto">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{concept.estimatedMinutes} mins read</span>
            <span className="mx-1">•</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-medium">+{concept.xpReward} XP</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-white">{concept.title}</h1>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">{concept.summary}</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('theory')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'theory'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Theory & Invariants</span>
        </button>

        {concept.workedExamples && concept.workedExamples.length > 0 && (
          <button
            onClick={() => setActiveTab('examples')}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'examples'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Worked Examples ({concept.workedExamples.length})</span>
          </button>
        )}

        {concept.commonPitfalls && concept.commonPitfalls.length > 0 && (
          <button
            onClick={() => setActiveTab('pitfalls')}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'pitfalls'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Common Pitfalls ({concept.commonPitfalls.length})</span>
          </button>
        )}

        {concept.interactiveWidget && (
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'simulator'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'graph'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Prerequisites & Graph</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* 1. THEORY TAB */}
        {activeTab === 'theory' && (
          <div className="space-y-6">
            {/* Formal Definition */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Formal Mathematical / Scientific Definition
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif">
                {concept.formalDefinition}
              </p>
            </div>

            {/* First Principles Intuition */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                First-Principles Intuition
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {concept.intuitiveExplanation}
              </p>
            </div>

            {/* Key Formulas */}
            {concept.keyFormulas && concept.keyFormulas.length > 0 && (
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                  Key Governing Invariants & Formulas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {concept.keyFormulas.map((f, i) => (
                    <div key={i} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">{f.label}</div>
                      <div className="text-sm font-mono font-medium text-slate-900 dark:text-slate-100 mb-1.5 overflow-x-auto py-1">
                        {f.latex}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{f.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Observations */}
            {concept.keyObservations && concept.keyObservations.length > 0 && (
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
                  Critical Observations & Pro Tips
                </h3>
                <ul className="space-y-2">
                  {concept.keyObservations.map((obs, i) => (
                    <li key={i} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mini Diagnostic Check */}
            {concept.miniCheckQuestion && (
              <div className="p-5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                    Quick Diagnostic Check
                  </h4>
                </div>

                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  {concept.miniCheckQuestion.prompt}
                </p>

                <div className="space-y-2 mb-4">
                  {concept.miniCheckQuestion.options.map((opt, idx) => {
                    const isSelected = selectedMiniAnswer === idx;
                    const isCorrect = idx === concept.miniCheckQuestion!.correctIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedMiniAnswer(idx);
                          setShowMiniExplanation(true);
                        }}
                        className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          showMiniExplanation && isCorrect
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-semibold'
                            : showMiniExplanation && isSelected && !isCorrect
                            ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-300'
                            : isSelected
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{opt}</span>
                          {showMiniExplanation && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                          {showMiniExplanation && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {showMiniExplanation && (
                  <div
                    className={`p-3 rounded-lg text-xs leading-relaxed ${
                      isMiniCorrect
                        ? 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100/80 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    <span className="font-bold">{isMiniCorrect ? 'Correct! ' : 'Incorrect. '}</span>
                    {concept.miniCheckQuestion.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. WORKED EXAMPLES TAB */}
        {activeTab === 'examples' && (
          <div className="space-y-4">
            {concept.workedExamples.map((ex, index) => {
              const isRevealed = revealedSolutionSteps[ex.id] || false;
              return (
                <div key={ex.id} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Worked Example {index + 1}: {ex.title}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                      {ex.difficulty}
                    </span>
                  </div>

                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    {ex.problemStatement}
                  </div>

                  <div>
                    <button
                      onClick={() => toggleSolution(ex.id)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {isRevealed ? 'Hide Step-by-Step Solution' : 'Reveal Step-by-Step Solution'}
                    </button>
                  </div>

                  {isRevealed && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-1.5">
                        {ex.stepByStepSolution.map((step, sIdx) => (
                          <div key={sIdx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="font-mono text-indigo-500 font-bold">{sIdx + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">Final Answer: </span>
                        <span className="text-emerald-900 dark:text-emerald-200 font-medium">{ex.finalAnswer}</span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Key Takeaway: </span>
                        {ex.keyTakeaway}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 3. COMMON PITFALLS TAB */}
        {activeTab === 'pitfalls' && (
          <div className="space-y-4">
            {concept.commonPitfalls.map((pit, idx) => (
              <div key={pit.id || idx} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <h4>Trap #{idx + 1}: {pit.trapTitle}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-300">
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-rose-600 dark:text-rose-400 mb-1">
                      Flawed Reasoning (The Trap)
                    </span>
                    <p>{pit.flawedReasoning}</p>
                  </div>

                  <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300">
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-emerald-600 dark:text-emerald-400 mb-1">
                      Correct Invariant Understanding
                    </span>
                    <p>{pit.correctConcept}</p>
                  </div>
                </div>

                {pit.counterExample && (
                  <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">Counterexample:</span>
                    {pit.counterExample}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 4. SIMULATOR TAB */}
        {activeTab === 'simulator' && concept.interactiveWidget && (
          <div>
            <InteractiveWidgets type={concept.interactiveWidget} />
          </div>
        )}

        {/* 5. PREREQUISITES & GRAPH TAB */}
        {activeTab === 'graph' && (
          <div className="space-y-5">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Prerequisites (Master Before Studying This)
              </h3>
              {concept.prerequisites && concept.prerequisites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {concept.prerequisites.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onNavigateConcept(p.id)}
                      className="p-3 text-left rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{p.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">This is a foundational concept with direct first-principles axioms.</p>
              )}
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Related Next Concepts in Curriculum
              </h3>
              {concept.relatedConcepts && concept.relatedConcepts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {concept.relatedConcepts.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onNavigateConcept(r.id)}
                      className="p-3 text-left rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 hover:border-indigo-400 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span className="font-semibold text-indigo-900 dark:text-indigo-300">{r.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">Proceed to practice to reinforce understanding!</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ready to Practice Sticky Trigger */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-slate-100 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Ready to test your concept retention?</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Launch a calibrated 5-question problem ladder (+5 XP per correct answer)
          </div>
        </div>

        <button
          onClick={() => onStartPractice(concept.id, concept.subjectId, topicTitle)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
        >
          <Zap className="w-4 h-4 fill-current text-amber-300" />
          <span>Launch 5-Question Ladder</span>
        </button>
      </div>
    </div>
  );
};
