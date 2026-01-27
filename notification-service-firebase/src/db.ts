import { getDb } from "./firebase.js";
import type { Firestore } from "firebase-admin/firestore";

const DEVICES = "devices";
const TRACKED_ORDERS = "tracked_orders";

export interface DeviceRow {
  id: string;
  push_token: string;
  created_at: number;
  updated_at: number;
}

export interface TrackedOrderRow {
  id: string;
  push_token: string;
  order_number: string;
  cliente: string;
  last_known_status: number;
  updated_at: number;
}

function db(): Firestore {
  return getDb();
}

export async function upsertDevice(pushToken: string): Promise<DeviceRow> {
  const database = db();
  const now = Date.now();
  const snap = await database.collection(DEVICES).where("push_token", "==", pushToken).limit(1).get();
  let id: string;
  if (!snap.empty) {
    const doc = snap.docs[0];
    id = doc.id;
    await doc.ref.update({ updated_at: now });
  } else {
    const ref = await database.collection(DEVICES).add({
      push_token: pushToken,
      created_at: now,
      updated_at: now,
    });
    id = ref.id;
  }
  const created = snap.empty ? now : (snap.docs[0].data().created_at as number);
  return { id, push_token: pushToken, created_at: created, updated_at: now };
}

export async function getDeviceByToken(pushToken: string): Promise<DeviceRow | undefined> {
  const database = db();
  const snap = await database.collection(DEVICES).where("push_token", "==", pushToken).limit(1).get();
  if (snap.empty) return undefined;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    push_token: data.push_token as string,
    created_at: data.created_at as number,
    updated_at: data.updated_at as number,
  };
}

export async function deleteDevice(pushToken: string): Promise<boolean> {
  const database = db();
  const snap = await database.collection(DEVICES).where("push_token", "==", pushToken).limit(1).get();
  if (snap.empty) return false;
  const ordersSnap = await database.collection(TRACKED_ORDERS).where("push_token", "==", pushToken).get();
  const batch = database.batch();
  for (const o of ordersSnap.docs) batch.delete(o.ref);
  batch.delete(snap.docs[0].ref);
  await batch.commit();
  return true;
}

export async function setTrackedOrders(
  pushToken: string,
  orders: { orderNumber: string; cliente: string; lastKnownStatus: number }[]
): Promise<void> {
  const database = db();
  const now = Date.now();
  const existing = await database.collection(TRACKED_ORDERS).where("push_token", "==", pushToken).get();
  const batch = database.batch();
  for (const d of existing.docs) batch.delete(d.ref);
  for (const o of orders) {
    const ref = database.collection(TRACKED_ORDERS).doc();
    batch.set(ref, {
      push_token: pushToken,
      order_number: o.orderNumber,
      cliente: o.cliente,
      last_known_status: o.lastKnownStatus,
      updated_at: now,
    });
  }
  await batch.commit();
}

export async function getDevicesWithTrackedOrders(): Promise<
  Array<{ device: DeviceRow; orders: TrackedOrderRow[] }>
> {
  const database = db();
  const ordersSnap = await database.collection(TRACKED_ORDERS).get();
  const byToken = new Map<string, TrackedOrderRow[]>();
  for (const d of ordersSnap.docs) {
    const data = d.data();
    const row: TrackedOrderRow = {
      id: d.id,
      push_token: data.push_token as string,
      order_number: data.order_number as string,
      cliente: data.cliente as string,
      last_known_status: data.last_known_status as number,
      updated_at: data.updated_at as number,
    };
    const arr = byToken.get(row.push_token) ?? [];
    arr.push(row);
    byToken.set(row.push_token, arr);
  }
  const tokens = Array.from(byToken.keys());
  if (tokens.length === 0) return [];
  if (tokens.length > 30) {
    console.warn("[DB] More than 30 devices with tracked orders; truncating to 30 for Firestore 'in' query.");
  }
  const tokensSlice = tokens.slice(0, 30);
  const devicesSnap = await database.collection(DEVICES).where("push_token", "in", tokensSlice).get();
  const deviceMap = new Map<string, DeviceRow>();
  for (const d of devicesSnap.docs) {
    const data = d.data();
    deviceMap.set(data.push_token as string, {
      id: d.id,
      push_token: data.push_token as string,
      created_at: data.created_at as number,
      updated_at: data.updated_at as number,
    });
  }
  return tokensSlice
    .filter((t) => deviceMap.has(t))
    .map((t) => ({ device: deviceMap.get(t)!, orders: byToken.get(t) ?? [] }));
}

export async function updateTrackedOrderStatus(
  pushToken: string,
  orderNumber: string,
  lastKnownStatus: number
): Promise<void> {
  const database = db();
  const now = Date.now();
  const snap = await database
    .collection(TRACKED_ORDERS)
    .where("push_token", "==", pushToken)
    .where("order_number", "==", orderNumber)
    .limit(1)
    .get();
  if (!snap.empty) {
    await snap.docs[0].ref.update({ last_known_status: lastKnownStatus, updated_at: now });
  }
}
