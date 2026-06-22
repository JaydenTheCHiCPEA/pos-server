import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const storageTable = pgTable("storage", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
