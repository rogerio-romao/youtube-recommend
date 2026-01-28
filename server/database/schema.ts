import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  googleId: text('google_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Subscriptions table
export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  channelId: text('channel_id').notNull(),
  channelTitle: text('channel_title').notNull(),
  channelThumbnail: text('channel_thumbnail'),
  channelDescription: text('channel_description'),
  subscriberCount: integer('subscriber_count'),
  videoCount: integer('video_count'),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Liked videos table
export const likedVideos = sqliteTable('liked_videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  videoId: text('video_id').notNull(),
  videoTitle: text('video_title').notNull(),
  videoThumbnail: text('video_thumbnail'),
  channelId: text('channel_id').notNull(),
  channelTitle: text('channel_title').notNull(),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Taste profiles table
export const tasteProfiles = sqliteTable('taste_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categories: text('categories', { mode: 'json' }).$type<TasteCategory[]>().notNull(),
  analysisSummary: text('analysis_summary').notNull(),
  analyzedAt: integer('analyzed_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Recommendations table
export const recommendations = sqliteTable('recommendations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['channel', 'hidden_gem', 'content_gap'] }).notNull(),
  channelId: text('channel_id'),
  channelTitle: text('channel_title').notNull(),
  channelThumbnail: text('channel_thumbnail'),
  subscriberCount: integer('subscriber_count'),
  reason: text('reason').notNull(),
  category: text('category').notNull(),
  confidenceScore: real('confidence_score').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Type definitions for JSON columns
export interface TasteCategory {
  name: string
  weight: number
  description: string
  subCategories?: string[]
}

// Type exports for use in other files
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
export type LikedVideo = typeof likedVideos.$inferSelect
export type NewLikedVideo = typeof likedVideos.$inferInsert
export type TasteProfile = typeof tasteProfiles.$inferSelect
export type NewTasteProfile = typeof tasteProfiles.$inferInsert
export type Recommendation = typeof recommendations.$inferSelect
export type NewRecommendation = typeof recommendations.$inferInsert
