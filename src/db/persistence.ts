import crypto from 'crypto';
import { and, desc, eq, gt, lt, sql } from 'drizzle-orm';
import { db, isSqlConfigured } from './index.ts';
import { logSqlFailure } from './errors.ts';
import {
  users,
  authAccounts,
  authSessions,
  userProfiles,
  userGamification,
  userSettings,
  userSolvedQuestions,
  practiceAttempts,
  xpLedger,
  userMistakes,
  mentorshipProfiles,
  mentorshipRequests,
  mentorshipRelationships,
  mentorshipItems,
  appDomainRecords,
} from './schema.ts';
import { normalizeEmail } from './users.ts';
import type {
  UserAccount,
  UserProfile,
  UserGamification,
  UserSettings,
  XPTransaction,
  QuestionAttemptRecord,
  MistakeRecord,
} from '../types/auth';
import type {
  MentorProfile,
  MentorshipRequest,
  MentorshipRelationship,
  MentorshipGoal,
  MentorshipTask,
  MentorshipSession,
  MentorshipMessage,
  MentorshipFeedback,
  MentorshipReport,
} from '../types/mentorship';

export interface StoredSessionRecord {
  userId: string;
  createdAt: string;
  expiresAt: string;
  verifiedOwner?: boolean;
  tokenHashVersion?: number;
}

export interface MemoryStoreShape {
  users: Record<string, UserAccount>;
  usersByEmail: Record<string, string>;
  profiles: Record<string, UserProfile>;
  gamification: Record<string, UserGamification>;
  settings: Record<string, UserSettings>;
  xpTransactions: XPTransaction[];
  mistakes: MistakeRecord[];
  sessions: Record<string, StoredSessionRecord>;
  questionAttempts: QuestionAttemptRecord[];
  attemptsById: Record<string, QuestionAttemptRecord>;
  mentorProfiles: Record<string, MentorProfile>;
  mentorshipRequests: Record<string, MentorshipRequest>;
  mentorshipRelationships: Record<string, MentorshipRelationship>;
  mentorshipGoals: Record<string, MentorshipGoal>;
  mentorshipTasks: Record<string, MentorshipTask>;
  mentorshipSessions: Record<string, MentorshipSession>;
  mentorshipMessages: Record<string, MentorshipMessage[]>;
  mentorshipFeedback: MentorshipFeedback[];
  mentorshipReports: MentorshipReport[];
  creatorSources: Record<string, any>;
  creatorResources: Record<string, any>;
  copilotConversations: Record<string, any>;
  copilotMessages: Record<string, any[]>;
  studyPlans: Record<string, any>;
  studyGoals: Record<string, any>;
  studyTasks: Record<string, any>;
  studyScheduleSettings: Record<string, any>;
}

/**
 * Compute deterministic SHA-256 hex digest of a raw session token.
 * Raw tokens must NEVER be stored in PostgreSQL or .learnco_db.json.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(String(token || '').trim()).digest('hex');
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

/**
 * Atomic transaction persisting user account, users directory row, profile, gamification, and settings.
 */
