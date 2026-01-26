import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import { ENV } from "./env.js";

let db: Database.Database | null = null;

function ensureDataDir() {
  const dir = dirname(ENV.DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function getDb(): Database.Database {
  if (!db) {
    ensureDataDir();
    db = new Database(ENV.DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

/** Initialize DB (create tables). Run via `pnpm db:init`. */
export function initDb(): void {
  getDb();
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      push_token TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tracked_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
      order_number TEXT NOT NULL,
      cliente TEXT NOT NULL,
      last_known_status INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(device_id, order_number)
    );

    CREATE INDEX IF NOT EXISTS idx_tracked_device ON tracked_orders(device_id);
    CREATE INDEX IF NOT EXISTS idx_devices_token ON devices(push_token);
  `);
}

export interface DeviceRow {
  id: number;
  push_token: string;
  created_at: number;
  updated_at: number;
}

export interface TrackedOrderRow {
  id: number;
  device_id: number;
  order_number: string;
  cliente: string;
  last_known_status: number;
  created_at: number;
  updated_at: number;
}

export function upsertDevice(pushToken: string): DeviceRow {
  const database = getDb();
  const now = Date.now();
  database
    .prepare(
      `INSERT INTO devices (push_token, created_at, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(push_token) DO UPDATE SET updated_at = excluded.updated_at`
    )
    .run(pushToken, now, now);
  const row = database.prepare("SELECT id, push_token, created_at, updated_at FROM devices WHERE push_token = ?").get(pushToken) as DeviceRow;
  return row;
}

export function getDeviceByToken(pushToken: string): DeviceRow | undefined {
  const database = getDb();
  return database.prepare("SELECT id, push_token, created_at, updated_at FROM devices WHERE push_token = ?").get(pushToken) as DeviceRow | undefined;
}

export function deleteDevice(pushToken: string): boolean {
  const database = getDb();
  const r = database.prepare("DELETE FROM devices WHERE push_token = ?").run(pushToken);
  return r.changes > 0;
}

export function setTrackedOrders(deviceId: number, orders: { orderNumber: string; cliente: string; lastKnownStatus: number }[]): void {
  const database = getDb();
  const now = Date.now();
  const del = database.prepare("DELETE FROM tracked_orders WHERE device_id = ?");
  const ins = database.prepare(`
    INSERT INTO tracked_orders (device_id, order_number, cliente, last_known_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const run = database.transaction(() => {
    del.run(deviceId);
    for (const o of orders) {
      ins.run(deviceId, o.orderNumber, o.cliente, o.lastKnownStatus, now, now);
    }
  });
  run();
}

export function getDevicesWithTrackedOrders(): Array<{ device: DeviceRow; orders: TrackedOrderRow[] }> {
  const database = getDb();
  const devices = database.prepare("SELECT id, push_token, created_at, updated_at FROM devices").all() as DeviceRow[];
  const orders = database.prepare("SELECT id, device_id, order_number, cliente, last_known_status, created_at, updated_at FROM tracked_orders").all() as TrackedOrderRow[];
  const byDevice = new Map<number, TrackedOrderRow[]>();
  for (const o of orders) {
    const arr = byDevice.get(o.device_id) ?? [];
    arr.push(o);
    byDevice.set(o.device_id, arr);
  }
  return devices
    .filter((d) => (byDevice.get(d.id)?.length ?? 0) > 0)
    .map((device) => ({ device, orders: byDevice.get(device.id) ?? [] }));
}

export function updateTrackedOrderStatus(deviceId: number, orderNumber: string, lastKnownStatus: number): void {
  const database = getDb();
  const now = Date.now();
  database.prepare("UPDATE tracked_orders SET last_known_status = ?, updated_at = ? WHERE device_id = ? AND order_number = ?").run(lastKnownStatus, now, deviceId, orderNumber);
}
