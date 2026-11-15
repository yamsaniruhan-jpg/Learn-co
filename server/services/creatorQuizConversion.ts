import type { CreatorResource } from '../../src/types/creator';
import type { QuestionBankItem } from '../../src/types/curriculum';

/** Preserve supplied material only. Structural validation does not verify accuracy. */
export function convertCreatorQuiz(resource: CreatorResource): QuestionBankItem[] {
  if (resource.resourceType !== 'quiz' || !Array.isArray(resource.content?.quiz) || resource.content.quiz.length === 0) {
    throw new Error('Only quizzes with complete answer choices can currently be transferred to practice. Flashcards and worksheets need a suitable practice format first.');
  }
  return resource.content.quiz.map((raw, idx) => {
    const q = raw as any;
    const options = Array.isArray(q?.options) ? q.options : [];
    const index = q?.correctIndex;
    const indexedAnswer = Number.isInteger(index) && index >= 0 && index < options.length ? options[index] : undefined;
    const explicitAnswer = typeof q?.correctAnswer === 'string' ? q.correctAnswer : undefined;
    const answer = explicitAnswer ?? indexedAnswer;
    if (typeof q?.question !== 'string' || !q.question.trim() ||
        options.length < 2 || options.some((option: unknown) => typeof option !== 'string' || !option.trim()) ||
        typeof answer !== 'string' || !answer.trim() || !options.includes(answer) ||
        (index !== undefined && indexedAnswer === undefined) ||
        (explicitAnswer !== undefined && indexedAnswer !== undefined && explicitAnswer !== indexedAnswer)) {
      throw new Error(`Quiz item ${idx + 1} needs a question, at least two answer choices and a matching answer before transfer.`);
    }
    return {
      id: `creator-${resource.id}-${idx + 1}`,
      subjectId: resource.subjectId || 'math',
      examTracks: ['all'],
      chapterId: `ch-${resource.subjectId}-creator`,
      topicId: `topic-${resource.id}`,
      subtopicId: `sub-${resource.id}`,
      conceptId: `concept-${resource.id}`,
      difficulty: resource.difficulty || 'medium',
      questionType: 'single_choice',
      questionText: q.question,
      options,
      correctAnswer: answer,
      explanation: typeof q.explanation === 'string' && q.explanation.trim() ? q.explanation : 'No explanation was provided for this creator question.',
      stepByStepSolution: [],
      hints: [],
      tags: ['creator-studio', resource.subjectId || 'math'],
      source: `Creator Studio: ${resource.title}`,
      verificationStatus: 'creator_imported',
      version: 1,
    };
  });
}
