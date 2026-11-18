import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: process.env.DATABASE_AUTH_TOKEN ? "turso" : "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./dados/frota.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  } as any,
});
