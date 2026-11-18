CREATE TABLE `maintenance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceDate` date NOT NULL,
	`vehicleId` int NOT NULL,
	`km` int NOT NULL,
	`maintenanceTypeId` int NOT NULL,
	`vehicleSystemId` int NOT NULL,
	`serviceDescription` text NOT NULL,
	`material` varchar(255),
	`partQuantity` decimal(12,2) NOT NULL DEFAULT '0',
	`partUnitValue` decimal(12,2) NOT NULL DEFAULT '0',
	`partsTotal` decimal(12,2) NOT NULL DEFAULT '0',
	`laborValue` decimal(12,2) NOT NULL DEFAULT '0',
	`totalValue` decimal(12,2) NOT NULL DEFAULT '0',
	`supplierId` int,
	`nextMaintenance` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maintenance_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `maintenance_types_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_systems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_systems_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicle_systems_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plate` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicles_plate_unique` UNIQUE(`plate`)
);
