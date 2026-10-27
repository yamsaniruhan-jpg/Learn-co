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
import { getCurrentXp } from '../utils/xpManager';
import { loadUserStreak } from '../utils/streakManager';
import { syncClientToFirestore } from '../services/clientFirestoreSync';

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
  const [gamification, setGamification] = useState<UserGamification | null>(() => {
    const initXp = getCurrentXp(420);
    const lvl = calculateLevelFromXp(initXp);
    const streakState = loadUserStreak('guest');
    return {
      userId: 'guest',
      xp: initXp,
      level: lvl.level,
      currentStreak: streakState.currentStreak,
      longestStreak: streakState.longestStreak,
      lastActiveDate: streakState.lastActiveDate,
      dailyQuestionsSolvedToday: 0,
      dailyAllowanceLimit: 25,
      dailyDoubtsAskedToday: 0,
      dailyDoubtsLimit: 10,
      dailyArtifactsCreatedToday: 0,
      dailyArtifactsLimit: 5,
      dailySourcesUploadedToday: 0,
      dailySourcesUploadLimit: 5,
    };
  });
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize session on mount
  const refreshUserData = useCallback(async () => {
    try {
      const token = AuthClient.getToken();
      if (!token) {
        // No active session: Start in clean guest / unauthenticated state with local gamification
        setUser(null);
        setProfile(null);
        setSettings(null);
        const currentLocalXp = getCurrentXp(420);
        const lvl = calculateLevelFromXp(currentLocalXp);
        const streakState = loadUserStreak('guest');
        setGamification((prev) => ({
          userId: prev?.userId || 'guest',
          xp: currentLocalXp,
          level: lvl.level,
          currentStreak: streakState.currentStreak,
          longestStreak: streakState.longestStreak,
          lastActiveDate: streakState.lastActiveDate,
          dailyQuestionsSolvedToday: prev?.dailyQuestionsSolvedToday || 0,
          dailyAllowanceLimit: prev?.dailyAllowanceLimit || 25,
          dailyDoubtsAskedToday: prev?.dailyDoubtsAskedToday || 0,
          dailyDoubtsLimit: prev?.dailyDoubtsLimit || 10,
          dailyArtifactsCreatedToday: prev?.dailyArtifactsCreatedToday || 0,
          dailyArtifactsLimit: prev?.dailyArtifactsLimit || 5,
          dailySourcesUploadedToday: prev?.dailySourcesUploadedToday || 0,
          dailySourcesUploadLimit: prev?.dailySourcesUploadLimit || 5,
        }));
        return;
      }

      const res = await AuthClient.getMe();
      setUser(res.user);
      setProfile(res.profile);
      const userStreak = loadUserStreak(res.user.id || 'default_user');
      setGamification({
        ...res.gamification,
        currentStreak: userStreak.currentStreak,
        longestStreak: userStreak.longestStreak,
      });
      setSettings(res.settings);
      syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
    } catch (err: any) {
      console.warn('Session verification failed or expired:', err?.message || err);
      AuthClient.removeToken();
      setUser(null);
      setProfile(null);
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  // Listen to global XP awarded events
  useEffect(() => {
    const handleXpAwarded = (e: Event) => {
      const customEvent = e as CustomEvent<{ totalXp: number; level: number }>;
      if (customEvent.detail) {
        setGamification((prev) => {
          const currentXp = customEvent.detail.totalXp;
          const lvl = calculateLevelFromXp(currentXp);
          if (!prev) {
            return {
              userId: 'guest',
              xp: currentXp,
              level: lvl.level,
              currentStreak: 3,
              longestStreak: 7,
              lastActiveDate: new Date().toISOString().split('T')[0],
              dailyQuestionsSolvedToday: 4,
              dailyAllowanceLimit: 25,
              dailyDoubtsAskedToday: 1,
              dailyDoubtsLimit: 10,
              dailyArtifactsCreatedToday: 0,
              dailyArtifactsLimit: 5,
              dailySourcesUploadedToday: 0,
              dailySourcesUploadLimit: 5,
            };
          }
          const updatedGam = {
            ...prev,
            xp: currentXp,
            level: lvl.level,
          };
          if (user) {
            syncClientToFirestore(user, profile, updatedGam).catch(() => {});
          }
          return updatedGam;
        });
      }
    };

    window.addEventListener('learnco_xp_awarded', handleXpAwarded);
    return () => {
      window.removeEventListener('learnco_xp_awarded', handleXpAwarded);
    };
  }, []);

  const signInWithEmail = async (email: string, password?: string) => {
    setAuthError(null);
    try {
      let firebaseIdToken: string | undefined;

      // Authenticate with Firebase Authentication first if password is provided
      if (password) {
        try {
          const { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import(
            '../services/firebaseClient'
          );
          if (auth && auth.app) {
            try {
              const cred = await signInWithEmailAndPassword(auth, email, password);
              firebaseIdToken = await cred.user.getIdToken();
            } catch (fbErr: any) {
              // If user does not exist yet in Firebase, auto-register in Firebase Auth
              if (
                fbErr.code === 'auth/user-not-found' ||
                fbErr.code === 'auth/invalid-credential'
              ) {
                try {
                  const newCred = await createUserWithEmailAndPassword(auth, email, password);
                  firebaseIdToken = await newCred.user.getIdToken();
                } catch {
                  // Fall back to backend auth
                }
              }
            }
          }
        } catch (fbInitErr) {
          console.warn('Firebase client sign-in fallback to backend auth', fbInitErr);
        }
      }

      // Complete backend flow with Firebase ID Token
      const res = await AuthClient.signIn(email, password, firebaseIdToken);
      setUser(res.user);
      setProfile(res.profile);
      setGamification(res.gamification);
      setSettings(res.settings);
      syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
    } catch (err: any) {
      setAuthError(err.message || 'Sign in failed.');
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password?: string, fullName?: string) => {
    setAuthError(null);
    try {
      let firebaseIdToken: string | undefined;

      // Register with Firebase Authentication
      if (password) {
        try {
          const { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import(
            '../services/firebaseClient'
          );
          if (auth && auth.app) {
            try {
              const cred = await createUserWithEmailAndPassword(auth, email, password);
              firebaseIdToken = await cred.user.getIdToken();
            } catch (fbErr: any) {
              if (fbErr.code === 'auth/email-already-in-use') {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                firebaseIdToken = await cred.user.getIdToken();
              }
            }
          }
        } catch (fbInitErr) {
          console.warn('Firebase client sign-up fallback to backend auth', fbInitErr);
        }
      }

      // Complete backend flow with Firebase ID Token
      const res = await AuthClient.signUp({ email, password, fullName, idToken: firebaseIdToken });
      setUser(res.user);
      setProfile(res.profile);
      setGamification(res.gamification);
      setSettings(res.settings);
      syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
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
      // 1. Use Firebase Auth if not already provided via idToken
      let firebaseToken = idToken;
      if (!firebaseToken) {
        const { signInWithPopup } = await import('../services/firebaseClient');
        const { googleProvider, auth } = await import('../services/firebaseClient');
        const result = await signInWithPopup(auth, googleProvider);
        firebaseToken = await result.user.getIdToken();
      }

      // 2. Pass the Firebase ID token to the backend
      const res = await AuthClient.signInWithGoogle({
        email: email || '',
        name: name || '',
        avatarUrl,
        intent,
        idToken: firebaseToken,
      });
      setUser(res.user);
      setProfile(res.profile);
      setGamification(res.gamification);
      setSettings(res.settings);
      syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
    } catch (err: any) {
      setAuthError(err.message || 'Google sign in failed.');
      throw err;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      try {
        const { auth, signOut: fbSignOut } = await import('../services/firebaseClient');
        if (auth && auth.app) {
          await fbSignOut(auth);
        }
      } catch (fbErr) {
        console.warn('Firebase sign-out warning:', fbErr);
      }
      await AuthClient.signOut();
    } finally {
      setUser(null);
      setProfile(null);
      setSettings(null);
      const currentLocalXp = getCurrentXp(420);
      const lvl = calculateLevelFromXp(currentLocalXp);
      const streakState = loadUserStreak('guest');
      setGamification({
        userId: 'guest',
        xp: currentLocalXp,
        level: lvl.level,
        currentStreak: streakState.currentStreak,
        longestStreak: streakState.longestStreak,
        lastActiveDate: streakState.lastActiveDate,
        dailyQuestionsSolvedToday: 0,
        dailyAllowanceLimit: 25,
        dailyDoubtsAskedToday: 0,
        dailyDoubtsLimit: 10,
        dailyArtifactsCreatedToday: 0,
        dailyArtifactsLimit: 5,
        dailySourcesUploadedToday: 0,
        dailySourcesUploadLimit: 5,
      });
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
      const streakState = loadUserStreak(prev?.userId || 'guest');
      if (!prev) {
        const initXp = newGam.xp ?? getCurrentXp(420);
        const lvl = calculateLevelFromXp(initXp);
        return {
          userId: 'guest',
          xp: initXp,
          level: lvl.level,
          currentStreak: streakState.currentStreak,
          longestStreak: streakState.longestStreak,
          lastActiveDate: streakState.lastActiveDate,
          dailyQuestionsSolvedToday: 0,
          dailyAllowanceLimit: 25,
          dailyDoubtsAskedToday: 0,
          dailyDoubtsLimit: 10,
          dailyArtifactsCreatedToday: 0,
          dailyArtifactsLimit: 5,
          dailySourcesUploadedToday: 0,
          dailySourcesUploadLimit: 5,
          ...newGam,
        };
      }
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
