import { describe, expect, it } from 'vitest';
import { MASTER_QUESTION_BANK } from '../server/data/questionBankData';
import { gradeQuestionAnswer } from '../src/utils/gradeAnswer';

const question = (id: string) => MASTER_QUESTION_BANK.find(q => q.id === id)!;
describe('reviewed question-bank corrections', () => {
  it('uses the work-energy theorem to grade the final speed', () => {
    const q = question('q-phys-we-02');
    const mass = 0.5, initialSpeed = 4, work = 9;
    const expectedSpeed = Math.sqrt(initialSpeed ** 2 + 2 * work / mass);
    expect(q.questionText).toContain('final speed');
    expect(gradeQuestionAnswer(q, expectedSpeed)).toBe(true);
    expect(gradeQuestionAnswer(q, 5.29)).toBe(false);
  });
  it('specifies the conditions needed for the reviewed biology and optimization claims', () => {
    expect(question('q-bio-dna-01').questionText).toContain('eukaryotic');
    const q = question('q-cs-grad-05');
    expect(q.questionText).toContain('attains a global minimum');
    expect(q.questionText).toContain('objective values');
  });
});
