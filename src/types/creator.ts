import { DifficultyLevel, SubjectId } from './index';

export type SourceType = 'pdf' | 'url' | 'text';

export type CreatorResourceType =
  | 'summary'
  | 'notes'
  | 'slides'
  | 'quiz'
  | 'flashcards'
  | 'worksheet'
  | 'mindmap'
  | 'key_concepts';

export interface CreatorSource {
  id: string;
  userId: string;
  title: string;
  sourceType: SourceType;
  originalContent: string;
  extractedText: string;
  fileName?: string;
  fileSize?: number;
  url?: string;
  status: 'ready' | 'processing' | 'failed';
  errorMessage?: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SummaryContent {
  executiveSummary: string;
  theoremsAndPrinciples: Array<{
    name: string;
    statement: string;
    formula?: string;
    significance?: string;
  }>;
  misconceptions: Array<{
    misconception: string;
    correction: string;
  }>;
  actionableTakeaways: string[];
}

export interface NotesContent {
  title: string;
  overview: string;
  sections: Array<{
    heading: string;
    markdownContent: string;
    formulas?: string[];
  }>;
  keyDerivations?: Array<{
    name: string;
    steps: string[];
  }>;
}

export interface SlideItem {
  slideNumber: number;
  title: string;
  subtitle?: string;
  bullets: string[];
  speakerNotes?: string;
  calloutFormula?: string;
}

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  bloomLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate';
  difficulty: DifficultyLevel;
  hints?: string[];
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  formula?: string;
  hint?: string;
  tags?: string[];
  mastered?: boolean;
}

export interface WorksheetProblem {
  id: string;
  problemNumber: number;
  problemStatement: string;
  hints: string[];
  solutionSteps: string[];
  finalAnswer: string;
  rubricScore: number;
}

export interface WorksheetContent {
  title: string;
  instructions: string;
  difficulty: DifficultyLevel;
  problems: WorksheetProblem[];
}

export interface MindMapNode {
  id: string;
  parentId?: string | null;
  label: string;
  description?: string;
  formula?: string;
  category?: string;
}

export interface MindMapContent {
  rootTopic: string;
  nodes: MindMapNode[];
}

export interface KeyConceptItem {
  concept: string;
  definition: string;
  invariant: string;
  formula?: string;
  example: string;
}

export interface CreatorResourceContent {
  summary?: SummaryContent;
  notes?: NotesContent;
  slides?: SlideItem[];
  quiz?: QuizQuestionItem[];
  flashcards?: FlashcardItem[];
  worksheet?: WorksheetContent;
  mindmap?: MindMapContent;
  keyConcepts?: KeyConceptItem[];
  rawText?: string;
}

export interface CreatorResource {
  id: string;
  userId: string;
  sourceId?: string;
  title: string;
  resourceType: CreatorResourceType;
  subjectId: SubjectId;
  difficulty: DifficultyLevel;
  tags: string[];
  content: CreatorResourceContent;
  version: number;
  status: 'ready' | 'draft' | 'archived';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorResourceVersion {
  id: string;
  resourceId: string;
  versionNumber: number;
  content: CreatorResourceContent;
  changelog: string;
  createdAt: string;
}

export interface CreatorJob {
  id: string;
  userId: string;
  type: 'generate_resource' | 'process_source';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stepMessage: string;
  resultResourceId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateResourceRequest {
  sourceId?: string;
  sourceText?: string;
  sourceUrl?: string;
  sourceType: SourceType;
  resourceType: CreatorResourceType;
  title: string;
  subjectId?: SubjectId;
  difficulty?: DifficultyLevel;
  options?: {
    cardCount?: number;
    depthLevel?: 'standard' | 'rigorous' | 'simplified';
    includeFormulas?: boolean;
    includeBloomTaxonomy?: boolean;
  };
}
