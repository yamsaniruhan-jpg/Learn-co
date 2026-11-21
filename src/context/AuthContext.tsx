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
import { loadUserStreak, saveUserStreak, StreakData } from '../utils/streakManager';
import { OfflineStorageManager } from '../utils/offlineStorage';
import { hasMatchingFirebaseIdentity, syncClientToFirestore } from '../services/clientFirestoreSync';
import {
  pullAndMergeStreakFromFirestore,
  pushStreakToFirestore,
} from '../services/streakFirestoreSync';
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
  onAuthStateChanged,
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

const REDIRECT_PENDING_KEY = 'learnco_google_redirect_pending';
let firebaseEmailPasswordDisabled = false;

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
  const authOperationInFlightRef = useRef<boolean>(false);
  const bootCheckInFlightRef = useRef<boolean>(true);

  const applyAuthenticatedSession = useCallback(
    (res: {
      user: any;
      profile: UserProfile | null;
      gamification?: UserGamification | null;
      settings: UserSettings | null;
    }) => {
      setAuthError(null);
      setUser(res.user);
      setProfile(res.profile);
      if (res.user) {
        AuthClient.setCurrentUser(res.user);
      }
      if (res.gamification) {
        const displayXp = syncLocalXpOnly(res.gamification.xp ?? 0, res.user?.id);
        const uidKey = res.user?.id || 'default_user';
        const userStreak = loadUserStreak(uidKey);
        setGamification({
          ...res.gamification,
          xp: displayXp,
          level: calculateLevelFromXp(displayXp).level,
          currentStreak: userStreak.currentStreak,
          longestStreak: userStreak.longestStreak,
        });
        pullAndMergeStreakFromFirestore(userStreak)
          .then((merged) => {
            if (merged) {
              saveUserStreak(uidKey, merged);
              setGamification((prev) =>
                prev
                  ? {
                      ...prev,
                      currentStreak: merged.currentStreak,
                      longestStreak: merged.longestStreak,
                      lastActiveDate: merged.lastActiveDate,
                    }
                  : prev
              );
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('learnco_streak_updated', { detail: merged }));
              }
            }
          })
          .catch(() => {});
      } else {
        setGamification(res.gamification ?? null);
      }
      setSettings(res.settings);
      syncClientToFirestore(res.user, res.profile, res.gamification ?? null).catch(() => {});
      if (typeof navigator === 'undefined' || navigator.onLine) {
        OfflineStorageManager.syncPendingAttemptsToServer().catch(() => {});
      }
    },
    []
  );

  // Initialize session on mount
  const refreshUserData = useCallback(async () => {
    const token = AuthClient.getToken();
    try {
      if (!token) {
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
      if (AuthClient.getToken() !== token) return;
      applyAuthenticatedSession(res);
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
  }, [applyAuthenticatedSession]);

  useEffect(() => {
    let active = true;
    bootCheckInFlightRef.current = true;
    (async () => {
      let redirectHandled = false;
      let redirectFailed = false;
      try {
        if (auth?.app && typeof getRedirectResult === 'function') {
          let pendingRaw: string | null = null;
          try {
            pendingRaw = sessionStorage.getItem(REDIRECT_PENDING_KEY);
          } catch {}
          const redirectTimeoutMs = pendingRaw ? 10000 : 800;

          let redirectTimeout: ReturnType<typeof setTimeout> | undefined;
          const redirectResult = await Promise.race([
            getRedirectResult(auth).catch((err) => {
              if (pendingRaw) throw err;
              return null;
            }),
            new Promise<null>((resolve) => {
              redirectTimeout = setTimeout(() => resolve(null), redirectTimeoutMs);
            }),
          ]);
          if (redirectTimeout) clearTimeout(redirectTimeout);

          if (active && redirectResult?.user) {
            let pendingIntent: 'signin' | 'signup' | 'auto' = 'auto';
            let expectedEmail: string | undefined;
            try {
              const raw = pendingRaw || sessionStorage.getItem(REDIRECT_PENDING_KEY);
              sessionStorage.removeItem(REDIRECT_PENDING_KEY);
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
              redirectFailed = true;
              setAuthError(
                `You signed into Google as ${resolvedEmail || 'another account'}, which does not match ${expectedEmail}.`
              );
              try { await fbSignOut(auth); } catch {}
            } else {
              const firebaseToken = await redirectResult.user.getIdToken();
              const res = await AuthClient.signInWithGoogle({
                email: resolvedEmail,
                name: redirectResult.user.displayName || '',
                avatarUrl: redirectResult.user.photoURL || undefined,
                intent: pendingIntent,
                idToken: firebaseToken,
              });
              if (active) {
                applyAuthenticatedSession(res);
                redirectHandled = true;
                setIsLoading(false);
                return;
              }
            }
          }
        }
      } catch (err: any) {
        if (active) {
          redirectFailed = true;
          try { sessionStorage.removeItem(REDIRECT_PENDING_KEY); } catch {}
          setAuthError(err?.message || 'Google redirect sign-in could not be completed.');
        }
      } finally {
        bootCheckInFlightRef.current = false;
      }

      if (active && !redirectHandled) {
        if (redirectFailed) {
          setIsLoading(false);
        } else {
          await refreshUserData();
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshUserData, applyAuthenticatedSession]);

  // Complete a pending Google redirect login via onAuthStateChanged if browser
  // storage partitioning caused getRedirectResult() to return null on mobile/iframe.
  // Never race explicit popup, email/password, or sign-out operations.
  useEffect(() => {
    if (!auth || !auth.app || typeof onAuthStateChanged !== 'function') return;
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled || !firebaseUser) return;
      if (authOperationInFlightRef.current || bootCheckInFlightRef.current) return;
      if (AuthClient.getToken()) return;

      let pendingRaw: string | null = null;
      try {
        pendingRaw = sessionStorage.getItem(REDIRECT_PENDING_KEY);
      } catch {}
      if (!pendingRaw) return;

      const isGoogleUser =
        Boolean(firebaseUser.providerData?.some((p) => p?.providerId === 'google.com'));
      if (!isGoogleUser) return;

      let pendingIntent: 'signin' | 'signup' | 'auto' = 'auto';
      let expectedEmail: string | undefined;
      try {
        sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        const parsed = JSON.parse(pendingRaw);
        if (parsed?.intent) pendingIntent = parsed.intent;
        if (parsed?.expectedEmail) expectedEmail = parsed.expectedEmail;
      } catch {}

      const resolvedEmail =
        firebaseUser.email ||
        firebaseUser.providerData?.find((p) => p?.email)?.email ||
        '';
      if (expectedEmail && resolvedEmail.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()) {
        setAuthError(
          `You signed into Google as ${resolvedEmail || 'another account'}, which does not match ${expectedEmail}.`
        );
        try { await fbSignOut(auth); } catch {}
        return;
      }

      authOperationInFlightRef.current = true;
      try {
        const idToken = await firebaseUser.getIdToken();
        const res = await AuthClient.signInWithGoogle({
          email: resolvedEmail,
          name: firebaseUser.displayName || '',
          avatarUrl: firebaseUser.photoURL || undefined,
          intent: pendingIntent,
          idToken,
        });
        if (!cancelled) {
          applyAuthenticatedSession(res);
          setIsLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setAuthError(e?.message || 'Google redirect sign-in could not be completed.');
        }
      } finally {
        authOperationInFlightRef.current = false;
      }
    });

    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [applyAuthenticatedSession]);

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

    const handleStreakUpdated = (e: Event) => {
      const detail = (e as CustomEvent<StreakData>).detail;
      if (!detail) return;
      setGamification((prev) =>
        prev
          ? {
              ...prev,
              currentStreak: detail.currentStreak,
              longestStreak: detail.longestStreak,
              lastActiveDate: detail.lastActiveDate,
            }
          : prev
      );
      if (user) {
        pushStreakToFirestore(detail).catch(() => {});
      }
    };

    window.addEventListener('learnco_xp_awarded', handleXpAwarded);
    window.addEventListener('learnco_streak_updated', handleStreakUpdated);
    return () => {
      window.removeEventListener('learnco_xp_awarded', handleXpAwarded);
      window.removeEventListener('learnco_streak_updated', handleStreakUpdated);
    };
  }, [user, profile]);

  const clearMismatchedFirebaseIdentity = async (email?: string) => {
    if (auth?.app && auth.currentUser && !hasMatchingFirebaseIdentity(auth.currentUser.email, email)) {
      try { await fbSignOut(auth); } catch (err) { console.warn('Firebase sign-out warning:', err); }
    }
  };

  const signInWithEmail = async (email: string, password?: string) => {
    setAuthError(null);
    authOperationInFlightRef.current = true;
    let firebaseSignedIn = false;
    try {
      let firebaseIdToken: string | undefined;

      // Attempt Firebase Authentication sign-in to obtain ID token when available
      if (password && !firebaseEmailPasswordDisabled) {
        try {
          if (auth && auth.app) {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            firebaseSignedIn = true;
            firebaseIdToken = await cred.user.getIdToken();
          }
        } catch (fbInitErr: any) {
          if (fbInitErr?.code === 'auth/operation-not-allowed') {
            firebaseEmailPasswordDisabled = true;
          }
          // Backend password verification remains authoritative if Firebase client auth fails
          console.debug('Firebase client email sign-in skipped:', fbInitErr);
        }
      }

      // Complete backend flow with Firebase ID Token
      const res = await AuthClient.signIn(email, password, firebaseIdToken);
      await clearMismatchedFirebaseIdentity(res.user?.email);

      // Sync to Firebase Auth only if Email/Password provider is enabled
      if (
        !firebaseSignedIn &&
        !firebaseEmailPasswordDisabled &&
        password &&
        auth?.app &&
        typeof createUserWithEmailAndPassword === 'function'
      ) {
        try {
          const createdCred = await createUserWithEmailAndPassword(auth, email, password);
          if (createdCred?.user) {
            firebaseSignedIn = true;
            const preferredName = res.profile?.displayName || res.profile?.fullName;
            if (preferredName && typeof updateFirebaseProfile === 'function') {
              await updateFirebaseProfile(createdCred.user, { displayName: preferredName }).catch(() => {});
            }
          }
        } catch (fbSyncErr: any) {
          if (fbSyncErr?.code === 'auth/operation-not-allowed') {
            firebaseEmailPasswordDisabled = true;
          }
        }
      }

      applyAuthenticatedSession(res);
    } catch (err: any) {
      if (firebaseSignedIn) {
        try { await fbSignOut(auth); } catch { /* retain the original sign-in error */ }
      }
      setAuthError(err.message || 'Sign in failed.');
      throw err;
    } finally {
      authOperationInFlightRef.current = false;
    }
  };

  const signUpWithEmail = async (email: string, password?: string, fullName?: string) => {
    setAuthError(null);
    authOperationInFlightRef.current = true;
    let firebaseSignedIn = false;
    try {
      let firebaseIdToken: string | undefined;

      // Register with Firebase Authentication when Email/Password provider is enabled
      if (password && !firebaseEmailPasswordDisabled) {
        try {
          if (auth && auth.app) {
            try {
              const cred = await createUserWithEmailAndPassword(auth, email, password);
              if (cred?.user) {
                firebaseSignedIn = true;
                if (fullName && typeof updateFirebaseProfile === 'function') {
                  await updateFirebaseProfile(cred.user, { displayName: fullName }).catch(() => {});
                }
                firebaseIdToken = await cred.user.getIdToken();
              }
            } catch (fbErr: any) {
              if (fbErr?.code === 'auth/operation-not-allowed') {
                firebaseEmailPasswordDisabled = true;
              } else if (fbErr?.code === 'auth/email-already-in-use') {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                if (cred?.user) {
                  firebaseSignedIn = true;
                  firebaseIdToken = await cred.user.getIdToken();
                }
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
      applyAuthenticatedSession(res);
    } catch (err: any) {
      if (firebaseSignedIn) {
        try { await fbSignOut(auth); } catch { /* retain the original sign-up error */ }
      }
      setAuthError(err.message || 'Sign up failed.');
      throw err;
    } finally {
      authOperationInFlightRef.current = false;
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
    authOperationInFlightRef.current = true;
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
              try {
                sessionStorage.setItem(
                  REDIRECT_PENDING_KEY,
                  JSON.stringify({ intent, expectedEmail: email || undefined })
                );
              } catch {}
              await signInWithRedirect(auth, googleProvider);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              throw Object.assign(new Error('Redirecting to Google Sign-In...'), { isRedirecting: true });
            }
            throw new Error(
              'Google sign-in popup was blocked or restricted inside this embedded preview frame. Open the app in a new browser tab to complete Google Sign-In, or sign in with Email & Password.'
            );
          }
          throw popupErr;
        }
        firebaseSignedIn = true;
        firebaseToken = await result.user.getIdToken();
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
      const res = await AuthClient.signInWithGoogle({
        email: email || '',
        name: name || '',
        avatarUrl,
        intent,
        idToken: firebaseToken,
      });
      await clearMismatchedFirebaseIdentity(res.user?.email);
      applyAuthenticatedSession(res);
      if (res.user?.email) {
        try {
          localStorage.setItem('learnco_last_google_email', res.user.email);
          if (res.profile?.displayName || res.user?.name) {
            localStorage.setItem('learnco_last_google_name', res.profile?.displayName || res.user?.name);
          }
        } catch (_) {}
      }
    } catch (err: any) {
      if (err?.isRedirecting) {
        throw err;
      }
      if (firebaseSignedIn) {
        try { await fbSignOut(auth); } catch { /* retain the original Google sign-in error */ }
      }
      setAuthError(err.message || 'Google sign in failed.');
      throw err;
    } finally {
      authOperationInFlightRef.current = false;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    authOperationInFlightRef.current = true;
    try {
      try { sessionStorage.removeItem(REDIRECT_PENDING_KEY); } catch {}
      try {
        if (auth && auth.app) {
          await fbSignOut(auth);
        }
      } catch (fbErr) {
        console.warn('Firebase sign-out warning:', fbErr);
      }
      await AuthClient.signOut();
    } finally {
      authOperationInFlightRef.current = false;
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
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await AuthClient.updateProfile(updates);
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
    const res = await AuthClient.updateSettings(updates);
    setSettings(res.settings);
    return res.settings;
  };

  const uploadAvatar = async (imageData: string): Promise<string> => {
    const res = await AuthClient.uploadAvatar(imageData);
    setProfile(res.profile);
    if (user) {
      await syncClientToFirestore(user, res.profile, gamification).catch(() => {});
    }
    return res.avatarUrl;
  };

  const saveOnboarding = async (data: any) => {
    const res = await AuthClient.saveOnboarding(data);
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
