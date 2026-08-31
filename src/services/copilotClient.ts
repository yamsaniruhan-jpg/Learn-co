import {
  CopilotConversation,
  CopilotMessage,
  CopilotMode,
  LearnerLevel,
  CopilotContextPayload,
  CopilotPromptOptions,
  CopilotCitation,
  CopilotArtifact,
} from '../types/copilot';
import { SubjectId } from '../types/curriculum';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('learnco_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class CopilotClient {
  /**
   * List conversations
   */
  static async listConversations(search?: string): Promise<CopilotConversation[]> {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/copilot/conversations${query}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

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
    conversationId: string
  ): Promise<{ conversation: CopilotConversation; messages: CopilotMessage[] } | null> {
    try {
      const response = await fetch(`/api/copilot/conversations/${conversationId}`, {
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
    const response = await fetch('/api/copilot/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversation (${response.status})`);
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
    try {
      const response = await fetch(`/api/copilot/conversations/${conversationId}`, {
        method: 'PATCH',
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
    try {
      const response = await fetch(`/api/copilot/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
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
    try {
      const response = await fetch(`/api/copilot/conversations/${conversationId}/clear`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
        },
      });
      return response.ok;
    } catch (err) {
      console.error('CopilotClient: failed to clear conversation', err);
      return false;
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
  }> {
    const response = await fetch('/api/copilot/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`Copilot request failed with status ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Stream message response using Server-Sent Events (SSE)
   */
  static async streamMessage(
    options: CopilotPromptOptions,
    callbacks: {
      onToken?: (token: string) => void;
      onCitation?: (citation: CopilotCitation) => void;
      onArtifact?: (artifact: CopilotArtifact) => void;
      onDone?: (data: { conversationId: string; messageId: string; modelUsed: string }) => void;
      onError?: (err: string) => void;
    },
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const response = await fetch('/api/copilot/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(options),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Streaming failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
            if (data.type === 'token' && callbacks.onToken && data.content) {
              callbacks.onToken(data.content);
            } else if (data.type === 'citation' && callbacks.onCitation && data.citation) {
              callbacks.onCitation(data.citation);
            } else if (data.type === 'artifact' && callbacks.onArtifact && data.artifact) {
              callbacks.onArtifact(data.artifact);
            } else if (data.type === 'done' && callbacks.onDone) {
              callbacks.onDone(data);
            } else if (data.type === 'error' && callbacks.onError) {
              callbacks.onError(data.error || 'Unknown streaming error');
            }
          } catch (parseErr) {
            console.warn('Failed to parse SSE chunk:', parseErr);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation was aborted by user.');
        return;
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