export async function persistFullUserRecordToSql(
  user: UserAccount,
  profile?: UserProfile | null,
  gamification?: UserGamification | null,
  settings?: UserSettings | null
): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    const email = normalizeEmail(user.email);
    await db.transaction(async (tx) => {
      await tx
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

      await tx
        .insert(users)
        .values({
          uid: user.id,
          email,
          fullName: profile?.fullName || null,
          role: profile?.role || 'student',
          authProvider: user.authProvider || 'email',
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
            ...(profile?.fullName ? { fullName: profile.fullName } : {}),
            ...(profile?.role ? { role: profile.role } : {}),
            updatedAt: new Date(),
          },
        });

      if (profile) {
        await tx
          .insert(userProfiles)
          .values({
            userId: profile.userId,
            email: normalizeEmail(profile.email),
            profileJson: profile as unknown as Record<string, any>,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: userProfiles.userId,
            set: {
              email: normalizeEmail(profile.email),
              profileJson: profile as unknown as Record<string, any>,
              updatedAt: new Date(),
            },
          });
      }

      if (gamification) {
        await tx
          .insert(userGamification)
          .values({
            userId: gamification.userId,
            xp: Math.max(0, Math.round(gamification.xp || 0)),
            level: Math.max(1, Math.round(gamification.level || 1)),
            currentStreak: Math.max(0, Math.round(gamification.currentStreak || 0)),
            longestStreak: Math.max(0, Math.round(gamification.longestStreak || 0)),
            lastActiveDate: gamification.lastActiveDate || '',
            gamificationJson: gamification as unknown as Record<string, any>,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: userGamification.userId,
            set: {
              xp: Math.max(0, Math.round(gamification.xp || 0)),
              level: Math.max(1, Math.round(gamification.level || 1)),
              currentStreak: Math.max(0, Math.round(gamification.currentStreak || 0)),
              longestStreak: Math.max(0, Math.round(gamification.longestStreak || 0)),
              lastActiveDate: gamification.lastActiveDate || '',
              gamificationJson: gamification as unknown as Record<string, any>,
              updatedAt: new Date(),
            },
          });
      }

      if (settings) {
        await tx
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
      }
    });
  } catch (err) {
    logSqlFailure('Atomic persist full user record failed', err);
  }
}

export async function persistSessionToSql(
  rawToken: string,
  session: { userId: string; createdAt: string; expiresAt: string; verifiedOwner?: boolean }
): Promise<void> {
  if (!isSqlConfigured() || !rawToken) return;
  try {
    const tokenHash = hashSessionToken(rawToken);
    await db
      .insert(authSessions)
      .values({
        token: tokenHash,
        userId: session.userId,
        verifiedOwner: Boolean(session.verifiedOwner),
        tokenVersion: 2,
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt),
      })
      .onConflictDoUpdate({
        target: authSessions.token,
        set: {
          userId: session.userId,
          verifiedOwner: Boolean(session.verifiedOwner),
          tokenVersion: 2,
          expiresAt: new Date(session.expiresAt),
        },
      });
  } catch (err) {
    logSqlFailure('Persist hashed session failed', err);
  }
}

export async function revokeSessionInSql(rawToken: string): Promise<void> {
  if (!isSqlConfigured() || !rawToken) return;
  try {
    const tokenHash = hashSessionToken(rawToken);
    await db.delete(authSessions).where(eq(authSessions.token, tokenHash));
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

/**
 * Atomic password reset commit: updates passwordHash and deletes all live sessions for userId.
 */
export async function commitPasswordResetToSql(user: UserAccount): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    const email = normalizeEmail(user.email);
    await db.transaction(async (tx) => {
      await tx
        .insert(authAccounts)
        .values({
          userId: user.id,
          email,
          passwordHash: user.passwordHash ?? null,
          authProvider: user.authProvider || 'email',
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: authAccounts.userId,
          set: {
            passwordHash: user.passwordHash ?? null,
            updatedAt: new Date(),
          },
        });
      await tx.delete(authSessions).where(eq(authSessions.userId, user.id));
    });
  } catch (err) {
    logSqlFailure('Atomic password reset commit failed', err);
  }
}

export async function persistSolvedQuestionToSql(attempt: QuestionAttemptRecord): Promise<void> {
  if (!isSqlConfigured()) return;
  await persistPracticeAttemptAtomicToSql(attempt, null);
}

