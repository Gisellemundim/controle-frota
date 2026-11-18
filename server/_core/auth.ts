import { createHash, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { jwtVerify, SignJWT } from "jose";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";

// Login simples por senha única da equipe. Sem APP_PASSWORD (uso local), o app fica aberto.
export const authEnabled = () => Boolean(process.env.APP_PASSWORD);

const secret = () => {
  const raw = process.env.SESSION_SECRET || process.env.APP_PASSWORD || "frota-local";
  return new TextEncoder().encode(createHash("sha256").update(raw).digest("hex"));
};

export function passwordMatches(input: string) {
  const expected = createHash("sha256").update(process.env.APP_PASSWORD ?? "").digest();
  const given = createHash("sha256").update(input).digest();
  return timingSafeEqual(expected, given);
}

export async function createSessionToken(name: string) {
  return new SignJWT({ name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(secret());
}

export async function readSession(req: Request): Promise<{ name: string } | null> {
  if (!authEnabled()) return { name: "Equipe" };
  const token = parseCookie(req.headers.cookie ?? "")[COOKIE_NAME];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { name: String(payload.name ?? "Equipe") };
  } catch {
    return null;
  }
}
