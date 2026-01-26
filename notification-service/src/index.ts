import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  getDb,
  upsertDevice,
  getDeviceByToken,
  deleteDevice,
  setTrackedOrders,
} from "./db.js";
import { ENV } from "./env.js";
import { startCron } from "./cron.js";

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

app.post("/api/register", (req, res) => {
  const token = typeof req.body?.pushToken === "string" ? req.body.pushToken.trim() : null;
  if (!token) {
    return res.status(400).json({ error: "pushToken is required" });
  }
  try {
    const device = upsertDevice(token);
    res.status(200).json({ ok: true, deviceId: device.id });
  } catch (e) {
    console.error("[API] register error:", e);
    res.status(500).json({ error: "Failed to register device" });
  }
});

app.put("/api/tracked", (req, res) => {
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
  const device = getDeviceByToken(token);
  if (!device) {
    return res.status(404).json({ error: "Device not registered. Call POST /api/register first." });
  }
  try {
    setTrackedOrders(device.id, orders);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[API] tracked error:", e);
    res.status(500).json({ error: "Failed to update tracked orders" });
  }
});

app.post("/api/unregister", (req, res) => {
  const token = typeof req.body?.pushToken === "string" ? req.body.pushToken.trim() : null;
  if (!token) {
    return res.status(400).json({ error: "pushToken is required" });
  }
  const deleted = deleteDevice(token);
  res.status(200).json({ ok: true, deleted });
});

const server = app.listen(ENV.PORT, () => {
  console.log(`[Notifications] API listening on port ${ENV.PORT}`);
});

const stopCron = startCron();

process.on("SIGTERM", () => {
  stopCron();
  server.close();
});
