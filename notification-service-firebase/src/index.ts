import express from "express";
import cors from "cors";
import { getDb } from "./firebase.js";
import { CONFIG } from "./config.js";
import { runCheck } from "./cron.js";
import {
  upsertDevice,
  getDeviceByToken,
  deleteDevice,
  setTrackedOrders,
} from "./db.js";

getDb(); // init Firebase at startup

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  try {
    getDb();
  } catch {
    return res.status(503).json({ ok: false, error: "database" });
  }
  res.json({ ok: true, timestamp: Date.now() });
});

app.post("/api/register", async (req, res) => {
  const token = typeof req.body?.pushToken === "string" ? req.body.pushToken.trim() : null;
  if (!token) {
    return res.status(400).json({ error: "pushToken is required" });
  }
  try {
    const device = await upsertDevice(token);
    res.status(200).json({ ok: true, deviceId: device.id });
  } catch (e) {
    console.error("[API] register error:", e);
    res.status(500).json({ error: "Failed to register device" });
  }
});

app.put("/api/tracked", async (req, res) => {
  const token = typeof req.body?.pushToken === "string" ? req.body.pushToken.trim() : null;
  const raw = req.body?.orders;
  if (!token) {
    return res.status(400).json({ error: "pushToken is required" });
  }
  const orders = Array.isArray(raw)
    ? raw
        .filter(
          (o: unknown) =>
            o &&
            typeof o === "object" &&
            typeof (o as { orderNumber?: unknown }).orderNumber === "string" &&
            typeof (o as { cliente?: unknown }).cliente === "string" &&
            typeof (o as { lastKnownStatus?: unknown }).lastKnownStatus === "number"
        )
        .map((o: { orderNumber: string; cliente: string; lastKnownStatus: number }) => ({
          orderNumber: String((o as { orderNumber: string }).orderNumber).trim(),
          cliente: String((o as { cliente: string }).cliente).trim(),
          lastKnownStatus: Number((o as { lastKnownStatus: number }).lastKnownStatus),
        }))
    : [];
  const device = await getDeviceByToken(token);
  if (!device) {
    return res.status(404).json({ error: "Device not registered. Call POST /api/register first." });
  }
  try {
    await setTrackedOrders(token, orders);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[API] tracked error:", e);
    res.status(500).json({ error: "Failed to update tracked orders" });
  }
});

app.post("/api/unregister", async (req, res) => {
  const token = typeof req.body?.pushToken === "string" ? req.body.pushToken.trim() : null;
  if (!token) {
    return res.status(400).json({ error: "pushToken is required" });
  }
  const deleted = await deleteDevice(token);
  res.status(200).json({ ok: true, deleted });
});

function cronSecret(req: express.Request): string {
  const q = typeof req.query?.secret === "string" ? req.query.secret : "";
  const h = (req.headers["x-cron-secret"] as string) ?? "";
  return q || h;
}

app.all("/api/cron", async (req, res) => {
  if (CONFIG.CRON_SECRET && cronSecret(req) !== CONFIG.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await runCheck();
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[API] cron error:", e);
    res.status(500).json({ error: "Cron check failed" });
  }
});

const server = app.listen(CONFIG.PORT, () => {
  console.log(`[Notifications] API listening on port ${CONFIG.PORT}`);
});

process.on("SIGTERM", () => {
  server.close();
});
