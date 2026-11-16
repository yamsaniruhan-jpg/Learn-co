import { relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
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
 * Durable authentication accounts (credentials & provider metadata).
 */
export const authAccounts = pgTable('auth_accounts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  authProvider: text('auth_provider').notNull().default('email'),
  subscription: text('subscription'),
  subscriptionExpiresAt: text('subscription_expires_at'),
  lastLoginAt: timestamp('last_login_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Persistent bearer sessions so logins survive container restarts.
 */
export const authSessions = pgTable('auth_sessions', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull(),
  verifiedOwner: boolean('verified_owner').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

/**
 * Persistent learner profiles and onboarding state.
 */
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull(),
  profileJson: jsonb('profile_json').$type<Record<string, any>>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Persistent gamification, streaks, XP, and daily quota counters.
 */
export const userGamification = pgTable('user_gamification', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastActiveDate: text('last_active_date').notNull().default(''),
  gamificationJson: jsonb('gamification_json').$type<Record<string, any>>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Persistent user appearance & learning preferences.
 */
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  settingsJson: jsonb('settings_json').$type<Record<string, any>>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Cross-device solved question history per user for strict non-repetition.
 */
export const userSolvedQuestions = pgTable(
  'user_solved_questions',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    questionId: text('question_id').notNull(),
    subjectId: text('subject_id').notNull(),
    topicId: text('topic_id'),
    isCorrect: boolean('is_correct').notNull().default(false),
    xpAwarded: integer('xp_awarded').notNull().default(0),
    attemptCount: integer('attempt_count').notNull().default(1),
    lastAttemptJson: jsonb('last_attempt_json').$type<Record<string, any>>(),
    lastAttemptAt: timestamp('last_attempt_at').defaultNow().notNull(),
  },
  (table) => ({
    userQuestionUniqueIdx: uniqueIndex('user_solved_questions_user_q_idx').on(
      table.userId,
      table.questionId
    ),
  })
);

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
