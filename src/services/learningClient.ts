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
import { buildApiHeaders } from '../utils/csrf';
import { EXAM_TRACKS } from '../data/curriculumMeta';
import {
  findConceptOfflineFallback,
  loadCurriculumOfflineFallback,
  loadSubjectCurriculum,
} from '../data/curriculumLoader';
import {
  generateGuestPracticeQuestions,
  getGuestQuotaRemaining,
  GUEST_LIMITS,
} from '../utils/guestMode';

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
  isGuestPreview?: boolean;
  quota: {
    solvedToday: number;
    dailyLimit: number;
    remaining: number;
    isLimitReached: boolean;
  };
}

export class LearningClient {
  private static getHeaders(): HeadersInit {
    return buildApiHeaders();
  }

  /**
   * Fetch single subject curriculum on demand with local cache and offline fallback.
   */
  static async getSubjectCurriculum(
    subjectId: SubjectId,
    trackId: ExamTrackId = 'all'
  ): Promise<SubjectCurriculum | null> {
    return loadSubjectCurriculum(subjectId, trackId);
  }

  /**
   * Fetch data-driven curriculum hierarchy with optional track / subject filter
   */
  static async getCurriculum(trackId?: ExamTrackId, subjectId?: SubjectId): Promise<SubjectCurriculum[]> {
    if (subjectId && (subjectId as string) !== 'all') {
      const single = await loadSubjectCurriculum(subjectId, trackId || 'all');
      return single ? [single] : [];
    }

    try {
      const params = new URLSearchParams();
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

    return loadCurriculumOfflineFallback(trackId, subjectId);
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

    return findConceptOfflineFallback(conceptId);
  }

  private static seenQuestionIds = new Set<string>();
  private static syncedServerIds = new Set<string>();
  private static readonly MAX_CLIENT_EXCLUDE_IDS = 1200;

  static clearSeenQuestions() {
    this.seenQuestionIds.clear();
    this.syncedServerIds.clear();
  }

  static getCachedSeenQuestionIds(): string[] {
    return Array.from(new Set([...this.syncedServerIds, ...this.seenQuestionIds]));
  }

  private static compactExcludeIds(explicitIds?: string[]): string[] {
    // Server already excludes persisted Database/SQL solved IDs; only transmit unsynced
    // session-local IDs (and explicit overrides) capped to stay safely under 100kb JSON.
    const unsynced = Array.from(this.seenQuestionIds).filter((id) => !this.syncedServerIds.has(id));
    const merged = Array.from(new Set([...(explicitIds ?? []), ...unsynced]));
    return merged.slice(-this.MAX_CLIENT_EXCLUDE_IDS);
  }

  /**
   * Fetch all previously solved/attempted question IDs for the signed-in account
   * from Cloud SQL / backend so mobile & desktop sessions never repeat problems.
   */
  static async syncSolvedQuestionIds(): Promise<string[]> {
    try {
      if (!AuthClient.hasSession()) return [];
      const res = await fetch('/api/practice/solved-ids', {
        credentials: 'include',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (Array.isArray(data?.solvedIds)) {
        data.solvedIds.forEach((id: string) => {
          if (typeof id === 'string' && id) {
            this.syncedServerIds.add(id);
            this.seenQuestionIds.add(id);
          }
        });
        return data.solvedIds;
      }
    } catch {
      // Offline / unreachable: preserve already-collected local IDs
    }
    return this.getCachedSeenQuestionIds();
  }

  private static async buildGuestSession(config: PracticeSessionConfig): Promise<StartSessionResponse> {
    const remaining = getGuestQuotaRemaining().practiceRemaining;
    if (remaining <= 0) {
      throw new Error(
        `Guest practice limit reached (${GUEST_LIMITS.practiceQuestions}/${GUEST_LIMITS.practiceQuestions} questions used). Sign in to unlock 25/day + saved XP.`
      );
    }
    const questions = await generateGuestPracticeQuestions(config, remaining);
    return {
      success: true,
      sessionId: `session-guest-${Date.now()}`,
      config: { ...config, questionCount: questions.length },
      questions,
      isGuestPreview: true,
      quota: {
        solvedToday: GUEST_LIMITS.practiceQuestions - remaining,
        dailyLimit: GUEST_LIMITS.practiceQuestions,
        remaining,
        isLimitReached: false,
      },
    };
  }

  /**
   * Start a calibrated or custom practice session (verifies daily quota on server).
   * Requires sign-in on first attempt; if user presses Retry in Guest Mode (`allowGuestFallback`),
   * generates up to the remaining guest limit ephemerally without saving XP.
   */
  static async startPracticeSession(
    config: PracticeSessionConfig,
    options?: { allowGuestFallback?: boolean }
  ): Promise<StartSessionResponse> {
    const shouldDeduplicate = config.mode !== 'mistake_remediation';
    const mergedExclude = shouldDeduplicate
      ? this.compactExcludeIds(config.excludeQuestionIds)
      : config.excludeQuestionIds;

    const payloadConfig: PracticeSessionConfig = shouldDeduplicate
      ? { ...config, excludeQuestionIds: mergedExclude }
      : config;

    if (!AuthClient.hasSession()) {
      if (options?.allowGuestFallback) {
        return this.buildGuestSession(payloadConfig);
      }
      throw new Error(
        'Authentication required. Sign in to save verified XP, or press Retry to practice in Guest Mode (up to 5 questions).'
      );
    }

    const res = await fetch('/api/learning/session/start', {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify({ config: payloadConfig }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      if (options?.allowGuestFallback) {
        return this.buildGuestSession(payloadConfig);
      }
      throw new Error(
        'Authentication required. Sign in to save verified XP, or press Retry to practice in Guest Mode (up to 5 questions).'
      );
    }

    if (!res.ok) {
      throw new Error(data.error || `Failed to start practice session (${res.status})`);
    }

    if (shouldDeduplicate && Array.isArray(data?.questions)) {
      data.questions.forEach((q: { id?: string }) => {
        if (q?.id) this.seenQuestionIds.add(q.id);
      });
    }
    return data;
  }

  static async startOlympiadContest(params: {
    track: 'ipho' | 'icho' | 'ibho' | 'ijso' | 'ict' | 'mixed';
    durationMinutes: number;
    questionCount: number;
    excludeQuestionIds?: string[];
  }): Promise<{
    success: boolean;
    contestId: string;
    track: string;
    title: string;
    durationSeconds: number;
    questions: Array<Omit<QuestionBankItem, 'correctAnswer' | 'explanation' | 'stepByStepSolution'>>;
  }> {
    const mergedExclude = this.compactExcludeIds(params.excludeQuestionIds);
    const res = await fetch('/api/learning/contest/start', {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...params, excludeQuestionIds: mergedExclude }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to start Olympiad contest');
    }
    return data;
  }

  static async submitOlympiadContest(params: {
    contestId: string;
    track: string;
    questionIds: string[];
    answers: Record<string, any>;
    timeSpentSeconds: number;
  }): Promise<{
    success: boolean;
    contestId: string;
    track: string;
    title: string;
    totalQuestions: number;
    correctCount: number;
    accuracy: number;
    medalTier: string;
    totalXpEarned: number;
    timeSpentSeconds: number;
    reviews: Array<{
      question: QuestionBankItem;
      userAnswer: any;
      isCorrect: boolean;
      xpAwarded: number;
      timeSpent: number;
    }>;
  }> {
    const res = await fetch('/api/learning/contest/submit', {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit Olympiad contest');
    }
    if (Array.isArray(params.questionIds)) {
      params.questionIds.forEach((id) => {
        if (id) this.seenQuestionIds.add(id);
      });
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
      credentials: 'include',
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
      credentials: 'include',
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
      credentials: 'include',
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
        credentials: 'include',
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
