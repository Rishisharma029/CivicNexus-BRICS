CREATE TABLE `messageIngestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('whatsapp','telegram','government_gateway') NOT NULL,
	`externalMessageId` varchar(180) NOT NULL,
	`requestId` int NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageIngestions_id` PRIMARY KEY(`id`),
	CONSTRAINT `messageIngestions_provider_message_unique` UNIQUE(`provider`,`externalMessageId`)
);
--> statement-breakpoint
CREATE TABLE `nationalContextRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceKey` varchar(320) NOT NULL,
	`country` enum('BR','RU','IN','CN','ZA') NOT NULL,
	`category` enum('water','sanitation','transport','healthcare','education','energy','digital','climate','public_safety'),
	`contextType` enum('demographic','infrastructure_index','investment_plan') NOT NULL,
	`indicatorCode` varchar(120) NOT NULL,
	`label` varchar(280) NOT NULL,
	`value` varchar(64) NOT NULL,
	`unit` varchar(120) NOT NULL,
	`dataPeriod` varchar(32) NOT NULL,
	`direction` enum('higher_need','lower_need','manual') NOT NULL DEFAULT 'manual',
	`relevanceWeight` int NOT NULL DEFAULT 50,
	`sourceName` varchar(280) NOT NULL,
	`sourceUrl` varchar(1024) NOT NULL,
	`notes` text,
	`importedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nationalContextRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `nationalContextRecords_sourceKey_unique` UNIQUE(`sourceKey`)
);
--> statement-breakpoint
ALTER TABLE `auditEvents` MODIFY COLUMN `entityType` enum('request','priority','brief','user','context','message') NOT NULL;--> statement-breakpoint
ALTER TABLE `citizenRequests` ADD `channel` enum('text','voice','messaging') DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE `citizenRequests` ADD `audioUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `policyPriorities` ADD `contextScore` int DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `policyPriorities` ADD `contextEvidence` json;--> statement-breakpoint
CREATE INDEX `nationalContext_country_category_idx` ON `nationalContextRecords` (`country`,`category`);--> statement-breakpoint
CREATE INDEX `nationalContext_type_idx` ON `nationalContextRecords` (`contextType`);