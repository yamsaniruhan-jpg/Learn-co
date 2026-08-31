import { GoogleGenAI } from '@google/genai';
import { Database } from '../db';
import { CURRICULUM_DATA } from '../../src/data/curriculumData';
import {
  PlanGenerationInput,
  StudyGoal,
  StudyPlan,
  StudyTask,
  StudyTaskType,
  StudyTaskPriority,
  DayOfWeek,
  ScheduleConflict,
} from '../../src/types/planner';
import { SubjectId } from '../../src/types/curriculum';
import { DAILY_PRACTICE_LIMIT } from '../../src/types/auth';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const DAY_NAME_MAP: Record<number, DayOfWeek> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

export class PlannerEngine {
  /**
   * Deterministic Plan Generator with Pedagogical Invariants
   */
  static generateDeterministicPlan(
    userId: string,
    input: PlanGenerationInput
  ): { plan: Partial<StudyPlan>; tasks: Partial<StudyTask>[]; goal: Partial<StudyGoal> } {
    const startDate = new Date();
    const targetDate = new Date(input.targetDate);
    const totalDays = Math.max(7, Math.ceil((targetDate.getTime() - startDate.getTime()) / 86400000));

    const selectedSubjects: SubjectId[] =
      input.subjects && input.subjects.length > 0 ? input.subjects : ['math', 'cs'];

    // 1. Synthesize Goal
    const goalTitle =
      input.goalTitle || `${input.targetExamTrack || 'STEM'} Comprehensive Mastery`;
    const goal: Partial<StudyGoal> = {
      userId,
      title: goalTitle,
      description: `Targeted study milestones for ${selectedSubjects.map((s) => s.toUpperCase()).join(', ')} targeting ${input.targetExamTrack || 'Board Exam'}.`,
      targetExam: input.targetExamTrack,
      startDate: startDate.toISOString().split('T')[0],
      deadline: input.targetDate,
      subjects: selectedSubjects,
      topics: input.priorityTopics || [],
      progressPercent: 0,
      status: 'ACTIVE',
    };

    // 2. Extract concepts from curriculum data for selected subjects
    const subjectConcepts: Array<{
      subjectId: SubjectId;
      topicId: string;
      conceptId: string;
      conceptTitle: string;
    }> = [];

    selectedSubjects.forEach((subId) => {
      const subData = CURRICULUM_DATA[subId];
      if (subData && subData.courses) {
        subData.courses.forEach((course) => {
          course.chapters.forEach((chap) => {
            chap.topics.forEach((topic) => {
              topic.concepts.forEach((concept) => {
                subjectConcepts.push({
                  subjectId: subId,
                  topicId: topic.id,
                  conceptId: concept.id,
                  conceptTitle: concept.title,
                });
              });
            });
          });
        });
      }
    });

    // 3. Collect recent user mistakes for remediation
    const mistakes = Database.getMistakes(userId);
    const weakMistakes = mistakes.filter(
      (m) => !m.resolved && selectedSubjects.includes(m.subjectId as SubjectId)
    );

    // 4. Distribute tasks across available days
    const availableDaysSet = new Set<DayOfWeek>(
      input.availableDays && input.availableDays.length > 0
        ? input.availableDays
        : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    );

    const preferredStart = input.preferredStartTime || '17:30';
    const [startH, startM] = preferredStart.split(':').map(Number);
    const sessionDuration = input.preferredSessionLength || 45;
    const dailyLimit = input.dailyAvailableMinutes || 120;

    const generatedTasks: Partial<StudyTask>[] = [];
    let conceptIdx = 0;
    let mistakeIdx = 0;

    // Allocate up to 4 weeks or totalDays
    const scheduleLengthDays = Math.min(totalDays, 28);

    for (let dayOffset = 0; dayOffset < scheduleLengthDays; dayOffset++) {
      const currDate = new Date(startDate.getTime() + dayOffset * 86400000);
      const dayOfWeek = DAY_NAME_MAP[currDate.getDay()];

      if (!availableDaysSet.has(dayOfWeek)) {
        continue;
      }

      const dateStr = currDate.toISOString().split('T')[0];
      let dayMinutesUsed = 0;
      let dayQuestionsUsed = 0;
      let slotMinutes = startH * 60 + startM;

      // 1st slot of day: Concept Learning or Review
      if (dayMinutesUsed + sessionDuration <= dailyLimit && subjectConcepts.length > 0) {
        const item = subjectConcepts[conceptIdx % subjectConcepts.length];
        conceptIdx++;

        const taskStart = `${String(Math.floor(slotMinutes / 60) % 24).padStart(2, '0')}:${String(slotMinutes % 60).padStart(2, '0')}`;
        const endMin = slotMinutes + sessionDuration;
        const taskEnd = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

        generatedTasks.push({
          userId,
          title: `${item.conceptTitle} - Deep Concept Derivation`,
          description: `Study fundamental principles and mathematical derivations for ${item.conceptTitle}.`,
          taskType: 'LEARN_CONCEPT' as StudyTaskType,
          subjectId: item.subjectId,
          conceptId: item.conceptId,
          conceptTitle: item.conceptTitle,
          scheduledDate: dateStr,
          scheduledStartTime: taskStart,
          scheduledEndTime: taskEnd,
          estimatedDurationMinutes: sessionDuration,
          priority: 'HIGH' as StudyTaskPriority,
          status: 'NOT_STARTED',
          orderIndex: generatedTasks.length + 1,
        });

        dayMinutesUsed += sessionDuration;
        slotMinutes += sessionDuration + 10; // 10 min break
      }

      // 2nd slot: Calibrated Practice Arena or Mistake Remediation
      const practiceDur = Math.min(35, dailyLimit - dayMinutesUsed);
      if (practiceDur >= 20) {
        const isMistakeDay =
          input.includeWeakMistakeRemediation &&
          weakMistakes.length > 0 &&
          dayOffset % 2 === 1 &&
          mistakeIdx < weakMistakes.length;

        const taskStart = `${String(Math.floor(slotMinutes / 60) % 24).padStart(2, '0')}:${String(slotMinutes % 60).padStart(2, '0')}`;
        const endMin = slotMinutes + practiceDur;
        const taskEnd = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

        if (isMistakeDay) {
          const mistake = weakMistakes[mistakeIdx % weakMistakes.length];
          mistakeIdx++;
          const questionCount = Math.min(4, DAILY_PRACTICE_LIMIT - dayQuestionsUsed);

          generatedTasks.push({
            userId,
            title: `Mistake Remediation Drill: ${mistake.topicId || mistake.subjectId}`,
            description: `Targeted analysis and remediation for previous error: "${mistake.questionText.slice(0, 50)}..."`,
            taskType: 'REVIEW_MISTAKES' as StudyTaskType,
            subjectId: mistake.subjectId as SubjectId,
            conceptId: mistake.conceptId,
            conceptTitle: mistake.topicId,
            scheduledDate: dateStr,
            scheduledStartTime: taskStart,
            scheduledEndTime: taskEnd,
            estimatedDurationMinutes: practiceDur,
            practiceQuestionCount: questionCount,
            priority: 'CRITICAL' as StudyTaskPriority,
            status: 'NOT_STARTED',
            orderIndex: generatedTasks.length + 1,
          });

          dayMinutesUsed += practiceDur;
          dayQuestionsUsed += questionCount;
          slotMinutes += practiceDur + 10;
        } else {
          const prevConcept =
            generatedTasks[generatedTasks.length - 1] || subjectConcepts[0];
          const questionCount = Math.min(5, DAILY_PRACTICE_LIMIT - dayQuestionsUsed);

          generatedTasks.push({
            userId,
            title: `${prevConcept.conceptTitle || 'STEM'} Calibrated Practice Ladder`,
            description: `Solve 5 adaptive questions testing boundary conditions and invariant reasoning.`,
            taskType: 'PRACTICE_QUESTIONS' as StudyTaskType,
            subjectId: prevConcept.subjectId || 'math',
            conceptId: prevConcept.conceptId,
            conceptTitle: prevConcept.conceptTitle,
            scheduledDate: dateStr,
            scheduledStartTime: taskStart,
            scheduledEndTime: taskEnd,
            estimatedDurationMinutes: practiceDur,
            practiceQuestionCount: questionCount,
            priority: 'NORMAL' as StudyTaskPriority,
            status: 'NOT_STARTED',
            orderIndex: generatedTasks.length + 1,
          });

          dayMinutesUsed += practiceDur;
          dayQuestionsUsed += questionCount;
          slotMinutes += practiceDur + 10;
        }
      }

      // 3rd slot (if weekend or available capacity): Spaced Revision or Creator Flashcards
      const remainingMin = dailyLimit - dayMinutesUsed;
      if (remainingMin >= 20 && input.includeSpacedRevision && dayOffset >= 3 && dayOffset % 3 === 0) {
        const taskStart = `${String(Math.floor(slotMinutes / 60) % 24).padStart(2, '0')}:${String(slotMinutes % 60).padStart(2, '0')}`;
        const endMin = slotMinutes + Math.min(30, remainingMin);
        const taskEnd = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
        const revisionCycle = Math.floor(dayOffset / 7) + 1;

        generatedTasks.push({
          userId,
          title: `Spaced Repetition & Retention Drill (Cycle ${revisionCycle})`,
          description: `Spaced retrieval practice to consolidate neural encoding and prevent memory decay.`,
          taskType: 'REVISION' as StudyTaskType,
          subjectId: selectedSubjects[dayOffset % selectedSubjects.length],
          scheduledDate: dateStr,
          scheduledStartTime: taskStart,
          scheduledEndTime: taskEnd,
          estimatedDurationMinutes: Math.min(30, remainingMin),
          isSpacedRevision: true,
          revisionCycle,
          priority: 'HIGH' as StudyTaskPriority,
          status: 'NOT_STARTED',
          orderIndex: generatedTasks.length + 1,
        });
      }
    }

    const totalEstHours = Math.round(
      (generatedTasks.reduce((sum, t) => sum + (t.estimatedDurationMinutes || 0), 0) / 60) * 10
    ) / 10;

    const plan: Partial<StudyPlan> = {
      userId,
      title: `${input.targetExamTrack || 'STEM'} Paced Mastery Sprint`,
      description: `Structured ${selectedSubjects.length}-subject curriculum plan pacing concept mastery, calibrated practice, mistake remediation, and spaced retention.`,
      subjects: selectedSubjects,
      startDate: startDate.toISOString().split('T')[0],
      targetEndDate: input.targetDate,
      status: 'ACTIVE',
      version: 1,
      totalTasksCount: generatedTasks.length,
      completedTasksCount: 0,
      totalEstimatedHours: totalEstHours,
      completedHours: 0,
      aiGenerated: false,
    };

    return { plan, tasks: generatedTasks, goal };
  }