export async function persistPracticeAttemptAtomicToSql(
  attempt: QuestionAttemptRecord,
  gamification?: UserGamification | null,
  xpTx?: XPTransaction | null,
  mistake?: MistakeRecord | null
): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    await db.transaction(async (tx) => {
      await tx
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

      await tx
        .insert(practiceAttempts)
        .values({
          attemptId: attempt.id,
          userId: attempt.userId,
          questionId: attempt.questionId,
          subjectId: attempt.subjectId || 'math',
          topicId: attempt.topicId || null,
          isCorrect: Boolean(attempt.isCorrect),
          xpAwarded: Math.max(0, Math.round(attempt.xpAwarded || 0)),
          attemptJson: attempt as unknown as Record<string, any>,
          submittedAt: attempt.submittedAt ? new Date(attempt.submittedAt) : new Date(),
        })
        .onConflictDoNothing({ target: practiceAttempts.attemptId });

      if (gamification) {
        await tx
          .insert(userGamification)
          .values({
            userId: gamification.userId,
            xp: Math.max(0, Math.round(gamification.xp || 0)),
            level: Math.max(1, Math.round(gamification.level || 1)),
            currentStreak: Math.max(0, Math.round(gamification.currentStreak || 0)),
            longestStreak: Math.max(0, Math.round(gamification.longestStreak || 0)),
            lastActiveDate: gamification.lastActiveDate || '',
            gamificationJson: gamification as unknown as Record<string, any>,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: userGamification.userId,
            set: {
              xp: Math.max(0, Math.round(gamification.xp || 0)),
              level: Math.max(1, Math.round(gamification.level || 1)),
              currentStreak: Math.max(0, Math.round(gamification.currentStreak || 0)),
              longestStreak: Math.max(0, Math.round(gamification.longestStreak || 0)),
              lastActiveDate: gamification.lastActiveDate || '',
              gamificationJson: gamification as unknown as Record<string, any>,
              updatedAt: new Date(),
            },
          });
      }

      if (xpTx) {
        await tx
          .insert(xpLedger)
          .values({
            txId: xpTx.id,
            userId: xpTx.userId,
            amount: Math.round(xpTx.amount || 0),
            reason: xpTx.reason || 'Activity',
            txJson: xpTx as unknown as Record<string, any>,
            timestamp: xpTx.timestamp ? new Date(xpTx.timestamp) : new Date(),
          })
          .onConflictDoNothing({ target: xpLedger.txId });
      }

      if (mistake) {
        await tx
          .insert(userMistakes)
          .values({
            mistakeId: mistake.id,
            userId: mistake.userId,
            subjectId: mistake.subjectId || 'math',
            resolved: Boolean(mistake.resolved),
            mistakeJson: mistake as unknown as Record<string, any>,
            createdAt: mistake.createdAt ? new Date(mistake.createdAt) : new Date(),
          })
          .onConflictDoUpdate({
            target: userMistakes.mistakeId,
            set: {
              resolved: Boolean(mistake.resolved),
              mistakeJson: mistake as unknown as Record<string, any>,
            },
          });
      }
    });
  } catch (err) {
    logSqlFailure('Atomic persist practice attempt failed', err);
  }
}

export async function persistXpUpdateAtomicToSql(
  gamification: UserGamification,
  xpTx?: XPTransaction | null
): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(userGamification)
        .values({
          userId: gamification.userId,
          xp: Math.max(0, Math.round(gamification.xp || 0)),
          level: Math.max(1, Math.round(gamification.level || 1)),
          currentStreak: Math.max(0, Math.round(gamification.currentStreak || 0)),
          longestStreak: Math.max(0, Math.round(gamification.longestStreak || 0)),
          lastActiveDate: gamification.lastActiveDate || '',
          gamificationJson: gamification as unknown as Record<string, any>,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userGamification.userId,
          set: {
            xp: Math.max(0, Math.round(gamification.xp || 0)),
            level: Math.max(1, Math.round(gamification.level || 1)),
            currentStreak: Math.max(0, Math.round(gamification.currentStreak || 0)),
            longestStreak: Math.max(0, Math.round(gamification.longestStreak || 0)),
            lastActiveDate: gamification.lastActiveDate || '',
            gamificationJson: gamification as unknown as Record<string, any>,
            updatedAt: new Date(),
          },
        });

      if (xpTx) {
        await tx
          .insert(xpLedger)
          .values({
            txId: xpTx.id,
            userId: xpTx.userId,
            amount: Math.round(xpTx.amount || 0),
            reason: xpTx.reason || 'Activity',
            txJson: xpTx as unknown as Record<string, any>,
            timestamp: xpTx.timestamp ? new Date(xpTx.timestamp) : new Date(),
          })
          .onConflictDoNothing({ target: xpLedger.txId });
      }
    });
  } catch (err) {
    logSqlFailure('Atomic persist XP update failed', err);
  }
}

