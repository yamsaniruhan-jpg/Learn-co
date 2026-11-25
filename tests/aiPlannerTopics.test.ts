import { describe, expect, it } from 'vitest';
import { PlannerEngine } from '../server/services/plannerEngine';

describe('AI Plan Generator top topics & subtopics identification', () => {
  it('identifies Chemistry (Organic, Inorganic, Physical) & Math (Calculus, Limits, Continuity, Differentiability, Differentiation, Integration, Applications) with subtopics', async () => {
    const { topics } = await PlannerEngine.identifyTopTopics(['chemistry', 'math'], 'Advanced STEM Mastery');

    const chemTopics = topics.filter((t) => t.subjectId === 'chemistry');
    const chemNames = chemTopics.map((t) => t.topic);
    expect(chemNames).toEqual(
      expect.arrayContaining(['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry'])
    );
    for (const grp of chemTopics) {
      expect(grp.subtopics.length).toBeGreaterThanOrEqual(3);
    }

    const mathTopics = topics.filter((t) => t.subjectId === 'math');
    const mathNames = mathTopics.map((t) => t.topic);
    expect(mathNames).toEqual(
      expect.arrayContaining([
        'Limits',
        'Continuity',
        'Differentiability',
        'Differentiation',
        'Integration',
        'Calculus',
        'Applications',
      ])
    );
    for (const grp of mathTopics) {
      expect(grp.subtopics.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('builds a study plan directly from identified Chemistry and Math topics and subtopics', async () => {
    const { topics } = await PlannerEngine.identifyTopTopics(['chemistry', 'math'], 'JEE Advanced Sprint');
    const targetDate = new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0];

    const result = PlannerEngine.generateDeterministicPlan('scholar-1', {
      goalTitle: 'Chemistry & Calculus Sprint',
      targetExamTrack: 'JEE Advanced Sprint',
      subjects: ['chemistry', 'math'],
      targetDate,
      dailyAvailableMinutes: 120,
      preferredStartTime: '17:30',
      availableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      preferredSessionLength: 45,
      identifiedTopicGroups: topics,
      includeWeakMistakeRemediation: true,
      includeSpacedRevision: true,
    });

    expect(result.goal.topics?.length).toBeGreaterThanOrEqual(15);
    expect(result.tasks.length).toBeGreaterThan(10);

    const taskTitles = result.tasks.map((t) => t.title || '').join(' | ');
    expect(taskTitles).toContain('Organic Chemistry');
    expect(taskTitles).toContain('Limits');
  });
});
