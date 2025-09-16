import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Image type with caption support
export const imageSchema = z.object({
  url: z.string(),
  caption: z.string().optional().default(""),
});

export type ImageWithCaption = z.infer<typeof imageSchema>;

export const tableRows = pgTable("table_rows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  no: integer("no").notNull().default(0),
  route: text("route").notNull().default(""),
  code: text("code").notNull().default(""),
  location: text("location").notNull().default(""),
  delivery: text("delivery").notNull().default(""),
  trip: text("trip").notNull().default(""),
  alt1: text("alt1").notNull().default(""),
  alt2: text("alt2").notNull().default(""),
  info: text("info").notNull().default(""),
  tngSite: text("tng_site").notNull().default(""),
  tngRoute: text("tng_route").notNull().default(""),
  images: jsonb("images").$type<ImageWithCaption[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const tableColumns = pgTable("table_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  dataKey: text("data_key").notNull(),
  type: text("type").notNull().default("text"), // text, number, currency, images, select
  sortOrder: integer("sort_order").notNull().default(0),
  isEditable: text("is_editable").notNull().default("true"),
  options: jsonb("options").$type<string[]>().default([]),
});

export const insertTableRowSchema = createInsertSchema(tableRows).omit({
  id: true,
  sortOrder: true,
});

export const insertTableColumnSchema = createInsertSchema(tableColumns).omit({
  id: true,
  sortOrder: true,
});

export type InsertTableRow = z.infer<typeof insertTableRowSchema>;
export type TableRow = typeof tableRows.$inferSelect;
export type InsertTableColumn = z.infer<typeof insertTableColumnSchema>;
export type TableColumn = typeof tableColumns.$inferSelect;