export async function persistMentorProfileToSql(mentor: MentorProfile): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    await db
      .insert(mentorshipProfiles)
      .values({
        mentorId: mentor.id,
        userId: mentor.userId,
        email: mentor.email ? normalizeEmail(mentor.email) : null,
        isVerified: mentor.isVerified !== false,
        profileJson: mentor as unknown as Record<string, any>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: mentorshipProfiles.mentorId,
        set: {
          email: mentor.email ? normalizeEmail(mentor.email) : null,
          isVerified: mentor.isVerified !== false,
          profileJson: mentor as unknown as Record<string, any>,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    logSqlFailure('Persist mentor profile failed', err);
  }
}

export async function persistMentorshipRequestToSql(request: MentorshipRequest): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    await db
      .insert(mentorshipRequests)
      .values({
        requestId: request.id,
        learnerId: request.learnerId,
        mentorId: request.mentorId,
        status: request.status,
        requestJson: request as unknown as Record<string, any>,
        createdAt: request.createdAt ? new Date(request.createdAt) : new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: mentorshipRequests.requestId,
        set: {
          status: request.status,
          requestJson: request as unknown as Record<string, any>,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    logSqlFailure('Persist mentorship request failed', err);
  }
}

export async function persistMentorshipRelationshipToSql(rel: MentorshipRelationship): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    await db
      .insert(mentorshipRelationships)
      .values({
        relationshipId: rel.id,
        learnerId: rel.learnerId,
        mentorId: rel.mentorId,
        status: rel.status,
        relationshipJson: rel as unknown as Record<string, any>,
        createdAt: rel.createdAt ? new Date(rel.createdAt) : new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: mentorshipRelationships.relationshipId,
        set: {
          status: rel.status,
          relationshipJson: rel as unknown as Record<string, any>,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    logSqlFailure('Persist mentorship relationship failed', err);
  }
}

export async function persistMentorshipItemToSql(
  kind: 'goal' | 'task' | 'session' | 'message' | 'feedback' | 'report',
  id: string,
  mentorshipId: string | undefined,
  item: Record<string, any>
): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    const itemKey = `${kind}:${id}`;
    await db
      .insert(mentorshipItems)
      .values({
        itemKey,
        kind,
        mentorshipId: mentorshipId || null,
        itemJson: item,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: mentorshipItems.itemKey,
        set: {
          mentorshipId: mentorshipId || null,
          itemJson: item,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    logSqlFailure(`Persist mentorship ${kind} failed`, err);
  }
}

/**
 * Atomic transaction when accepting/declining a mentorship request.
 */
export async function persistMentorshipDecisionAtomicToSql(params: {
  request: MentorshipRequest;
  relationship?: MentorshipRelationship | null;
  mentor?: MentorProfile | null;
  initialGoal?: MentorshipGoal | null;
  welcomeMessage?: MentorshipMessage | null;
}): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(mentorshipRequests)
        .values({
          requestId: params.request.id,
          learnerId: params.request.learnerId,
          mentorId: params.request.mentorId,
          status: params.request.status,
          requestJson: params.request as unknown as Record<string, any>,
          createdAt: params.request.createdAt ? new Date(params.request.createdAt) : new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: mentorshipRequests.requestId,
          set: {
            status: params.request.status,
            requestJson: params.request as unknown as Record<string, any>,
            updatedAt: new Date(),
          },
        });

      if (params.relationship) {
        await tx
          .insert(mentorshipRelationships)
          .values({
            relationshipId: params.relationship.id,
            learnerId: params.relationship.learnerId,
            mentorId: params.relationship.mentorId,
            status: params.relationship.status,
            relationshipJson: params.relationship as unknown as Record<string, any>,
            createdAt: params.relationship.createdAt ? new Date(params.relationship.createdAt) : new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: mentorshipRelationships.relationshipId,
            set: {
              status: params.relationship.status,
              relationshipJson: params.relationship as unknown as Record<string, any>,
              updatedAt: new Date(),
            },
          });
      }

      if (params.mentor) {
        await tx
          .insert(mentorshipProfiles)
          .values({
            mentorId: params.mentor.id,
            userId: params.mentor.userId,
            email: params.mentor.email ? normalizeEmail(params.mentor.email) : null,
            isVerified: params.mentor.isVerified !== false,
            profileJson: params.mentor as unknown as Record<string, any>,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: mentorshipProfiles.mentorId,
            set: {
              profileJson: params.mentor as unknown as Record<string, any>,
              updatedAt: new Date(),
            },
          });
      }

      if (params.initialGoal) {
        await tx
          .insert(mentorshipItems)
          .values({
            itemKey: `goal:${params.initialGoal.id}`,
            kind: 'goal',
            mentorshipId: params.initialGoal.mentorshipId,
            itemJson: params.initialGoal as unknown as Record<string, any>,
            updatedAt: new Date(),
          })
          .onConflictDoNothing({ target: mentorshipItems.itemKey });
      }

      if (params.welcomeMessage) {
        await tx
          .insert(mentorshipItems)
          .values({
            itemKey: `message:${params.welcomeMessage.id}`,
            kind: 'message',
            mentorshipId: params.welcomeMessage.mentorshipId,
            itemJson: params.welcomeMessage as unknown as Record<string, any>,
            updatedAt: new Date(),
          })
          .onConflictDoNothing({ target: mentorshipItems.itemKey });
      }
    });
  } catch (err) {
    logSqlFailure('Atomic mentorship decision persist failed', err);
  }
}

