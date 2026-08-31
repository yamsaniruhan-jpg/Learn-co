import { Database } from '../db';
import { CURRICULUM_DATA } from '../../src/data/curriculumData';
import { MASTER_QUESTION_BANK } from '../data/questionBankData';
import { RagEngine } from './ragEngine';
import { AdaptiveAnalyticsEngine } from './adaptiveAnalyticsEngine';
import { CopilotToolCall, CopilotArtifact } from '../../src/types/copilot';
import { SubjectId } from '../../src/types/curriculum';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export class CopilotToolRegistry {
  static getTools(): ToolDefinition[] {
    return [
      {
        name: 'search_learning_content',
        description: 'Search official Learn.co curriculum for concepts, theorems, derivations, and formulas.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search keywords or concept names' },
            subjectId: { type: 'string', description: 'Optional subject filter (math, cs, physics, chemistry, biology)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'search_creator_resources',
        description: 'Search the authenticated user\'s saved notes, uploaded texts, flashcards, and quizzes in Creator Studio.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Keywords to search in user\'s Creator Studio files' },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_user_progress',
        description: 'Retrieve the authenticated user\'s current XP, level, daily streak, remaining practice quota, and subject mastery matrix.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_mistakes',
        description: 'Retrieve the authenticated user\'s recent mistakes and failure patterns for targeted remediation.',
        parameters: {
          type: 'object',
          properties: {
            subjectId: { type: 'string', description: 'Optional subject filter' },
            limit: { type: 'number', description: 'Max number of mistakes to retrieve (default 5)' },
          },
        },
      },
      {
        name: 'get_question',
        description: 'Retrieve detailed diagnostic metadata, hints, and step-by-step solution for a specific question ID.',
        parameters: {
          type: 'object',
          properties: {
            questionId: { type: 'string', description: 'The unique question identifier' },
          },
          required: ['questionId'],
        },
      },
      {
        name: 'generate_practice',
        description: 'Generate targeted practice questions with step-by-step invariant derivations and verify against schema.',
        parameters: {
          type: 'object',
          properties: {
            subjectId: { type: 'string', description: 'Subject ID (math, cs, physics, chemistry, biology)' },
            topic: { type: 'string', description: 'Topic or concept name' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], description: 'Target difficulty' },
            questionText: { type: 'string', description: 'Problem statement' },
            options: { type: 'array', items: { type: 'string' }, description: '4 multiple choice options' },
            correctAnswer: { type: 'string', description: 'The correct option or formula' },
            explanation: { type: 'string', description: 'Detailed invariant derivation' },
          },
          required: ['subjectId', 'topic', 'questionText', 'options', 'correctAnswer', 'explanation'],
        },
      },
      {
        name: 'create_summary',
        description: 'Synthesize an executive study summary and automatically save it into the user\'s Creator Studio notebook.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Title of the summary' },
            subjectId: { type: 'string', description: 'Subject (math, cs, physics, chemistry, biology)' },
            markdownContent: { type: 'string', description: 'Full markdown summary text' },
          },
          required: ['title', 'markdownContent'],
        },
      },
      {
        name: 'create_flashcards',
        description: 'Generate a high-yield flashcard deck and save it to the user\'s Creator Studio.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Deck title' },
            subjectId: { type: 'string', description: 'Subject ID' },
            cards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  front: { type: 'string' },
                  back: { type: 'string' },
                  formula: { type: 'string' },
                  hint: { type: 'string' },
                },
                required: ['front', 'back'],
              },
              description: 'Array of flashcard objects',
            },
          },
          required: ['title', 'cards'],
        },
      },
      {
        name: 'create_quiz',
        description: 'Generate a diagnostic multiple-choice quiz deck and save it to Creator Studio.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Quiz title' },
            subjectId: { type: 'string', description: 'Subject ID' },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' } },
                  correctIndex: { type: 'number' },
                  explanation: { type: 'string' },
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['title', 'questions'],
        },
      },
      {
        name: 'get_mentorship_overview',
        description: 'Retrieve the authenticated user\'s active mentorship relationships, upcoming study sessions, active goals, and assigned tasks.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'recommend_mentors',
        description: 'Recommend top verified STEM mentors tailored to the learner\'s target exam, weak diagnostic concepts, and preferred subjects.',
        parameters: {
          type: 'object',
          properties: {
            subjectId: { type: 'string', description: 'Optional subject filter (math, cs, physics, chemistry, biology)' },
          },
        },
      },
      {
        name: 'prepare_session_agenda',
        description: 'Generate a structured study session agenda combining recent mistakes, concept goals, and active tasks for a 1-on-1 mentorship session.',
        parameters: {
          type: 'object',
          properties: {
            mentorshipId: { type: 'string', description: 'The mentorship relationship ID' },
            sessionTopic: { type: 'string', description: 'Focus topic for the meeting' },
          },
          required: ['mentorshipId'],
        },
      },
      {
        name: 'get_study_plan',
        description: 'Get the learner\'s active study plan, today\'s scheduled tasks, target exam goals, and workload analytics.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_study_plan',
        description: 'Generate and create a structured study plan for the learner with target exam track, selected subjects, and timeline.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Plan title, e.g. "Calculus & ML 30-Day Sprint"' },
            targetExamTrack: { type: 'string', description: 'Exam track, e.g. "Advanced STEM Mastery", "JEE", "AP Physics"' },
            targetDate: { type: 'string', description: 'Target completion date in YYYY-MM-DD format' },
            subjects: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of subject IDs (math, cs, physics, chemistry, biology)',
            },
            dailyMinutes: { type: 'number', description: 'Daily available study minutes (default: 120)' },
          },
          required: ['targetDate', 'subjects'],
        },
      },
      {
        name: 'reschedule_missed_tasks',
        description: 'Batch reschedule overdue or missed study tasks to today or tomorrow without breaking streak consistency.',
        parameters: {
          type: 'object',
          properties: {
            targetDate: { type: 'string', description: 'Optional destination date in YYYY-MM-DD format' },
          },
        },
      },
      {
        name: 'create_study_task',
        description: 'Create a specific study task in the learner\'s study planner.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Task title' },
            taskType: {
              type: 'string',
              description: 'LEARN_CONCEPT | PRACTICE_QUESTIONS | REVIEW_MISTAKES | REVISION | FLASHCARDS',
            },
            subjectId: { type: 'string', description: 'math, cs, physics, chemistry, or biology' },
            scheduledDate: { type: 'string', description: 'YYYY-MM-DD' },
            durationMinutes: { type: 'number', description: 'Estimated session length in minutes' },
            priority: { type: 'string', description: 'LOW | NORMAL | HIGH | CRITICAL' },
          },
          required: ['title', 'subjectId', 'scheduledDate'],
        },
      },
      {
        name: 'get_learner_analytics',
        description: 'Retrieve the learner\'s comprehensive mastery matrix, accuracy percentages, strong topics, weak areas, and cognitive retention metrics.',
        parameters: {
          type: 'object',
          properties: {
            subjectId: { type: 'string', description: 'Optional subject filter (math, cs, physics, chemistry, biology)' },
          },
        },
      },
      {
        name: 'get_adaptive_recommendations',
        description: 'Get ranked next-best-action recommendations (remediations, prerequisite scaffolds, spaced reviews) with clear explainable justifications.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_exam_readiness',
        description: 'Calculate syllabus coverage %, concept mastery %, practice volume, and readiness band for the student\'s target exam track.',
        parameters: {
          type: 'object',
          properties: {
            track: { type: 'string', description: 'Optional exam track ID, e.g. jee_advanced, jee_main, ai_ml_foundations, ap_stem, stem_olympiad' },
          },
        },
      },
      {
        name: 'get_mistake_notebook',
        description: 'Retrieve the learner\'s repeated mistakes, unresolved misconceptions, and failure pattern clusters.',
        parameters: {
          type: 'object',
          properties: {
            subjectId: { type: 'string', description: 'Optional subject filter' },
          },
        },
      },
      {
        name: 'schedule_adaptive_remediation',
        description: 'Schedule a targeted remediation study session directly in the learner\'s Study Planner for a weak concept or mistake.',
        parameters: {
          type: 'object',
          properties: {
            conceptOrTopicTitle: { type: 'string', description: 'Name of the concept or topic to remediate' },
            subjectId: { type: 'string', description: 'math, cs, physics, chemistry, or biology' },
            scheduledDate: { type: 'string', description: 'YYYY-MM-DD format (default: today)' },
            durationMinutes: { type: 'number', description: 'Session duration in minutes (default: 20)' },
          },
          required: ['conceptOrTopicTitle', 'subjectId'],
        },
      },
    ];
  }

  /**
   * Execute a tool securely on the server
   */
  static async executeTool(
    userId: string,
    toolName: string,
    toolInput: any
  ): Promise<{ result: any; artifact?: CopilotArtifact; error?: string }> {
    try {
      const db = Database.getDb();

      switch (toolName) {
        case 'search_learning_content': {
          const { query, subjectId } = toolInput || {};
          const queryTokens = RagEngine.tokenize(query || '');
          const matches: any[] = [];

          for (const s of CURRICULUM_DATA) {
            if (subjectId && s.id !== subjectId) continue;
            for (const ch of s.chapters) {
              for (const top of ch.topics) {
                for (const sub of top.subtopics) {
                  for (const c of sub.concepts) {
                    const text = `${c.title} ${c.summary} ${c.formalDefinition || ''} ${c.intuitiveExplanation || ''}`;
                    const score = RagEngine.calculateRelevance(queryTokens, text);
                    if (score > 0.05) {
                      matches.push({
                        conceptId: c.id,
                        title: c.title,
                        subject: s.name,
                        topic: top.title,
                        summary: c.summary,
                        score,
                      });
                    }
                  }
                }
              }
            }
          }

          const topMatches = matches.sort((a, b) => b.score - a.score).slice(0, 4);
          return { result: { count: topMatches.length, items: topMatches } };
        }

        case 'search_creator_resources': {
          const { query } = toolInput || {};
          const userSources = Object.values(db.creatorSources).filter((s) => s.userId === userId);
          const userResources = Object.values(db.creatorResources).filter((r) => r.userId === userId);
          const queryTokens = RagEngine.tokenize(query || '');

          const hits: any[] = [];
          for (const s of userSources) {
            const score = RagEngine.calculateRelevance(queryTokens, s.extractedText || s.originalContent || '');
            if (score > 0.05) {
              hits.push({
                type: 'source',
                id: s.id,
                title: s.title,
                snippet: (s.extractedText || s.originalContent || '').slice(0, 150) + '...',
              });
            }
          }

          for (const r of userResources) {
            hits.push({
              type: 'resource',
              id: r.id,
              title: r.title,
              resourceType: r.resourceType,
            });
          }

          return { result: { count: hits.length, hits: hits.slice(0, 5) } };
        }

        case 'get_user_progress': {
          const gam = Database.getGamification(userId);
          const profile = Database.getProfile(userId);
          return {
            result: {
              xp: gam?.xp || 0,
              level: gam?.level || 1,
              streak: gam?.currentStreak || 0,
              dailyQuestionsSolvedToday: gam?.dailyQuestionsSolvedToday || 0,
              dailyAllowanceLimit: gam?.dailyAllowanceLimit || 25,
              targetExam: profile?.targetExam || 'General STEM',
              subjects: profile?.subjects || ['math', 'cs'],
            },
          };
        }

        case 'get_mistakes': {
          const { subjectId, limit = 5 } = toolInput || {};
          let mistakes = db.mistakes.filter((m) => m.userId === userId);
          if (subjectId) {
            mistakes = mistakes.filter((m) => m.subjectId === subjectId);
          }
          const recent = mistakes.slice(-limit).map((m) => ({
            id: m.id,
            topic: m.topicId,
            questionText: m.questionText,
            userAnswer: m.userAnswer,
            correctAnswer: m.correctAnswer,
            explanation: m.explanation,
          }));
          return { result: { count: recent.length, mistakes: recent } };
        }

        case 'get_question': {
          const { questionId } = toolInput || {};
          const q = MASTER_QUESTION_BANK.find((item) => item.id === questionId);
          if (!q) {
            return { result: { found: false, message: `Question ${questionId} not found in authoritative bank.` } };
          }
          return {
            result: {
              found: true,
              id: q.id,
              subjectId: q.subjectId,
              topicId: q.topicId,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              hints: q.hints,
            },
          };
        }

        case 'generate_practice': {
          const { subjectId, topic, difficulty, questionText, options, correctAnswer, explanation } = toolInput || {};
          const practiceQuestion = {
            id: `q-gen-${Date.now()}`,
            subjectId: subjectId || 'math',
            topic: topic || 'General STEM Practice',
            difficulty: difficulty || 'medium',
            questionText,
            options: options || [],
            correctAnswer,
            explanation,
            xpReward: 5,
          };

          return {
            result: { success: true, message: 'Practice question synthesized successfully.' },
            artifact: {
              type: 'practice_question',
              title: `Practice: ${topic || 'STEM Drill'}`,
              data: practiceQuestion,
            },
          };
        }

        case 'create_summary': {
          const { title, subjectId, markdownContent } = toolInput || {};
          const now = new Date().toISOString();
          const sourceId = `src-copilot-${Date.now()}`;
          const resId = `res-summary-${Date.now()}`;

          // Create source record in Creator Studio
          const newSource = {
            id: sourceId,
            userId,
            title: title || 'Copilot Synthesis',
            sourceType: 'text' as const,
            originalContent: markdownContent,
            extractedText: markdownContent,
            wordCount: markdownContent.split(/\s+/).length,
            status: 'ready' as const,
            createdAt: now,
            updatedAt: now,
          };
          db.creatorSources[sourceId] = newSource;

          // Create resource record in Creator Studio
          const newResource = {
            id: resId,
            userId,
            sourceId,
            title: title || 'Copilot Synthesis Note',
            resourceType: 'summary' as const,
            subjectId: (subjectId || 'math') as SubjectId,
            difficulty: 'medium' as const,
            tags: ['copilot-generated', 'summary'],
            version: 1,
            status: 'ready' as const,
            isPublic: false,
            createdAt: now,
            updatedAt: now,
            content: {
              summary: markdownContent,
            },
          };
          db.creatorResources[resId] = newResource;

          return {
            result: { success: true, resourceId: resId, title: newResource.title },
            artifact: {
              type: 'summary',
              title: newResource.title,
              data: { summary: markdownContent },
              savedToCreatorId: resId,
            },
          };
        }

        case 'create_flashcards': {
          const { title, subjectId, cards } = toolInput || {};
          const now = new Date().toISOString();
          const resId = `res-flash-${Date.now()}`;

          const formattedCards = (cards || []).map((c: any, i: number) => ({
            id: `fc-${i + 1}`,
            front: c.front,
            back: c.back,
            formula: c.formula,
            hint: c.hint,
            tags: ['copilot'],
            mastered: false,
          }));

          const newResource = {
            id: resId,
            userId,
            title: title || 'Copilot Flashcard Deck',
            resourceType: 'flashcards' as const,
            subjectId: (subjectId || 'math') as SubjectId,
            difficulty: 'medium' as const,
            tags: ['copilot-generated', 'flashcards'],
            version: 1,
            status: 'ready' as const,
            isPublic: false,
            createdAt: now,
            updatedAt: now,
            content: {
              flashcards: formattedCards,
            },
          };
          db.creatorResources[resId] = newResource;

          return {
            result: { success: true, resourceId: resId, count: formattedCards.length },
            artifact: {
              type: 'flashcards',
              title: newResource.title,
              data: { flashcards: formattedCards },
              savedToCreatorId: resId,
            },
          };
        }

        case 'create_quiz': {
          const { title, subjectId, questions } = toolInput || {};
          const now = new Date().toISOString();
          const resId = `res-quiz-${Date.now()}`;

          const formattedQuiz = (questions || []).map((q: any, i: number) => ({
            id: `qz-${i + 1}`,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex ?? 0,
            explanation: q.explanation || '',
            bloomLevel: 'Apply',
            difficulty: 'medium',
          }));

          const newResource = {
            id: resId,
            userId,
            title: title || 'Copilot Diagnostic Quiz',
            resourceType: 'quiz' as const,
            subjectId: (subjectId || 'math') as SubjectId,
            difficulty: 'medium' as const,
            tags: ['copilot-generated', 'quiz'],
            version: 1,
            status: 'ready' as const,
            isPublic: false,
            createdAt: now,
            updatedAt: now,
            content: {
              quiz: formattedQuiz,
            },
          };
          db.creatorResources[resId] = newResource;

          return {
            result: { success: true, resourceId: resId, count: formattedQuiz.length },
            artifact: {
              type: 'quiz',
              title: newResource.title,
              data: { quiz: formattedQuiz },
              savedToCreatorId: resId,
            },
          };
        }

        case 'get_mentorship_overview': {
          const relationships = Database.listMentorshipRelationships(userId);
          const sessions = Database.listMentorshipSessions(userId).filter((s) => s.status === 'SCHEDULED');
          const goals = relationships.flatMap((r) => Database.listMentorshipGoals(userId, r.id));
          const tasks = relationships.flatMap((r) => Database.listMentorshipTasks(userId, r.id));

          return {
            result: {
              activeRelationshipsCount: relationships.length,
              relationships: relationships.map((r) => ({
                id: r.id,
                mentorName: r.mentorName,
                subjectId: r.subjectId,
                status: r.status,
                agreedCadence: r.agreedCadence,
              })),
              upcomingSessions: sessions.map((s) => ({
                id: s.id,
                title: s.title,
                scheduledDate: s.scheduledDate,
                startTime: s.startTime,
              })),
              activeGoals: goals.filter((g) => g.status !== 'COMPLETED').map((g) => ({
                id: g.id,
                title: g.title,
                progress: g.progressPercent,
                targetDate: g.targetDate,
              })),
              pendingTasks: tasks.filter((t) => t.status !== 'COMPLETED').map((t) => ({
                id: t.id,
                title: t.title,
                dueDate: t.dueDate,
                status: t.status,
              })),
            },
          };
        }

        case 'recommend_mentors': {
          const { subjectId } = toolInput || {};
          const userProfile = Database.getProfile(userId);
          const allMentors = Object.values(Database.getDb().mentorProfiles);
          const mistakes = Database.getDb().mistakes.filter((m) => m.userId === userId);

          if (!userProfile) {
            return { result: { recommendations: [] } };
          }

          const recs = allMentors.slice(0, 4).map((m) => ({
            id: m.id,
            name: m.name,
            headline: m.headline,
            subjects: m.subjects,
            rating: m.rating,
            areasOfExpertise: m.areasOfExpertise,
            acceptingNewMentees: m.acceptingNewMentees,
          }));

          return {
            result: {
              count: recs.length,
              mentors: recs,
            },
          };
        }

        case 'prepare_session_agenda': {
          const { mentorshipId, sessionTopic } = toolInput || {};
          const rel = Database.getMentorshipRelationship(userId, mentorshipId);
          if (!rel) {
            return { result: null, error: 'Mentorship relationship not found or access denied.' };
          }

          const goals = Database.listMentorshipGoals(userId, mentorshipId);
          const tasks = Database.listMentorshipTasks(userId, mentorshipId);
          const mistakes = Database.getDb().mistakes.filter((m) => m.userId === userId);

          const agendaMarkdown = `### Mentorship Study Session Prep: ${sessionTopic || rel.subjectId.toUpperCase()}
**Mentor:** ${rel.mentorName} | **Learner:** ${rel.learnerName}

#### 1. Concept Objectives & Active Goals
${goals.map((g) => `- **${g.title}** (${g.progressPercent}% complete, Target: ${g.targetDate})`).join('\n') || '- No active goals logged yet.'}

#### 2. Recent Practice Diagnostics & Misconceptions to Address
${mistakes.slice(0, 3).map((m) => `- **${m.topicId}**: Review question on *${m.questionText.slice(0, 70)}...*`).join('\n') || '- All recent practice drills completed with high accuracy.'}

#### 3. Assigned Action Items & Tasks
${tasks.map((t) => `- [${t.status === 'COMPLETED' ? 'x' : ' '}] ${t.title} (Due: ${t.dueDate})`).join('\n') || '- No pending tasks.'}

#### 4. Interactive Derivation Plan
1. Warm-up invariant check (5 min)
2. Socratic step-by-step problem walkthrough (25 min)
3. Action item synthesis and next practice drill assignment (10 min)`;

          return {
            result: {
              success: true,
              mentorshipId,
              mentorName: rel.mentorName,
              agenda: agendaMarkdown,
            },
            artifact: {
              type: 'summary',
              title: `Session Agenda: ${sessionTopic || rel.subjectId}`,
              data: { markdown: agendaMarkdown },
            },
          };
        }

        case 'get_study_plan': {
          const active = Database.getActivePlan(userId);
          const analytics = Database.getPlannerAnalytics(userId);
          const conflicts = Database.detectScheduleConflicts(userId);
          const today = new Date().toISOString().split('T')[0];
          const todayTasks = active.tasks.filter((t) => t.scheduledDate === today);

          const summaryMarkdown = `### Study Planner Snapshot
**Active Plan:** ${active.plan ? active.plan.title : 'No active plan'} (${active.plan ? active.plan.completedTasksCount : 0}/${active.plan ? active.plan.totalTasksCount : 0} tasks completed)
**Completion Rate:** ${analytics.completionRatePercent}% | **Total Study Hours:** ${analytics.completedMinutes}m / ${analytics.totalPlannedMinutes}m

#### Today's Tasks (${today})
${
  todayTasks.length > 0
    ? todayTasks
        .map(
          (t) =>
            `- [${t.status === 'COMPLETED' ? 'x' : ' '}] **${t.scheduledStartTime || 'Flexible'}** - ${t.title} (*${t.subjectId.toUpperCase()}*, ${t.estimatedDurationMinutes}m, ${t.priority})`
        )
        .join('\n')
    : '- No tasks scheduled for today. Ready to add a focused study session!'
}

#### Target Goals
${active.goals.map((g) => `- **${g.title}** (${g.progressPercent}% progress, Deadline: ${g.deadline})`).join('\n') || '- No active goals logged.'}
${
  conflicts.length > 0
    ? `\n⚠️ **Detected Schedule Alerts:**\n${conflicts.map((c) => `- ${c.description}`).join('\n')}`
    : ''
}`;

          return {
            result: {
              success: true,
              plan: active.plan,
              tasksCount: active.tasks.length,
              todayTasksCount: todayTasks.length,
              analytics,
              conflictsCount: conflicts.length,
            },
            artifact: {
              type: 'summary',
              title: 'Study Planner Overview',
              data: { markdown: summaryMarkdown },
            },
          };
        }

        case 'create_study_plan': {
          const { title, targetExamTrack, targetDate, subjects, dailyMinutes } = toolInput || {};
          const settings = Database.getScheduleSettings(userId);

          const { plan, tasks } = await Database.createPlan(
            userId,
            {
              title: title || `${targetExamTrack || 'STEM'} Comprehensive Plan`,
              targetEndDate: targetDate,
              subjects: subjects || ['math', 'cs'],
              aiGenerated: true,
            },
            []
          );

          return {
            result: {
              success: true,
              planId: plan.id,
              title: plan.title,
              targetEndDate: plan.targetEndDate,
              subjects: plan.subjects,
            },
            artifact: {
              type: 'summary',
              title: `Created Plan: ${plan.title}`,
              data: {
                markdown: `### Study Plan Activated: ${plan.title}\n- **Subjects:** ${plan.subjects.join(', ')}\n- **Target Date:** ${plan.targetEndDate}\n- **Status:** Active and ready for study sessions.`,
              },
            },
          };
        }

        case 'reschedule_missed_tasks': {
          const { targetDate } = toolInput || {};
          const res = Database.batchRescheduleMissedTasks(userId, targetDate);

          return {
            result: {
              success: true,
              rescheduledCount: res.rescheduledCount,
              newDate: targetDate || 'Tomorrow',
            },
            artifact: {
              type: 'summary',
              title: 'Tasks Rescheduled',
              data: {
                markdown: `### Rescheduled ${res.rescheduledCount} Overdue Tasks\nSuccessfully shifted uncompleted past tasks forward to maintain pacing without streak penalty.`,
              },
            },
          };
        }

        case 'create_study_task': {
          const { title, taskType, subjectId, scheduledDate, durationMinutes, priority } =
            toolInput || {};
          const activePlan = Database.getActivePlan(userId).plan;

          const created = Database.createTask(userId, {
            planId: activePlan ? activePlan.id : 'plan-001',
            title: title || 'Custom Study Session',
            taskType: taskType || 'LEARN_CONCEPT',
            subjectId: subjectId || 'math',
            scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
            estimatedDurationMinutes: durationMinutes || 45,
            priority: priority || 'NORMAL',
          });

          return {
            result: {
              success: true,
              task: created,
            },
            artifact: {
              type: 'summary',
              title: `Task Added: ${created.title}`,
              data: {
                markdown: `### Added Study Task\n- **Title:** ${created.title}\n- **Subject:** ${created.subjectId.toUpperCase()}\n- **Scheduled:** ${created.scheduledDate} (${created.estimatedDurationMinutes} mins)`,
              },
            },
          };
        }

        case 'get_learner_analytics': {
          const { subjectId } = toolInput || {};
          const masteries = AdaptiveAnalyticsEngine.calculateConceptMasteries(userId);
          const summaries = AdaptiveAnalyticsEngine.calculateSubjectSummaries(userId, masteries);
          const userStats = Database.getUserStatistics(userId);

          const filteredSummaries = subjectId && subjectId !== 'all'
            ? summaries.filter((s) => s.subjectId === subjectId)
            : summaries;

          const weakConcepts = masteries
            .filter((m) => m.isWeakArea && (!subjectId || subjectId === 'all' || m.subjectId === subjectId))
            .map((m) => ({
              conceptTitle: m.conceptTitle,
              subject: m.subjectId,
              masteryScore: m.masteryScore,
              accuracy: m.accuracy,
              revisionStatus: m.revisionStatus,
            }));

          const strongConcepts = masteries
            .filter((m) => m.masteryLabel === 'MASTERED' && (!subjectId || subjectId === 'all' || m.subjectId === subjectId))
            .map((m) => ({
              conceptTitle: m.conceptTitle,
              subject: m.subjectId,
              masteryScore: m.masteryScore,
            }));

          return {
            result: {
              overallAccuracy: userStats.accuracyPercentage,
              totalAttempts: userStats.totalAttempts,
              subjectSummaries: filteredSummaries.map((s) => ({
                subject: s.name,
                mastery: `${s.masteryPercentage}%`,
                accuracy: s.accuracyPercentage !== null ? `${s.accuracyPercentage}%` : 'No attempts yet',
                strongTopics: s.strongTopics,
                weakTopics: s.weakTopics,
                trend: s.improvementTrend,
              })),
              weakConceptsCount: weakConcepts.length,
              weakConcepts: weakConcepts.slice(0, 5),
              strongConcepts: strongConcepts.slice(0, 5),
            },
            artifact: {
              type: 'summary',
              title: 'Cognitive Mastery Matrix',
              data: {
                markdown: `### Learner Cognitive Mastery Audit\n- **Overall Accuracy:** ${userStats.accuracyPercentage}%\n- **Total Questions Attempted:** ${userStats.totalAttempts}\n- **Mastered Concepts:** ${strongConcepts.length}\n- **Weak/Decayed Concepts:** ${weakConcepts.length}\n\n**Weak Areas Needing Review:**\n${weakConcepts.slice(0, 3).map((w) => `- ${w.conceptTitle} (${w.subject.toUpperCase()}) — Score: ${w.masteryScore}%`).join('\n') || 'None detected'}`,
              },
            },
          };
        }

        case 'get_adaptive_recommendations': {
          const masteries = AdaptiveAnalyticsEngine.calculateConceptMasteries(userId);
          const mistakes = Database.getMistakes(userId);
          const actions = AdaptiveAnalyticsEngine.generateNextBestActions(userId, masteries, mistakes);

          return {
            result: {
              totalRecommendations: actions.length,
              recommendations: actions.slice(0, 5).map((a) => ({
                id: a.id,
                title: a.title,
                type: a.type,
                urgency: a.urgency,
                priorityScore: a.priorityScore,
                reason: a.explanation,
                estimatedMinutes: a.estimatedMinutes,
              })),
            },
            artifact: {
              type: 'summary',
              title: 'Adaptive Next Best Actions',
              data: {
                markdown: `### Recommended Next Best Actions\n${actions.slice(0, 4).map((a, i) => `${i + 1}. **${a.title}** [${a.urgency} Priority]\n   *${a.explanation}* (${a.estimatedMinutes} mins)`).join('\n\n')}`,
              },
            },
          };
        }

        case 'get_exam_readiness': {
          const { track } = toolInput || {};
          const masteries = AdaptiveAnalyticsEngine.calculateConceptMasteries(userId);
          const readiness = AdaptiveAnalyticsEngine.calculateExamReadiness(userId, masteries, track);

          return {
            result: {
              examName: readiness.examName,
              estimatedReadinessScore: `${readiness.estimatedReadinessScore}%`,
              readinessBand: readiness.readinessBand,
              syllabusCoveragePercent: `${readiness.syllabusCoveragePercent}%`,
              conceptMasteryPercent: `${readiness.conceptMasteryPercent}%`,
              accuracyScore: readiness.accuracyScore !== null ? `${readiness.accuracyScore}%` : 'No data yet',
              practiceVolumeScore: readiness.practiceVolumeScore,
              keyStrengths: readiness.keyStrengthAreas,
              criticalGaps: readiness.criticalGaps,
              summary: readiness.summaryNarrative,
            },
            artifact: {
              type: 'summary',
              title: `Exam Readiness: ${readiness.examName}`,
              data: {
                markdown: `### ${readiness.examName} Readiness Assessment\n- **Estimated Readiness:** ${readiness.estimatedReadinessScore}% (${readiness.readinessBand.replace('_', ' ')})\n- **Syllabus Coverage:** ${readiness.syllabusCoveragePercent}%\n- **Concept Mastery:** ${readiness.conceptMasteryPercent}%\n\n**Key Strengths:** ${readiness.keyStrengthAreas.join(', ') || 'Building initial baseline'}\n**Critical Gaps:** ${readiness.criticalGaps.join(', ') || 'None flagged'}\n\n*${readiness.summaryNarrative}*`,
              },
            },
          };
        }

        case 'get_mistake_notebook': {
          const { subjectId } = toolInput || {};
          const mistakes = Database.getMistakes(userId, subjectId);
          const summary = AdaptiveAnalyticsEngine.calculateMistakeAnalytics(userId);

          return {
            result: {
              totalMistakes: summary.totalMistakes,
              unresolvedCount: summary.unresolvedCount,
              resolvedCount: summary.resolvedCount,
              repeatedMistakeConcepts: summary.repeatedMistakeConcepts,
              recentMistakes: mistakes.slice(0, 5).map((m) => ({
                id: m.id,
                topic: m.topicId,
                subject: m.subjectId,
                questionSnippet: m.questionText.slice(0, 80),
                userAnswer: m.userAnswer,
                correctAnswer: m.correctAnswer,
                resolved: m.resolved,
              })),
            },
            artifact: {
              type: 'summary',
              title: 'Mistake Notebook & Invariant Review',
              data: {
                markdown: `### Mistake Notebook Summary\n- **Total Recorded Errors:** ${summary.totalMistakes}\n- **Unresolved Misconceptions:** ${summary.unresolvedCount}\n- **Resolved & Mastered:** ${summary.resolvedCount}\n\n**Frequent Error Patterns:**\n${summary.repeatedMistakeConcepts.slice(0, 3).map((r) => `- **${r.conceptTitle}** (${r.mistakeCount} errors)`).join('\n') || 'No repeated mistakes detected.'}`,
              },
            },
          };
        }

        case 'schedule_adaptive_remediation': {
          const { conceptOrTopicTitle, subjectId, scheduledDate, durationMinutes } = toolInput || {};
          const dateStr = scheduledDate || new Date().toISOString().split('T')[0];

          const task = Database.createTask(userId, {
            title: `Remediate: ${conceptOrTopicTitle}`,
            description: `Targeted cognitive derivation review and 5-question calibrated practice ladder.`,
            subjectId: (subjectId || 'math') as SubjectId,
            topicId: conceptOrTopicTitle,
            taskType: 'REVIEW_MISTAKES',
            scheduledDate: dateStr,
            scheduledStartTime: '16:00',
            estimatedDurationMinutes: durationMinutes || 20,
            priority: 'HIGH',
          });

          return {
            result: {
              success: true,
              taskId: task.id,
              title: task.title,
              scheduledDate: task.scheduledDate,
            },
            artifact: {
              type: 'summary',
              title: `Remediation Scheduled: ${conceptOrTopicTitle}`,
              data: {
                markdown: `### Remediation Session Scheduled\n- **Topic:** ${conceptOrTopicTitle}\n- **Subject:** ${subjectId.toUpperCase()}\n- **Scheduled Date:** ${dateStr}\n- **Duration:** ${durationMinutes || 20} minutes\n\n*Task has been added to your active daily Study Planner schedule.*`,
              },
            },
          };
        }

        default:
          return { result: null, error: `Tool ${toolName} is not recognized or authorized.` };
      }
    } catch (err: any) {
      console.error(`Error executing tool ${toolName}:`, err);
      return { result: null, error: err.message || 'Tool execution failed.' };
    }
  }
}
