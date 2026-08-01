import { Router, Request, Response } from "express";
import { db, saveDatabase } from "../db/index.js";
import { greenLots, greenCoffeeEntries, varieties, roastingBatches } from "../db/schema.js";
import { eq, desc, sql, and, type SQL } from "drizzle-orm";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const { varietyId, from, to } = req.query;
  let query = db.select({
    lot: greenLots,
    varietyName: varieties.name,
    entryDate: greenCoffeeEntries.entryDate,
  }).from(greenLots)
    .leftJoin(greenCoffeeEntries, eq(greenLots.entryId, greenCoffeeEntries.id))
    .leftJoin(varieties, eq(greenLots.varietyId, varieties.id))
    .orderBy(desc(greenCoffeeEntries.entryDate))
    .$dynamic();

  if (varietyId) {
    query = query.where(eq(greenLots.varietyId, Number(varietyId)));
  }
  if (from) {
    query = query.where(sql`${greenCoffeeEntries.entryDate} >= ${from}`);
  }
  if (to) {
    query = query.where(sql`${greenCoffeeEntries.entryDate} <= ${to}`);
  }

  const rows = query.all();
  const result = rows.map((r) => ({
    ...r.lot,
    varietyName: r.varietyName,
    entryDate: r.entryDate,
  }));
  res.json(result);
});

router.get("/summary", (req: Request, res: Response) => {
  const { varietyId } = req.query;
  const allMeshes = ["18", "16", "14", "desperdicio"];

  let lotWhere: SQL | undefined;
  if (varietyId) lotWhere = eq(greenLots.varietyId, Number(varietyId));

  let batchWhere: SQL | undefined = sql`${roastingBatches.mesh} IS NOT NULL`;
  if (varietyId) batchWhere = and(batchWhere, eq(roastingBatches.varietyId, Number(varietyId)));

  const lotsRows = db.select({
    mesh: greenLots.mesh,
    incoming: sql<number>`COALESCE(SUM(${greenLots.kilos}), 0)`,
  }).from(greenLots).where(lotWhere).groupBy(greenLots.mesh).all();

  const usedRows = db.select({
    mesh: roastingBatches.mesh,
    used: sql<number>`COALESCE(SUM(${roastingBatches.greenKilos}), 0)`,
  }).from(roastingBatches).where(batchWhere).groupBy(roastingBatches.mesh).all();

  const incomingMap = new Map(lotsRows.map((r) => [r.mesh, Number(r.incoming)]));
  const usedMap = new Map(usedRows.map((r) => [r.mesh, Number(r.used)]));

  const result = allMeshes.map((mesh) => {
    const incoming = Math.round((incomingMap.get(mesh) || 0) * 100) / 100;
    const used = Math.round((usedMap.get(mesh) || 0) * 100) / 100;
    return { mesh, incoming, used, available: Math.round((incoming - used) * 100) / 100 };
  });

  res.json(result);
});

const ALLOWED_MESHES = ["18", "16", "14", "desperdicio"];

router.post("/batch", (req: Request, res: Response) => {
  const { entryId, lots, notes } = req.body;

  if (!entryId || !Array.isArray(lots) || lots.length === 0) {
    res.status(400).json({ error: "entryId y lots son obligatorios" });
    return;
  }

  const entry = db.select().from(greenCoffeeEntries).where(eq(greenCoffeeEntries.id, Number(entryId))).get();
  if (!entry) {
    res.status(404).json({ error: "Ingreso no encontrado" });
    return;
  }

  for (const lot of lots) {
    const mesh = lot?.mesh;
    const kilos = Number(lot?.kilos);
    if (!ALLOWED_MESHES.includes(mesh)) {
      res.status(400).json({ error: `Malla inválida: ${mesh}` });
      return;
    }
    if (!Number.isFinite(kilos) || kilos <= 0) {
      res.status(400).json({ error: `Kilos inválidos para la malla ${mesh}` });
      return;
    }
  }

  db.delete(greenLots).where(eq(greenLots.entryId, entry.id)).run();

  const created = lots.map((lot: { mesh: string; kilos: number }) =>
    db.insert(greenLots).values({
      entryId: entry.id,
      varietyId: entry.varietyId,
      mesh: lot.mesh,
      kilos: Number(lot.kilos),
    }).returning().get()
  );

  if (typeof notes === "string" && notes.trim()) {
    db.update(greenCoffeeEntries)
      .set({ splitNotes: notes.trim() })
      .where(eq(greenCoffeeEntries.id, entry.id))
      .run();
  }

  saveDatabase();
  res.status(201).json(created);
});

router.delete("/:id", (req: Request, res: Response) => {
  const deleted = db.delete(greenLots).where(eq(greenLots.id, Number(req.params.id))).returning().get();
  if (!deleted) { res.status(404).json({ error: "No encontrado" }); return; }
  saveDatabase();
  res.json({ message: "Eliminado", id: deleted.id });
});

export default router;