export async function persistDomainRecordToSql(
  domain: string,
  id: string,
  ownerId: string | undefined,
  payload: Record<string, any>
): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    const recordKey = `${domain}:${id}`;
    await db
      .insert(appDomainRecords)
      .values({
        recordKey,
        domain,
        ownerId: ownerId || null,
        payloadJson: payload,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appDomainRecords.recordKey,
        set: {
          ownerId: ownerId || null,
          payloadJson: payload,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    logSqlFailure(`Persist domain record ${domain} failed`, err);
  }
}

export async function deleteDomainRecordFromSql(domain: string, id: string): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    await db.delete(appDomainRecords).where(eq(appDomainRecords.recordKey, `${domain}:${id}`));
  } catch (err) {
    logSqlFailure(`Delete domain record ${domain} failed`, err);
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
      authProvider: row.authProvider === 'google' ? 'google' : 'email',
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

export async function resolveSessionFromSql(rawToken: string): Promise<{
  user: UserAccount;
  profile?: UserProfile;
  gamification?: UserGamification;
  settings?: UserSettings;
  session: StoredSessionRecord;
} | null> {
  if (!isSqlConfigured() || !rawToken) return null;
  try {
    const tokenHash = hashSessionToken(rawToken);
    const now = new Date();
    const [sessionRow] = await db
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.token, tokenHash),
          eq(authSessions.tokenVersion, 2),
          gt(authSessions.expiresAt, now)
        )
      )
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
        tokenHashVersion: 2,
        ...(sessionRow.verifiedOwner ? { verifiedOwner: true } : {}),
      },
    };
  } catch (err) {
    logSqlFailure('Resolve session from SQL failed', err);
    return null;
  }
}

