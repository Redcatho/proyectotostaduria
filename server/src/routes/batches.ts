import { Router, Request, Response } from "express";
import { db, saveDatabase } from "../db/index.js";
import { roastingBatches, varieties } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const { varietyId, from, to } = req.query;
  let query = db.select({
    batch: roastingBatches,
    varietyName: varieties.name,
  }).from(roastingBatches)
    .leftJoin(varieties, eq(roastingBatches.varietyId, varieties.id))
    .orderBy(desc(roastingBatches.batchDate))
    .$dynamic();

  if (varietyId) {
    query = query.where(eq(roastingBatches.varietyId, Number(varietyId)));
  }
  if (from) {
    query = query.where(sql`${roastingBatches.batchDate} >= ${from}`);
  }
  if (to) {
    query = query.where(sql`${roastingBatches.batchDate} <= ${to}`);
  }

  const rows = query.all();
  const result = rows.map((r) => ({
    ...r.batch,
    varietyName: r.varietyName,
    mermaKg: Math.round((r.batch.greenKilos - r.batch.roastedKilos) * 100) / 100,
    mermaPct: r.batch.greenKilos > 0
      ? Math.round(((r.batch.greenKilos - r.batch.roastedKilos) / r.batch.greenKilos) * 100 * 100) / 100
      : 0,
  }));
  res.json(result);
});

router.post("/", (req: Request, res: Response) => {
  const { varietyId, greenKilos, roastedKilos, batchDate, mesh, notes } = req.body;
  if (!varietyId || !greenKilos || !roastedKilos || !batchDate) {
    res.status(400).json({ error: "varietyId, greenKilos, roastedKilos y batchDate son obligatorios" });
    return;
  }
  const inserted = db.insert(roastingBatches).values({
    varietyId: Number(varietyId),
    greenKilos: Number(greenKilos),
    roastedKilos: Number(roastedKilos),
    batchDate,
    mesh: mesh || null,
    notes: notes || null,
  }).returning().get();
  saveDatabase();
  res.status(201).json(inserted);
});

router.delete("/:id", (req: Request, res: Response) => {
  const deleted = db.delete(roastingBatches).where(eq(roastingBatches.id, Number(req.params.id))).returning().get();
  if (!deleted) { res.status(404).json({ error: "No encontrada" }); return; }
  saveDatabase();
  res.json({ message: "Eliminada", id: deleted.id });
});

export default router;
