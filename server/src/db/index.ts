import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import * as schema from "./schema.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "..", "data");
const dbPath = join(dataDir, "tostaduria.db");

mkdirSync(dataDir, { recursive: true });

export let sqlJs!: SqlJsDatabase;

async function getDatabase() {
  const SQL = await initSqlJs();
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    sqlJs = new SQL.Database(buffer);
  } else {
    sqlJs = new SQL.Database();
  }
  sqlJs.run("PRAGMA foreign_keys = ON");
  return sqlJs;
}

function saveDatabase() {
  if (sqlJs) {
    const data = sqlJs.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

export { saveDatabase };

function columnExists(table: string, column: string): boolean {
  const res = sqlJs.exec(`PRAGMA table_info(${table})`);
  if (!res.length) return false;
  return res[0].values.some((row) => row[1] === column);
}

function migrateDatabase() {
  const migrations: [string, string][] = [
    ["green_coffee_entries", "split_notes TEXT"],
    ["roasting_batches", "mesh TEXT"],
  ];
  for (const [table, columnDef] of migrations) {
    const column = columnDef.split(" ")[0];
    if (!columnExists(table, column)) {
      sqlJs.run(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
    }
  }
}

await getDatabase();
export const db = drizzle(sqlJs, { schema });

export function initDatabase() {
  sqlJs.run(`
    CREATE TABLE IF NOT EXISTS varieties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      origin TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  sqlJs.run(`
    CREATE TABLE IF NOT EXISTS green_coffee_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variety_id INTEGER NOT NULL REFERENCES varieties(id) ON DELETE SET NULL,
      kilos REAL NOT NULL,
      supplier TEXT,
      entry_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  sqlJs.run(`
    CREATE TABLE IF NOT EXISTS roasting_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variety_id INTEGER NOT NULL REFERENCES varieties(id) ON DELETE SET NULL,
      green_kilos REAL NOT NULL,
      roasted_kilos REAL NOT NULL,
      batch_date TEXT NOT NULL,
      mesh TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  sqlJs.run(`
    CREATE TABLE IF NOT EXISTS green_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL REFERENCES green_coffee_entries(id) ON DELETE CASCADE,
      variety_id INTEGER NOT NULL REFERENCES varieties(id) ON DELETE SET NULL,
      mesh TEXT NOT NULL,
      kilos REAL NOT NULL
    )
  `);

  migrateDatabase();
  saveDatabase();
}

process.on("exit", () => saveDatabase());
process.on("SIGINT", () => { saveDatabase(); process.exit(0); });
process.on("SIGTERM", () => { saveDatabase(); process.exit(0); });
