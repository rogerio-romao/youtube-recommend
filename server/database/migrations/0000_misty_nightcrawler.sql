CREATE TABLE `liked_videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`video_id` text NOT NULL,
	`video_title` text NOT NULL,
	`video_thumbnail` text,
	`channel_id` text NOT NULL,
	`channel_title` text NOT NULL,
	`fetched_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`channel_id` text,
	`channel_title` text NOT NULL,
	`channel_thumbnail` text,
	`subscriber_count` integer,
	`reason` text NOT NULL,
	`category` text NOT NULL,
	`confidence_score` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`channel_id` text NOT NULL,
	`channel_title` text NOT NULL,
	`channel_thumbnail` text,
	`channel_description` text,
	`subscriber_count` integer,
	`video_count` integer,
	`fetched_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `taste_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`categories` text NOT NULL,
	`analysis_summary` text NOT NULL,
	`analyzed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`google_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);