/**
 * Hydrate in-memory state from Cloud SQL PostgreSQL on boot.
 * Purges any pre-upgrade unhashed session rows (tokenVersion < 2) once on startup.
 */
export async function hydrateDatabaseFromSql(store: MemoryStoreShape): Promise<void> {
  if (!isSqlConfigured()) return;
  try {
    const now = new Date();
    // One-time cleanup: delete pre-upgrade unhashed sessions so raw tokens never remain valid
    await db.delete(authSessions).where(lt(authSessions.tokenVersion, 2)).catch(() => {});

    const [
      acctRows,
      sessionRows,
      profileRows,
      gamRows,
      settingsRows,
      attemptRows,
      solvedRows,
      xpRows,
      mistakeRows,
      mentorProfileRows,
      mReqRows,
      mRelRows,
      mItemRows,
      domainRows,
    ] = await Promise.all([
      db.select().from(authAccounts),
      db.select().from(authSessions).where(and(eq(authSessions.tokenVersion, 2), gt(authSessions.expiresAt, now))),
      db.select().from(userProfiles),
      db.select().from(userGamification),
      db.select().from(userSettings),
      db.select().from(practiceAttempts).orderBy(desc(practiceAttempts.submittedAt)).catch(() => []),
      db.select().from(userSolvedQuestions),
      db.select().from(xpLedger).orderBy(desc(xpLedger.timestamp)).catch(() => []),
      db.select().from(userMistakes).orderBy(desc(userMistakes.createdAt)).catch(() => []),
      db.select().from(mentorshipProfiles).catch(() => []),
      db.select().from(mentorshipRequests).catch(() => []),
      db.select().from(mentorshipRelationships).catch(() => []),
      db.select().from(mentorshipItems).catch(() => []),
      db.select().from(appDomainRecords).catch(() => []),
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
      if (row.profileJson) {
        const sqlProfile = row.profileJson as unknown as UserProfile;
        const existing = store.profiles[row.userId];
        if (!existing || sqlProfile.onboardingStatus === 'COMPLETED' || !existing.displayName) {
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
      if (row.settingsJson) {
        store.settings[row.userId] = row.settingsJson as unknown as UserSettings;
      }
    }

    for (const row of sessionRows) {
      // row.token is already the SHA-256 hex digest when tokenVersion === 2
      store.sessions[row.token] = {
        userId: row.userId,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        tokenHashVersion: 2,
        ...(row.verifiedOwner ? { verifiedOwner: true } : {}),
      };
    }

    const existingAttemptIds = new Set(store.questionAttempts.map((a) => a.id));
    for (const row of attemptRows) {
      const attempt = row.attemptJson as unknown as QuestionAttemptRecord;
      if (attempt && attempt.id && !existingAttemptIds.has(attempt.id)) {
        store.questionAttempts.push(attempt);
        store.attemptsById[attempt.id] = attempt;
        existingAttemptIds.add(attempt.id);
      }
    }

    const existingAttemptUserQKeys = new Set(
      store.questionAttempts.map((a) => `${a.userId}:${a.questionId}`)
    );
    for (const row of solvedRows) {
      const key = `${row.userId}:${row.questionId}`;
      if (!existingAttemptUserQKeys.has(key)) {
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
        if (restored.id) store.attemptsById[restored.id] = restored;
        existingAttemptUserQKeys.add(key);
      }
    }

    const existingTxIds = new Set(store.xpTransactions.map((t) => t.id));
    for (const row of xpRows) {
      const txObj = row.txJson as unknown as XPTransaction;
      if (txObj && txObj.id && !existingTxIds.has(txObj.id)) {
        store.xpTransactions.push(txObj);
        existingTxIds.add(txObj.id);
      }
    }

    const existingMistakeIds = new Set(store.mistakes.map((m) => m.id));
    for (const row of mistakeRows) {
      const mObj = row.mistakeJson as unknown as MistakeRecord;
      if (mObj && mObj.id && !existingMistakeIds.has(mObj.id)) {
        store.mistakes.push(mObj);
        existingMistakeIds.add(mObj.id);
      }
    }

    for (const row of mentorProfileRows) {
      const prof = row.profileJson as unknown as MentorProfile;
      if (prof?.id) {
        store.mentorProfiles[prof.id] = prof;
      }
    }

    for (const row of mReqRows) {
      const req = row.requestJson as unknown as MentorshipRequest;
      if (req?.id) {
        store.mentorshipRequests[req.id] = req;
      }
    }

    for (const row of mRelRows) {
      const rel = row.relationshipJson as unknown as MentorshipRelationship;
      if (rel?.id) {
        store.mentorshipRelationships[rel.id] = rel;
      }
    }

    const existingFbIds = new Set(store.mentorshipFeedback.map((f) => f.id));
    const existingRepIds = new Set(store.mentorshipReports.map((r) => r.id));
    const msgIdsByRel = new Map<string, Set<string>>();

    for (const row of mItemRows) {
      const item = row.itemJson as Record<string, any>;
      if (!item) continue;
      if (row.kind === 'goal' && item.id) {
        store.mentorshipGoals[item.id] = item as MentorshipGoal;
      } else if (row.kind === 'task' && item.id) {
        store.mentorshipTasks[item.id] = item as MentorshipTask;
      } else if (row.kind === 'session' && item.id) {
        store.mentorshipSessions[item.id] = item as MentorshipSession;
      } else if (row.kind === 'message' && item.id && item.mentorshipId) {
        if (!store.mentorshipMessages[item.mentorshipId]) {
          store.mentorshipMessages[item.mentorshipId] = [];
        }
        if (!msgIdsByRel.has(item.mentorshipId)) {
          msgIdsByRel.set(
            item.mentorshipId,
            new Set(store.mentorshipMessages[item.mentorshipId].map((m) => m.id))
          );
        }
        const seen = msgIdsByRel.get(item.mentorshipId)!;
        if (!seen.has(item.id)) {
          store.mentorshipMessages[item.mentorshipId].push(item as MentorshipMessage);
          seen.add(item.id);
        }
      } else if (row.kind === 'feedback' && item.id && !existingFbIds.has(item.id)) {
        store.mentorshipFeedback.push(item as MentorshipFeedback);
        existingFbIds.add(item.id);
      } else if (row.kind === 'report' && item.id && !existingRepIds.has(item.id)) {
        store.mentorshipReports.push(item as MentorshipReport);
        existingRepIds.add(item.id);
      }
    }

    for (const row of domainRows) {
      const payload = row.payloadJson as Record<string, any>;
      if (!payload) continue;
      const idx = row.recordKey.indexOf(':');
      const id = idx >= 0 ? row.recordKey.slice(idx + 1) : row.recordKey;
      if (row.domain === 'creator_source') store.creatorSources[id] = payload;
      else if (row.domain === 'creator_resource') store.creatorResources[id] = payload;
      else if (row.domain === 'copilot_conv') store.copilotConversations[id] = payload;
      else if (row.domain === 'copilot_msgs' && Array.isArray(payload.messages)) store.copilotMessages[id] = payload.messages;
      else if (row.domain === 'study_plan') store.studyPlans[id] = payload;
      else if (row.domain === 'study_goal') store.studyGoals[id] = payload;
      else if (row.domain === 'study_task') store.studyTasks[id] = payload;
      else if (row.domain === 'study_settings') store.studyScheduleSettings[id] = payload;
    }

    // Backfill any local-only seeded or fallback accounts into Cloud SQL silently
    const sqlUserIds = new Set(acctRows.map((r) => r.userId));
    for (const user of Object.values(store.users)) {
      if (!sqlUserIds.has(user.id)) {
        await persistFullUserRecordToSql(
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
