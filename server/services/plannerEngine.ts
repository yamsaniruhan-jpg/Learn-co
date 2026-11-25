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
  TopicSubtopicGroup,
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

export const CURATED_TOP_TOPICS_BY_SUBJECT: Record<string, TopicSubtopicGroup[]> = {
  chemistry: [
    {
      subjectId: 'chemistry',
      topic: 'Organic Chemistry',
      weight: 'HIGH',
      subtopics: [
        'General Organic Chemistry (GOC), Resonance & Inductive Effects',
        'Isomerism & Stereochemistry (R/S, E/Z, Optical Activity)',
        'Reaction Mechanisms: SN1, SN2, E1 & E2',
        'Hydrocarbons, Aldehydes, Ketones & Carboxylic Acids',
        'Amines, Biomolecules & Named Reactions',
      ],
    },
    {
      subjectId: 'chemistry',
      topic: 'Inorganic Chemistry',
      weight: 'HIGH',
      subtopics: [
        'Periodic Trends, Atomic Radius & Ionization Enthalpy',
        'Chemical Bonding, VSEPR, Hybridization & MOT',
        'Coordination Compounds, Crystal Field Theory & Isomerism',
        's, p, d & f-Block Elements and Oxidation States',
        'Qualitative Inorganic Analysis & Metallurgy',
      ],
    },
    {
      subjectId: 'chemistry',
      topic: 'Physical Chemistry',
      weight: 'HIGH',
      subtopics: [
        'Mole Concept, Stoichiometry & Atomic Structure',
        'Thermodynamics, Enthalpy, Entropy & Gibbs Free Energy',
        'Chemical & Ionic Equilibrium (Kp, Kc, pH & Buffers)',
        'Chemical Kinetics, Rate Laws & Arrhenius Equation',
        'Electrochemistry, Nernst Equation & Colligative Properties',
      ],
    },
  ],
  math: [
    {
      subjectId: 'math',
      topic: 'Limits',
      weight: 'HIGH',
      subtopics: [
        'Epsilon-Delta & Left/Right-Hand Limit Foundations',
        'Indeterminate Forms (0/0, ∞/∞, 1^∞) & L’Hôpital’s Rule',
        'Standard Trigonometric, Exponential & Logarithmic Limits',
      ],
    },
    {
      subjectId: 'math',
      topic: 'Continuity',
      weight: 'CORE',
      subtopics: [
        'Continuity at a Point & on Closed Intervals',
        'Classification of Discontinuities (Removable, Jump, Infinite)',
        'Intermediate Value Theorem (IVT) & Root Existence',
      ],
    },
    {
      subjectId: 'math',
      topic: 'Differentiability',
      weight: 'CORE',
      subtopics: [
        'Left & Right Derivatives, Corners & Cusps',
        'Continuity vs Differentiability Relationship',
        'Rolle’s Theorem & Lagrange Mean Value Theorem (LMVT)',
      ],
    },
    {
      subjectId: 'math',
      topic: 'Differentiation',
      weight: 'HIGH',
      subtopics: [
        'First Principles, Product, Quotient & Chain Rule',
        'Implicit, Parametric & Logarithmic Differentiation',
        'Inverse Trigonometric & Higher-Order Derivatives',
      ],
    },
    {
      subjectId: 'math',
      topic: 'Integration',
      weight: 'HIGH',
      subtopics: [
        'Indefinite Integration: Substitution, Parts & Partial Fractions',
        'Definite Integrals, King’s Property & Reduction Formulas',
        'Fundamental Theorem of Calculus & Leibniz Rule',
      ],
    },
    {
      subjectId: 'math',
      topic: 'Calculus',
      weight: 'HIGH',
      subtopics: [
        'Ordinary Differential Equations (Separable, Linear, Exact)',
        'Multivariable Gradients, Partial Derivatives & Lagrange Multipliers',
        'Taylor & Maclaurin Series Expansions',
      ],
    },
    {
      subjectId: 'math',
      topic: 'Applications',
      weight: 'HIGH',
      subtopics: [
        'Tangents, Normals & Related Rates of Change',
        'Monotonicity, Maxima/Minima & Second Derivative Test',
        'Concavity, Inflection Points & Optimization Word Problems',
        'Area Under & Between Curves Using Definite Integrals',
      ],
    },
  ],
  physics: [
    {
      subjectId: 'physics',
      topic: 'Classical Mechanics',
      weight: 'HIGH',
      subtopics: ['Newton’s Laws & Constraints', 'Work, Energy & Conservation', 'Rotational Dynamics & Torque'],
    },
    {
      subjectId: 'physics',
      topic: 'Electromagnetism & Optics',
      weight: 'HIGH',
      subtopics: ['Gauss’s Law & Capacitance', 'Faraday’s Law & Induction', 'Wave Optics & Interference'],
    },
  ],
  cs: [
    {
      subjectId: 'cs',
      topic: 'Algorithms & Data Structures',
      weight: 'HIGH',
      subtopics: ['Asymptotic Big-O & Recurrences', 'Graph Traversal & Dijkstra', 'Dynamic Programming'],
    },
    {
      subjectId: 'cs',
      topic: 'Machine Learning & Systems',
      weight: 'CORE',
      subtopics: ['Gradient Descent Optimization', 'Transformers & Self-Attention', 'Concurrency & CAP Theorem'],
    },
  ],
  biology: [
    {
      subjectId: 'biology',
      topic: 'Molecular Genetics & Cell Biology',
      weight: 'HIGH',
      subtopics: ['DNA Replication & Transcription', 'Enzyme Kinetics & Metabolism', 'Cellular Respiration'],
    },
  ],
};

