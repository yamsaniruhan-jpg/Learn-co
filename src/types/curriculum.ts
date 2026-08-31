export type SubjectId = 'math' | 'cs' | 'physics' | 'chemistry' | 'biology';
export type DifficultyLevel = 'easy' | 'easy_medium' | 'medium' | 'medium_hard' | 'hard';

export type ExamTrackId =
  | 'all'
  | 'jee_main'
  | 'jee_advanced'
  | 'stem_olympiad'
  | 'ap_stem'
  | 'ai_ml_foundations'
  | 'general_stem';

export interface ExamTrack {
  id: ExamTrackId;
  name: string;
  shortName: string;
  description: string;
  badgeColor: string;
  subjects: SubjectId[];
}

export type QuestionTypeId =
  | 'single_choice'
  | 'multiple_choice'
  | 'numerical'
  | 'true_false'
  | 'assertion_reason'
  | 'code_output';

export interface WorkedExample {
  id: string;
  title: string;
  problemStatement: string;
  difficulty: DifficultyLevel;
  stepByStepSolution: string[];
  finalAnswer: string;
  keyTakeaway: string;
}

export interface CommonPitfall {
  id: string;
  trapTitle: string;
  flawedReasoning: string;
  correctConcept: string;
  counterExample?: string;
}

export type InteractiveWidgetType =
  | 'sign_chart'
  | 'gradient_descent'
  | 'energy_conservation'
  | 'sn2_inversion'
  | 'dna_transcription'
  | 'vector_projection';

export interface ConceptDetail {
  id: string;
  subjectId: SubjectId;
  examTracks: ExamTrackId[];
  chapterId: string;
  topicId: string;
  subtopicId: string;
  title: string;
  summary: string;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  xpReward: number;
  
  // Core Theory
  formalDefinition: string;
  intuitiveExplanation: string;
  keyFormulas: Array<{ label: string; latex: string; explanation: string }>;
  keyObservations: string[];
  
  // Worked Examples & Pitfalls
  workedExamples: WorkedExample[];
  commonPitfalls: CommonPitfall[];
  
  // Interactive Simulators
  interactiveWidget?: InteractiveWidgetType;
  
  // Graph Navigation
  prerequisites: Array<{ id: string; title: string; subjectId: SubjectId }>;
  relatedConcepts: Array<{ id: string; title: string; subjectId: SubjectId }>;
  
  // Diagnostic mini-check
  miniCheckQuestion?: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface SubtopicItem {
  id: string;
  title: string;
  description: string;
  concepts: ConceptDetail[];
}

export interface TopicItem {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  subtopics: SubtopicItem[];
  conceptCount: number;
  estimatedHours: number;
}

export interface ChapterItem {
  id: string;
  subjectId: SubjectId;
  examTracks: ExamTrackId[];
  title: string;
  sequenceOrder: number;
  description: string;
  topics: TopicItem[];
}

export interface SubjectCurriculum {
  id: SubjectId;
  name: string;
  tagline: string;
  iconName: string;
  color: string;
  chapters: ChapterItem[];
}

export interface QuestionBankItem {
  id: string;
  subjectId: SubjectId;
  examTracks: ExamTrackId[];
  chapterId: string;
  topicId: string;
  subtopicId?: string;
  conceptId: string;
  difficulty: DifficultyLevel;
  questionType: QuestionTypeId;
  
  questionText: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  diagramLatex?: string;
  
  // Options (for single/multiple choice & assertion reason)
  options?: string[];
  
  // For single_choice, numerical, true_false, code_output: string or number
  // For multiple_choice: array of correct option strings or indices
  correctAnswer: string | number | string[];
  
  // For numerical questions
  numericalTolerance?: number;
  numericalUnit?: string;
  
  explanation: string;
  stepByStepSolution: string[];
  hints: string[];
  
  tags: string[];
  source: string;
  verificationStatus: 'verified' | 'creator_imported' | 'ai_synthesized';
  version: number;
}

export interface PracticeSessionConfig {
  sessionTitle?: string;
  subjectId?: SubjectId;
  examTrack?: ExamTrackId;
  chapterId?: string;
  topicId?: string;
  conceptId?: string;
  difficultyMode?: 'calibrated_ladder' | 'easy' | 'medium' | 'hard' | 'adaptive';
  questionCount: number; // default 5
  timed: boolean;
  timeLimitSeconds?: number;
  questionTypes?: QuestionTypeId[];
  mode?: 'standard' | 'mistake_remediation' | 'weak_topics' | 'weak_topics_remediation';
}

export interface PracticeSessionState {
  id: string;
  config: PracticeSessionConfig;
  questions: QuestionBankItem[];
  currentIndex: number;
  startedAt: string;
  userAnswers: Record<string, string | number | string[]>;
  isSubmitted: Record<string, boolean>;
  isCorrect: Record<string, boolean>;
  timeSpentSeconds: Record<string, number>;
  hintsUsedCount: Record<string, number>;
  completed: boolean;
  totalXpAwarded: number;
}

export interface WeakTopicSignal {
  topicId: string;
  topicTitle: string;
  subjectId: SubjectId;
  conceptId?: string;
  conceptTitle?: string;
  totalAttempts: number;
  incorrectAttempts: number;
  accuracyRate: number;
  lastPracticedAt: string;
  decayRisk: 'low' | 'moderate' | 'high' | 'critical';
  recommendedAction: string;
}

export interface PracticeRecommendation {
  id: string;
  type: 'weakness_remediation' | 'recent_mistake' | 'curriculum_progression' | 'exam_readiness';
  title: string;
  description: string;
  subjectId: SubjectId;
  topicId: string;
  conceptId?: string;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  xpPotential: number;
  reason: string;
}
