import {
  MentorProfile,
  MentorMatchRecommendation,
  MentorshipRequest,
  MentorshipRelationship,
  MentorshipGoal,
  MentorshipTask,
  MentorshipSession,
  MentorshipMessage,
  MentorshipFeedback,
  MentorshipPrivacySettings,
  AuthorizedLearnerInsights,
} from '../types/mentorship';
import { SubjectId } from '../types';

export class MentorshipClient {
  private static getHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token') || 'token-alex-001';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  static async getMentors(params?: {
    search?: string;
    subjectId?: SubjectId;
    track?: string;
    format?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ mentors: MentorProfile[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.track) query.set('track', params.track);
    if (params?.format) query.set('format', params.format);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`/api/mentorship/mentors?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load mentors');
    return {
      mentors: data.mentors || [],
      total: data.total || 0,
      page: data.page || 1,
      totalPages: data.totalPages || 1,
    };
  }

  static async getMentor(id: string): Promise<MentorProfile> {
    const res = await fetch(`/api/mentorship/mentors/${id}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load mentor');
    return data.mentor;
  }

  static async updateMentorProfile(profileData: Partial<MentorProfile>): Promise<MentorProfile> {
    const res = await fetch('/api/mentorship/mentors/profile', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to save mentor profile');
    return data.profile;
  }

  static async getRecommendations(subjectId?: SubjectId): Promise<MentorMatchRecommendation[]> {
    const query = subjectId ? `?subjectId=${subjectId}` : '';
    const res = await fetch(`/api/mentorship/recommendations${query}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load recommendations');
    return data.recommendations || [];
  }

  static async createRequest(requestData: {
    mentorId: string;
    subjectId: SubjectId;
    targetTrack?: string;
    goalDescription: string;
    initialMessage: string;
    preferredCadence?: 'weekly' | 'biweekly' | 'on_demand';
  }): Promise<MentorshipRequest> {
    const res = await fetch('/api/mentorship/requests', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to submit request');
    return data.request;
  }

  static async getRequests(): Promise<{ sent: MentorshipRequest[]; received: MentorshipRequest[] }> {
    const res = await fetch('/api/mentorship/requests', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load requests');
    return {
      sent: data.sent || [],
      received: data.received || [],
    };
  }

  static async respondToRequest(
    requestId: string,
    action: 'ACCEPT' | 'DECLINE',
    note?: string
  ): Promise<{ request: MentorshipRequest; relationship: MentorshipRelationship | null }> {
    const res = await fetch(`/api/mentorship/requests/${requestId}/respond`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action, note }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to respond to request');
    return {
      request: data.request,
      relationship: data.relationship,
    };
  }

  static async cancelRequest(requestId: string): Promise<boolean> {
    const res = await fetch(`/api/mentorship/requests/${requestId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    return !!data.success;
  }

  static async getRelationships(): Promise<MentorshipRelationship[]> {
    const res = await fetch('/api/mentorship/relationships', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load relationships');
    return data.relationships || [];
  }

  static async getRelationship(id: string): Promise<MentorshipRelationship> {
    const res = await fetch(`/api/mentorship/relationships/${id}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load relationship');
    return data.relationship;
  }

  static async updateRelationshipStatus(
    id: string,
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'SUSPENDED'
  ): Promise<MentorshipRelationship> {
    const res = await fetch(`/api/mentorship/relationships/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update status');
    return data.relationship;
  }

  static async updatePrivacySettings(
    id: string,
    settings: Partial<MentorshipPrivacySettings>
  ): Promise<MentorshipPrivacySettings> {
    const res = await fetch(`/api/mentorship/relationships/${id}/privacy`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update privacy settings');
    return data.privacySettings;
  }

  static async getAuthorizedInsights(relationshipId: string): Promise<AuthorizedLearnerInsights> {
    const res = await fetch(`/api/mentorship/relationships/${relationshipId}/insights`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load insights');
    return data.insights;
  }

  static async getMessages(relationshipId: string): Promise<MentorshipMessage[]> {
    const res = await fetch(`/api/mentorship/relationships/${relationshipId}/messages`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load messages');
    return data.messages || [];
  }

  static async sendMessage(
    relationshipId: string,
    content: string,
    attachedResource?: any
  ): Promise<MentorshipMessage> {
    const res = await fetch(`/api/mentorship/relationships/${relationshipId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content, attachedResource }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to send message');
    return data.message;
  }

  static async markMessagesRead(relationshipId: string): Promise<boolean> {
    const res = await fetch(`/api/mentorship/relationships/${relationshipId}/messages/read`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    return !!data.success;
  }

  static async getGoals(relationshipId: string): Promise<MentorshipGoal[]> {
    const res = await fetch(`/api/mentorship/relationships/${relationshipId}/goals`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load goals');
    return data.goals || [];
  }

  static async createGoal(
    relationshipId: string,
    goal: {
      title: string;
      description?: string;
      targetDate: string;
      subjectId?: SubjectId;
      linkedTopicId?: string;
      linkedConceptId?: string;
    }
  ): Promise<MentorshipGoal> {
    const res = await fetch(`/api/mentorship/relationships/${relationshipId}/goals`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(goal),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create goal');
    return data.goal;
  }

  static async updateGoal(goalId: string, updates: Partial<MentorshipGoal>): Promise<MentorshipGoal> {
    const res = await fetch(`/api/mentorship/goals/${goalId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update goal');
    return data.goal;
  }

  static async getTasks(relationshipId: string): Promise<MentorshipTask[]> {
    const res = await fetch(`/api/mentorship/relationships/${relationshipId}/tasks`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load tasks');
    return data.tasks || [];
  }

  static async createTask(
    relationshipId: string,
    task: {
      title: string;
      description?: string;
      dueDate: string;
      subjectId?: SubjectId;
      linkedTopicId?: string;
      linkedResource?: any;
    }
  ): Promise<MentorshipTask> {
    const res = await fetch(`/api/mentorship/relationships/${relationshipId}/tasks`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(task),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create task');
    return data.task;
  }

  static async updateTask(taskId: string, updates: Partial<MentorshipTask>): Promise<MentorshipTask> {
    const res = await fetch(`/api/mentorship/tasks/${taskId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update task');
    return data.task;
  }

  static async getSessions(relationshipId?: string): Promise<MentorshipSession[]> {
    const query = relationshipId ? `?mentorshipId=${relationshipId}` : '';
    const res = await fetch(`/api/mentorship/sessions${query}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load sessions');
    return data.sessions || [];
  }

  static async scheduleSession(session: {
    mentorshipId: string;
    title: string;
    scheduledDate: string;
    startTime: string;
    durationMinutes?: number;
    topicsCovered?: string[];
    sharedNotes?: string;
  }): Promise<MentorshipSession> {
    const res = await fetch('/api/mentorship/sessions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(session),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to schedule session');
    return data.session;
  }

  static async updateSession(sessionId: string, updates: Partial<MentorshipSession>): Promise<MentorshipSession> {
    const res = await fetch(`/api/mentorship/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update session');
    return data.session;
  }

  static async submitFeedback(feedback: {
    mentorshipId: string;
    sessionId?: string;
    receiverId: string;
    overallRating: number;
    pedagogicalClarityRating?: number;
    responsivenessRating?: number;
    domainMasteryRating?: number;
    feedbackText: string;
    isAnonymous?: boolean;
    isPublicOnProfile?: boolean;
  }): Promise<MentorshipFeedback> {
    const res = await fetch('/api/mentorship/feedback', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(feedback),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to submit feedback');
    return data.feedback;
  }

  static async submitReport(report: {
    reportedUserId: string;
    mentorshipId?: string;
    reason: string;
    details: string;
  }): Promise<any> {
    const res = await fetch('/api/mentorship/reports', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(report),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to submit report');
    return data.report;
  }

  static async getMentorDashboard(): Promise<{
    mentorProfile: MentorProfile | null;
    activeMentees: Array<{
      relationship: MentorshipRelationship;
      insights: AuthorizedLearnerInsights | null;
      recentMessage?: MentorshipMessage;
    }>;
    pendingRequests: MentorshipRequest[];
    upcomingSessions: MentorshipSession[];
  }> {
    const res = await fetch('/api/mentorship/mentor-dashboard', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load mentor dashboard');
    return data;
  }
}
