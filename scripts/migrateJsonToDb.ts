import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { closeSqlPool, db, isSqlConfigured } from '../src/db/index.ts';
import {
  authAccounts,
  authSessions,
  mentorshipItems,
  mentorshipProfiles,
  mentorshipRelationships,
  mentorshipRequests,
  practiceAttempts,
  userGamification,
  userMistakes,
  userProfiles,
  users,
  userSettings,
  userSolvedQuestions,
  xpLedger,
} from '../src/db/schema.ts';
import { normalizeEmail } from '../src/db/users.ts';

export interface MigrationSummary {
  users: number;
  profiles: number;
  gamification: number;
  settings: number;
  sessionsMigrated: number;
  legacySessionsSkipped: number;
  attempts: number;
  mistakes: number;
  xpTransactions: number;
  mentorshipProfiles: number;
  mentorshipRequests: number;
  mentorshipRelationships: number;
  mentorshipItems: number;
}

export async function migrateJsonFileToSql(jsonFilePath: string): Promise<MigrationSummary> {
  if (!isSqlConfigured()) {
    throw new Error('Cloud SQL is not configured. Ensure SQL_HOST, SQL_USER, SQL_PASSWORD, and SQL_DB_NAME are set.');
  }

  const resolved = path.resolve(jsonFilePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`JSON data file not found: ${resolved}`);
  }

  const parsed = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
  const summary: MigrationSummary = {
    users: 0,
    profiles: 0,
    gamification: 0,
    settings: 0,
    sessionsMigrated: 0,
    legacySessionsSkipped: 0,
    attempts: 0,
    mistakes: 0,
    xpTransactions: 0,
    mentorshipProfiles: 0,
    mentorshipRequests: 0,
    mentorshipRelationships: 0,
    mentorshipItems: 0,
  };

  await db.transaction(async (tx) => {
    const usersMap: Record<string, any> = parsed.users || {};
    const profilesMap: Record<string, any> = parsed.profiles || {};
    const gamMap: Record<string, any> = parsed.gamification || {};
    const settingsMap: Record<string, any> = parsed.settings || {};

    for (const u of Object.values(usersMap)) {
      if (!u?.id || !u?.email) continue;
      const email = normalizeEmail(u.email);
      const profile = profilesMap[u.id];
      await tx
        .insert(authAccounts)
        .values({
          userId: u.id,
          email,
          passwordHash: u.passwordHash ?? null,
          authProvider: u.authProvider || 'email',
          subscription: u.subscription ?? null,
          subscriptionExpiresAt: u.subscriptionExpiresAt ?? null,
          lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : new Date(),
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
        })
        .onConflictDoNothing({ target: authAccounts.userId });

      await tx
        .insert(users)
        .values({
          uid: u.id,
          email,
          fullName: profile?.fullName || null,
          role: profile?.role || 'student',
          authProvider: u.authProvider || 'email',
        })
        .onConflictDoNothing({ target: users.uid });
      summary.users += 1;
    }

    for (const p of Object.values(profilesMap)) {
      if (!p?.userId) continue;
      await tx
        .insert(userProfiles)
        .values({
          userId: p.userId,
          email: normalizeEmail(p.email || `${p.userId}@learn.co`),
          profileJson: p,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: { profileJson: p, updatedAt: new Date() },
        });
      summary.profiles += 1;
    }

    for (const g of Object.values(gamMap)) {
      if (!g?.userId) continue;
      await tx
        .insert(userGamification)
        .values({
          userId: g.userId,
          xp: Math.max(0, Math.round(g.xp || 0)),
          level: Math.max(1, Math.round(g.level || 1)),
          currentStreak: Math.max(0, Math.round(g.currentStreak || 0)),
          longestStreak: Math.max(0, Math.round(g.longestStreak || 0)),
          lastActiveDate: g.lastActiveDate || '',
          gamificationJson: g,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userGamification.userId,
          set: {
            xp: Math.max(0, Math.round(g.xp || 0)),
            level: Math.max(1, Math.round(g.level || 1)),
            currentStreak: Math.max(0, Math.round(g.currentStreak || 0)),
            longestStreak: Math.max(0, Math.round(g.longestStreak || 0)),
            lastActiveDate: g.lastActiveDate || '',
            gamificationJson: g,
            updatedAt: new Date(),
          },
        });
      summary.gamification += 1;
    }

    for (const s of Object.values(settingsMap)) {
      if (!s?.userId) continue;
      await tx
        .insert(userSettings)
        .values({
          userId: s.userId,
          settingsJson: s,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: { settingsJson: s, updatedAt: new Date() },
        });
      summary.settings += 1;
    }

    // Never import legacy raw-token sessions. Only import v2 SHA-256 hashed unexpired sessions.
    const now = Date.now();
    for (const [key, sess] of Object.entries((parsed.sessions || {}) as Record<string, any>)) {
      if (!sess || sess.tokenHashVersion !== 2 || new Date(sess.expiresAt).getTime() <= now) {
        summary.legacySessionsSkipped += 1;
        continue;
      }
      await tx
        .insert(authSessions)
        .values({
          token: key,
          userId: sess.userId,
          verifiedOwner: Boolean(sess.verifiedOwner),
          tokenVersion: 2,
          createdAt: new Date(sess.createdAt),
          expiresAt: new Date(sess.expiresAt),
        })
        .onConflictDoNothing({ target: authSessions.token });
      summary.sessionsMigrated += 1;
    }

    for (const att of (parsed.questionAttempts || []) as any[]) {
      if (!att?.id || !att?.userId || !att?.questionId) continue;
      await tx
        .insert(practiceAttempts)
        .values({
          attemptId: att.id,
          userId: att.userId,
          questionId: att.questionId,
          subjectId: att.subjectId || 'math',
          topicId: att.topicId || null,
          isCorrect: Boolean(att.isCorrect),
          xpAwarded: Math.max(0, Math.round(att.xpAwarded || 0)),
          attemptJson: att,
          submittedAt: att.submittedAt ? new Date(att.submittedAt) : new Date(),
        })
        .onConflictDoNothing({ target: practiceAttempts.attemptId });

      await tx
        .insert(userSolvedQuestions)
        .values({
          userId: att.userId,
          questionId: att.questionId,
          subjectId: att.subjectId || 'math',
          topicId: att.topicId || null,
          isCorrect: Boolean(att.isCorrect),
          xpAwarded: Math.max(0, Math.round(att.xpAwarded || 0)),
          attemptCount: 1,
          lastAttemptJson: att,
          lastAttemptAt: att.submittedAt ? new Date(att.submittedAt) : new Date(),
        })
        .onConflictDoNothing({ target: [userSolvedQuestions.userId, userSolvedQuestions.questionId] });
      summary.attempts += 1;
    }

    for (const x of (parsed.xpTransactions || []) as any[]) {
      if (!x?.id || !x?.userId) continue;
      await tx
        .insert(xpLedger)
        .values({
          txId: x.id,
          userId: x.userId,
          amount: Math.round(x.amount || 0),
          reason: x.reason || 'Activity',
          txJson: x,
          timestamp: x.timestamp ? new Date(x.timestamp) : new Date(),
        })
        .onConflictDoNothing({ target: xpLedger.txId });
      summary.xpTransactions += 1;
    }

    for (const m of (parsed.mistakes || []) as any[]) {
      if (!m?.id || !m?.userId) continue;
      await tx
        .insert(userMistakes)
        .values({
          mistakeId: m.id,
          userId: m.userId,
          subjectId: m.subjectId || 'math',
          resolved: Boolean(m.resolved),
          mistakeJson: m,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        })
        .onConflictDoNothing({ target: userMistakes.mistakeId });
      summary.mistakes += 1;
    }

    for (const mp of Object.values((parsed.mentorProfiles || {}) as Record<string, any>)) {
      if (!mp?.id || !mp?.userId) continue;
      await tx
        .insert(mentorshipProfiles)
        .values({
          mentorId: mp.id,
          userId: mp.userId,
          email: mp.email ? normalizeEmail(mp.email) : null,
          isVerified: mp.isVerified !== false,
          profileJson: mp,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: mentorshipProfiles.mentorId,
          set: { profileJson: mp, updatedAt: new Date() },
        });
      summary.mentorshipProfiles += 1;
    }

    for (const req of Object.values((parsed.mentorshipRequests || {}) as Record<string, any>)) {
      if (!req?.id) continue;
      await tx
        .insert(mentorshipRequests)
        .values({
          requestId: req.id,
          learnerId: req.learnerId,
          mentorId: req.mentorId,
          status: req.status || 'PENDING',
          requestJson: req,
          createdAt: req.createdAt ? new Date(req.createdAt) : new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: mentorshipRequests.requestId,
          set: { status: req.status || 'PENDING', requestJson: req, updatedAt: new Date() },
        });
      summary.mentorshipRequests += 1;
    }

    for (const rel of Object.values((parsed.mentorshipRelationships || {}) as Record<string, any>)) {
      if (!rel?.id) continue;
      await tx
        .insert(mentorshipRelationships)
        .values({
          relationshipId: rel.id,
          learnerId: rel.learnerId,
          mentorId: rel.mentorId,
          status: rel.status || 'ACTIVE',
          relationshipJson: rel,
          createdAt: rel.createdAt ? new Date(rel.createdAt) : new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: mentorshipRelationships.relationshipId,
          set: { status: rel.status || 'ACTIVE', relationshipJson: rel, updatedAt: new Date() },
        });
      summary.mentorshipRelationships += 1;
    }

    const pushItem = async (
      kind: 'goal' | 'task' | 'session' | 'message' | 'feedback' | 'report',
      id: string,
      mentorshipId: string | undefined,
      item: Record<string, any>
    ) => {
      await tx
        .insert(mentorshipItems)
        .values({
          itemKey: `${kind}:${id}`,
          kind,
          mentorshipId: mentorshipId || null,
          itemJson: item,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: mentorshipItems.itemKey,
          set: { itemJson: item, updatedAt: new Date() },
        });
      summary.mentorshipItems += 1;
    };

    for (const g of Object.values((parsed.mentorshipGoals || {}) as Record<string, any>)) {
      if (g?.id) await pushItem('goal', g.id, g.mentorshipId, g);
    }
    for (const t of Object.values((parsed.mentorshipTasks || {}) as Record<string, any>)) {
      if (t?.id) await pushItem('task', t.id, t.mentorshipId, t);
    }
    for (const s of Object.values((parsed.mentorshipSessions || {}) as Record<string, any>)) {
      if (s?.id) await pushItem('session', s.id, s.mentorshipId, s);
    }
    for (const [mId, list] of Object.entries((parsed.mentorshipMessages || {}) as Record<string, any[]>)) {
      for (const msg of list || []) {
        if (msg?.id) await pushItem('message', msg.id, mId, msg);
      }
    }
    for (const fb of (parsed.mentorshipFeedback || []) as any[]) {
      if (fb?.id) await pushItem('feedback', fb.id, fb.mentorshipId, fb);
    }
    for (const rep of (parsed.mentorshipReports || []) as any[]) {
      if (rep?.id) await pushItem('report', rep.id, rep.mentorshipId, rep);
    }
  });

  return summary;
}

const isMain = process.argv[1] && /migrateJsonToDb\.(ts|js|mjs)$/.test(process.argv[1]);
if (isMain) {
  const fileArg = process.argv[2] || process.env.LEARNCO_DB_FILE || path.join(process.cwd(), '.learnco_db.json');
  migrateJsonFileToSql(fileArg)
    .then((summary) => {
      console.log('Migration complete:', JSON.stringify(summary, null, 2));
    })
    .catch((err) => {
      console.error('Migration failed:', err?.message || err);
      process.exitCode = 1;
    })
    .finally(() => closeSqlPool().catch(() => {}));
}
