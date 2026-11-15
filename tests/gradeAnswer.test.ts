import { describe, expect, it } from 'vitest';
import { gradeQuestionAnswer, isValidSubmittedAnswer } from '../src/utils/gradeAnswer';

const multi = { questionType: 'multiple_choice' as const, correctAnswer: ['A, B', 'C', 'D'] };
const numerical = { questionType: 'numerical' as const, correctAnswer: 1.92, numericalTolerance: 0.01 };

describe('question grading', () => {
  it('matches exact sets regardless of order, including choices with commas', () => {
    expect(gradeQuestionAnswer(multi, ['D', 'a, b', ' C '])).toBe(true);
    expect(gradeQuestionAnswer(multi, ['C', 'C', 'D'])).toBe(false);
    expect(gradeQuestionAnswer(multi, ['C', 'D'])).toBe(false);
    expect(gradeQuestionAnswer(multi, ['A, B', 'C', 'D', 'E'])).toBe(false);
    expect(gradeQuestionAnswer({questionType:'multiple_choice',correctAnswer:'A'}, ['A'])).toBe(true);
  });
  it('accepts legacy comma-joined answers without naively splitting commas in choices', () => {
    expect(gradeQuestionAnswer(multi, 'D, A, B, C')).toBe(true);
    expect(gradeQuestionAnswer(multi, 'D, A, B, C, extra')).toBe(false);
    expect(gradeQuestionAnswer(multi, 'A, B, D')).toBe(false);
  });
  it('grades finite numbers inclusively within tolerance, preserving strict zero tolerance', () => {
    expect(gradeQuestionAnswer(numerical, '1.93')).toBe(true);
    expect(gradeQuestionAnswer(numerical, '1.91')).toBe(true);
    expect(gradeQuestionAnswer(numerical, '1.93001')).toBe(false);
    expect(gradeQuestionAnswer(numerical, '1.92junk')).toBe(false);
    expect(gradeQuestionAnswer(numerical, 'Infinity')).toBe(false);
    expect(gradeQuestionAnswer(numerical, '1e999')).toBe(false);
    expect(gradeQuestionAnswer({ ...numerical, numericalTolerance: 0 }, '1.920000000000001')).toBe(false);
    expect(gradeQuestionAnswer({ ...numerical, numericalTolerance: 0 }, 1.92)).toBe(true);
    expect(gradeQuestionAnswer({ ...numerical, numericalTolerance: -1 }, 1.92)).toBe(false);
    expect(gradeQuestionAnswer({ questionType:'numerical', correctAnswer:1 }, '1.05')).toBe(true);
  });
  it('only uses exact normalized matching for symbolic numerical answers', () => {
    const symbolic = { questionType: 'numerical' as const, correctAnswer: '2π' };
    expect(gradeQuestionAnswer(symbolic, ' 2Π ')).toBe(true);
    expect(gradeQuestionAnswer(symbolic, '2')).toBe(false);
  });
  it('rejects malformed answer payloads', () => {
    for (const answer of [undefined, null, '', '  ', NaN, Infinity, {}, [], ['A', null], [''], Array(65).fill('A'), Array(5).fill('x'.repeat(4096))]) {
      expect(isValidSubmittedAnswer(answer)).toBe(false);
    }
    for (const answer of [0, '0', ['A, B', 'C']]) expect(isValidSubmittedAnswer(answer)).toBe(true);
  });
});
