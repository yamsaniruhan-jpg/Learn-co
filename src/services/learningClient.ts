import {
  SubjectCurriculum,
  ExamTrack,
  ConceptDetail,
  QuestionBankItem,
  PracticeSessionConfig,
  WeakTopicSignal,
  PracticeRecommendation,
  SubjectId,
  ExamTrackId,
} from '../types/curriculum';
import { AuthClient } from './authClient';
import { CURRICULUM_DATA, EXAM_TRACKS } from '../data/curriculumData';

export interface CurriculumResponse {
  success: boolean;
  subjects: SubjectCurriculum[];
  tracks: ExamTrack[];
}

export interface ConceptResponse {
  success: boolean;
  concept: ConceptDetail;
  chapterTitle: string;
  topicTitle: string;
  subjectName: string;
}

export interface StartSessionResponse {
  success: boolean;
  sessionId: string;
  config: PracticeSessionConfig;
  questions: QuestionBankItem[];
  quota: {
    solvedToday: number;
    dailyLimit: number;
    remaining: number;
    isLimitReached: boolean;
  };
}

export class LearningClient {
  private static getHeaders(): HeadersInit {
    const token = AuthClient.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Fetch data-driven curriculum hierarchy with optional track / subject filter
   */
  static async getCurriculum(trackId?: ExamTrackId, subjectId?: SubjectId): Promise<SubjectCurriculum[]> {
    try {
      const params = new URLSearchParams();
      if (subjectId && subjectId !== ('all' as any)) params.append('subjectId', subjectId);
      if (trackId && trackId !== 'all') params.append('trackId', trackId);

      const res = await fetch(`/api/learning/curriculum?${params.toString()}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.subjects && Array.isArray(data.subjects)) {
            return data.subjects;
          }
        }
      }
    } catch (err) {
      console.warn('Network error loading curriculum from API, falling back to local dataset:', err);
    }

    // Local fallback
    let fallback = [...CURRICULUM_DATA];
    if (subjectId && (subjectId as string) !== 'all') {
      fallback = fallback.filter((s) => s.id === subjectId);
    }
    if (trackId && trackId !== 'all') {
      fallback = fallback.map((subject) => ({
        ...subject,
        chapters: subject.chapters.filter(
          (ch) => ch.examTracks.includes(trackId as any) || ch.examTracks.includes('all')
        ),
      }));
    }
    return fallback;
  }

  /**
   * Fetch available exam tracks
   */
  static async getExamTracks(): Promise<ExamTrack[]> {
    try {
      const res = await fetch('/api/learning/tracks');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.tracks && Array.isArray(data.tracks)) {
            return data.tracks;
          }
        }
      }
    } catch (err) {
      console.warn('Network error loading tracks from API, falling back to local dataset:', err);
    }
    return EXAM_TRACKS;
  }

  /**
   * Fetch deep concept details
   */
  static async getConcept(conceptId: string): Promise<ConceptDetail | null> {
    try {
      const res = await fetch(`/api/learning/concept/${conceptId}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.concept) {
            return data.concept;
          }
        }
      }
    } catch (err) {
      console.warn('Network error loading concept from API, resolving locally:', err);
    }

    // Local fallback
    for (const subject of CURRICULUM_DATA) {
      for (const chapter of subject.chapters) {
        for (const topic of chapter.topics) {
          for (const subtopic of topic.subtopics) {
            const concept = subtopic.concepts.find((c) => c.id === conceptId);
            if (concept) return concept;
          }
        }
      }
    }
    return null;
  }

  /**
   * Start a calibrated or custom practice session (verifies daily quota on server)
   */
  static async startPracticeSession(config: PracticeSessionConfig): Promise<StartSessionResponse> {
    const res = await fetch('/api/learning/session/start', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ config }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to start practice session');
    }
    return data;
  }

  /**
   * Query question bank with pagination and filters
   */
  static async getQuestions(params: {
    subjectId?: string;
    difficulty?: string;
    questionType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    questions: QuestionBankItem[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    if (params.subjectId) searchParams.append('subjectId', params.subjectId);
    if (params.difficulty) searchParams.append('difficulty', params.difficulty);
    if (params.questionType) searchParams.append('questionType', params.questionType);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const res = await fetch(`/api/learning/questions?${searchParams.toString()}`);
    if (!res.ok) {
      throw new Error('Failed to fetch questions');
    }
    return res.json();
  }

  /**
   * Helper alias for getQuestions
   */
  static async getQuestionBank(params: {
    subjectId?: SubjectId;
    difficulty?: string;
    questionType?: string;
    searchQuery?: string;
    limit?: number;
  }): Promise<{ questions: QuestionBankItem[]; total: number }> {
    const res = await this.getQuestions({
      subjectId: params.subjectId,
      difficulty: params.difficulty,
      questionType: params.questionType,
      search: params.searchQuery,
      limit: params.limit,
    });
    return {
      questions: res.questions,
      total: res.pagination?.total || res.questions.length,
    };
  }

  /**
   * Get user's weak topics identified algorithmically
   */
  static async getWeakTopics(): Promise<WeakTopicSignal[]> {
    const res = await fetch('/api/learning/weak-topics', {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.weakTopics || [];
  }

  /**
   * Get smart curated practice recommendations
   */
  static async getRecommendations(): Promise<PracticeRecommendation[]> {
    const res = await fetch('/api/learning/recommendations', {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.recommendations || [];
  }

  /**
   * Import a Creator Studio Quiz into the Practice question bank
   */
  static async importCreatorQuiz(resourceId: string): Promise<{ success: boolean; importedCount: number; message: string }> {
    const res = await fetch('/api/learning/import-creator-quiz', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ resourceId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to import quiz');
    }
    return data;
  }

  /**
   * Request a Socratic hint from Gemini AI (with fallback)
   */
  static async requestSocraticHint(questionText: string, topic: string, currentHintCount: number): Promise<string> {
    try {
      const res = await fetch('/api/learning/socratic-hint', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ questionText, topic, currentHintCount }),
      });
      const data = await res.json();
      return data.hint || 'Focus on testing boundary values and sign changes.';
    } catch {
      return 'Focus on the fundamental physical/mathematical invariant governing this system.';
    }
  }
}
