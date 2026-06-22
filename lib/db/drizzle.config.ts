/**
 * drizzle-kit config — used by `pnpm --filter @workspace/db run push`.
 * Reads DATABASE_URL from the environment (same as the runtime pool).
 */
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is required to run drizzle-kit push");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: { url },
});
