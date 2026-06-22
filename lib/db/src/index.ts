/**
 * Database client — NeonDB / PostgreSQL via node-postgres + Drizzle ORM.
 *
 * Requires DATABASE_URL in the environment (set on Render or in api-server/.env).
 * Never hardcode credentials here; use your Neon connection string in env vars.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add your Neon Postgres connection string to the environment.",
  );
}

/** Shared connection pool — one pool per server process. */
export const pool = new Pool({
  connectionString: DATABASE_URL,
  // Neon serverless-friendly: recycle idle connections before the pooler times them out.
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

/** Drizzle client bound to our schema (currently the `storage` JSONB table). */
export const db = drizzle(pool, { schema });

export * from "./schema";
