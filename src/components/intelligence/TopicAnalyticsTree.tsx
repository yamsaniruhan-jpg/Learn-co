import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Target,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { TopicAnalyticsDetail, ConceptMasteryEstimate } from '../../types/analytics';
import { SubjectId } from '../../types/curriculum';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';

interface TopicAnalyticsTreeProps {
  topics: TopicAnalyticsDetail[];
  selectedSubject: SubjectId;
  onSelectSubject: (subjectId: SubjectId) => void;
  onNavigateTab?: (tab: string, context?: any) => void;
}

export const TopicAnalyticsTree: React.FC<TopicAnalyticsTreeProps> = ({
  topics,
  selectedSubject,
  onSelectSubject,
  onNavigateTab,
}) => {
  const [expandedTopicIds, setExpandedTopicIds] = useState<Record<string, boolean>>({});

  const toggleTopic = (id: string) => {
    setExpandedTopicIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getLabelBadge = (label: ConceptMasteryEstimate['masteryLabel']) => {
    switch (label) {
      case 'MASTERED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            MASTERED
          </span>
        );
      case 'STRONG':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            STRONG
          </span>
        );
      case 'DEVELOPING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            DEVELOPING
          </span>
        );
      case 'LEARNING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            LEARNING
          </span>
        );
      case 'NOT_STARTED':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            NOT STARTED
          </span>
        );
    }
  };

  const subjects: { id: SubjectId; label: string }[] = [
    { id: 'math', label: 'Mathematics' },
    { id: 'cs', label: 'Computer Science' },
    { id: 'physics', label: 'Physics' },
    { id: 'chemistry', label: 'Chemistry' },
    { id: 'biology', label: 'Biology' },
  ];

  return (
    <div className="space-y-6">
      {/* Subject Pill Selector */}
      <div className="flex gap-2 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        {subjects.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelectSubject(sub.id)}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
              selectedSubject === sub.id
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* Topics Hierarchy List */}
      <div className="space-y-4">
        {topics.map((topic) => {
          const isExpanded = expandedTopicIds[topic.topicId] ?? true;

          return (
            <Card
              key={topic.topicId}
              variant="default"
              padding="md"
              className="space-y-3 transition-all"
            >
              {/* Topic Header Summary */}
              <div
                onClick={() => toggleTopic(topic.topicId)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <button className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      {topic.topicTitle}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {topic.concepts.length} concepts • {topic.attemptsCount} questions solved
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Topic Mastery
                    </span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {topic.masteryScore}%
                    </span>
                  </div>

                  <div className="w-24 hidden sm:block">
                    <Progress value={topic.masteryScore} color="indigo" size="xs" />
                  </div>
                </div>
              </div>

              {/* Expanded Concepts Sub-Table */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {topic.concepts.map((concept) => (
                    <div
                      key={concept.conceptId}
                      className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {concept.conceptTitle}
                          </span>
                          {getLabelBadge(concept.masteryLabel)}
                          {concept.isWeakArea && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              Weak Area
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            Accuracy: <strong className="text-slate-700 dark:text-slate-200">{concept.accuracy !== null ? `${concept.accuracy}%` : 'N/A'}</strong> ({concept.correctCount}/{concept.attemptsCount})
                          </span>
                          <span>•</span>
                          <span>
                            Retention Stability: <strong className="text-slate-700 dark:text-slate-200">{concept.retentionStrength}%</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Revision: <strong className="text-indigo-600 dark:text-indigo-400 capitalize">{concept.revisionStatus.replace('_', ' ')}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Mini Bar & Practice Launch */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-16">
                          <div className="text-right text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                            {concept.masteryScore}%
                          </div>
                          <Progress
                            value={concept.masteryScore}
                            color={
                              concept.masteryScore >= 80
                                ? 'emerald'
                                : concept.masteryScore >= 50
                                ? 'indigo'
                                : 'rose'
                            }
                            size="xs"
                          />
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (onNavigateTab) {
                              onNavigateTab('practice', {
                                subjectId: concept.subjectId,
                                conceptId: concept.conceptId,
                                topicId: concept.conceptTitle,
                              });
                            }
                          }}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 py-1 px-2.5"
                        >
                          <span>Practice</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
