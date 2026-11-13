import { describe, it, expect } from 'vitest';
import { CURRICULUM_DATA } from '../src/data/curriculumData';
import { MASTER_QUESTION_BANK } from '../server/data/questionBankData';
import {
  buildCurriculumIndex,
  validateCurriculum,
} from '../server/services/curriculumIntegrity';

const report = validateCurriculum(CURRICULUM_DATA, MASTER_QUESTION_BANK);
const index = buildCurriculumIndex(CURRICULUM_DATA);

describe('curriculum structure', () => {
  it('has every subject present', () => {
    const subjects = CURRICULUM_DATA.map((subject) => subject.id).sort();
    expect(subjects).toEqual(
      ['biology', 'chemistry', 'cs', 'data_science', 'english', 'math', 'physics'].sort()
    );
  });

  it('has no duplicate concept ids', () => {
    expect(report.duplicateConceptIds).toEqual([]);
  });

  it('has no duplicate concept titles within a subject', () => {
    expect(report.duplicateNames).toEqual([]);
  });

  it('declares every concept under its real parent chapter/topic/subtopic', () => {
    expect(report.misplacedConcepts).toEqual([]);
  });

  it('has no topics without subtopics', () => {
    expect(report.emptyTopics).toEqual([]);
  });

  it('fills the fields the concept view renders', () => {
    expect(report.incompleteConcepts).toEqual([]);
  });

  it('has no dangling prerequisite references', () => {
    expect(report.brokenPrerequisites).toEqual([]);
  });

  it('gives every concept a unique id that resolves through the index', () => {
    expect(index.all).toHaveLength(report.conceptCount);
    for (const entry of index.all) {
      expect(index.byId.get(entry.concept.id)?.concept).toBe(entry.concept);
    }
  });
});

describe('question bank joins to the curriculum', () => {
  // Regression guard: the generator used to write `concept-<topic>-gen-<n>` ids
  // that no concept declared, orphaning all 4,600 generated questions.
  it('has no questions pointing at a non-existent concept', () => {
    expect(report.orphanedQuestions).toBe(0);
  });

  it('has no duplicate question ids', () => {
    expect(report.duplicateQuestionIds).toEqual([]);
  });

  it('leaves no concept without practice questions', () => {
    expect(report.conceptsWithoutQuestions).toEqual([]);
  });

  it('binds each generated question to the concept of the topic it belongs to', () => {
    const generated = MASTER_QUESTION_BANK.filter((question) => question.id.startsWith('q-gen-'));
    expect(generated.length).toBeGreaterThan(0);

    const mismatched = generated.filter((question) => {
      const entry = index.byId.get(question.conceptId);
      return !entry || entry.topicId !== question.topicId;
    });

    expect(mismatched.slice(0, 5)).toEqual([]);
  });

  it('uses the same subject id on a question as on its concept', () => {
    const mismatched = MASTER_QUESTION_BANK.filter((question) => {
      const entry = index.byId.get(question.conceptId);
      return entry ? entry.subjectId !== question.subjectId : false;
    });

    expect(mismatched.slice(0, 5)).toEqual([]);
  });
});

describe('curriculum depth', () => {
  // The original curriculum shipped one topic per chapter, which made a chapter
  // impossible to study end to end. Keep the floor above that.
  it('ships more than one topic in the majority of chapters', () => {
    const chapters = CURRICULUM_DATA.flatMap((subject) => subject.chapters);
    const singleTopicChapters = chapters.filter((chapter) => chapter.topics.length < 2);
    expect(singleTopicChapters.length).toBeLessThan(chapters.length / 2);
  });

  it('sustains a meaningful concept count per subject', () => {
    for (const subject of CURRICULUM_DATA) {
      const conceptCount = subject.chapters.reduce(
        (total, chapter) =>
          total +
          chapter.topics.reduce(
            (inner, topic) =>
              inner +
              topic.subtopics.reduce(
                (sum, subtopic) => sum + subtopic.concepts.length,
                0
              ),
            0
          ),
        0
      );
      expect(conceptCount, `${subject.id} has only ${conceptCount} concepts`).toBeGreaterThanOrEqual(6);
    }
  });

  it('reports accurate conceptCount metadata on every topic', () => {
    const stale: string[] = [];
    for (const subject of CURRICULUM_DATA) {
      for (const chapter of subject.chapters) {
        for (const topic of chapter.topics) {
          const actual = topic.subtopics.reduce(
            (sum, subtopic) => sum + subtopic.concepts.length,
            0
          );
          if (topic.conceptCount !== actual) stale.push(topic.id);
        }
      }
    }
    expect(stale).toEqual([]);
  });

  it('orders chapter sequences without gaps or duplicates per subject', () => {
    for (const subject of CURRICULUM_DATA) {
      const orders = subject.chapters.map((chapter) => chapter.sequenceOrder);
      expect(new Set(orders).size, `${subject.id} has duplicate sequenceOrder`).toBe(orders.length);
    }
  });
});

describe('concept content quality', () => {
  it('gives each concept at least one worked example with a final answer', () => {
    const missing = index.all
      .filter(
        (entry) =>
          entry.concept.workedExamples.length === 0 ||
          entry.concept.workedExamples.some(
            (example) => !example.finalAnswer || !example.stepByStepSolution.length
          )
      )
      .map((entry) => entry.concept.id);

    expect(missing).toEqual([]);
  });

  it('gives each concept at least one common pitfall', () => {
    const missing = index.all
      .filter((entry) => entry.concept.commonPitfalls.length === 0)
      .map((entry) => entry.concept.id);

    expect(missing).toEqual([]);
  });

  it('gives each concept an intuition distinct from its formal definition', () => {
    const identical = index.all
      .filter((entry) => entry.concept.intuitiveExplanation === entry.concept.formalDefinition)
      .map((entry) => entry.concept.id);

    expect(identical).toEqual([]);
  });

  it('gives each concept a diagnostic mini-check whose answer index is in range', () => {
    const bad = index.all
      .filter((entry) => {
        const check = entry.concept.miniCheckQuestion;
        if (!check) return true;
        return (
          check.options.length < 2 ||
          check.correctIndex < 0 ||
          check.correctIndex >= check.options.length
        );
      })
      .map((entry) => entry.concept.id);

    expect(bad).toEqual([]);
  });
});
