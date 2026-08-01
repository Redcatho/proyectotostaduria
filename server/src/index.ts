import express from "express";
import cors from "cors";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./db/index.js";
import varietiesRouter from "./routes/varieties.js";
import entriesRouter from "./routes/entries.js";
import batchesRouter from "./routes/batches.js";
import lotsRouter from "./routes/lots.js";
import inventoryRouter from "./routes/inventory.js";
import dashboardRouter from "./routes/dashboard.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDatabase();

app.use("/api/varieties", varietiesRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/batches", batchesRouter);
app.use("/api/lots", lotsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const clientDist = join(__dirname, "..", "..", "client", "dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
