import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import {
  maintenanceRecords,
  maintenanceTypes,
  suppliers,
  vehicles,
  vehicleSystems,
} from "../drizzle/schema";

type Db = ReturnType<typeof drizzle>;
let _db: Promise<Db> | null = null;

async function openDb(): Promise<Db> {
  const url = process.env.DATABASE_URL || "file:./dados/frota.db";
  if (url.startsWith("file:")) fs.mkdirSync(path.dirname(url.slice(5)), { recursive: true });
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle/migrations") });
  return db;
}

const initialPlates = [
  "RFN7E65", "QWU0330", "RFL3C44", "QWU3D27", "RFK3I76", "RUQ2C83",
  "RUP7F43", "HDI-8662", "RFM7G19", "HAA-7461", "QWU3D56", "HMV-3660",
  "QWU0329", "QUF3033", "RGD7J05", "TEW0A70", "TEW0A66", "QUF3A34",
];
const initialTypes = ["Corretiva", "Preventiva", "Emergencial"];
const initialSystems = [
  "Freio", "Motor", "Suspensão", "Thermo King", "Elétrica", "Pneus",
  "Transmissão", "Arrefecimento", "Carroceria", "Lubrificação", "Outro",
];

export function getDb() {
  if (!_db) _db = openDb().catch(error => { _db = null; throw error; });
  return _db;
}

const requireDb = getDb;

export async function seedFleetDefaults() {
  const db = await requireDb();
  const [plateCount] = await db.select({ value: count() }).from(vehicles);
  if (plateCount.value === 0) await db.insert(vehicles).values(initialPlates.map(plate => ({ plate })));
  const [typeCount] = await db.select({ value: count() }).from(maintenanceTypes);
  if (typeCount.value === 0) await db.insert(maintenanceTypes).values(initialTypes.map(name => ({ name })));
  const [systemCount] = await db.select({ value: count() }).from(vehicleSystems);
  if (systemCount.value === 0) await db.insert(vehicleSystems).values(initialSystems.map(name => ({ name })));
}

export async function getReferenceData() {
  await seedFleetDefaults();
  const db = await requireDb();
  const [vehicleRows, typeRows, systemRows, supplierRows] = await Promise.all([
    db.select().from(vehicles).orderBy(asc(vehicles.plate)),
    db.select().from(maintenanceTypes).orderBy(asc(maintenanceTypes.name)),
    db.select().from(vehicleSystems).orderBy(asc(vehicleSystems.name)),
    db.select().from(suppliers).orderBy(asc(suppliers.name)),
  ]);
  return { vehicles: vehicleRows, types: typeRows, systems: systemRows, suppliers: supplierRows };
}

export async function addReference(kind: "vehicle" | "type" | "system" | "supplier", name: string) {
  const db = await requireDb();
  const normalized = name.trim().toUpperCase();
  if (kind === "vehicle") {
    await db.insert(vehicles).values({ plate: normalized });
  } else if (kind === "type") {
    await db.insert(maintenanceTypes).values({ name: name.trim() });
  } else if (kind === "system") {
    await db.insert(vehicleSystems).values({ name: name.trim() });
  } else {
    await db.insert(suppliers).values({ name: name.trim() });
  }
}

export type MaintenanceInput = {
  serviceDate: string;
  vehicleId: number;
  km: number;
  maintenanceTypeId: number;
  vehicleSystemId: number;
  serviceDescription: string;
  material?: string | null;
  partQuantity: number;
  partUnitValue: number;
  laborValue: number;
  supplierId?: number | null;
  nextMaintenance?: string | null;
  notes?: string | null;
};

function totals(input: MaintenanceInput) {
  const partsTotal = Number((input.partQuantity * input.partUnitValue).toFixed(2));
  return { partsTotal, totalValue: Number((partsTotal + input.laborValue).toFixed(2)) };
}

function databaseValues(input: MaintenanceInput) {
  const { partsTotal, totalValue } = totals(input);
  return {
    serviceDate: input.serviceDate,
    vehicleId: input.vehicleId,
    km: input.km,
    maintenanceTypeId: input.maintenanceTypeId,
    vehicleSystemId: input.vehicleSystemId,
    serviceDescription: input.serviceDescription.trim(),
    material: input.material?.trim() || null,
    partQuantity: input.partQuantity,
    partUnitValue: input.partUnitValue,
    partsTotal,
    laborValue: input.laborValue,
    totalValue,
    supplierId: input.supplierId ?? null,
    nextMaintenance: input.nextMaintenance || null,
    notes: input.notes?.trim() || null,
  };
}

export async function createMaintenance(input: MaintenanceInput) {
  const db = await requireDb();
  const [row] = await db.insert(maintenanceRecords).values(databaseValues(input)).returning({ id: maintenanceRecords.id });
  return { id: row.id };
}

