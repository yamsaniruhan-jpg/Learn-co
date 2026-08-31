import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  Calendar,
  Bot,
  AlertTriangle,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { NextBestAction } from '../../types/analytics';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AnalyticsClient } from '../../services/analyticsClient';

interface NextBestActionsListProps {
  actions: NextBestAction[];
  onNavigateTab?: (tab: string, context?: any) => void;
  onRefresh?: () => void;
}

export const NextBestActionsList: React.FC<NextBestActionsListProps> = ({
  actions,
  onNavigateTab,
  onRefresh,
}) => {
  const [scheduledIds, setScheduledIds] = useState<Record<string, boolean>>({});
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const handleScheduleAction = async (action: NextBestAction) => {
    try {
      setSchedulingId(action.id);
      await AnalyticsClient.scheduleMistakeRemediation(
        action.conceptId || action.id,
        new Date().toISOString().split('T')[0],
        '16:00'
      );
      setScheduledIds((prev) => ({ ...prev, [action.id]: true }));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to schedule action:', err);
    } finally {
      setSchedulingId(null);
    }
  };

  const getUrgencyBadge = (urgency: NextBestAction['urgency']) => {
    switch (urgency) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            HIGH PRIORITY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            RECOMMENDED
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            OPTIONAL SPRINT
          </span>
        );
    }
  };

  if (!actions || actions.length === 0) {
    return (
      <Card variant="default" padding="lg" className="text-center py-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          All Concepts in Optimal State
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
          No critical decay or unresolved error patterns detected. Continue regular curriculum progression or challenge an exam ladder.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action, idx) => {
        const isScheduled = scheduledIds[action.id];
        const isScheduling = schedulingId === action.id;

        return (
          <Card
            key={action.id}
            variant="default"
            padding="md"
            className="transition-all hover:border-indigo-200 dark:hover:border-indigo-900 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <Badge variant={action.subjectId} size="sm">
                    {action.subjectId.toUpperCase()}
                  </Badge>
                  {getUrgencyBadge(action.urgency)}
                  <span className="text-[11px] font-mono text-slate-400">
                    Priority Score: {action.priorityScore}/100
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {action.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {action.description}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {action.estimatedMinutes} mins
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-500">
                  <Zap className="w-3.5 h-3.5" />
                  +{action.xpReward} XP
                </span>
              </div>
            </div>

            {/* Pedagogical Justification Box */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Pedagogical Rationale: </span>
                {action.explanation}
              </div>
            </div>

            {/* Action Triggers */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    if (onNavigateTab) {
                      onNavigateTab('practice', {
                        subjectId: action.subjectId,
                        conceptId: action.conceptId,
                        topicId: action.topicId,
                      });
                    }
                  }}
                  className="text-xs py-1.5 px-3"
                >
                  <span>Solve 5-Question Ladder</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleScheduleAction(action)}
                  disabled={isScheduled || isScheduling}
                  className="text-xs py-1.5 px-3"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {isScheduled ? 'Scheduled in Planner' : isScheduling ? 'Scheduling...' : 'Schedule Task'}
                </Button>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab('copilot', {
                      prompt: `Explain why I struggled with "${action.title}" and derive the core invariants step-by-step.`,
                    });
                  }
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 py-1.5 px-2.5"
              >
                <Bot className="w-3.5 h-3.5 mr-1" />
                Ask Copilot
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
