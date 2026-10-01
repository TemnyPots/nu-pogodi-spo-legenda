CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`seed` integer NOT NULL,
	`started` integer NOT NULL,
	`finished` integer,
	`score` integer,
	`duration` integer
);
--> statement-breakpoint
CREATE INDEX `idx_runs_score` ON `runs` (`score`);