import { CONFIG } from "./config.js";
import { fetchOrders, stageTitle } from "./orders.js";
import {
  getDevicesWithTrackedOrders,
  updateTrackedOrderStatus,
  deleteDevice,
  type TrackedOrderRow,
} from "./db.js";
import { sendPushNotification } from "./expo-push.js";

export async function runCheck(): Promise<void> {
  console.log("[Cron] Checking for order status changes...");
  let orders: Array<{ orden: string; estado: number; cliente: string }>;
  try {
    const raw = await fetchOrders(CONFIG.SUPABASE_ORDERS_URL);
    orders = raw.map((o) => ({ orden: o.orden, estado: o.estado, cliente: o.cliente }));
  } catch (err) {
    console.error("[Cron] Failed to fetch orders:", err);
    return;
  }
  const ordersMap = new Map(orders.map((o) => [o.orden, o]));

  const devices = await getDevicesWithTrackedOrders();
  for (const { device, orders: tracked } of devices) {
    for (const row of tracked as TrackedOrderRow[]) {
      const current = ordersMap.get(row.order_number);
      if (!current) continue;
      if (current.estado === row.last_known_status) continue;

      const title = `Actualización de pedido: ${row.order_number}`;
      const stage = stageTitle(current.estado);
      const body = `La orden ${row.order_number} del cliente ${row.cliente} ha cambiado a ${stage}`;
      const ok = await sendPushNotification({
        to: device.push_token,
        title,
        body,
        data: { orderNumber: row.order_number, cliente: row.cliente, message: body },
      });
      if (!ok) {
        console.warn("[Cron] Push failed for token, unregistering:", device.push_token.slice(0, 30) + "...");
        await deleteDevice(device.push_token);
        break;
      }
      await updateTrackedOrderStatus(device.push_token, row.order_number, current.estado);
    }
  }
  console.log("[Cron] Check complete.");
}
