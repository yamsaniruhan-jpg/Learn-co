import {
  CreatorSource,
  CreatorResource,
  CreatorResourceVersion,
  GenerateResourceRequest,
  CreatorResourceType,
} from '../types/creator';
import { AuthClient } from './authClient';

export class CreatorClient {
  private static getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = AuthClient.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- Sources ---

  static async getSources(search?: string): Promise<CreatorSource[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/creator/sources${query}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch sources: ${res.statusText}`);
    }
    const data = await res.json();
    return data.sources || [];
  }

  static async createSource(params: {
    title: string;
    sourceType: 'pdf' | 'url' | 'text';
    content?: string;
    fileName?: string;
    fileSize?: number;
    url?: string;
  }): Promise<CreatorSource> {
    const res = await fetch('/api/creator/sources', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create source document.');
    }
    return data.source;
  }

  static async getSource(id: string): Promise<CreatorSource> {
    const res = await fetch(`/api/creator/sources/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch source.');
    }
    return data.source;
  }

  static async deleteSource(id: string): Promise<void> {
    const res = await fetch(`/api/creator/sources/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete source.');
    }
  }

  // --- Resources ---

  static async getResources(filters?: {
    type?: string;
    subject?: string;
    search?: string;
    status?: string;
  }): Promise<CreatorResource[]> {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
    if (filters?.subject && filters.subject !== 'all') params.set('subject', filters.subject);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/creator/resources${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch resources: ${res.statusText}`);
    }
    const data = await res.json();
    return data.resources || [];
  }

  static async getResource(id: string): Promise<{
    resource: CreatorResource;
    versions: CreatorResourceVersion[];
  }> {
    const res = await fetch(`/api/creator/resources/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load resource.');
    }
    return {
      resource: data.resource,
      versions: data.versions || [],
    };
  }

  static async generateResource(params: GenerateResourceRequest): Promise<CreatorResource> {
    const res = await fetch('/api/creator/generate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Resource synthesis failed.');
    }
    return data.resource;
  }

  static async updateResource(
    id: string,
    updates: {
      title?: string;
      content?: any;
      tags?: string[];
      difficulty?: any;
      subjectId?: any;
      status?: 'ready' | 'draft' | 'archived';
      isPublic?: boolean;
      changelog?: string;
    }
  ): Promise<CreatorResource> {
    const res = await fetch(`/api/creator/resources/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update resource.');
    }
    return data.resource;
  }

  static async deleteResource(id: string): Promise<void> {
    const res = await fetch(`/api/creator/resources/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete resource.');
    }
  }

  static async addToPractice(id: string): Promise<{
    success: boolean;
    message: string;
    addedCount: number;
    targetSubject: string;
  }> {
    const res = await fetch(`/api/creator/resources/${id}/add-to-practice`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to transfer resource to practice.');
    }
    return data;
  }

  static async exportResource(
    id: string,
    format: 'markdown' | 'json' = 'markdown'
  ): Promise<{
    exportType: string;
    filename?: string;
    content?: string;
    data?: any;
  }> {
    const res = await fetch(`/api/creator/resources/${id}/export`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ format }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Export failed.');
    }
    return data;
  }
}
