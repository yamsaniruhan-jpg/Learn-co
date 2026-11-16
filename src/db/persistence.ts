import { and, eq, gt, sql } from 'drizzle-orm';
import { db, isSqlConfigured } from './index.ts';
import { logSqlFailure } from './errors.ts';
import {
  authAccounts,
  authSessions,
  userProfiles,
  userGamification,
  userSettings,
  userSolvedQuestions,
} from './schema.ts';
import { getOrCreateSqlUser, normalizeEmail } from './users.ts';
import type {
  UserAccount,
  UserProfile,
  UserGamification,
  UserSettings,
  QuestionAttemptRecord,
} from '../types/auth';

export interface MemoryStoreShape {
  users: Record<string, UserAccount>;
  usersByEmail: Record<string, string>;
  profiles: Record<string, UserProfile>;
  gamification: Record<string, UserGamification>;
  settings: Record<string, UserSettings>;
  sessions: Record<string, { userId: string; createdAt: string; expiresAt: string; verifiedOwner?: boolean }>;
  questionAttempts: QuestionAttemptRecord[];
  attemptsById: Record<string, QuestionAttemptRecord>;
}

export async function persistAccountToSql(user: UserAccount): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    const email = normalizeEmail(user.email);
    await db
      .insert(authAccounts)
      .values({
        userId: user.id,
        email,
        passwordHash: user.passwordHash ?? null,
        authProvider: user.authProvider || 'email',
        subscription: user.subscription ?? null,
        subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : new Date(),
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
      })
      .onConflictDoUpdate({
        target: authAccounts.userId,
        set: {
          email,
          passwordHash: user.passwordHash ?? null,
          authProvider: user.authProvider || 'email',
          subscription: user.subscription ?? null,
          subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
          lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : new Date(),
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    logSqlFailure('Persist auth account failed', err);
  }
}

export async function persistProfileToSql(profile: UserProfile): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    const email = normalizeEmail(profile.email);
    await db
      .insert(userProfiles)
      .values({
        userId: profile.userId,
        email,
        profileJson: profile as unknown as Record<string, any>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          email,
          profileJson: profile as unknown as Record<string, any>,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    logSqlFailure('Persist user profile failed', err);
  }
}

export async function persistGamificationToSql(gam: UserGamification): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    await db
      .insert(userGamification)
      .values({
        userId: gam.userId,
        xp: Math.max(0, Math.round(gam.xp || 0)),
        level: Math.max(1, Math.round(gam.level || 1)),
        currentStreak: Math.max(0, Math.round(gam.currentStreak || 0)),
        longestStreak: Math.max(0, Math.round(gam.longestStreak || 0)),
        lastActiveDate: gam.lastActiveDate || '',
        gamificationJson: gam as unknown as Record<string, any>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userGamification.userId,
        set: {
          xp: Math.max(0, Math.round(gam.xp || 0)),
          level: Math.max(1, Math.round(gam.level || 1)),
          currentStreak: Math.max(0, Math.round(gam.currentStreak || 0)),
          longestStreak: Math.max(0, Math.round(gam.longestStreak || 0)),
          lastActiveDate: gam.lastActiveDate || '',
          gamificationJson: gam as unknown as Record<string, any>,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    logSqlFailure('Persist user gamification failed', err);
  }
}

export async function persistSettingsToSql(settings: UserSettings): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    await db
      .insert(userSettings)
      .values({
        userId: settings.userId,
        settingsJson: settings as unknown as Record<string, any>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          settingsJson: settings as unknown as Record<string, any>,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    logSqlFailure('Persist user settings failed', err);
  }
}

export async function persistFullUserRecordToSql(
  user: UserAccount,
  profile?: UserProfile | null,
  gamification?: UserGamification | null,
  settings?: UserSettings | null
): Promise<void> {
  if (!isSqlConfigured()) return;
  await Promise.allSettled([
    persistAccountToSql(user),
    getOrCreateSqlUser({
      uid: user.id,
      email: user.email,
      fullName: profile?.fullName,
      role: profile?.role,
      authProvider: user.authProvider,
    }),
    profile ? persistProfileToSql(profile) : Promise.resolve(),
    gamification ? persistGamificationToSql(gamification) : Promise.resolve(),
    settings ? persistSettingsToSql(settings) : Promise.resolve(),
  ]);
}

export async function persistSessionToSql(
  token: string,
  session: { userId: string; createdAt: string; expiresAt: string; verifiedOwner?: boolean }
): Promise<void> {
  if (!isSqlConfigured() || !token) return;
  try {
    await db
      .insert(authSessions)
      .values({
        token,
        userId: session.userId,
        verifiedOwner: Boolean(session.verifiedOwner),
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt),
      })
      .onConflictDoUpdate({
        target: authSessions.token,
        set: {
          userId: session.userId,
          verifiedOwner: Boolean(session.verifiedOwner),
          expiresAt: new Date(session.expiresAt),
        },
      });
  } catch (err) {
    logSqlFailure('Persist session failed', err);
  }
}

export async function revokeSessionInSql(token: string): Promise<void> {
  if (!isSqlConfigured() || !token) return;
  try {
    await db.delete(authSessions).where(eq(authSessions.token, token));
  } catch (err) {
    logSqlFailure('Revoke session failed', err);
  }
}

export async function revokeUserSessionsInSql(userId: string): Promise<void> {
  if (!isSqlConfigured() || !userId) return;
  try {
    await db.delete(authSessions).where(eq(authSessions.userId, userId));
  } catch (err) {
    logSqlFailure('Revoke user sessions failed', err);
  }
}

export async function persistSolvedQuestionToSql(attempt: QuestionAttemptRecord): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    await db
      .insert(userSolvedQuestions)
      .values({
        userId: attempt.userId,
        questionId: attempt.questionId,
        subjectId: attempt.subjectId || 'math',
        topicId: attempt.topicId || null,
        isCorrect: Boolean(attempt.isCorrect),
        xpAwarded: Math.max(0, Math.round(attempt.xpAwarded || 0)),
        attemptCount: 1,
        lastAttemptJson: attempt as unknown as Record<string, any>,
        lastAttemptAt: attempt.submittedAt ? new Date(attempt.submittedAt) : new Date(),
      })
      .onConflictDoUpdate({
        target: [userSolvedQuestions.userId, userSolvedQuestions.questionId],
        set: {
          subjectId: attempt.subjectId || 'math',
          topicId: attempt.topicId || null,
          isCorrect: Boolean(attempt.isCorrect),
          xpAwarded: sql`GREATEST(${userSolvedQuestions.xpAwarded}, ${Math.max(0, Math.round(attempt.xpAwarded || 0))})`,
          attemptCount: sql`${userSolvedQuestions.attemptCount} + 1`,
          lastAttemptJson: attempt as unknown as Record<string, any>,
          lastAttemptAt: attempt.submittedAt ? new Date(attempt.submittedAt) : new Date(),
        },
      });
  } catch (err) {
    logSqlFailure('Persist solved question failed', err);
  }
}

