import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique().notNull(),
  password_hash: text('password_hash').notNull(),
  username: text('username').unique(),
  full_name: text('full_name'),
  avatar_url: text('avatar_url'),
  bio: text('bio'),
  website: text('website'),
  twitter: text('twitter'),
  github: text('github'),
  role: text('role').default('user').notNull(), // 'user', 'maker', 'admin'
  preferred_lang: text('preferred_lang').default('en').notNull(), // 'en', 'id'
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const sessions = sqliteTable('sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  user_id: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  expires_at: integer('expires_at').notNull(), // Unix timestamp in seconds
});

export const submittedSites = sqliteTable('submitted_sites', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  maker_id: text('maker_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description'),
  live_url: text('live_url').notNull(),
  thumbnail_url: text('thumbnail_url'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  status: text('status').default('pending_review').notNull(), // 'pending_review', 'approved', 'rejected'
  rejection_reason: text('rejection_reason'),
  views_count: integer('views_count').default(0).notNull(),
  approved_at: text('approved_at'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const votes = sqliteTable('votes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  site_id: text('site_id')
    .references(() => submittedSites.id, { onDelete: 'cascade' })
    .notNull(),
  user_id: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const comments = sqliteTable('comments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  site_id: text('site_id')
    .references(() => submittedSites.id, { onDelete: 'cascade' })
    .notNull(),
  user_id: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const featureFlags = sqliteTable('feature_flags', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').unique().notNull(),
  description: text('description'),
  is_enabled: integer('is_enabled', { mode: 'boolean' }).default(false).notNull(),
  env_override: integer('env_override', { mode: 'boolean' }).default(false).notNull(),
  whitelist: text('whitelist', { mode: 'json' }).$type<string[]>(),
  rollout_percentage: integer('rollout_percentage').default(0).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});
