import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateFirebaseProfile,
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
  ) => Promise<'signed-in' | 'redirecting'>;
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
    const initXp = getCurrentXp(0, null);
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
  const authOperation = useRef(0);
  const ensureCurrentOperation = (operation: number) => {
    if (operation !== authOperation.current) throw new Error('Your session changed while this request was in progress. Please try again.');
  };

  // Initialize session on mount
  const refreshUserData = useCallback(async () => {
    const sessionId = AuthClient.getSessionId();
    try {
      if (!sessionId) {
        // No active session: Start in clean guest / unauthenticated state with local gamification
        setUser(null);
        setProfile(null);
        setSettings(null);
        const currentLocalXp = getCurrentXp(0, null);
        const lvl = calculateLevelFromXp(currentLocalXp);
        const streakState = loadUserStreak('guest');
        setGamification((prev) => ({
          userId: 'guest',
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
      if (AuthClient.getSessionId() !== sessionId) return;
      setAuthError(null);
      setUser(res.user);
      setProfile(res.profile);
      AuthClient.setCurrentUser(res.user);
      const displayXp = syncLocalXpOnly(res.gamification?.xp ?? 0, res.user.id);
      const userStreak = loadUserStreak(res.user.id || 'default_user');
      setGamification({
        ...res.gamification,
        xp: displayXp,
        level: calculateLevelFromXp(displayXp).level,
        currentStreak: userStreak.currentStreak,
        longestStreak: userStreak.longestStreak,
      });
      setSettings(res.settings);
      syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
    } catch (err: any) {
      if (AuthClient.getSessionId() !== sessionId) return;
      // A temporary network/server failure is not proof that the session is
      // invalid. Keep the session marker so the user can retry when service returns.
      if (err?.status !== 401 && err?.status !== 403) {
        console.warn('Session verification temporarily unavailable:', err?.message || err);
        setAuthError('Could not verify your session. Please check your connection and try again.');
        return;
      }
      console.warn('Session expired or rejected.');
      AuthClient.clearSession();
      const guestXp = getCurrentXp(0, null);
      setUser(null);
      setProfile(null);
      setSettings(null);
      const streakState = loadUserStreak('guest');
      setGamification({
        userId: 'guest',
        xp: guestXp,
        level: calculateLevelFromXp(guestXp).level,
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
    let active = true;
    const operation = authOperation.current;
    (async () => {
      try {
        let hasPendingRedirect = false;
        try {
          hasPendingRedirect = Boolean(sessionStorage.getItem('learnco_google_redirect_pending'));
        } catch {}
        if (auth?.app && typeof getRedirectResult === 'function') {
          const redirectTimeoutMs = hasPendingRedirect ? 8000 : 1200;
          const redirectResult = await Promise.race([
            getRedirectResult(auth),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), redirectTimeoutMs)),
          ]);
          if (active && operation === authOperation.current && redirectResult?.user) {
            let pendingIntent: 'signin' | 'signup' | 'auto' = 'auto';
            let expectedEmail: string | undefined;
            try {
              const raw = sessionStorage.getItem('learnco_google_redirect_pending');
              sessionStorage.removeItem('learnco_google_redirect_pending');
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.intent) pendingIntent = parsed.intent;
                if (parsed?.expectedEmail) expectedEmail = parsed.expectedEmail;
              }
            } catch {}

            const resolvedEmail =
              redirectResult.user.email ||
              redirectResult.user.providerData?.find((p) => p?.email)?.email ||
              '';
            if (expectedEmail && resolvedEmail.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()) {
              setAuthError(
                `You signed into Google as ${resolvedEmail || 'another account'}, which does not match ${expectedEmail}.`
              );
              try { await fbSignOut(auth); } catch {}
            } else {
              const firebaseToken = await redirectResult.user.getIdToken();
              if (!active || operation !== authOperation.current) return;
              const res = await AuthClient.signInWithGoogle({
                email: resolvedEmail,
                name: redirectResult.user.displayName || '',
                avatarUrl: redirectResult.user.photoURL || undefined,
                intent: pendingIntent,
                idToken: firebaseToken,
              });
              if (active && operation === authOperation.current) {
                setUser(res.user);
                setProfile(res.profile);
                const displayXp = syncLocalXpOnly(res.gamification?.xp ?? 0, res.user?.id);
                setGamification(res.gamification ? {
                  ...res.gamification,
                  xp: displayXp,
                  level: calculateLevelFromXp(displayXp).level,
                } : res.gamification);
                setSettings(res.settings);
                await syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
                setIsLoading(false);
                return;
              }
            }
          } else if (active && operation === authOperation.current && !redirectResult?.user) {
            // A persisted Firebase identity is not proof of a completed redirect.
            try {
              if (sessionStorage.getItem('learnco_google_redirect_pending')) {
                sessionStorage.removeItem('learnco_google_redirect_pending');
                setAuthError('Google sign-in could not be completed. Please try again.');
              }
            } catch {}
          }
        }
      } catch (err: any) {
        try { sessionStorage.removeItem('learnco_google_redirect_pending'); } catch {}
        if (active && operation === authOperation.current) {
          setAuthError(err?.message || 'Google redirect sign-in could not be completed.');
        }
      }
      if (active && operation === authOperation.current) {
        await refreshUserData();
      }
    })();
    return () => {
      active = false;
    };
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
    const operation = ++authOperation.current;
    setAuthError(null);
    let firebaseSignedIn = false;
    try {
      // The local backend verifies the password. Do not create a separate
      // Firebase identity during sign-in when the provider is unavailable.
      const res = await AuthClient.signIn(email, password);
      ensureCurrentOperation(operation);
      await clearMismatchedFirebaseIdentity(res.user?.email);
      ensureCurrentOperation(operation);
      if (password && auth?.app) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          firebaseSignedIn = true;
        } catch {
          // Local sign-in is valid even if Firebase sync is unavailable.
        }
      }

      ensureCurrentOperation(operation);
      setUser(res.user);
      setProfile(res.profile);
      const displayXp = syncLocalXpOnly(res.gamification?.xp ?? 0, res.user?.id);
      setGamification(res.gamification ? {
        ...res.gamification,
        xp: displayXp,
        level: calculateLevelFromXp(displayXp).level,
      } : res.gamification);
      setSettings(res.settings);
      await syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
    } catch (err: any) {
      if (firebaseSignedIn && (operation === authOperation.current || !AuthClient.getSessionId())) {
        try { await fbSignOut(auth); } catch { /* retain the original sign-in error */ }
      }
      if (operation === authOperation.current) setAuthError(err.message || 'Sign in failed.');
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password?: string, fullName?: string) => {
    const operation = ++authOperation.current;
    setAuthError(null);
    let firebaseSignedIn = false;
    try {
      // Create the authoritative local account first. A rejected backend
      // signup must not leave an unintended Firebase account behind.
      const res = await AuthClient.signUp({ email, password, fullName });
      ensureCurrentOperation(operation);
      await clearMismatchedFirebaseIdentity(res.user?.email);
      ensureCurrentOperation(operation);
      if (password && auth?.app && typeof createUserWithEmailAndPassword === 'function') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          firebaseSignedIn = true;
          if (fullName && typeof updateFirebaseProfile === 'function') {
            await updateFirebaseProfile(cred.user, { displayName: fullName }).catch(() => {});
          }
        } catch {
          // The account exists locally. Firebase provisioning is best-effort;
          // never claim cloud sync succeeded without verifying it separately.
        }
      }
      ensureCurrentOperation(operation);
      setUser(res.user);
      setProfile(res.profile);
      const displayXp = syncLocalXpOnly(res.gamification?.xp ?? 0, res.user?.id);
      setGamification(res.gamification ? {
        ...res.gamification,
        xp: displayXp,
        level: calculateLevelFromXp(displayXp).level,
      } : res.gamification);
      setSettings(res.settings);
      await syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
    } catch (err: any) {
      if (firebaseSignedIn && (operation === authOperation.current || !AuthClient.getSessionId())) {
        try { await fbSignOut(auth); } catch { /* retain the original sign-up error */ }
      }
      if (operation === authOperation.current) setAuthError(err.message || 'Sign up failed.');
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
    const operation = ++authOperation.current;
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
        const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
        try {
          result = await signInWithPopup(auth, googleProvider);
        } catch (popupErr: any) {
          const code = popupErr?.code || '';
          if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
            throw new Error('Google sign-in was cancelled before completing. Click the button again to choose your Google account.');
          }
          if (code === 'auth/account-exists-with-different-credential' || code === 'auth/credential-already-in-use') {
            throw new Error(
              'An account with this email already uses Email & Password sign-in. Sign in with your email and password below, or link Google from Firebase Console.'
            );
          }
          if (code === 'auth/unauthorized-domain') {
            throw new Error('This domain is not authorized for Google Sign-In in Firebase Console. Open the live app URL or sign in with Email & Password.');
          }
          if (code === 'auth/operation-not-allowed') {
            throw new Error('Google Sign-In is disabled in Firebase Console. Enable Google under Authentication → Sign-in method, or sign in with Email & Password.');
          }
          if (code === 'auth/network-request-failed') {
            throw new Error('Network error while contacting Google. Check your internet connection and try again.');
          }
          if (
            code === 'auth/popup-blocked' ||
            code === 'auth/internal-error' ||
            code === 'auth/operation-not-supported-in-this-environment' ||
            code === 'auth/web-storage-unsupported'
          ) {
            if (!isInIframe && typeof signInWithRedirect === 'function') {
              ensureCurrentOperation(operation);
              try {
                sessionStorage.setItem(
                  'learnco_google_redirect_pending',
                  JSON.stringify({ intent, expectedEmail: email || undefined })
                );
              } catch {}
              await signInWithRedirect(auth, googleProvider);
              return 'redirecting' as const;
            }
            throw new Error(
              'Google sign-in popup was blocked or restricted inside this embedded preview frame. Open the app in a new browser tab to complete Google Sign-In, or sign in with Email & Password.'
            );
          }
          throw popupErr;
        }
        firebaseSignedIn = true;
        ensureCurrentOperation(operation);
        firebaseToken = await result.user.getIdToken();
        ensureCurrentOperation(operation);
        const resolvedEmail =
          result.user.email ||
          result.user.providerData?.find((p) => p?.email)?.email ||
          email ||
          '';
        if (email && resolvedEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
          throw new Error(
            `You signed into Google as ${resolvedEmail || 'another account'}, which does not match ${email}. Clear the email filter or select the matching account.`
          );
        }
        email = resolvedEmail;
        name = result.user.displayName || result.user.providerData?.find((p) => p?.displayName)?.displayName || name;
        avatarUrl = result.user.photoURL || result.user.providerData?.find((p) => p?.photoURL)?.photoURL || avatarUrl;
      }

      // 2. Pass the Firebase ID token to the backend
      ensureCurrentOperation(operation);
      const res = await AuthClient.signInWithGoogle({
        email: email || '',
        name: name || '',
        avatarUrl,
        intent,
        idToken: firebaseToken,
      });
      ensureCurrentOperation(operation);
      await clearMismatchedFirebaseIdentity(res.user?.email);
      ensureCurrentOperation(operation);
      setUser(res.user);
      setProfile(res.profile);
      const displayXp = syncLocalXpOnly(res.gamification?.xp ?? 0, res.user?.id);
      setGamification(res.gamification ? {
        ...res.gamification,
        xp: displayXp,
        level: calculateLevelFromXp(displayXp).level,
      } : res.gamification);
      setSettings(res.settings);
      if (res.user?.email) {
        try {
          localStorage.setItem('learnco_last_google_email', res.user.email);
          if (res.profile?.displayName || res.user?.name) {
            localStorage.setItem('learnco_last_google_name', res.profile?.displayName || res.user?.name);
          }
        } catch (_) {}
      }
      await syncClientToFirestore(res.user, res.profile, res.gamification).catch(() => {});
      return 'signed-in' as const;
    } catch (err: any) {
      if (firebaseSignedIn && (operation === authOperation.current || !AuthClient.getSessionId())) {
        try { await fbSignOut(auth); } catch { /* retain the original Google sign-in error */ }
      }
      if (operation === authOperation.current) setAuthError(err.message || 'Google sign in failed.');
      throw err;
    }
  };

  const signOut = async () => {
    ++authOperation.current;
    try { sessionStorage.removeItem('learnco_google_redirect_pending'); } catch {}
    setAuthError(null);
    setIsLoading(false);
    // Clear this browser session before waiting for either network provider.
    const localRevocation = AuthClient.signOut();
    const firebaseRevocation = auth?.app ? fbSignOut(auth).catch(() => {}) : Promise.resolve();
    {
      const guestXp = getCurrentXp(0, null);
      setUser(null);
      setProfile(null);
      setSettings(null);
      const streakState = loadUserStreak('guest');
      setGamification({
        userId: 'guest',
        xp: guestXp,
        level: calculateLevelFromXp(guestXp).level,
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
    await Promise.allSettled([localRevocation, firebaseRevocation]);
  };

  const assertSessionUnchanged = (sessionId: string | null) => {
    if (!sessionId || AuthClient.getSessionId() !== sessionId) {
      throw new Error('Your session changed while this request was in progress. Please try again.');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const sessionId = AuthClient.getSessionId();
    const res = await AuthClient.updateProfile(updates);
    assertSessionUnchanged(sessionId);
    setProfile(res.profile);
    if (
      auth?.currentUser &&
      hasMatchingFirebaseIdentity(auth.currentUser.email, user?.email || res.profile?.email) &&
      (updates.displayName || updates.fullName) &&
      typeof updateFirebaseProfile === 'function'
    ) {
      await updateFirebaseProfile(auth.currentUser, {
        displayName: updates.displayName || updates.fullName,
      }).catch(() => {});
    }
    if (user) {
      await syncClientToFirestore(user, res.profile, gamification).catch(() => {});
    }
    return res.profile;
  };

  const updateSettings = async (updates: Partial<UserSettings>): Promise<UserSettings> => {
    const sessionId = AuthClient.getSessionId();
    const res = await AuthClient.updateSettings(updates);
    assertSessionUnchanged(sessionId);
    setSettings(res.settings);
    return res.settings;
  };

  const uploadAvatar = async (imageData: string): Promise<string> => {
    const sessionId = AuthClient.getSessionId();
    const res = await AuthClient.uploadAvatar(imageData);
    assertSessionUnchanged(sessionId);
    setProfile(res.profile);
    if (user) {
      await syncClientToFirestore(user, res.profile, gamification).catch(() => {});
    }
    return res.avatarUrl;
  };

  const saveOnboarding = async (data: any) => {
    const sessionId = AuthClient.getSessionId();
    const res = await AuthClient.saveOnboarding(data);
    assertSessionUnchanged(sessionId);
    setProfile(res.profile);
    if (res.settings) setSettings(res.settings);
    if (user) {
      await syncClientToFirestore(user, res.profile, gamification).catch(() => {});
    }
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
