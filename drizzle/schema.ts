import {
  date,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  plate: varchar("plate", { length: 16 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const maintenanceTypes = mysqlTable("maintenance_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const vehicleSystems = mysqlTable("vehicle_systems", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const maintenanceRecords = mysqlTable("maintenance_records", {
  id: int("id").autoincrement().primaryKey(),
  serviceDate: date("serviceDate", { mode: "string" }).notNull(),
  vehicleId: int("vehicleId").notNull(),
  km: int("km").notNull(),
  maintenanceTypeId: int("maintenanceTypeId").notNull(),
  vehicleSystemId: int("vehicleSystemId").notNull(),
  serviceDescription: text("serviceDescription").notNull(),
  material: varchar("material", { length: 255 }),
  partQuantity: decimal("partQuantity", { precision: 12, scale: 2 }).notNull().default("0"),
  partUnitValue: decimal("partUnitValue", { precision: 12, scale: 2 }).notNull().default("0"),
  partsTotal: decimal("partsTotal", { precision: 12, scale: 2 }).notNull().default("0"),
  laborValue: decimal("laborValue", { precision: 12, scale: 2 }).notNull().default("0"),
  totalValue: decimal("totalValue", { precision: 12, scale: 2 }).notNull().default("0"),
  supplierId: int("supplierId"),
  nextMaintenance: date("nextMaintenance", { mode: "string" }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
