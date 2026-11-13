/**
 * Curriculum integrity checks.
 *
 * These exist because the question bank and the curriculum drifted apart
 * silently: 4,600 generated questions pointed at `conceptId`s that no concept
 * ever declared, so no concept could show "practice this" and practice could
 * not route back to theory. Nothing failed loudly — the data just stopped
 * joining up.
 *
 * Run as a test (`tests/curriculum.test.ts`) so a regression fails CI.
 */

import {
  ConceptDetail,
  SubjectCurriculum,
  QuestionBankItem,
} from '../../src/types/curriculum';

export interface CurriculumIndexEntry {
  concept: ConceptDetail;
  subjectId: string;
  chapterId: string;
  topicId: string;
  subtopicId: string;
  chapterTitle: string;
  topicTitle: string;
  subjectName: string;
}

export interface CurriculumIndex {
  byId: Map<string, CurriculumIndexEntry>;
  all: CurriculumIndexEntry[];
}

/** Flatten the nested curriculum into a single lookup index. */
export function buildCurriculumIndex(curriculum: SubjectCurriculum[]): CurriculumIndex {
  const all: CurriculumIndexEntry[] = [];

  for (const subject of curriculum) {
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        for (const subtopic of topic.subtopics) {
          for (const concept of subtopic.concepts) {
            all.push({
              concept,
              subjectId: subject.id,
              chapterId: chapter.id,
              topicId: topic.id,
              subtopicId: subtopic.id,
              chapterTitle: chapter.title,
              topicTitle: topic.title,
              subjectName: subject.name,
            });
          }
        }
      }
    }
  }

  return { byId: new Map(all.map((entry) => [entry.concept.id, entry])), all };
}

export interface CurriculumIntegrityReport {
  conceptCount: number;
  chapterCount: number;
  topicCount: number;
  subtopicCount: number;
  /** Concept ids declared more than once. */
  duplicateConceptIds: string[];
  /** Concept ids re-declared by a later merge (kept once, flagged for review). */
  duplicateNames: string[];
  /** References to concept ids that do not exist. */
  brokenPrerequisites: string[];
  /** Concepts whose declared parent ids do not match their location in the tree. */
  misplacedConcepts: string[];
  /** Topics with fewer than one subtopic. */
  emptyTopics: string[];
  /** Concepts missing the fields the UI renders. */
  incompleteConcepts: string[];
  /** Concepts with no practice question pointing at them. */
  conceptsWithoutQuestions: string[];
  /** Question rows pointing at concepts that do not exist. */
  orphanedQuestions: number;
  /** Unique question ids. */
  duplicateQuestionIds: string[];
}

const REQUIRED_CONCEPT_FIELDS: Array<keyof ConceptDetail> = [
  'title',
  'summary',
  'formalDefinition',
  'intuitiveExplanation',
  'difficulty',
];

/**
 * Verify the merged curriculum is internally consistent and that every
 * concept can be reached from practice.
 */
export function validateCurriculum(
  curriculum: SubjectCurriculum[],
  questions: QuestionBankItem[]
): CurriculumIntegrityReport {
  const index = buildCurriculumIndex(curriculum);
  const seen = new Map<string, number>();
  const names = new Map<string, number>();

  let chapterCount = 0;
  let topicCount = 0;
  let subtopicCount = 0;
  const emptyTopics: string[] = [];
  const misplacedConcepts: string[] = [];
  const incompleteConcepts: string[] = [];

  for (const subject of curriculum) {
    for (const chapter of subject.chapters) {
      chapterCount += 1;
      for (const topic of chapter.topics) {
        topicCount += 1;
        if (topic.subtopics.length === 0) emptyTopics.push(topic.id);

        for (const subtopic of topic.subtopics) {
          subtopicCount += 1;
          for (const concept of subtopic.concepts) {
            seen.set(concept.id, (seen.get(concept.id) || 0) + 1);
            const nameKey = `${concept.subjectId}::${concept.title}`;
            names.set(nameKey, (names.get(nameKey) || 0) + 1);

            if (
              concept.subjectId !== subject.id ||
              concept.chapterId !== chapter.id ||
              concept.topicId !== topic.id ||
              concept.subtopicId !== subtopic.id
            ) {
              misplacedConcepts.push(concept.id);
            }

            for (const field of REQUIRED_CONCEPT_FIELDS) {
              const value = concept[field];
              if (value === undefined || value === null || value === '') {
                incompleteConcepts.push(`${concept.id}:${field}`);
                break;
              }
            }
          }
        }
      }
    }
  }

  const duplicateConceptIds = [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);

  const duplicateNames = [...names.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name);

  const brokenPrerequisites: string[] = [];
  for (const entry of index.all) {
    for (const prerequisite of entry.concept.prerequisites || []) {
      if (!index.byId.has(prerequisite.id)) {
        brokenPrerequisites.push(`${entry.concept.id} -> ${prerequisite.id}`);
      }
    }
  }

  const linkedConceptIds = new Set<string>();
  let orphanedQuestions = 0;
  const questionIds = new Map<string, number>();

  for (const question of questions) {
    questionIds.set(question.id, (questionIds.get(question.id) || 0) + 1);
    if (index.byId.has(question.conceptId)) {
      linkedConceptIds.add(question.conceptId);
    } else {
      orphanedQuestions += 1;
    }
  }

  return {
    conceptCount: index.all.length,
    chapterCount,
    topicCount,
    subtopicCount,
    duplicateConceptIds,
    duplicateNames,
    brokenPrerequisites,
    misplacedConcepts,
    emptyTopics,
    incompleteConcepts,
    conceptsWithoutQuestions: index.all
      .filter((entry) => !linkedConceptIds.has(entry.concept.id))
      .map((entry) => entry.concept.id),
    orphanedQuestions,
    duplicateQuestionIds: [...questionIds.entries()]
      .filter(([, count]) => count > 1)
      .map(([id]) => id),
  };
}
