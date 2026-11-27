import {
  CopilotConversation,
  CopilotMessage,
  CopilotMode,
  LearnerLevel,
  CopilotContextPayload,
  CopilotPromptOptions,
  CopilotCitation,
  CopilotArtifact,
  CopilotFallbackQuestion,
  CopilotUnavailableReason,
} from '../types/copilot';
import { SubjectId } from '../types/curriculum';
import { buildApiHeaders } from '../utils/csrf';
import { AuthClient } from './authClient';

function getAuthHeader(includeContentType = true): Record<string, string> {
  return buildApiHeaders(undefined, includeContentType);
}

function buildGuestConversation(params: {
  title?: string;
  mode?: CopilotMode;
  learnerLevel?: LearnerLevel;
  subjectId?: SubjectId;
}): CopilotConversation {
  return {
    id: `conv-guest-${Date.now()}`,
    userId: 'guest_scholar_id',
    title: params.title || 'New Socratic Chat',
    mode: params.mode || 'socratic_hint',
    learnerLevel: params.learnerLevel || 'intermediate',
    subjectId: params.subjectId || 'math',
    pinned: false,
    messageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export class CopilotClient {
  /**
   * List conversations
   */
  static async listConversations(search?: string): Promise<CopilotConversation[]> {
    if (!AuthClient.hasSession()) {
      return [];
    }
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/copilot/conversations${query}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      if (response.status === 401) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations (${response.status})`);
      }

      const data = await response.json();
      return data.conversations || [];
    } catch (err) {
      console.warn('CopilotClient: fallback to local conversation store', err);
      return [];
    }
  }

  /**
   * Get single conversation details & messages
   */
  static async getConversation(
    conversationId: string,
    options?: { skipSessionGuard?: boolean }
  ): Promise<{ conversation: CopilotConversation; messages: CopilotMessage[] } | null> {
    if (conversationId.startsWith('conv-guest-')) {
      return null;
    }
    if (!options?.skipSessionGuard && !AuthClient.hasSession()) {
      return null;
    }
    try {
      const response = await fetch(`/api/copilot/conversations/${conversationId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        conversation: data.conversation,
        messages: data.messages || [],
      };
    } catch (err) {
      console.error('CopilotClient: failed to get conversation', err);
      return null;
    }
  }

  /**
   * Create a new conversation
   */
  static async createConversation(params: {
    title?: string;
    mode?: CopilotMode;
    learnerLevel?: LearnerLevel;
    subjectId?: SubjectId;
  }): Promise<CopilotConversation> {
    if (!AuthClient.hasSession()) {
      return buildGuestConversation(params);
    }

    const response = await fetch('/api/copilot/conversations', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (response.status === 401) {
      return buildGuestConversation(params);
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error || `Failed to create conversation (${response.status})`);
    }

    const data = await response.json();
    return data.conversation;
  }

  /**
   * Update conversation title / mode / level / pinned status
   */
  static async updateConversation(
    conversationId: string,
    updates: Partial<CopilotConversation>
  ): Promise<CopilotConversation | null> {
    if (!AuthClient.hasSession() || conversationId.startsWith('conv-guest-')) {
      return null;
    }
    try {
      const response = await fetch(`/api/copilot/conversations/${conversationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.conversation;
    } catch (err) {
      console.error('CopilotClient: failed to update conversation', err);
      return null;
    }
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(conversationId: string): Promise<boolean> {
    if (!AuthClient.hasSession() || conversationId.startsWith('conv-guest-')) {
      return true;
    }
    try {
      const response = await fetch(`/api/copilot/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...getAuthHeader(false),
        },
      });
      return response.ok;
    } catch (err) {
      console.error('CopilotClient: failed to delete conversation', err);
      return false;
    }
  }

  /**
   * Clear messages in conversation
   */
  static async clearConversation(conversationId: string): Promise<boolean> {
    if (!AuthClient.hasSession() || conversationId.startsWith('conv-guest-')) {
      return true;
    }
    try {
      const response = await fetch(`/api/copilot/conversations/${conversationId}/clear`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...getAuthHeader(false),
        },
      });
      return response.ok;
    } catch (err) {
      console.error('CopilotClient: failed to clear conversation', err);
      return false;
    }
  }

  /**
   * Delete all conversations
   */
  static async deleteAllConversations(): Promise<boolean> {
    if (!AuthClient.hasSession()) {
      return true;
    }
    try {
      const response = await fetch('/api/copilot/conversations', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...getAuthHeader(false),
        },
      });
      return response.ok;
    } catch (err) {
      console.error('CopilotClient: failed to delete all conversations', err);
      return false;
    }
  }

  /**
   * Export all history
   */
  static async exportHistory(): Promise<any> {
    if (!AuthClient.hasSession()) {
      return null;
    }
    try {
      const response = await fetch('/api/copilot/history/export', {
        credentials: 'include',
        headers: {
          ...getAuthHeader(false),
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error('CopilotClient: failed to export history', err);
      return null;
    }
  }

  /**
   * Send standard chat message
   */
  static async sendMessage(options: CopilotPromptOptions): Promise<{
    conversationId: string;
    message: CopilotMessage;
    citations?: CopilotCitation[];
    artifact?: CopilotArtifact;
    modelUsed?: string;
    hintOnly?: boolean;
    unavailableReason?: CopilotUnavailableReason;
    fallbackPracticeQuestions?: CopilotFallbackQuestion[];
  }> {
    const response = await fetch('/api/copilot/chat', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error || `Copilot request failed with status ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Stream message response using Server-Sent Events (SSE) with optional disconnect recovery.
   */
  static async streamMessage(
    options: CopilotPromptOptions,
    callbacks: {
      onToken?: (token: string) => void;
      onCitation?: (citation: CopilotCitation) => void;
      onArtifact?: (artifact: CopilotArtifact) => void;
      onReconnecting?: (attempt: number) => void;
      onDone?: (data: {
        conversationId: string;
        messageId: string;
        modelUsed: string;
        hintOnly?: boolean;
        unavailableReason?: CopilotUnavailableReason;
        fallbackPracticeQuestions?: CopilotFallbackQuestion[];
      }) => void;
      onError?: (err: string) => void;
    },
    signal?: AbortSignal,
    streamConfig?: { recoverOnDisconnect?: boolean }
  ): Promise<void> {
    const recoverOnDisconnect = streamConfig?.recoverOnDisconnect ?? false;
    let accumulated = '';
    let seenConvId = options.conversationId;
    let explicitServerError: string | undefined;

    try {
      const response = await fetch('/api/copilot/stream', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(options),
        signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          explicitServerError = errData?.error || 'Authentication required (401). Please sign in or press Retry to continue in Guest Mode.';
          throw new Error(explicitServerError);
        }
        throw new Error(errData?.error || `Streaming failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completed = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.substring(5).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.conversationId && !seenConvId) {
              seenConvId = data.conversationId;
            }
            if (data.type === 'token' && data.content) {
              accumulated += data.content;
              callbacks.onToken?.(data.content);
            } else if (data.type === 'citation' && callbacks.onCitation && data.citation) {
              callbacks.onCitation(data.citation);
            } else if (data.type === 'artifact' && callbacks.onArtifact && data.artifact) {
              callbacks.onArtifact(data.artifact);
            } else if (data.type === 'done') {
              completed = true;
              callbacks.onDone?.(data);
            } else if (data.type === 'error') {
              completed = true;
              explicitServerError = data.error || 'Unknown streaming error';
            }
          } catch (parseErr) {
            console.warn('Failed to parse SSE chunk:', parseErr);
          }
        }
      }
      if (explicitServerError) throw new Error(explicitServerError);
      if (!completed) throw new Error('Stream ended before completion.');
    } catch (err: any) {
      if (err.name === 'AbortError' || signal?.aborted) {
        console.log('Stream generation was aborted by user.');
        return;
      }

      // Recover from unexpected network or mid-stream disconnect when enabled
      if (recoverOnDisconnect && !explicitServerError) {
        try {
          callbacks.onReconnecting?.(1);
          await new Promise((r) => setTimeout(r, 250));

          if (seenConvId && accumulated.length > 0) {
            const existing = await CopilotClient.getConversation(seenConvId, { skipSessionGuard: true });
            const lastAssistant = existing?.messages
              ?.slice()
              .reverse()
              .find((m) => m.role === 'assistant');

            if (lastAssistant && lastAssistant.content.startsWith(accumulated.slice(0, 24))) {
              const tail = lastAssistant.content.slice(accumulated.length);
              if (tail) callbacks.onToken?.(tail);
              lastAssistant.citations?.forEach((c) => callbacks.onCitation?.(c));
              callbacks.onDone?.({
                conversationId: seenConvId,
                messageId: lastAssistant.id,
                modelUsed: lastAssistant.modelUsed || 'gemini-2.5-flash',
                hintOnly: lastAssistant.hintOnly,
                unavailableReason: lastAssistant.unavailableReason,
                fallbackPracticeQuestions: lastAssistant.fallbackPracticeQuestions,
              });
              return;
            }
          }

          // Fallback to non-streaming /chat endpoint to complete cleanly
          const fallbackRes = await CopilotClient.sendMessage({
            ...options,
            conversationId: seenConvId || options.conversationId,
          });
          const fullText = fallbackRes.message?.content || '';
          const delta = accumulated && fullText.startsWith(accumulated)
            ? fullText.slice(accumulated.length)
            : accumulated
            ? `\n\n${fullText}`
            : fullText;
          if (delta) callbacks.onToken?.(delta);
          fallbackRes.citations?.forEach((c) => callbacks.onCitation?.(c));
          if (fallbackRes.artifact) callbacks.onArtifact?.(fallbackRes.artifact);
          callbacks.onDone?.({
            conversationId: fallbackRes.conversationId,
            messageId: fallbackRes.message.id,
            modelUsed: fallbackRes.modelUsed || fallbackRes.message.modelUsed || 'gemini-2.5-flash',
            hintOnly: fallbackRes.hintOnly,
            unavailableReason: fallbackRes.unavailableReason,
            fallbackPracticeQuestions: fallbackRes.fallbackPracticeQuestions,
          });
          return;
        } catch {
          // Fall through to callbacks.onError below if recovery fails
        }
      }

      if (callbacks.onError) {
        callbacks.onError(err.message || 'Stream connection failed.');
      } else {
        throw err;
      }
    }
  }

  /**
   * Submit an attempt for a generated practice question (+5 XP)
   */
  static async submitPracticeAnswer(params: {
    questionId: string;
    subjectId?: string;
    topic?: string;
    userAnswer: string;
    correctAnswer: string;
    timeSpentSeconds?: number;
  }): Promise<{ isCorrect: boolean; xpEarned: number; message: string; gamification: any }> {
    const response = await fetch('/api/copilot/practice/submit', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Submission failed (${response.status})`);
    }

    return await response.json();
  }

  /**
   * Execute a tool explicitly
   */
  static async executeTool(toolName: string, toolInput: any): Promise<any> {
    const response = await fetch('/api/copilot/tools/execute', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ toolName, toolInput }),
    });

    if (!response.ok) {
      throw new Error(`Tool execution failed (${response.status})`);
    }

    return await response.json();
  }
}
