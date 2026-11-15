import type { QuestionBankItem } from '../types/curriculum';

export type SubmittedAnswer = string | number | string[];

type GradingQuestion = Pick<QuestionBankItem, 'questionType' | 'correctAnswer' | 'numericalTolerance'>;

const normalize = (value: string | number) => String(value).trim().toLowerCase();
const numericPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

/** Reject missing, oversized or malformed answer payloads before recording. */
export function isValidSubmittedAnswer(value: unknown): value is SubmittedAnswer {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.trim().length > 0 && value.length <= 16384;
  return Array.isArray(value) && value.length > 0 && value.length <= 64 &&
    value.every(item => typeof item === 'string' && item.trim().length > 0 && item.length <= 4096) &&
    value.reduce((length, item) => length + item.length, 0) <= 16384;
}

/**
 * Match old comma-joined multi-select submissions without splitting option text:
 * options may contain commas themselves (for example, mathematical intervals).
 * Bound the search to the expected choices, with a practical upper limit.
 */
function matchesLegacyMultiselect(raw: string, expected: string[]): boolean {
  if (expected.length > 8) return false;
  const target = normalize(raw);
  const candidates = expected.map(normalize);
  const search = (prefix: string, remaining: string[]): boolean => {
    if (remaining.length === 0) return prefix === target;
    for (let index = 0; index < remaining.length; index++) {
      const next = prefix ? `${prefix}, ${remaining[index]}` : remaining[index];
      if (target.startsWith(next) && search(next, remaining.filter((_, i) => i !== index))) return true;
    }
    return false;
  };
  return search('', candidates);
}

/** Grade using a question's own answer key. Caller is responsible for provenance. */
export function gradeQuestionAnswer(question: GradingQuestion, selectedAnswer: SubmittedAnswer): boolean {
  if (question.questionType === 'multiple_choice') {
    const expected = Array.isArray(question.correctAnswer) ? question.correctAnswer : [String(question.correctAnswer)];
    if (expected.length === 0) return false;
    if (!Array.isArray(selectedAnswer)) {
      return typeof selectedAnswer === 'string' && matchesLegacyMultiselect(selectedAnswer, expected);
    }
    if (selectedAnswer.length !== expected.length) return false;
    const actual = selectedAnswer.map(normalize).sort();
    const correct = expected.map(normalize).sort();
    return actual.every((value, index) => value === correct[index]);
  }

  if (Array.isArray(selectedAnswer) || Array.isArray(question.correctAnswer)) return false;
  if (question.questionType === 'numerical') {
    const actualText = normalize(selectedAnswer);
    const expectedText = normalize(question.correctAnswer);
    // Some historical "numerical" items have symbolic answers. Do not parse a
    // partial number from a formula; require an exact normalized match instead.
    if (numericPattern.test(expectedText)) {
      if (!numericPattern.test(actualText)) return false;
      const actual = Number(actualText);
      const expected = Number(expectedText);
      const tolerance = question.numericalTolerance ?? 0.05;
      if (!Number.isFinite(actual) || !Number.isFinite(expected) || !Number.isFinite(tolerance) || tolerance < 0) return false;
      if (tolerance === 0) return actual === expected;
      // Accommodate binary rounding at the boundary without materially widening
      // a small tolerance, especially for large expected values.
      const rounding = Math.min(tolerance * 1e-12, Number.EPSILON * Math.max(1, Math.abs(expected), Math.abs(actual)) * 4);
      return Math.abs(actual - expected) <= tolerance + rounding;
    }
  }
  return normalize(selectedAnswer) === normalize(question.correctAnswer);
}
