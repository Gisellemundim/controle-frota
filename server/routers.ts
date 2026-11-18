import { z } from "zod";
import { COOKIE_NAME, SESSION_MAX_AGE_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { authEnabled, createSessionToken, passwordMatches } from "./_core/auth";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
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
    me: publicProcedure.query(opts => ({ user: opts.ctx.user, authEnabled: authEnabled() })),
    login: publicProcedure
      .input(z.object({ name: z.string().trim().min(2, "Digite seu nome."), password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!authEnabled()) return { ok: true };
        if (!passwordMatches(input.password)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha incorreta." });
        const token = await createSessionToken(input.name);
        ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: SESSION_MAX_AGE_MS });
        return { ok: true };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  fleet: router({
    bootstrap: protectedProcedure.mutation(async () => {
      await seedFleetDefaults();
      return { ok: true };
    }),
    references: protectedProcedure.query(async () => getReferenceData()),
    addReference: protectedProcedure
      .input(z.object({ kind: z.enum(["vehicle", "type", "system", "supplier"]), name: z.string().trim().min(2, "Digite um nome válido.") }))
      .mutation(async ({ input }) => {
        await addReference(input.kind, input.name);
        return { ok: true };
      }),
    list: protectedProcedure
      .input(z.object({
        vehicleId: z.number().int().positive().optional(),
        maintenanceTypeId: z.number().int().positive().optional(),
        vehicleSystemId: z.number().int().positive().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }).optional())
      .query(async ({ input }) => listMaintenances(input)),
    create: protectedProcedure.input(maintenanceInput).mutation(async ({ input }) => {
      const normalized = { ...input, nextMaintenance: input.nextMaintenance || null };
      return createMaintenance(normalized);
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: maintenanceInput })).mutation(async ({ input }) => {
      await updateMaintenance(input.id, { ...input.data, nextMaintenance: input.data.nextMaintenance || null });
      return { ok: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      await deleteMaintenance(input.id);
      return { ok: true };
    }),
    dashboard: protectedProcedure.query(async () => getDashboardData()),
  }),
});

export type AppRouter = typeof appRouter;
