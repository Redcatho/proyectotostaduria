import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { varieties, greenCoffeeEntries, roastingBatches } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const allVarieties = db.select().from(varieties).all();

  const inventory = allVarieties.map((v) => {
    const totalGreenIn = db.select({ total: sql`COALESCE(SUM(${greenCoffeeEntries.kilos}), 0)` })
      .from(greenCoffeeEntries)
      .where(eq(greenCoffeeEntries.varietyId, v.id))
      .get();

    const totalGreenUsed = db.select({ total: sql`COALESCE(SUM(${roastingBatches.greenKilos}), 0)` })
      .from(roastingBatches)
      .where(eq(roastingBatches.varietyId, v.id))
      .get();

    const totalRoasted = db.select({ total: sql`COALESCE(SUM(${roastingBatches.roastedKilos}), 0)` })
      .from(roastingBatches)
      .where(eq(roastingBatches.varietyId, v.id))
      .get();

    const greenIn = Number(totalGreenIn?.total || 0);
    const used = Number(totalGreenUsed?.total || 0);
    const roasted = Number(totalRoasted?.total || 0);

    return {
      varietyId: v.id,
      varietyName: v.name,
      origin: v.origin,
      totalGreenIn: Math.round(greenIn * 100) / 100,
      totalGreenUsed: Math.round(used * 100) / 100,
      availableGreen: Math.round((greenIn - used) * 100) / 100,
      totalRoasted: Math.round(roasted * 100) / 100,
    };
  });

  res.json(inventory);
});

export default router;