  /**
   * AI-Assisted Plan Generator with Resilient LLM Fallback and Hard Validation
   */
  static async generateAiPlan(
    userId: string,
    input: PlanGenerationInput
  ): Promise<{ plan: Partial<StudyPlan>; tasks: Partial<StudyTask>[]; goal: Partial<StudyGoal> }> {
    const ai = getGeminiClient();

    if (!ai) {
      console.log('Gemini API client not initialized. Using deterministic planner engine.');
      return this.generateDeterministicPlan(userId, input);
    }

    try {
      const userProfile = Database.getProfile(userId);
      const userMistakes = Database.getMistakes(userId);
      const scheduleSettings = Database.getScheduleSettings(userId);

      const promptContext = {
        userGoal: input.goalTitle,
        targetExam: input.targetExamTrack,
        targetDate: input.targetDate,
        subjects: input.subjects,
        dailyAvailableMinutes: input.dailyAvailableMinutes,
        preferredStartTime: input.preferredStartTime,
        availableDays: input.availableDays,
        preferredSessionLength: input.preferredSessionLength,
        unresolvedMistakesCount: userMistakes.filter((m) => !m.resolved).length,
        recentMistakes: userMistakes.slice(0, 3).map((m) => ({
          subject: m.subjectId,
          topic: m.topicId,
          snippet: m.questionText.slice(0, 60),
        })),
        customNotes: input.customPrompt,
      };

      const systemInstruction = `You are the Learn.co Master Education Architect.
Generate a structured, rigorous, paced study plan for a student in JSON format.
CRITICAL CONSTRAINTS:
1. Daily workload MUST NOT exceed ${input.dailyAvailableMinutes} minutes per day.
2. Daily practice question count across all tasks on any single day MUST NOT exceed 25 questions (enforce Learn.co daily quota).
3. Schedule ONLY on available study days: ${input.availableDays.join(', ')}.
4. Assign realistic start times (e.g. "${input.preferredStartTime}") with duration between 20 and 60 minutes.
5. Task types must be one of: LEARN_CONCEPT, PRACTICE_QUESTIONS, REVIEW_MISTAKES, REVISION, FLASHCARDS, QUIZ, WORKSHEET, MIND_MAP.
6. Return ONLY valid JSON matching this schema:
{
  "planTitle": "string",
  "planDescription": "string",
  "goalTitle": "string",
  "goalDescription": "string",
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "taskType": "LEARN_CONCEPT | PRACTICE_QUESTIONS | REVIEW_MISTAKES | REVISION | FLASHCARDS",
      "subjectId": "math | cs | physics | chemistry | biology",
      "conceptTitle": "string",
      "scheduledDate": "YYYY-MM-DD",
      "scheduledStartTime": "HH:MM",
      "scheduledEndTime": "HH:MM",
      "estimatedDurationMinutes": number,
      "practiceQuestionCount": number (optional, <= 10),
      "priority": "LOW | NORMAL | HIGH | CRITICAL",
      "isSpacedRevision": boolean (optional)
    }
  ]
}`;

      const contents = `Create a 14-day study plan based on: ${JSON.stringify(promptContext)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const rawJson = response.text?.trim();
      if (!rawJson) {
        throw new Error('Empty AI response from Gemini');
      }

      const parsed = JSON.parse(rawJson);

      // Validate and sanitize AI tasks
      const sanitizedTasks: Partial<StudyTask>[] = [];
      const validSubjects: Set<string> = new Set(['math', 'cs', 'physics', 'chemistry', 'biology']);
      const validTypes: Set<string> = new Set([
        'LEARN_CONCEPT',
        'READ_NOTES',
        'PRACTICE_QUESTIONS',
        'REVIEW_MISTAKES',
        'REVISION',
        'FLASHCARDS',
        'QUIZ',
        'WORKSHEET',
        'MIND_MAP',
        'CREATOR_RESOURCE_REVIEW',
        'MENTORSHIP_TASK',
      ]);

      if (Array.isArray(parsed.tasks)) {
        parsed.tasks.forEach((t: any, idx: number) => {
          const subId = validSubjects.has(t.subjectId) ? (t.subjectId as SubjectId) : input.subjects[0] || 'math';
          const tType = validTypes.has(t.taskType) ? (t.taskType as StudyTaskType) : 'LEARN_CONCEPT';
          const dur = Math.min(90, Math.max(15, Number(t.estimatedDurationMinutes) || 45));

          sanitizedTasks.push({
            userId,
            title: t.title || `Study Session ${idx + 1}`,
            description: t.description || '',
            taskType: tType,
            subjectId: subId,
            conceptTitle: t.conceptTitle || t.title,
            scheduledDate: t.scheduledDate || new Date().toISOString().split('T')[0],
            scheduledStartTime: t.scheduledStartTime || '17:30',
            scheduledEndTime: t.scheduledEndTime || '18:15',
            estimatedDurationMinutes: dur,
            practiceQuestionCount: Math.min(10, Number(t.practiceQuestionCount) || 0),
            isSpacedRevision: !!t.isSpacedRevision,
            priority: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'].includes(t.priority)
              ? (t.priority as StudyTaskPriority)
              : 'NORMAL',
            status: 'NOT_STARTED',
            orderIndex: idx + 1,
          });
        });
      }

      if (sanitizedTasks.length === 0) {
        throw new Error('AI generated 0 valid tasks');
      }

      const totalMinutes = sanitizedTasks.reduce(
        (sum, t) => sum + (t.estimatedDurationMinutes || 0),
        0
      );

      const plan: Partial<StudyPlan> = {
        userId,
        title: parsed.planTitle || `${input.targetExamTrack || 'STEM'} Accelerated Plan`,
        description: parsed.planDescription || 'AI-optimized study roadmap tailored to diagnostic weak points.',
        subjects: input.subjects,
        startDate: new Date().toISOString().split('T')[0],
        targetEndDate: input.targetDate,
        status: 'ACTIVE',
        version: 1,
        totalTasksCount: sanitizedTasks.length,
        completedTasksCount: 0,
        totalEstimatedHours: Math.round((totalMinutes / 60) * 10) / 10,
        completedHours: 0,
        aiGenerated: true,
        generationPrompt: input.customPrompt || input.goalTitle,
      };

      const goal: Partial<StudyGoal> = {
        userId,
        title: parsed.goalTitle || input.goalTitle,
        description: parsed.goalDescription || `AI-generated roadmap toward ${input.targetExamTrack}.`,
        targetExam: input.targetExamTrack,
        startDate: new Date().toISOString().split('T')[0],
        deadline: input.targetDate,
        subjects: input.subjects,
        topics: input.priorityTopics || [],
        progressPercent: 0,
        status: 'ACTIVE',
      };

      return { plan, tasks: sanitizedTasks, goal };
    } catch (err: any) {
      console.warn('AI plan generation failed or timed out. Falling back to deterministic engine:', err?.message || err);
      return this.generateDeterministicPlan(userId, input);
    }
  }
}
