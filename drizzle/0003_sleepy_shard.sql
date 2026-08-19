CREATE TABLE `farmerAdvisories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`model` varchar(128) NOT NULL,
	`issueType` varchar(80) NOT NULL,
	`severity` enum('low','medium','high') NOT NULL,
	`summary` text NOT NULL,
	`recommendedActions` json NOT NULL,
	`cautions` json NOT NULL,
	`escalation` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farmerAdvisories_id` PRIMARY KEY(`id`),
	CONSTRAINT `farmerAdvisories_requestId_unique` UNIQUE(`requestId`)
);
--> statement-breakpoint
ALTER TABLE `auditEvents` MODIFY COLUMN `entityType` enum('request','priority','brief','user','context','message','advisory') NOT NULL;--> statement-breakpoint
ALTER TABLE `citizenRequests` MODIFY COLUMN `category` enum('water','sanitation','transport','healthcare','education','energy','digital','climate','public_safety','agriculture') NOT NULL;--> statement-breakpoint
ALTER TABLE `nationalContextRecords` MODIFY COLUMN `category` enum('water','sanitation','transport','healthcare','education','energy','digital','climate','public_safety','agriculture');--> statement-breakpoint
ALTER TABLE `nationalContextRecords` MODIFY COLUMN `contextType` enum('demographic','infrastructure_index','agriculture_index','investment_plan') NOT NULL;--> statement-breakpoint
ALTER TABLE `policyPriorities` MODIFY COLUMN `category` enum('water','sanitation','transport','healthcare','education','energy','digital','climate','public_safety','agriculture') NOT NULL;--> statement-breakpoint
ALTER TABLE `citizenRequests` ADD `farmDetails` json;