export async function getSolvedQuestionIdsFromSql(userId: string): Promise<string[]> {
  if (!isSqlConfigured() || !userId) return [];
  try {
    const rows = await db
      .select({ questionId: userSolvedQuestions.questionId })
      .from(userSolvedQuestions)
      .where(eq(userSolvedQuestions.userId, userId));
    return rows.map((r) => r.questionId);
  } catch (err) {
    logSqlFailure('Fetch solved question IDs failed', err);
    return [];
  }
}

export async function findAccountByEmailFromSql(email: string): Promise<UserAccount | null> {
  if (!isSqlConfigured()) return null;
  try {
    const norm = normalizeEmail(email);
    const [row] = await db
      .select()
      .from(authAccounts)
      .where(eq(authAccounts.email, norm))
      .limit(1);
    if (!row) return null;
    return {
      id: row.userId,
      email: row.email,
      passwordHash: row.passwordHash ?? undefined,
      authProvider: (row.authProvider === 'google' ? 'google' : 'email'),
      subscription: row.subscription ?? undefined,
      subscriptionExpiresAt: row.subscriptionExpiresAt ?? undefined,
      lastLoginAt: row.lastLoginAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  } catch (err) {
    logSqlFailure('Lookup auth account by email failed', err);
    return null;
  }
}

export async function resolveSessionFromSql(token: string): Promise<{
  user: UserAccount;
  profile?: UserProfile;
  gamification?: UserGamification;
  settings?: UserSettings;
  session: { userId: string; createdAt: string; expiresAt: string; verifiedOwner?: boolean };
} | null> {
  if (!isSqlConfigured() || !token) return null;
  try {
    const now = new Date();
    const [sessionRow] = await db
      .select()
      .from(authSessions)
      .where(and(eq(authSessions.token, token.trim()), gt(authSessions.expiresAt, now)))
      .limit(1);
    if (!sessionRow) return null;

    const [acctRow] = await db
      .select()
      .from(authAccounts)
      .where(eq(authAccounts.userId, sessionRow.userId))
      .limit(1);
    if (!acctRow) return null;

    const [profRow] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, sessionRow.userId))
      .limit(1);
    const [gamRow] = await db
      .select()
      .from(userGamification)
      .where(eq(userGamification.userId, sessionRow.userId))
      .limit(1);
    const [setRow] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, sessionRow.userId))
      .limit(1);

    return {
      user: {
        id: acctRow.userId,
        email: acctRow.email,
        passwordHash: acctRow.passwordHash ?? undefined,
        authProvider: acctRow.authProvider === 'google' ? 'google' : 'email',
        subscription: acctRow.subscription ?? undefined,
        subscriptionExpiresAt: acctRow.subscriptionExpiresAt ?? undefined,
        lastLoginAt: acctRow.lastLoginAt.toISOString(),
        createdAt: acctRow.createdAt.toISOString(),
        updatedAt: acctRow.updatedAt.toISOString(),
      },
      profile: profRow?.profileJson as UserProfile | undefined,
      gamification: gamRow?.gamificationJson as UserGamification | undefined,
      settings: setRow?.settingsJson as UserSettings | undefined,
      session: {
        userId: sessionRow.userId,
        createdAt: sessionRow.createdAt.toISOString(),
        expiresAt: sessionRow.expiresAt.toISOString(),
        ...(sessionRow.verifiedOwner ? { verifiedOwner: true } : {}),
      },
    };
  } catch (err) {
    logSqlFailure('Resolve session from SQL failed', err);
    return null;
  }
}

