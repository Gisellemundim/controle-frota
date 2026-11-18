CREATE TABLE `maintenance_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`serviceDate` text NOT NULL,
	`vehicleId` integer NOT NULL,
	`km` integer NOT NULL,
	`maintenanceTypeId` integer NOT NULL,
	`vehicleSystemId` integer NOT NULL,
	`serviceDescription` text NOT NULL,
	`material` text,
	`partQuantity` real DEFAULT 0 NOT NULL,
	`partUnitValue` real DEFAULT 0 NOT NULL,
	`partsTotal` real DEFAULT 0 NOT NULL,
	`laborValue` real DEFAULT 0 NOT NULL,
	`totalValue` real DEFAULT 0 NOT NULL,
	`supplierId` integer,
	`nextMaintenance` text,
	`notes` text,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`maintenanceTypeId`) REFERENCES `maintenance_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehicleSystemId`) REFERENCES `vehicle_systems`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `maintenance_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `maintenance_types_name_unique` ON `maintenance_types` (`name`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_name_unique` ON `suppliers` (`name`);--> statement-breakpoint
CREATE TABLE `vehicle_systems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_systems_name_unique` ON `vehicle_systems` (`name`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plate` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_plate_unique` ON `vehicles` (`plate`);