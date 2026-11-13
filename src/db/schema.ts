import { relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * Users table synchronized with Firebase Auth UIDs / Learn.co account IDs.
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: text('role').notNull().default('student'),
  authProvider: text('auth_provider').notNull().default('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Persistent Mentor Application submissions routed to platform owner (yamsaniruhan@gmail.com).
 */
export const mentorApplications = pgTable('mentor_applications', {
  id: serial('id').primaryKey(),
  applicationCode: text('application_code').notNull().unique(),
  applicantUid: text('applicant_uid').notNull(),
  applicantEmail: text('applicant_email').notNull(),
  fullName: text('full_name').notNull(),
  degree: text('degree').notNull(),
  institution: text('institution').notNull(),
  subjectId: text('subject_id').notNull(),
  experienceYears: integer('experience_years').notNull().default(0),
  capacity: integer('capacity').notNull().default(5),
  hourlyRate: integer('hourly_rate').notNull().default(0),
  bio: text('bio').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING | APPROVED | REJECTED
  routedToEmail: text('routed_to_email').notNull().default('yamsaniruhan@gmail.com'),
  reviewerEmail: text('reviewer_email'),
  reviewerNote: text('reviewer_note'),
  reviewedAt: timestamp('reviewed_at'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Accredited Mentors published in the directory upon owner approval.
 */
export const mentors = pgTable('mentors', {
  id: serial('id').primaryKey(),
  mentorId: text('mentor_id').notNull().unique(),
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  headline: text('headline').notNull(),
  education: text('education').notNull(),
  subjects: jsonb('subjects').$type<string[]>().notNull(),
  teachingExperienceYears: integer('teaching_experience_years').notNull().default(0),
  maxMentees: integer('max_mentees').notNull().default(5),
  hourlyRate: integer('hourly_rate').notNull().default(0),
  bio: text('bio').notNull(),
  isVerified: boolean('is_verified').notNull().default(true),
  acceptingNewMentees: boolean('accepting_new_mentees').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  mentorApplications: many(mentorApplications),
}));

export const mentorApplicationsRelations = relations(mentorApplications, ({ one }) => ({
  applicant: one(users, {
    fields: [mentorApplications.applicantUid],
    references: [users.uid],
  }),
}));
