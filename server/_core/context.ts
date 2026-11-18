import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { readSession } from "./auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: { name: string } | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  return { req: opts.req, res: opts.res, user: await readSession(opts.req) };
}
