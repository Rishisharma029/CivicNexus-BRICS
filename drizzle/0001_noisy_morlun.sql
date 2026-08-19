CREATE TABLE `auditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int,
	`entityType` enum('request','priority','brief','user') NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(96) NOT NULL,
	`previousStatus` varchar(32),
	`nextStatus` varchar(32),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `citizenRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`country` enum('BR','RU','IN','CN','ZA') NOT NULL,
	`category` enum('water','sanitation','transport','healthcare','education','energy','digital','climate','public_safety') NOT NULL,
	`urgency` enum('low','medium','high','critical') NOT NULL,
	`status` enum('submitted','reviewed','prioritized','actioned') NOT NULL DEFAULT 'submitted',
	`originalLanguage` enum('en','hi','ru','zh','pt','ar') NOT NULL DEFAULT 'en',
	`title` varchar(280) NOT NULL,
	`description` text NOT NULL,
	`locationLabel` varchar(320) NOT NULL,
	`latitude` varchar(32) NOT NULL,
	`longitude` varchar(32) NOT NULL,
	`analysisState` enum('pending','complete','needs_review') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `citizenRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentTranslations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('request','analysis','brief') NOT NULL,
	`entityId` int NOT NULL,
	`language` enum('en','hi','ru','zh','pt','ar') NOT NULL,
	`title` varchar(280),
	`content` text NOT NULL,
	`model` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentTranslations_id` PRIMARY KEY(`id`),
	CONSTRAINT `translations_entity_language_unique` UNIQUE(`entityType`,`entityId`,`language`)
);
--> statement-breakpoint
CREATE TABLE `policyBriefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`priorityId` int NOT NULL,
	`language` enum('en','hi','ru','zh','pt','ar') NOT NULL DEFAULT 'en',
	`title` varchar(280) NOT NULL,
	`content` text NOT NULL,
	`model` varchar(128) NOT NULL,
	`readiness` enum('draft','ready_for_review') NOT NULL DEFAULT 'ready_for_review',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `policyBriefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policyPriorities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupKey` varchar(128) NOT NULL,
	`category` enum('water','sanitation','transport','healthcare','education','energy','digital','climate','public_safety') NOT NULL,
	`title` varchar(280) NOT NULL,
	`countries` json NOT NULL,
	`requestCount` int NOT NULL DEFAULT 0,
	`impactScore` int NOT NULL,
	`alignmentScore` int NOT NULL,
	`priorityScore` int NOT NULL,
	`status` enum('submitted','reviewed','prioritized','actioned') NOT NULL DEFAULT 'submitted',
	`evidenceBrief` text NOT NULL,
	`aiRationale` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policyPriorities_id` PRIMARY KEY(`id`),
	CONSTRAINT `policyPriorities_groupKey_unique` UNIQUE(`groupKey`)
);
--> statement-breakpoint
CREATE TABLE `requestAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`model` varchar(128) NOT NULL,
	`classification` varchar(80) NOT NULL,
	`sentiment` enum('negative','neutral','positive','mixed') NOT NULL,
	`urgencyScore` int NOT NULL,
	`confidence` int NOT NULL,
	`summary` text NOT NULL,
	`impactStatement` text NOT NULL,
	`evidence` json NOT NULL,
	`crossBorderThemes` json NOT NULL,
	`duplicateGroup` varchar(128),
	`humanReviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requestAnalyses_id` PRIMARY KEY(`id`),
	CONSTRAINT `requestAnalyses_requestId_unique` UNIQUE(`requestId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('citizen','policymaker','admin') NOT NULL DEFAULT 'citizen';--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `auditEvents` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `citizenRequests_country_category_idx` ON `citizenRequests` (`country`,`category`);--> statement-breakpoint
CREATE INDEX `citizenRequests_status_idx` ON `citizenRequests` (`status`);--> statement-breakpoint
CREATE INDEX `citizenRequests_user_idx` ON `citizenRequests` (`userId`);--> statement-breakpoint
CREATE INDEX `policyPriorities_score_idx` ON `policyPriorities` (`priorityScore`);--> statement-breakpoint
CREATE INDEX `policyPriorities_status_idx` ON `policyPriorities` (`status`);