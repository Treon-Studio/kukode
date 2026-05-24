ALTER TABLE `submitted_sites` ADD `is_sponsored` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `submitted_sites` ADD `sponsored_until` integer;