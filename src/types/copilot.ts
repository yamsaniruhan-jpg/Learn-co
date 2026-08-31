import { SubjectId } from './curriculum';

export type CopilotMode =
  | 'socratic_hint'
  | 'conceptual_explainer'
  | 'exam_solver'
  | 'code_tutor'
  | 'mistake_doctor'
  | 'practice_generator';

export type LearnerLevel = 'beginner' | 'intermediate' | 'advanced' | 'exam_focused';

export interface CopilotCitation {
  sourceId: string;
  title: string;
  sourceType: 'creator_studio' | 'curriculum_concept' | 'mistake_record' | 'external';
  snippet: string;
  url?: string;
  relevanceScore?: number;
}

export interface CopilotToolCall {
  id: string;
  name: string;
  input: any;
  output?: any;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface CopilotArtifact {
  type: 'practice_question' | 'flashcards' | 'summary' | 'quiz';
  title?: string;
  data: any;
  savedToCreatorId?: string;
}

export interface CopilotMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  mode?: CopilotMode;
  modelUsed?: string;
  citations?: CopilotCitation[];
  toolCalls?: CopilotToolCall[];
  artifact?: CopilotArtifact;
  timestamp: string;
}

export interface CopilotConversation {
  id: string;
  userId: string;
  title: string;
  mode: CopilotMode;
  learnerLevel: LearnerLevel;
  subjectId?: SubjectId;
  pinned?: boolean;
  messageCount: number;
  lastMessageSnippet?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CopilotActiveQuestionContext {
  questionId: string;
  questionText: string;
  userAnswer?: string | number;
  correctAnswer?: string | number;
  explanation?: string;
  difficulty?: string;
  subjectId?: SubjectId;
  topicTitle?: string;
}

export interface CopilotContextPayload {
  subjectId?: SubjectId;
  topicId?: string;
  conceptId?: string;
  activeQuestion?: CopilotActiveQuestionContext;
  selectedResourceId?: string;
  selectedSourceId?: string;
  mistakeContextId?: string;
  learnerLevel?: LearnerLevel;
  socraticGuidanceLevel?: 'low' | 'medium' | 'high';
  studyContextNote?: string;
}

export interface CopilotStreamChunk {
  type: 'token' | 'tool_call' | 'tool_result' | 'citation' | 'artifact' | 'error' | 'done';
  content?: string;
  toolCall?: CopilotToolCall;
  citation?: CopilotCitation;
  artifact?: CopilotArtifact;
  error?: string;
  conversationId?: string;
  messageId?: string;
  modelUsed?: string;
}

export interface CopilotPromptOptions {
  conversationId?: string;
  prompt: string;
  mode?: CopilotMode;
  learnerLevel?: LearnerLevel;
  context?: CopilotContextPayload;
  selectedModel?: string;
}
