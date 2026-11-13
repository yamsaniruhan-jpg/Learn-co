import { logSqlFailure } from './errors.ts';
import { desc, eq } from 'drizzle-orm';
import { db, isSqlConfigured } from './index.ts';
import { mentorApplications, mentors } from './schema.ts';
import { PLATFORM_OWNER_EMAIL, getOrCreateSqlUser } from './users.ts';

export type MentorApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MentorApplicationRecord {
  id: string;
  applicantUid: string;
  applicantEmail: string;
  fullName: string;
  degree: string;
  institution: string;
  subjectId: string;
  experienceYears: number;
  capacity: number;
  hourlyRate: number;
  bio: string;
  status: MentorApplicationStatus;
  routedToEmail: string;
  reviewerEmail?: string | null;
  reviewerNote?: string | null;
  reviewedAt?: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface SubmitMentorApplicationInput {
  applicantUid: string;
  applicantEmail: string;
  fullName: string;
  degree: string;
  institution: string;
  subjectId: string;
  experienceYears: number;
  capacity: number;
  hourlyRate: number;
  bio: string;
}

function mapRowToRecord(row: typeof mentorApplications.$inferSelect): MentorApplicationRecord {
  return {
    id: row.applicationCode,
    applicantUid: row.applicantUid,
    applicantEmail: row.applicantEmail,
    fullName: row.fullName,
    degree: row.degree,
    institution: row.institution,
    subjectId: row.subjectId,
    experienceYears: row.experienceYears,
    capacity: row.capacity,
    hourlyRate: row.hourlyRate,
    bio: row.bio,
    status: row.status as MentorApplicationStatus,
    routedToEmail: row.routedToEmail,
    reviewerEmail: row.reviewerEmail,
    reviewerNote: row.reviewerNote,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    submittedAt: row.submittedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Persists a formal mentor application to Cloud SQL PostgreSQL.
 * All applications are routed directly to the platform owner (yamsaniruhan@gmail.com).
 */
export async function createSqlMentorApplication(
  input: SubmitMentorApplicationInput
): Promise<MentorApplicationRecord | null> {
  if (!isSqlConfigured()) {
    return null;
  }

  try {
    await getOrCreateSqlUser({
      uid: input.applicantUid,
      email: input.applicantEmail,
      fullName: input.fullName,
    });

    const applicationCode = `mapp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();

    const [inserted] = await db
      .insert(mentorApplications)
      .values({
        applicationCode,
        applicantUid: input.applicantUid,
        applicantEmail: input.applicantEmail.trim().toLowerCase(),
        fullName: input.fullName.trim(),
        degree: input.degree.trim(),
        institution: input.institution.trim(),
        subjectId: input.subjectId.trim(),
        experienceYears: Math.max(0, Number(input.experienceYears) || 0),
        capacity: Math.max(1, Math.min(50, Number(input.capacity) || 5)),
        hourlyRate: Math.max(0, Number(input.hourlyRate) || 0),
        bio: input.bio.trim(),
        status: 'PENDING',
        routedToEmail: PLATFORM_OWNER_EMAIL,
        submittedAt: now,
        updatedAt: now,
      })
      .returning();

    return inserted ? mapRowToRecord(inserted) : null;
  } catch (error) {
    logSqlFailure('Failed to create mentor application', error);
    throw new Error('Failed to store mentor application in PostgreSQL.');
  }
}

export async function listSqlMentorApplications(): Promise<MentorApplicationRecord[] | null> {
  if (!isSqlConfigured()) {
    return null;
  }

  try {
    const rows = await db
      .select()
      .from(mentorApplications)
      .orderBy(desc(mentorApplications.submittedAt));

    return rows.map(mapRowToRecord);
  } catch (error) {
    logSqlFailure('Failed to list mentor applications', error);
    throw new Error('Failed to load mentor applications from PostgreSQL.');
  }
}

export async function listSqlMentorApplicationsByApplicant(
  applicantUid: string
): Promise<MentorApplicationRecord[] | null> {
  if (!isSqlConfigured()) {
    return null;
  }

  try {
    const rows = await db
      .select()
      .from(mentorApplications)
      .where(eq(mentorApplications.applicantUid, applicantUid))
      .orderBy(desc(mentorApplications.submittedAt));

    return rows.map(mapRowToRecord);
  } catch (error) {
    logSqlFailure('Failed to list user mentor applications', error);
    throw new Error('Failed to load your mentor applications.');
  }
}

export async function getSqlMentorApplication(
  applicationCode: string
): Promise<MentorApplicationRecord | null> {
  if (!isSqlConfigured()) {
    return null;
  }

  try {
    const [row] = await db
      .select()
      .from(mentorApplications)
      .where(eq(mentorApplications.applicationCode, applicationCode));

    return row ? mapRowToRecord(row) : null;
  } catch (error) {
    logSqlFailure('Failed to fetch mentor application', error);
    throw new Error('Failed to retrieve mentor application.');
  }
}

export async function decideSqlMentorApplication(
  applicationCode: string,
  decision: 'APPROVED' | 'REJECTED',
  reviewerEmail: string,
  reviewerNote?: string
): Promise<MentorApplicationRecord | null> {
  if (!isSqlConfigured()) {
    return null;
  }

  try {
    const now = new Date();
    const [updated] = await db
      .update(mentorApplications)
      .set({
        status: decision,
        reviewerEmail: reviewerEmail.trim().toLowerCase(),
        reviewerNote: reviewerNote?.trim() || null,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(mentorApplications.applicationCode, applicationCode))
      .returning();

    return updated ? mapRowToRecord(updated) : null;
  } catch (error) {
    logSqlFailure('Failed to update mentor application status', error);
    throw new Error('Failed to record decision for mentor application.');
  }
}

export async function upsertSqlMentorProfile(input: {
  mentorId: string;
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  headline: string;
  education: string;
  subjects: string[];
  teachingExperienceYears: number;
  maxMentees: number;
  hourlyRate: number;
  bio: string;
}) {
  if (!isSqlConfigured()) {
    return null;
  }

  try {
    const now = new Date();
    const [row] = await db
      .insert(mentors)
      .values({
        mentorId: input.mentorId,
        userId: input.userId,
        email: input.email.trim().toLowerCase(),
        name: input.name,
        avatarUrl: input.avatarUrl || null,
        headline: input.headline,
        education: input.education,
        subjects: input.subjects,
        teachingExperienceYears: input.teachingExperienceYears,
        maxMentees: input.maxMentees,
        hourlyRate: input.hourlyRate,
        bio: input.bio,
        isVerified: true,
        acceptingNewMentees: true,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: mentors.userId,
        set: {
          name: input.name,
          email: input.email.trim().toLowerCase(),
          avatarUrl: input.avatarUrl || null,
          headline: input.headline,
          education: input.education,
          subjects: input.subjects,
          teachingExperienceYears: input.teachingExperienceYears,
          maxMentees: input.maxMentees,
          hourlyRate: input.hourlyRate,
          bio: input.bio,
          isVerified: true,
          updatedAt: now,
        },
      })
      .returning();

    return row || null;
  } catch (error) {
    logSqlFailure('Failed to upsert mentor profile', error);
    throw new Error('Failed to save accredited mentor profile in PostgreSQL.');
  }
}
