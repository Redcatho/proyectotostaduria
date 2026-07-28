import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { varieties, greenCoffeeEntries, roastingBatches } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const totalGreenIn = db.select({ total: sql`COALESCE(SUM(${greenCoffeeEntries.kilos}), 0)` })
    .from(greenCoffeeEntries).get();
  const totalGreenUsed = db.select({ total: sql`COALESCE(SUM(${roastingBatches.greenKilos}), 0)` })
    .from(roastingBatches).get();
  const totalRoasted = db.select({ total: sql`COALESCE(SUM(${roastingBatches.roastedKilos}), 0)` })
    .from(roastingBatches).get();

  const greenIn = Number(totalGreenIn?.total || 0);
  const used = Number(totalGreenUsed?.total || 0);
  const roasted = Number(totalRoasted?.total || 0);

  const mermaKg = Math.round((used - roasted) * 100) / 100;
  const mermaPct = used > 0 ? Math.round(((used - roasted) / used) * 100 * 100) / 100 : 0;

  const allVarieties = db.select().from(varieties).all();

  const varietyStats = allVarieties.map((v) => {
    const vGreenIn = db.select({ total: sql`COALESCE(SUM(${greenCoffeeEntries.kilos}), 0)` })
      .from(greenCoffeeEntries).where(eq(greenCoffeeEntries.varietyId, v.id)).get();
    const vGreenUsed = db.select({ total: sql`COALESCE(SUM(${roastingBatches.greenKilos}), 0)` })
      .from(roastingBatches).where(eq(roastingBatches.varietyId, v.id)).get();
    const vRoasted = db.select({ total: sql`COALESCE(SUM(${roastingBatches.roastedKilos}), 0)` })
      .from(roastingBatches).where(eq(roastingBatches.varietyId, v.id)).get();

    const vg = Number(vGreenIn?.total || 0);
    const vu = Number(vGreenUsed?.total || 0);
    const vr = Number(vRoasted?.total || 0);

    return {
      varietyId: v.id,
      varietyName: v.name,
      totalGreenIn: Math.round(vg * 100) / 100,
      totalGreenUsed: Math.round(vu * 100) / 100,
      totalRoasted: Math.round(vr * 100) / 100,
      mermaKg: Math.round((vu - vr) * 100) / 100,
      mermaPct: vu > 0 ? Math.round(((vu - vr) / vu) * 100 * 100) / 100 : 0,
    };
  });

  const recentBatches = db.select({
    batch: roastingBatches,
    varietyName: varieties.name,
  }).from(roastingBatches)
    .leftJoin(varieties, eq(roastingBatches.varietyId, varieties.id))
    .orderBy(sql`${roastingBatches.createdAt} DESC`)
    .limit(5)
    .all()
    .map((r) => ({
      ...r.batch,
      varietyName: r.varietyName,
      mermaKg: Math.round((r.batch.greenKilos - r.batch.roastedKilos) * 100) / 100,
    }));

  const recentEntries = db.select({
    entry: greenCoffeeEntries,
    varietyName: varieties.name,
  }).from(greenCoffeeEntries)
    .leftJoin(varieties, eq(greenCoffeeEntries.varietyId, varieties.id))
    .orderBy(sql`${greenCoffeeEntries.createdAt} DESC`)
    .limit(5)
    .all()
    .map((r) => ({ ...r.entry, varietyName: r.varietyName }));

  res.json({
    summary: {
      totalGreenIn: Math.round(greenIn * 100) / 100,
      totalGreenUsed: Math.round(used * 100) / 100,
      totalRoasted: Math.round(roasted * 100) / 100,
      mermaKg,
      mermaPct,
    },
    varietyStats,
    recentBatches,
    recentEntries,
  });
});

export default router;
