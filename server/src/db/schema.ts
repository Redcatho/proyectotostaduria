import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const varieties = sqliteTable("varieties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  origin: text("origin"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const greenCoffeeEntries = sqliteTable("green_coffee_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  varietyId: integer("variety_id").references(() => varieties.id, { onDelete: "set null" }).notNull(),
  kilos: real("kilos").notNull(),
  supplier: text("supplier"),
  entryDate: text("entry_date").notNull(),
  notes: text("notes"),
  splitNotes: text("split_notes"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const roastingBatches = sqliteTable("roasting_batches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  varietyId: integer("variety_id").references(() => varieties.id, { onDelete: "set null" }).notNull(),
  greenKilos: real("green_kilos").notNull(),
  roastedKilos: real("roasted_kilos").notNull(),
  batchDate: text("batch_date").notNull(),
  mesh: text("mesh"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const greenLots = sqliteTable("green_lots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryId: integer("entry_id").references(() => greenCoffeeEntries.id, { onDelete: "cascade" }).notNull(),
  varietyId: integer("variety_id").references(() => varieties.id, { onDelete: "set null" }).notNull(),
  mesh: text("mesh").notNull(),
  kilos: real("kilos").notNull(),
});