/**
 * Hydrate in-memory auth/profile/gamification/session/solved state from Cloud SQL on boot,
 * and backfill any pre-existing local disk accounts that aren't in SQL yet.
 */
export async function hydrateDatabaseFromSql(store: MemoryStoreShape): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    const now = new Date();
    const [acctRows, sessionRows, profileRows, gamRows, settingsRows, solvedRows] = await Promise.all([
      db.select().from(authAccounts),
      db.select().from(authSessions).where(gt(authSessions.expiresAt, now)),
      db.select().from(userProfiles),
      db.select().from(userGamification),
      db.select().from(userSettings),
      db.select().from(userSolvedQuestions),
    ]);

    for (const row of acctRows) {
      const existing = store.users[row.userId];
      const sqlUpdated = row.updatedAt?.getTime() || 0;
      const memUpdated = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      if (!existing || sqlUpdated >= memUpdated) {
        store.users[row.userId] = {
          id: row.userId,
          email: normalizeEmail(row.email),
          passwordHash: row.passwordHash ?? undefined,
          authProvider: row.authProvider === 'google' ? 'google' : 'email',
          subscription: row.subscription ?? undefined,
          subscriptionExpiresAt: row.subscriptionExpiresAt ?? undefined,
          lastLoginAt: row.lastLoginAt.toISOString(),
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      }
      store.usersByEmail[normalizeEmail(row.email)] = row.userId;
    }

    for (const row of profileRows) {
      if (row.profileJson && !store.profiles[row.userId]) {
        store.profiles[row.userId] = row.profileJson as unknown as UserProfile;
      } else if (row.profileJson && store.profiles[row.userId]) {
        // Prefer SQL profile if SQL row is newer or onboarding was completed
        const sqlProfile = row.profileJson as unknown as UserProfile;
        if (sqlProfile.onboardingStatus === 'COMPLETED' && store.profiles[row.userId].onboardingStatus !== 'COMPLETED') {
          store.profiles[row.userId] = sqlProfile;
        }
      }
    }

    for (const row of gamRows) {
      if (row.gamificationJson) {
        const sqlGam = row.gamificationJson as unknown as UserGamification;
        const memGam = store.gamification[row.userId];
        if (!memGam || (sqlGam.xp ?? 0) >= (memGam.xp ?? 0)) {
          store.gamification[row.userId] = sqlGam;
        }
      }
    }

    for (const row of settingsRows) {
      if (row.settingsJson && !store.settings[row.userId]) {
        store.settings[row.userId] = row.settingsJson as unknown as UserSettings;
      }
    }

    for (const row of sessionRows) {
      if (!store.sessions[row.token]) {
        store.sessions[row.token] = {
          userId: row.userId,
          createdAt: row.createdAt.toISOString(),
          expiresAt: row.expiresAt.toISOString(),
          ...(row.verifiedOwner ? { verifiedOwner: true } : {}),
        };
      }
    }

    const existingAttemptKeys = new Set(
      store.questionAttempts.map((a) => `${a.userId}:${a.questionId}`)
    );
    for (const row of solvedRows) {
      const key = `${row.userId}:${row.questionId}`;
      if (!existingAttemptKeys.has(key)) {
        const restored = (row.lastAttemptJson as unknown as QuestionAttemptRecord) || {
          id: `sql-restored-${row.id}`,
          userId: row.userId,
          questionId: row.questionId,
          subjectId: row.subjectId as any,
          topicId: row.topicId || 'Practice',
          difficulty: 'medium',
          selectedAnswer: '',
          correctAnswer: '',
          isCorrect: row.isCorrect,
          solvingTimeSeconds: 0,
          hintsRevealedCount: 0,
          startedAt: row.lastAttemptAt.toISOString(),
          submittedAt: row.lastAttemptAt.toISOString(),
          status: row.isCorrect ? 'CORRECT' : 'INCORRECT',
          xpAwarded: row.xpAwarded,
          verification: 'bank',
          questionText: '',
          explanation: '',
        };
        store.questionAttempts.push(restored);
        if (restored.id) {
          store.attemptsById[restored.id] = restored;
        }
        existingAttemptKeys.add(key);
      }
    }

    // Backfill any local-only accounts into Cloud SQL silently
    const sqlUserIds = new Set(acctRows.map((r) => r.userId));
    for (const user of Object.values(store.users)) {
      if (!sqlUserIds.has(user.id)) {
        void persistFullUserRecordToSql(
          user,
          store.profiles[user.id],
          store.gamification[user.id],
          store.settings[user.id]
        );
      }
    }
  } catch (err) {
    logSqlFailure('Hydrate store from SQL failed', err);
  }
}
