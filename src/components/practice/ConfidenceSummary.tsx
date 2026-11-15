import React from 'react';
import type { QuestionAttempt } from '../../types';

const levels = [
  ['unsure', 'Unsure'],
  ['somewhat', 'Somewhat sure'],
  ['confident', 'Confident'],
] as const;

/** Descriptive counts only: a question can be attempted more than once. */
export function summarizeConfidence(attempts: QuestionAttempt[]) {
  const rows = levels.map(([level, label]) => {
    const included = attempts.filter(a => a?.confidence === level && a.verification === 'bank' && typeof a.isCorrect === 'boolean');
    return { level, label, total: included.length, correct: included.filter(a => a.isCorrect).length };
  });
  const excluded = attempts.filter(a => levels.some(([level]) => level === a?.confidence) &&
    !(a.verification === 'bank' && typeof a.isCorrect === 'boolean')).length;
  return { rows, excluded };
}

export const ConfidenceSummary: React.FC<{ attempts: QuestionAttempt[] }> = ({ attempts }) => {
  const { rows, excluded } = summarizeConfidence(attempts);
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  return (
    <section aria-labelledby="confidence-title" className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
      <h3 id="confidence-title" className="text-sm font-bold text-slate-900 dark:text-white">Confidence check-in</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400">Optional confidence choices compared with bank-checked answers on this device. This is a practice summary, not a measure of mastery or a prediction; repeated questions count again.</p>
      {total === 0 ? <p className="text-sm text-slate-600 dark:text-slate-300">No bank-checked attempts with confidence recorded yet. You can choose a confidence level before submitting a practice answer.</p> : (
        <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {rows.map(row => <li key={row.level}>{row.label}: {row.total ? `${row.correct} correct out of ${row.total}` : 'no recorded attempts'}</li>)}
        </ul>
      )}
      {excluded > 0 && <p className="text-xs text-slate-600 dark:text-slate-400">{excluded} self-checked, provisional, or older unverified attempt{excluded === 1 ? '' : 's'} excluded. Offline records remain provisional in this device summary even after sync.</p>}
      <p className="text-xs text-slate-600 dark:text-slate-400">Only the most recent 200 locally recorded attempts are kept. Clearing browser storage removes this summary.</p>
    </section>
  );
};
