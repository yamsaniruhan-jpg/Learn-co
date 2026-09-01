import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthClient } from '../services/authClient';
import {
  UserProfile,
  UserGamification,
  UserSettings,
  OnboardingStatus,
  DailyPracticeQuota,
  calculateLevelFromXp,
} from '../types/auth';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  gamification: UserGamification | null;
  settings: UserSettings | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingStatus: OnboardingStatus;
  authError: string | null;
  signInWithEmail: (email: string, password?: string) => Promise<void>;
  signUpWithEmail: (email: string, password?: string, fullName?: string) => Promise<void>;
  signInWithGoogle: (
    email?: string,
    name?: string,
    avatarUrl?: string,
    intent?: 'signin' | 'signup' | 'auto',
    idToken?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<UserSettings>;
  uploadAvatar: (imageData: string) => Promise<string>;
  saveOnboarding: (data: any) => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateGamificationState: (newGamification: Partial<UserGamification>) => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [gamification, setGamification] = useState<UserGamification | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize session on mount
  const refreshUserData = useCallback(async () => {
    try {
      const token = AuthClient.getToken();
      if (!token) {
        // No active session: Start in clean guest / unauthenticated state
        setUser(null);
        setProfile(null);
        setGamification(null);
        setSettings(null);
        return;
      }

      const res = await AuthClient.getMe();
      setUser(res.user);
      setProfile(res.profile);
      setGamification(res.gamification);
      setSettings(res.settings);
    } catch (err: any) {
      console.warn('Session verification failed or expired:', err?.message || err);
      AuthClient.removeToken();
      setUser(null);
      setProfile(null);
      setGamification(null);
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const signInWithEmail = async (email: string, password?: string) => {
    setAuthError(null);
    try {
      const res = await AuthClient.signIn(email, password);
      setUser(res.user);
      setProfile(res.profile);
      setGamification(res.gamification);
      setSettings(res.settings);
    } catch (err: any) {
      setAuthError(err.message || 'Sign in failed.');
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password?: string, fullName?: string) => {
    setAuthError(null);
    try {
      const res = await AuthClient.signUp({ email, password, fullName });
      setUser(res.user);
      setProfile(res.profile);
      setGamification(res.gamification);
      setSettings(res.settings);
    } catch (err: any) {
      setAuthError(err.message || 'Sign up failed.');
      throw err;
    }
  };

  const signInWithGoogle = async (
    email?: string,
    name?: string,
    avatarUrl?: string,
    intent: 'signin' | 'signup' | 'auto' = 'auto',
    idToken?: string
  ) => {
    setAuthError(null);
    try {
      if (!email || !email.includes('@')) {
        throw new Error('Please select or provide a valid Google Account email.');
      }
      const res = await AuthClient.signInWithGoogle({
        email: email.trim().toLowerCase(),
        name: name || email.split('@')[0],
        avatarUrl,
        intent,
        idToken,
      });
      setUser(res.user);
      setProfile(res.profile);
      setGamification(res.gamification);
      setSettings(res.settings);
    } catch (err: any) {
      setAuthError(err.message || 'Google sign in failed.');
      throw err;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await AuthClient.signOut();
    } finally {
      // Re-sign in with demo user or reset state
      setUser(null);
      setProfile(null);
      setGamification(null);
      setSettings(null);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await AuthClient.updateProfile(updates);
    setProfile(res.profile);
    return res.profile;
  };

  const updateSettings = async (updates: Partial<UserSettings>): Promise<UserSettings> => {
    const res = await AuthClient.updateSettings(updates);
    setSettings(res.settings);
    return res.settings;
  };

  const uploadAvatar = async (imageData: string): Promise<string> => {
    const res = await AuthClient.uploadAvatar(imageData);
    setProfile(res.profile);
    return res.avatarUrl;
  };

  const saveOnboarding = async (data: any) => {
    const res = await AuthClient.saveOnboarding(data);
    setProfile(res.profile);
    if (res.settings) setSettings(res.settings);
  };

  const updateGamificationState = (newGam: Partial<UserGamification>) => {
    setGamification((prev) => {
      if (!prev) return null;
      return { ...prev, ...newGam };
    });
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const onboardingStatus: OnboardingStatus = profile?.onboardingStatus || 'COMPLETED';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        gamification,
        settings,
        isAuthenticated: !!user,
        isLoading,
        onboardingStatus,
        authError,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        updateProfile,
        updateSettings,
        uploadAvatar,
        saveOnboarding,
        refreshUserData,
        updateGamificationState,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
