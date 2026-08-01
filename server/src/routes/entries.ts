import { Router, Request, Response } from "express";
import { db, saveDatabase } from "../db/index.js";
import { greenCoffeeEntries, varieties } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const { varietyId, from, to } = req.query;
  let query = db.select({
    entry: greenCoffeeEntries,
    varietyName: varieties.name,
  }).from(greenCoffeeEntries)
    .leftJoin(varieties, eq(greenCoffeeEntries.varietyId, varieties.id))
    .orderBy(desc(greenCoffeeEntries.entryDate))
    .$dynamic();

  if (varietyId) {
    query = query.where(eq(greenCoffeeEntries.varietyId, Number(varietyId)));
  }
  if (from) {
    query = query.where(sql`${greenCoffeeEntries.entryDate} >= ${from}`);
  }
  if (to) {
    query = query.where(sql`${greenCoffeeEntries.entryDate} <= ${to}`);
  }

  const rows = query.all();
  res.json(rows.map((r) => ({ ...r.entry, varietyName: r.varietyName })));
});

router.post("/", (req: Request, res: Response) => {
  const { varietyId, kilos, supplier, entryDate, notes } = req.body;
  if (!varietyId || !kilos || !entryDate) {
    res.status(400).json({ error: "varietyId, kilos y entryDate son obligatorios" });
    return;
  }
  const inserted = db.insert(greenCoffeeEntries).values({
    varietyId: Number(varietyId),
    kilos: Number(kilos),
    supplier: supplier || null,
    entryDate,
    notes: notes || null,
  }).returning().get();
  saveDatabase();
  res.status(201).json(inserted);
});

router.delete("/:id", (req: Request, res: Response) => {
  const deleted = db.delete(greenCoffeeEntries).where(eq(greenCoffeeEntries.id, Number(req.params.id))).returning().get();
  if (!deleted) { res.status(404).json({ error: "No encontrada" }); return; }
  saveDatabase();
  res.json({ message: "Eliminada", id: deleted.id });
});

export default router;
