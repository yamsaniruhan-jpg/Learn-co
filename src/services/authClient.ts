import {
  UserProfile,
  UserGamification,
  UserSettings,
  UserStatistics,
  MistakeRecord,
  XPTransaction,
  LeaderboardEntry,
  DailyPracticeQuota,
  SubmitAttemptRequest,
  SubmitAttemptResult,
} from '../types/auth';
import { buildApiHeaders, ensureCsrfToken } from '../utils/csrf';

const LEGACY_TOKEN_STORAGE_KEY = 'learnco_auth_token';
const USER_STORAGE_KEY = 'learnco_user';

function purgeLegacyTokenStorage(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage access issues
  }
}

export class AuthClient {
  // Prevent a slow sign-in/reset response from replacing a newer session.
  private static authAttempt = 0;

  static getSessionId(): string | null {
    const user = this.getCurrentUser();
    if (!user || typeof user.id !== 'string' || !user.id) {
      return null;
    }
    return `${this.authAttempt}:${user.id}`;
  }

  static hasSession(): boolean {
    return this.getSessionId() !== null;
  }

  static clearSession(): void {
    purgeLegacyTokenStorage();
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear session metadata', e);
    }
  }

  static getCurrentUser(): any | null {
    purgeLegacyTokenStorage();
    try {
      const userStr = localStorage.getItem(USER_STORAGE_KEY);
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (_) {}
    return null;
  }

  static setCurrentUser(user: any): void {
    purgeLegacyTokenStorage();
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (_) {}
  }

  private static saveAuthResponse(data: any, attempt: number): void {
    if (attempt !== this.authAttempt) {
      throw new Error('Your session changed while this request was in progress. Please try again.');
    }
    if (typeof data?.user?.id !== 'string' || !data.user.id) {
      throw new Error('The server returned an invalid sign-in response. Please try again.');
    }
    // Auth token is managed strictly via HttpOnly cookie by the backend.
    this.setCurrentUser(data.user);
  }

  private static getHeaders(includeContentType = true): HeadersInit {
    return buildApiHeaders(undefined, includeContentType);
  }

  static async signUp(params: {
    email: string;
    password?: string;
    fullName?: string;
    timezone?: string;
    idToken?: string;
  }): Promise<{
    user: any;
    profile: UserProfile;
    gamification: UserGamification;
    settings: UserSettings;
  }> {
    const attempt = ++this.authAttempt;
    await ensureCsrfToken();
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Failed to create account (HTTP ${res.status}).`);
    }

    this.saveAuthResponse(data, attempt);
    return data;
  }

  static async signIn(email: string, password?: string, idToken?: string): Promise<{
    user: any;
    profile: UserProfile;
    gamification: UserGamification;
    settings: UserSettings;
  }> {
    const attempt = ++this.authAttempt;
    await ensureCsrfToken();
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, idToken }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: any = new Error(data.error || `Sign in failed (HTTP ${res.status}).`);
      err.status = res.status;
      err.notFound = data.notFound;
      err.googleOnly = data.googleOnly;
      throw err;
    }

    this.saveAuthResponse(data, attempt);
    return data;
  }

  static async signInWithGoogle(payload: {
    email: string;
    name?: string;
    avatarUrl?: string;
    timezone?: string;
    intent?: 'signin' | 'signup' | 'auto';
    idToken?: string;
  }): Promise<{
    googleToken?: string;
    user: any;
    profile: UserProfile;
    gamification: UserGamification;
    settings: UserSettings;
  }> {
    const attempt = ++this.authAttempt;
    await ensureCsrfToken();
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: any = new Error(data.error || `Google authentication failed (HTTP ${res.status}).`);
      err.status = res.status;
      err.notFound = data.notFound;
      err.email = data.email;
      throw err;
    }

    this.saveAuthResponse(data, attempt);
    return data;
  }

  static async getMe(): Promise<{
    user: any;
    profile: UserProfile;
    gamification: UserGamification;
    settings: UserSettings;
  }> {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: this.getHeaders(),
        ...(controller ? { signal: controller.signal } : {}),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const error = new Error(data?.error || 'Session verification failed.') as Error & { status?: number };
        error.status = res.status;
        throw error;
      }
      if (!data?.user?.id) throw new Error('Invalid session response.');
      this.setCurrentUser(data.user);
      return data;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  static async signOut(): Promise<void> {
    ++this.authAttempt;
    const hadUser = Boolean(this.getCurrentUser());
    this.clearSession();
    try {
      await ensureCsrfToken();
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
        headers: this.getHeaders(),
      });
    } catch {
      if (hadUser) {
        // Local session cleared; server-side cookie revocation will expire or clear next online request.
      }
    }
  }

  static async requestPasswordReset(email: string): Promise<{
    success: boolean;
    message: string;
    transport: 'email';
    expiresInMinutes: number;
  }> {
    await ensureCsrfToken();
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Could not send the reset link. Please try again.');
    }
    return data;
  }

  static async getMailStatus(): Promise<{
    configured: boolean;
    provider: 'resend' | 'smtp' | 'none';
    mailFrom: string;
    missingEnvVars: string[];
  }> {
    try {
      const res = await fetch('/api/auth/mail-status', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.configured === 'boolean') {
        return {
          configured: data.configured,
          provider: data.provider || 'none',
          mailFrom: data.mailFrom || '',
          missingEnvVars: Array.isArray(data.missingEnvVars) ? data.missingEnvVars : [],
        };
      }
    } catch {
      // Fallback below
    }
    return { configured: false, provider: 'none', mailFrom: '', missingEnvVars: ['RESEND_API_KEY or SMTP_URL'] };
  }

  static async validateResetToken(token: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/auth/reset-password/${encodeURIComponent(token)}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      return res.ok && data?.valid === true;
    } catch {
      return false;
    }
  }

  static async resetPassword(token: string, password: string): Promise<void> {
    const attempt = ++this.authAttempt;
    await ensureCsrfToken();
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Could not reset your password.');
    }
    this.saveAuthResponse(data, attempt);
  }

  static async saveOnboarding(data: {
    displayName: string;
    educationLevel: string;
    subjects: string[];
    learningGoals: string[];
    targetExam?: string;
    targetScore?: string;
    examDate?: string;
    preferredStudyTimeMinutes: number;
    learningPreferences?: any;
  }): Promise<{ profile: UserProfile; settings: UserSettings }> {
    const res = await fetch('/api/auth/onboarding', {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.error || `Failed to save onboarding data (HTTP ${res.status}).`);
    }

    return result;
  }

  static async updateProfile(updates: Partial<UserProfile>): Promise<{ profile: UserProfile }> {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Failed to update profile (HTTP ${res.status}).`);
    }

    return data;
  }

  static async updateSettings(updates: Partial<UserSettings>): Promise<{ settings: UserSettings }> {
    const res = await fetch('/api/user/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Failed to update settings (HTTP ${res.status}).`);
    }

    return data;
  }

  static async uploadAvatar(imageData: string): Promise<{ avatarUrl: string; profile: UserProfile }> {
    const res = await fetch('/api/user/avatar', {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify({ imageData }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Failed to upload profile photo (HTTP ${res.status}).`);
    }

    return data;
  }

  static async getUserStatistics(): Promise<UserStatistics> {
    const res = await fetch('/api/user/stats', {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load statistics.');
    }

    return data.statistics;
  }

  static async getMistakes(subject?: string): Promise<MistakeRecord[]> {
    const url = subject && subject !== 'all' ? `/api/user/mistakes?subject=${subject}` : '/api/user/mistakes';
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load mistakes.');
    }

    return data.mistakes;
  }

  static async getXpHistory(): Promise<XPTransaction[]> {
    const res = await fetch('/api/user/xp-history', {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load XP history.');
    }

    return data.transactions;
  }

  static async getDailyQuota(): Promise<DailyPracticeQuota> {
    const res = await fetch('/api/practice/quota', {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load practice quota.');
    }

    return data.quota;
  }

  static async submitPracticeAttempt(attempt: SubmitAttemptRequest): Promise<SubmitAttemptResult> {
    const res = await fetch('/api/practice/submit-attempt', {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(attempt),
    });

    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || 'Failed to submit attempt.');
      err.statusCode = res.status;
      err.code = data.code;
      throw err;
    }

    return data;
  }

  static async getLeaderboard(
    timeframe: string = 'all_time',
    subject?: string
  ): Promise<LeaderboardEntry[]> {
    const url = subject && subject !== 'all'
      ? `/api/leaderboard?timeframe=${timeframe}&subject=${subject}`
      : `/api/leaderboard?timeframe=${timeframe}`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load leaderboard.');
    }

    return data.leaderboard;
  }
}
