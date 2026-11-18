import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  addReference,
  createMaintenance,
  deleteMaintenance,
  getDashboardData,
  getReferenceData,
  listMaintenances,
  seedFleetDefaults,
  updateMaintenance,
} from "./db";

const nonNegative = z.coerce.number().min(0, "Informe um valor maior ou igual a zero.");
const maintenanceInput = z.object({
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data."),
  vehicleId: z.coerce.number().int().positive("Selecione uma placa."),
  km: z.coerce.number().int().min(0, "KM não pode ser negativo."),
  maintenanceTypeId: z.coerce.number().int().positive("Selecione o tipo."),
  vehicleSystemId: z.coerce.number().int().positive("Selecione o sistema."),
  serviceDescription: z.string().trim().min(3, "Descreva o serviço executado."),
  material: z.string().optional().nullable(),
  partQuantity: nonNegative,
  partUnitValue: nonNegative,
  laborValue: nonNegative,
  supplierId: z.coerce.number().int().positive().optional().nullable(),
  nextMaintenance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  fleet: router({
    bootstrap: publicProcedure.mutation(async () => {
      await seedFleetDefaults();
      return { ok: true };
    }),
    references: publicProcedure.query(async () => getReferenceData()),
    addReference: publicProcedure
      .input(z.object({ kind: z.enum(["vehicle", "type", "system", "supplier"]), name: z.string().trim().min(2, "Digite um nome válido.") }))
      .mutation(async ({ input }) => {
        await addReference(input.kind, input.name);
        return { ok: true };
      }),
    list: publicProcedure
      .input(z.object({
        vehicleId: z.number().int().positive().optional(),
        maintenanceTypeId: z.number().int().positive().optional(),
        vehicleSystemId: z.number().int().positive().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }).optional())
      .query(async ({ input }) => listMaintenances(input)),
    create: publicProcedure.input(maintenanceInput).mutation(async ({ input }) => {
      const normalized = { ...input, nextMaintenance: input.nextMaintenance || null };
      return createMaintenance(normalized);
    }),
    update: publicProcedure.input(z.object({ id: z.number().int().positive(), data: maintenanceInput })).mutation(async ({ input }) => {
      await updateMaintenance(input.id, { ...input.data, nextMaintenance: input.data.nextMaintenance || null });
      return { ok: true };
    }),
    remove: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      await deleteMaintenance(input.id);
      return { ok: true };
    }),
    dashboard: publicProcedure.query(async () => getDashboardData()),
  }),
});

export type AppRouter = typeof appRouter;