export async function updateMaintenance(id: number, input: MaintenanceInput) {
  const db = await requireDb();
  await db.update(maintenanceRecords).set({ ...databaseValues(input), updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(maintenanceRecords.id, id));
}

export async function deleteMaintenance(id: number) {
  const db = await requireDb();
  await db.delete(maintenanceRecords).where(eq(maintenanceRecords.id, id));
}

export async function listMaintenances(filters?: {
  vehicleId?: number;
  maintenanceTypeId?: number;
  vehicleSystemId?: number;
  from?: string;
  to?: string;
}) {
  await seedFleetDefaults();
  const db = await requireDb();
  const conditions = [];
  if (filters?.vehicleId) conditions.push(eq(maintenanceRecords.vehicleId, filters.vehicleId));
  if (filters?.maintenanceTypeId) conditions.push(eq(maintenanceRecords.maintenanceTypeId, filters.maintenanceTypeId));
  if (filters?.vehicleSystemId) conditions.push(eq(maintenanceRecords.vehicleSystemId, filters.vehicleSystemId));
  if (filters?.from) conditions.push(gte(maintenanceRecords.serviceDate, filters.from));
  if (filters?.to) conditions.push(lte(maintenanceRecords.serviceDate, filters.to));

  const query = db
    .select({
      id: maintenanceRecords.id,
      serviceDate: maintenanceRecords.serviceDate,
      km: maintenanceRecords.km,
      serviceDescription: maintenanceRecords.serviceDescription,
      material: maintenanceRecords.material,
      partQuantity: maintenanceRecords.partQuantity,
      partUnitValue: maintenanceRecords.partUnitValue,
      partsTotal: maintenanceRecords.partsTotal,
      laborValue: maintenanceRecords.laborValue,
      totalValue: maintenanceRecords.totalValue,
      nextMaintenance: maintenanceRecords.nextMaintenance,
      notes: maintenanceRecords.notes,
      vehicleId: vehicles.id,
      plate: vehicles.plate,
      maintenanceTypeId: maintenanceTypes.id,
      typeName: maintenanceTypes.name,
      vehicleSystemId: vehicleSystems.id,
      systemName: vehicleSystems.name,
      supplierId: suppliers.id,
      supplierName: suppliers.name,
    })
    .from(maintenanceRecords)
    .innerJoin(vehicles, eq(maintenanceRecords.vehicleId, vehicles.id))
    .innerJoin(maintenanceTypes, eq(maintenanceRecords.maintenanceTypeId, maintenanceTypes.id))
    .innerJoin(vehicleSystems, eq(maintenanceRecords.vehicleSystemId, vehicleSystems.id))
    .leftJoin(suppliers, eq(maintenanceRecords.supplierId, suppliers.id));

  const rows = conditions.length ? await query.where(and(...conditions)).orderBy(desc(maintenanceRecords.serviceDate), desc(maintenanceRecords.id)) : await query.orderBy(desc(maintenanceRecords.serviceDate), desc(maintenanceRecords.id));
  return rows.map(row => ({
    ...row,
    partQuantity: Number(row.partQuantity),
    partUnitValue: Number(row.partUnitValue),
    partsTotal: Number(row.partsTotal),
    laborValue: Number(row.laborValue),
    totalValue: Number(row.totalValue),
  }));
}

export async function getDashboardData() {
  const records = await listMaintenances();
  const today = new Date().toISOString().slice(0, 10);
  const inThirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const totalCost = records.reduce((sum, record) => sum + record.totalValue, 0);
  const partsCost = records.reduce((sum, record) => sum + record.partsTotal, 0);
  const laborCost = records.reduce((sum, record) => sum + record.laborValue, 0);

  const summarize = (key: "plate" | "typeName" | "systemName") => {
    const map = new Map<string, { name: string; count: number; value: number }>();
    records.forEach(record => {
      const name = record[key];
      const current = map.get(name) ?? { name, count: 0, value: 0 };
      current.count += 1;
      current.value += record.totalValue;
      map.set(name, current);
    });
    return [...map.values()].sort((a, b) => b.value - a.value || b.count - a.count);
  };

  const months = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const label = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(2026, index, 1)).replace(".", "");
    const matching = records.filter(record => Number(record.serviceDate.slice(5, 7)) === month);
    return { label, count: matching.length, value: matching.reduce((sum, item) => sum + item.totalValue, 0) };
  });

  const alerts = records
    .filter(record => record.nextMaintenance && record.nextMaintenance <= inThirtyDays)
    .sort((a, b) => (a.nextMaintenance ?? "").localeCompare(b.nextMaintenance ?? ""))
    .map(record => ({
      ...record,
      status: record.nextMaintenance! < today ? "Vencida" : "Próxima",
    }));

  return {
    kpis: { maintenanceCount: records.length, totalCost, partsCost, laborCost, upcomingCount: alerts.filter(alert => alert.status === "Próxima").length },
    byPlate: summarize("plate"),
    byType: summarize("typeName"),
    bySystem: summarize("systemName"),
    months,
    alerts,
  };
}
