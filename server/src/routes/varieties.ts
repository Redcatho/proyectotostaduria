import { Router, Request, Response } from "express";
import { db, saveDatabase } from "../db/index.js";
import { varieties } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const all = db.select().from(varieties).orderBy(varieties.name).all();
  res.json(all);
});

router.get("/:id", (req: Request, res: Response) => {
  const item = db.select().from(varieties).where(eq(varieties.id, Number(req.params.id))).get();
  if (!item) { res.status(404).json({ error: "No encontrada" }); return; }
  res.json(item);
});

router.post("/", (req: Request, res: Response) => {
  const { name, origin, notes } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: "El nombre es obligatorio" }); return; }
  const inserted = db.insert(varieties).values({ name: name.trim(), origin: origin || null, notes: notes || null }).returning().get();
  saveDatabase();
  res.status(201).json(inserted);
});

router.put("/:id", (req: Request, res: Response) => {
  const { name, origin, notes } = req.body;
  const updated = db.update(varieties).set({ name: name?.trim(), origin: origin || null, notes: notes || null }).where(eq(varieties.id, Number(req.params.id))).returning().get();
  if (!updated) { res.status(404).json({ error: "No encontrada" }); return; }
  saveDatabase();
  res.json(updated);
});

router.delete("/:id", (req: Request, res: Response) => {
  const deleted = db.delete(varieties).where(eq(varieties.id, Number(req.params.id))).returning().get();
  if (!deleted) { res.status(404).json({ error: "No encontrada" }); return; }
  saveDatabase();
  res.json({ message: "Eliminada", id: deleted.id });
});

export default router;
