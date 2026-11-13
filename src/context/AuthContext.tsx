import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthClient } from '../services/authClient';
import {
  UserProfile,
  UserGamification,
  UserSettings,
  OnboardingStatus,
  DAILY_PRACTICE_LIMIT,
  DAILY_DOUBTS_LIMIT,
  DAILY_ARTIFACTS_LIMIT,
  DAILY_SOURCES_UPLOAD_LIMIT,
  DAILY_URLS_LIMIT,
  DAILY_AI_PLANS_LIMIT,
  calculateLevelFromXp,
} from '../types/auth';
import { getCurrentXp, syncLocalXpOnly } from '../utils/xpManager';
import { loadUserStreak } from '../utils/streakManager';
import { hasMatchingFirebaseIdentity, syncClientToFirestore } from '../services/clientFirestoreSync';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from '../services/firebaseClient';

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
    const initXp = getCurrentXp(0);
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
      dailyAllowanceLimit: DAILY_PRACTICE_LIMIT,
      dailyDoubtsAskedToday: 0,
      dailyDoubtsLimit: DAILY_DOUBTS_LIMIT,
      dailyArtifactsCreatedToday: 0,
      dailyArtifactsLimit: DAILY_ARTIFACTS_LIMIT,
      dailySourcesUploadedToday: 0,
      dailySourcesUploadLimit: DAILY_SOURCES_UPLOAD_LIMIT,
      dailyUrlsProcessedToday: 0,
      dailyUrlsLimit: DAILY_URLS_LIMIT,
      dailyAiPlansGeneratedToday: 0,
      dailyAiPlansLimit: DAILY_AI_PLANS_LIMIT,
    };
  });
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize session on mount
  const refreshUserData = useCallback(async () => {
    const token = AuthClient.getToken();
    try {
      if (!token) {
        // No active session: Start in clean guest / unauthenticated state with local gamification
        setUser(null);
        setProfile(null);
        setSettings(null);
        const currentLocalXp = getCurrentXp(0);
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
          dailyAllowanceLimit: prev?.dailyAllowanceLimit || DAILY_PRACTICE_LIMIT,
          dailyDoubtsAskedToday: prev?.dailyDoubtsAskedToday || 0,
          dailyDoubtsLimit: prev?.dailyDoubtsLimit || DAILY_DOUBTS_LIMIT,
          dailyArtifactsCreatedToday: prev?.dailyArtifactsCreatedToday || 0,
          dailyArtifactsLimit: prev?.dailyArtifactsLimit || DAILY_ARTIFACTS_LIMIT,
          dailySourcesUploadedToday: prev?.dailySourcesUploadedToday || 0,
          dailySourcesUploadLimit: prev?.dailySourcesUploadLimit || DAILY_SOURCES_UPLOAD_LIMIT,
          dailyUrlsProcessedToday: prev?.dailyUrlsProcessedToday || 0,
          dailyUrlsLimit: prev?.dailyUrlsLimit || DAILY_URLS_LIMIT,
          dailyAiPlansGeneratedToday: prev?.dailyAiPlansGeneratedToday || 0,
          dailyAiPlansLimit: prev?.dailyAiPlansLimit || DAILY_AI_PLANS_LIMIT,
        }));
        return;
      }

      const res = await AuthClient.getMe();
      // An in-flight refresh must not overwrite a newer sign-in/sign-out.
      if (AuthClient.getToken() !== token) return;
      setAuthError(null);
      setUser(res.user);
      setProfile(res.profile);
      syncLocalXpOnly(res.gamification?.xp ?? 0);
      const userStreak = loadUserStreak(res.user.id || 'default_user');
      setGamification({
        ...res.gamification,
        currentStreak: userStreak.currentStreak,
        longestStreak: userStreak.longestStreak,
      });
      setSettings(res.settings);
      syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
    } catch (err: any) {
      if (AuthClient.getToken() !== token) return;
      // A temporary network/server failure is not proof that the session is
      // invalid. Keep the token so the user can retry when service returns.
      if (err?.status !== 401 && err?.status !== 403) {
        console.warn('Session verification temporarily unavailable:', err?.message || err);
        setAuthError('Could not verify your session. Please check your connection and try again.');
        return;
      }
      console.warn('Session expired or rejected.');
      AuthClient.removeToken();
      syncLocalXpOnly(0);
      setUser(null);
      setProfile(null);
      setSettings(null);
      const streakState = loadUserStreak('guest');
      setGamification({
        userId: 'guest',
        xp: 0,
        level: 1,
        currentStreak: streakState.currentStreak,
        longestStreak: streakState.longestStreak,
        lastActiveDate: streakState.lastActiveDate,
        dailyQuestionsSolvedToday: 0,
        dailyAllowanceLimit: DAILY_PRACTICE_LIMIT,
        dailyDoubtsAskedToday: 0,
        dailyDoubtsLimit: DAILY_DOUBTS_LIMIT,
        dailyArtifactsCreatedToday: 0,
        dailyArtifactsLimit: DAILY_ARTIFACTS_LIMIT,
        dailySourcesUploadedToday: 0,
        dailySourcesUploadLimit: DAILY_SOURCES_UPLOAD_LIMIT,
        dailyUrlsProcessedToday: 0,
        dailyUrlsLimit: DAILY_URLS_LIMIT,
        dailyAiPlansGeneratedToday: 0,
        dailyAiPlansLimit: DAILY_AI_PLANS_LIMIT,
      });
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
              currentStreak: 0,
              longestStreak: 0,
              lastActiveDate: new Date().toISOString().split('T')[0],
              dailyQuestionsSolvedToday: 0,
              dailyAllowanceLimit: DAILY_PRACTICE_LIMIT,
              dailyDoubtsAskedToday: 0,
              dailyDoubtsLimit: DAILY_DOUBTS_LIMIT,
              dailyArtifactsCreatedToday: 0,
              dailyArtifactsLimit: DAILY_ARTIFACTS_LIMIT,
              dailySourcesUploadedToday: 0,
              dailySourcesUploadLimit: DAILY_SOURCES_UPLOAD_LIMIT,
              dailyUrlsProcessedToday: 0,
              dailyUrlsLimit: DAILY_URLS_LIMIT,
              dailyAiPlansGeneratedToday: 0,
              dailyAiPlansLimit: DAILY_AI_PLANS_LIMIT,
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
  }, [user, profile]);

  const clearMismatchedFirebaseIdentity = async (email?: string) => {
    if (auth?.app && auth.currentUser && !hasMatchingFirebaseIdentity(auth.currentUser.email, email)) {
      try { await fbSignOut(auth); } catch (err) { console.warn('Firebase sign-out warning:', err); }
    }
  };

  const signInWithEmail = async (email: string, password?: string) => {
    setAuthError(null);
    let firebaseSignedIn = false;
    try {
      let firebaseIdToken: string | undefined;

      // Attempt Firebase Authentication sign-in to obtain ID token when available
      if (password) {
        try {
          if (auth && auth.app) {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            firebaseSignedIn = true;
            firebaseIdToken = await cred.user.getIdToken();
          }
        } catch (fbInitErr) {
          // Backend password verification remains authoritative if Firebase client auth fails
          console.debug('Firebase client email sign-in skipped:', fbInitErr);
        }
      }

      // Complete backend flow with Firebase ID Token
      const res = await AuthClient.signIn(email, password, firebaseIdToken);
      await clearMismatchedFirebaseIdentity(res.user?.email);
      setUser(res.user);
      setProfile(res.profile);
      syncLocalXpOnly(res.gamification?.xp ?? 0);
      setGamification(res.gamification);
      setSettings(res.settings);
      syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
    } catch (err: any) {
      if (firebaseSignedIn) {
        try { await fbSignOut(auth); } catch { /* retain the original sign-in error */ }
      }
      setAuthError(err.message || 'Sign in failed.');
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password?: string, fullName?: string) => {
    setAuthError(null);
    let firebaseSignedIn = false;
    try {
      let firebaseIdToken: string | undefined;

      // Register with Firebase Authentication
      if (password) {
        try {
          if (auth && auth.app) {
            try {
              const cred = await createUserWithEmailAndPassword(auth, email, password);
              firebaseSignedIn = true;
              firebaseIdToken = await cred.user.getIdToken();
            } catch (fbErr: any) {
              if (fbErr.code === 'auth/email-already-in-use') {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                firebaseSignedIn = true;
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
      await clearMismatchedFirebaseIdentity(res.user?.email);
      setUser(res.user);
      setProfile(res.profile);
      syncLocalXpOnly(res.gamification?.xp ?? 0);
      setGamification(res.gamification);
      setSettings(res.settings);
      syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
    } catch (err: any) {
      if (firebaseSignedIn) {
        try { await fbSignOut(auth); } catch { /* retain the original sign-up error */ }
      }
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
    let firebaseSignedIn = false;
    try {
      // 1. Use Firebase Google Auth popup if not already provided via idToken
      let firebaseToken = idToken;
      if (!firebaseToken) {
        if (!auth || !auth.app) {
          throw new Error('Google authentication is unavailable in this environment. Please use Email & Password.');
        }
        let result;
        try {
          result = await signInWithPopup(auth, googleProvider);
        } catch (popupErr: any) {
          const code = popupErr?.code || '';
          if (code === 'auth/popup-blocked') {
            throw new Error('Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
          }
          if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
            throw new Error('Google sign-in was cancelled before completing. Click the button again to choose your Google account.');
          }
          if (code === 'auth/unauthorized-domain') {
            throw new Error('This preview domain is not yet authorized for Google popup login. Please sign in with Email & Password.');
          }
          throw popupErr;
        }
        firebaseSignedIn = true;
        firebaseToken = await result.user.getIdToken();
        if (email && result.user.email?.trim().toLowerCase() !== email.trim().toLowerCase()) {
          throw new Error(
            `You signed into Google as ${result.user.email}, which does not match ${email}. Clear the email filter or select the matching account.`
          );
        }
        email = result.user.email || email;
        name = result.user.displayName || name;
        avatarUrl = result.user.photoURL || avatarUrl;
      }

      // 2. Pass the Firebase ID token to the backend
      const res = await AuthClient.signInWithGoogle({
        email: email || '',
        name: name || '',
        avatarUrl,
        intent,
        idToken: firebaseToken,
      });
      await clearMismatchedFirebaseIdentity(res.user?.email);
      setUser(res.user);
      setProfile(res.profile);
      syncLocalXpOnly(res.gamification?.xp ?? 0);
      setGamification(res.gamification);
      setSettings(res.settings);
      if (res.user?.email) {
        try {
          localStorage.setItem('learnco_last_google_email', res.user.email);
          if (res.profile?.displayName || res.user?.name) {
            localStorage.setItem('learnco_last_google_name', res.profile?.displayName || res.user?.name);
          }
        } catch (_) {}
      }
      syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
    } catch (err: any) {
      if (firebaseSignedIn) {
        try { await fbSignOut(auth); } catch { /* retain the original Google sign-in error */ }
      }
      setAuthError(err.message || 'Google sign in failed.');
      throw err;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      try {
        if (auth && auth.app) {
          await fbSignOut(auth);
        }
      } catch (fbErr) {
        console.warn('Firebase sign-out warning:', fbErr);
      }
      await AuthClient.signOut();
    } finally {
      syncLocalXpOnly(0);
      setUser(null);
      setProfile(null);
      setSettings(null);
      const streakState = loadUserStreak('guest');
      setGamification({
        userId: 'guest',
        xp: 0,
        level: 1,
        currentStreak: streakState.currentStreak,
        longestStreak: streakState.longestStreak,
        lastActiveDate: streakState.lastActiveDate,
        dailyQuestionsSolvedToday: 0,
        dailyAllowanceLimit: DAILY_PRACTICE_LIMIT,
        dailyDoubtsAskedToday: 0,
        dailyDoubtsLimit: DAILY_DOUBTS_LIMIT,
        dailyArtifactsCreatedToday: 0,
        dailyArtifactsLimit: DAILY_ARTIFACTS_LIMIT,
        dailySourcesUploadedToday: 0,
        dailySourcesUploadLimit: DAILY_SOURCES_UPLOAD_LIMIT,
        dailyUrlsProcessedToday: 0,
        dailyUrlsLimit: DAILY_URLS_LIMIT,
        dailyAiPlansGeneratedToday: 0,
        dailyAiPlansLimit: DAILY_AI_PLANS_LIMIT,
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
        const initXp = newGam.xp ?? getCurrentXp(0);
        const lvl = calculateLevelFromXp(initXp);
        return {
          userId: 'guest',
          xp: initXp,
          level: lvl.level,
          currentStreak: streakState.currentStreak,
          longestStreak: streakState.longestStreak,
          lastActiveDate: streakState.lastActiveDate,
          dailyQuestionsSolvedToday: 0,
          dailyAllowanceLimit: DAILY_PRACTICE_LIMIT,
          dailyDoubtsAskedToday: 0,
          dailyDoubtsLimit: DAILY_DOUBTS_LIMIT,
          dailyArtifactsCreatedToday: 0,
          dailyArtifactsLimit: DAILY_ARTIFACTS_LIMIT,
          dailySourcesUploadedToday: 0,
          dailySourcesUploadLimit: DAILY_SOURCES_UPLOAD_LIMIT,
          dailyUrlsProcessedToday: 0,
          dailyUrlsLimit: DAILY_URLS_LIMIT,
          dailyAiPlansGeneratedToday: 0,
          dailyAiPlansLimit: DAILY_AI_PLANS_LIMIT,
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
