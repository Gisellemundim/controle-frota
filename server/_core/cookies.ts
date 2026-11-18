import type { CookieOptions, Request } from "express";

export function getSessionCookieOptions(req: Request): CookieOptions {
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  return { httpOnly: true, path: "/", sameSite: "lax", secure };
}
