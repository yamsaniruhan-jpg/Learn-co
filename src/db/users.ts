import { logSqlFailure } from './errors.ts';
import { eq } from 'drizzle-orm';
import { db, isSqlConfigured } from './index.ts';
import { users } from './schema.ts';

export const PLATFORM_OWNER_EMAIL = 'yamsaniruhan@gmail.com';

export function normalizeEmail(email?: string | null): string {
  return String(email || '').trim().toLowerCase();
}

export function isOwnerEmail(email?: string | null): boolean {
  return normalizeEmail(email) === PLATFORM_OWNER_EMAIL;
}

export interface UpsertSqlUserInput {
  uid: string;
  email: string;
  fullName?: string;
  role?: string;
  authProvider?: string;
}

/**
 * Safely register or update an authenticated user in Cloud SQL PostgreSQL.
 * Uses Drizzle upsert (onConflictDoUpdate) to remain concurrency-safe.
 */
export async function getOrCreateSqlUser(input: UpsertSqlUserInput) {
  if (!isSqlConfigured()) {
    return null;
  }

  const normalizedEmail = normalizeEmail(input.email);
  const resolvedRole = input.role || 'student';

  try {
    const [row] = await db
      .insert(users)
      .values({
        uid: input.uid,
        email: normalizedEmail,
        fullName: input.fullName || null,
        role: resolvedRole,
        authProvider: input.authProvider || 'email',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
          ...(input.fullName ? { fullName: input.fullName } : {}),
          ...(input.role ? { role: input.role } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return row || null;
  } catch (error) {
    logSqlFailure('User upsert failed', error);
    throw new Error('Failed to synchronize user account with database.');
  }
}

export async function updateSqlUserRole(uid: string, role: string) {
  if (!isSqlConfigured()) {
    return null;
  }

  try {
    const [row] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.uid, uid))
      .returning();
    return row || null;
  } catch (error) {
    logSqlFailure('Update user role failed', error);
    throw new Error('Failed to update user role in database.');
  }
}
