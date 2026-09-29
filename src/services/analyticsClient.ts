import {
  LearnerAnalyticsDashboardData,
  ConceptMasteryEstimate,
  TopicAnalyticsDetail,
  ExamReadinessEstimate,
  MistakeAnalyticsSummary,
  NextBestAction,
  ProgressTrendPoint,
} from '../types/analytics';
import { SubjectId, ExamTrackId } from '../types/curriculum';
import { MistakeRecord } from '../types/auth';
import { AuthClient } from './authClient';

export class AnalyticsClient {
  private static getHeaders(): HeadersInit {
    const token =
      AuthClient.getToken() ||
      localStorage.getItem('learnco_auth_token') ||
      localStorage.getItem('auth_token') ||
      'token-alex-001';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Fetch full dashboard data
   */
  static async getDashboard(): Promise<LearnerAnalyticsDashboardData> {
    const res = await fetch('/api/analytics/dashboard', {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch analytics dashboard');
    return json.data;
  }

  /**
   * Fetch concept masteries with optional filters
   */
  static async getConceptMasteries(filters?: {
    subject?: string;
    label?: string;
    weakOnly?: boolean;
  }): Promise<ConceptMasteryEstimate[]> {
    const params = new URLSearchParams();
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.label) params.append('label', filters.label);
    if (filters?.weakOnly) params.append('weakOnly', 'true');

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/analytics/mastery${queryString}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch masteries');
    return json.data;
  }

  /**
   * Fetch topic tree breakdown for a subject
   */
  static async getSubjectAnalytics(subjectId: SubjectId): Promise<TopicAnalyticsDetail[]> {
    const res = await fetch(`/api/analytics/subject/${subjectId}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch subject analytics');
    return json.data;
  }

  /**
   * Fetch exam readiness calculation
   */
  static async getExamReadiness(track?: ExamTrackId): Promise<ExamReadinessEstimate> {
    const query = track ? `?track=${track}` : '';
    const res = await fetch(`/api/analytics/exam-readiness${query}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch exam readiness');
    return json.data;
  }

  /**
   * Fetch mistakes and summary for mistake notebook
   */
  static async getMistakes(subject?: string): Promise<{
    summary: MistakeAnalyticsSummary;
    mistakes: MistakeRecord[];
  }> {
    const query = subject && subject !== 'all' ? `?subject=${subject}` : '';
    const res = await fetch(`/api/analytics/mistakes${query}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch mistakes');
    return json.data;
  }

  /**
   * Toggle or set resolve status of a mistake
   */
  static async resolveMistake(mistakeId: string, resolved?: boolean): Promise<MistakeRecord> {
    const res = await fetch(`/api/analytics/mistakes/${mistakeId}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ resolved }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update mistake');
    return json.data;
  }

  /**
   * Schedule a remediation task directly into Study Planner
   */
  static async scheduleMistakeRemediation(
    mistakeId: string,
    scheduledDate?: string,
    scheduledTime?: string
  ): Promise<any> {
    const res = await fetch(`/api/analytics/mistakes/${mistakeId}/schedule-task`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ scheduledDate, scheduledTime }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to schedule remediation');
    return json.data;
  }

  /**
   * Fetch explainable next best actions
   */
  static async getNextBestActions(): Promise<NextBestAction[]> {
    const res = await fetch('/api/analytics/next-best-actions', {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch next best actions');
    return json.data;
  }

  /**
   * Fetch time-series progress trends
   */
  static async getProgressTrends(): Promise<{
    daily: ProgressTrendPoint[];
    weekly: ProgressTrendPoint[];
    monthly: ProgressTrendPoint[];
  }> {
    const res = await fetch('/api/analytics/trends', {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch progress trends');
    return json.data;
  }

  /**
   * Request an AI-generated cognitive diagnostic summary
   */
  static async getAiDiagnosticSummary(focus?: string): Promise<{
    headline: string;
    diagnosticInsights: string[];
    prescriptions: string[];
    cognitiveProfile: string;
  }> {
    const res = await fetch('/api/analytics/ai-diagnostic-summary', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ focus }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to generate diagnostic summary');
    return json.data;
  }

  /**
   * Fetch system, attempt, and verification audit logs
   */
  static async getLogs(params?: { category?: string; search?: string; limit?: number }): Promise<any[]> {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.search) q.append('search', params.search);
    if (params?.limit) q.append('limit', String(params.limit));

    const res = await fetch(`/api/analytics/logs?${q.toString()}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch logs');
    return json.logs || [];
  }

  /**
   * Record a client-side audit or diagnostic log
   */
  static async logClientEvent(category: string, action: string, details: string, status: string = 'INFO', metadata?: Record<string, any>): Promise<any> {
    const res = await fetch('/api/analytics/logs', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ category, action, details, status, metadata }),
    });
    const json = await res.json();
    return json.log;
  }

  /**
   * Fetch webhook alert configuration
   */
  static async getWebhookConfig(): Promise<any> {
    const res = await fetch('/api/analytics/webhook-config', { headers: this.getHeaders() });
    const json = await res.json();
    return json.config;
  }

  /**
   * Update webhook alert configuration
   */
  static async setWebhookConfig(config: any): Promise<any> {
    const res = await fetch('/api/analytics/webhook-config', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(config),
    });
    const json = await res.json();
    return json.config;
  }

  /**
   * Dispatch a test alert to the configured webhook
   */
  static async testWebhook(): Promise<any> {
    const res = await fetch('/api/analytics/test-webhook', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    return json;
  }

  /**
   * Trigger automated spaced repetition review generation from mistake records
   */
  static async triggerSpacedRepetition(): Promise<{ tasksCreated: number; notificationsCreated: number; remediatedTopics: string[] }> {
    const res = await fetch('/api/analytics/trigger-spaced-repetition', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to trigger spaced repetition');
    return json.data;
  }
}