export class PlannerEngine {
  /**
   * Identify top high-yield topics & subtopics per selected subject (AI-assisted with curated taxonomy fallback)
   */
  static async identifyTopTopics(
    subjects: SubjectId[],
    targetExamTrack?: string,
    customFocus?: string
  ): Promise<{ topics: TopicSubtopicGroup[]; source: 'ai' | 'curated' }> {
    const activeSubjects: SubjectId[] =
      subjects && subjects.length > 0 ? subjects : ['math', 'chemistry'];

    const buildBaseline = (): TopicSubtopicGroup[] => {
      const result: TopicSubtopicGroup[] = [];
      for (const subId of activeSubjects) {
        const preset = CURATED_TOP_TOPICS_BY_SUBJECT[subId];
        if (preset && preset.length > 0) {
          result.push(...preset.map((item) => ({ ...item, subtopics: [...item.subtopics] })));
        } else {
          const subData = CURRICULUM_DATA.find((s) => s.id === subId);
          if (subData?.chapters?.length) {
            subData.chapters.slice(0, 3).forEach((chap) => {
              const subs: string[] = [];
              chap.topics?.forEach((t) => {
                t.subtopics?.forEach((st) => subs.push(st.title));
              });
              result.push({
                subjectId: subId,
                topic: chap.title,
                weight: 'CORE',
                subtopics: subs.slice(0, 5),
              });
            });
          }
        }
      }
      return result;
    };

    const baseline = buildBaseline();
    const ai = getGeminiClient();
    if (!ai) {
      return { topics: baseline, source: 'curated' };
    }

    try {
      const prompt = `You are an expert STEM curriculum planner for ${targetExamTrack || 'STEM Mastery'}.
Identify the top high-yield topics and their specific subtopics for the student's selected subjects: ${activeSubjects.join(', ')}.
${activeSubjects.includes('chemistry') ? 'For Chemistry, you MUST include Organic Chemistry, Inorganic Chemistry, and Physical Chemistry, each with 4-5 specific exam subtopics.' : ''}
${activeSubjects.includes('math') ? 'For Math, you MUST cover Calculus, Limits, Continuity, Differentiability, Differentiation, Integration, and Applications, each with 3-4 concrete subtopics.' : ''}
${customFocus ? `Student focus notes: ${customFocus}` : ''}

Return ONLY valid JSON matching:
{
  "topics": [
    {
      "subjectId": "chemistry | math | physics | cs | biology | english | data_science",
      "topic": "string",
      "weight": "HIGH | CORE | FOUNDATIONAL",
      "subtopics": ["string"]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 1800,
          responseMimeType: 'application/json',
        },
      });
      const text = response.text?.trim();
      if (!text) return { topics: baseline, source: 'curated' };
      const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      const validSet = new Set<string>(activeSubjects);
      if (Array.isArray(parsed?.topics) && parsed.topics.length > 0) {
        const sanitized: TopicSubtopicGroup[] = parsed.topics
          .filter((item: any) => item && typeof item.topic === 'string' && Array.isArray(item.subtopics))
          .map((item: any) => ({
            subjectId: validSet.has(item.subjectId) ? (item.subjectId as SubjectId) : activeSubjects[0],
            topic: String(item.topic).trim(),
            weight: (['HIGH', 'CORE', 'FOUNDATIONAL'].includes(item.weight) ? item.weight : 'HIGH') as 'HIGH' | 'CORE' | 'FOUNDATIONAL',
            subtopics: item.subtopics.map((s: any) => String(s).trim()).filter(Boolean).slice(0, 6),
          }))
          .filter((item: TopicSubtopicGroup) => item.topic.length > 0 && item.subtopics.length > 0);

        // Ensure mandatory Chemistry & Math pillars are preserved if AI omitted any
        for (const reqTopic of baseline) {
          if (reqTopic.subjectId === 'chemistry' || reqTopic.subjectId === 'math') {
            const exists = sanitized.some(
              (s) =>
                s.subjectId === reqTopic.subjectId &&
                s.topic.toLowerCase().includes(reqTopic.topic.toLowerCase().split(' ')[0])
            );
            if (!exists) sanitized.push(reqTopic);
          }
        }
        if (sanitized.length > 0) {
          return { topics: sanitized, source: 'ai' };
        }
      }
    } catch (err: any) {
      console.warn('[PlannerEngine.identifyTopTopics] AI fallback to curated taxonomy:', err?.message || err);
    }

    return { topics: baseline, source: 'curated' };
  }

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

    const prioritizedStrings: string[] = [];
    if (Array.isArray(input.identifiedTopicGroups) && input.identifiedTopicGroups.length > 0) {
      for (const grp of input.identifiedTopicGroups) {
        if (grp.subtopics && grp.subtopics.length > 0) {
          grp.subtopics.forEach((sub) => prioritizedStrings.push(`${grp.topic}: ${sub}`));
        } else if (grp.topic) {
          prioritizedStrings.push(grp.topic);
        }
      }
    } else if (Array.isArray(input.priorityTopics) && input.priorityTopics.length > 0) {
      prioritizedStrings.push(...input.priorityTopics);
    }

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
      topics: prioritizedStrings,
      progressPercent: 0,
      status: 'ACTIVE',
    };

    // 2. Build ordered topic queue: prioritize identified topic/subtopic groups first, then fill from curriculum data
    const subjectConcepts: Array<{
      subjectId: SubjectId;
      topicId: string;
      conceptId: string;
      conceptTitle: string;
    }> = [];

    if (Array.isArray(input.identifiedTopicGroups) && input.identifiedTopicGroups.length > 0) {
      // Interleave across subjects so multi-subject schedules alternate cleanly (e.g. Chemistry & Math)
      const expandedBySub = new Map<SubjectId, Array<{ topic: string; subtopic: string }>>();
      for (const grp of input.identifiedTopicGroups) {
        const list = expandedBySub.get(grp.subjectId) || [];
        const subs = grp.subtopics && grp.subtopics.length > 0 ? grp.subtopics : [grp.topic];
        for (const sub of subs) {
          list.push({ topic: grp.topic, subtopic: sub });
        }
        expandedBySub.set(grp.subjectId, list);
      }
      const queues = Array.from(expandedBySub.entries());
      const maxLen = Math.max(...queues.map(([, list]) => list.length), 0);
      for (let i = 0; i < maxLen; i++) {
        for (const [subId, list] of queues) {
          if (i < list.length) {
            const entry = list[i];
            subjectConcepts.push({
              subjectId: subId,
              topicId: entry.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              conceptId: `topic-${subId}-${i}`,
              conceptTitle: `${entry.topic}: ${entry.subtopic}`,
            });
          }
        }
      }
    }

    if (subjectConcepts.length === 0) {
      selectedSubjects.forEach((subId) => {
        const preset = CURATED_TOP_TOPICS_BY_SUBJECT[subId];
        if (preset && preset.length > 0) {
          preset.forEach((grp) => {
            grp.subtopics.forEach((sub, idx) => {
              subjectConcepts.push({
                subjectId: subId,
                topicId: grp.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                conceptId: `curated-${subId}-${idx}`,
                conceptTitle: `${grp.topic}: ${sub}`,
              });
            });
          });
        } else {
          const subData = CURRICULUM_DATA.find(s => s.id === subId);
          if (subData && subData.chapters) {
            subData.chapters.forEach((chap) => {
              chap.topics?.forEach((topic) => {
                topic.subtopics?.forEach((subtopic) => {
                  subtopic.concepts?.forEach((concept) => {
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
        }
      });
    }
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
          const prevConcept = generatedTasks[generatedTasks.length - 1] || subjectConcepts[0] || {
            conceptTitle: 'STEM',
            subjectId: 'math',
            conceptId: 'generic-concept'
          };
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

      const resolvedTopics =
        input.identifiedTopicGroups && input.identifiedTopicGroups.length > 0
          ? input.identifiedTopicGroups
          : (await this.identifyTopTopics(input.subjects, input.targetExamTrack, input.customPrompt)).topics;

      const promptContext = {
        userGoal: input.goalTitle,
        targetExam: input.targetExamTrack,
        targetDate: input.targetDate,
        subjects: input.subjects,
        identifiedTopicsAndSubtopics: resolvedTopics,
        priorityTopics: input.priorityTopics,
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
Generate a structured, rigorous, paced study plan for a student in JSON format built directly around the identified topics and subtopics.
CRITICAL CONSTRAINTS:
1. Build tasks sequentially from promptContext.identifiedTopicsAndSubtopics (for Chemistry: cover Organic, Inorganic, Physical and their subtopics; for Math: cover Limits, Continuity, Differentiability, Differentiation, Integration, Calculus, and Applications and their subtopics).
2. Daily workload MUST NOT exceed ${input.dailyAvailableMinutes} minutes per day.
3. Daily practice question count across all tasks on any single day MUST NOT exceed 25 questions (enforce Learn.co daily quota).
4. Schedule ONLY on available study days: ${input.availableDays.join(', ')}.
5. Assign realistic start times (e.g. "${input.preferredStartTime}") with duration between 20 and 60 minutes.
6. Task types must be one of: LEARN_CONCEPT, PRACTICE_QUESTIONS, REVIEW_MISTAKES, REVISION, FLASHCARDS, QUIZ, WORKSHEET, MIND_MAP.
7. Return ONLY valid JSON matching this schema:
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

      const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
      let rawJson = '';

      for (const model of candidateModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents,
              config: {
                systemInstruction,
                temperature: 0.3,
                maxOutputTokens: 2500,
                responseMimeType: 'application/json',
              },
            });

            const text = response.text?.trim();
            if (text) {
              rawJson = text;
              break;
            }
          } catch (err: any) {
            console.warn(
              `AI plan generation model ${model} (attempt ${attempt}/2) error:`,
              err?.message || err
            );
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 600));
            }
          }
        }
        if (rawJson) break;
      }

      if (!rawJson) {
        throw new Error('All AI models failed or timed out during plan generation.');
      }

      // Strip potential markdown JSON code block markers
      const cleanedJson = rawJson.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanedJson);

      // Validate and sanitize AI tasks
      const sanitizedTasks: Partial<StudyTask>[] = [];
      const validSubjects: Set<string> = new Set(['math', 'cs', 'physics', 'chemistry', 'biology', 'english', 'data_science']);
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
      console.error('AI plan generation failed or timed out, error:', err?.message || err);
      try {
        return this.generateDeterministicPlan(userId, input);
      } catch (detErr) {
        console.error('Deterministic plan generation also failed:', detErr);
        throw detErr;
      }
    }
  }
}
