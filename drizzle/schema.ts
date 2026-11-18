import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const createdAt = () => text("createdAt").notNull().default(sql`(CURRENT_TIMESTAMP)`);

export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  plate: text("plate").notNull().unique(),
  createdAt: createdAt(),
});

export const maintenanceTypes = sqliteTable("maintenance_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: createdAt(),
});

export const vehicleSystems = sqliteTable("vehicle_systems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: createdAt(),
});

export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: createdAt(),
});

export const maintenanceRecords = sqliteTable("maintenance_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serviceDate: text("serviceDate").notNull(),
  vehicleId: integer("vehicleId").notNull().references(() => vehicles.id),
  km: integer("km").notNull(),
  maintenanceTypeId: integer("maintenanceTypeId").notNull().references(() => maintenanceTypes.id),
  vehicleSystemId: integer("vehicleSystemId").notNull().references(() => vehicleSystems.id),
  serviceDescription: text("serviceDescription").notNull(),
  material: text("material"),
  partQuantity: real("partQuantity").notNull().default(0),
  partUnitValue: real("partUnitValue").notNull().default(0),
  partsTotal: real("partsTotal").notNull().default(0),
  laborValue: real("laborValue").notNull().default(0),
  totalValue: real("totalValue").notNull().default(0),
  supplierId: integer("supplierId").references(() => suppliers.id),
  nextMaintenance: text("nextMaintenance"),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: text("updatedAt").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
