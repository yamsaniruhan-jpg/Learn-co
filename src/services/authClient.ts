import {
  UserProfile,
  UserGamification,
  UserSettings,
  UserStatistics,
  MistakeRecord,
  XPTransaction,
  LeaderboardEntry,
  DailyPracticeQuota,
  OnboardingStatus,
  SubmitAttemptRequest,
  SubmitAttemptResult,
} from '../types/auth';

const TOKEN_STORAGE_KEY = 'learnco_auth_token';

export class AuthClient {
  static getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  static setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (e) {
      console.error('Failed to store auth token', e);
    }
  }

  static removeToken(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to remove auth token', e);
    }
  }

  private static getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async signUp(params: {
    email: string;
    password?: string;
    fullName?: string;
    timezone?: string;
  }): Promise<{
    token: string;
    user: any;
    profile: UserProfile;
    gamification: UserGamification;
    settings: UserSettings;
  }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create account.');
    }

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  static async signIn(email: string, password?: string): Promise<{
    token: string;
    user: any;
    profile: UserProfile;
    gamification: UserGamification;
    settings: UserSettings;
  }> {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials.');
    }

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  static async signInWithGoogle(payload: {
    email: string;
    name?: string;
    avatarUrl?: string;
    timezone?: string;
  }): Promise<{
    token: string;
    user: any;
    profile: UserProfile;
    gamification: UserGamification;
    settings: UserSettings;
  }> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google authentication failed.');
    }

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  static async getMe(): Promise<{
    user: any;
    profile: UserProfile;
    gamification: UserGamification;
    settings: UserSettings;
  }> {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Session expired.');
    }

    return data;
  }

  static async signOut(): Promise<void> {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {
      // Ignore network errors on signout
    } finally {
      this.removeToken();
    }
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
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to save onboarding data.');
    }

    return result;
  }

  static async updateProfile(
    updates: Partial<UserProfile>
  ): Promise<{ profile: UserProfile }> {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile.');
    }

    return data;
  }

  static async updateSettings(
    updates: Partial<UserSettings>
  ): Promise<{ settings: UserSettings }> {
    const res = await fetch('/api/user/settings', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update settings.');
    }

    return data;
  }

  static async uploadAvatar(
    imageData: string
  ): Promise<{ avatarUrl: string; profile: UserProfile }> {
    const res = await fetch('/api/user/avatar', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ imageData }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload profile photo.');
    }

    return data;
  }

  static async getUserStatistics(): Promise<UserStatistics> {
    const res = await fetch('/api/user/stats', {
      method: 'GET',
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
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load practice quota.');
    }

    return data.quota;
  }

  static async submitPracticeAttempt(
    attempt: SubmitAttemptRequest
  ): Promise<SubmitAttemptResult> {
    const res = await fetch('/api/practice/submit-attempt', {
      method: 'POST',
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
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load leaderboard.');
    }

    return data.leaderboard;
  }
}
