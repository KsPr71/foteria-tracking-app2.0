import { hasNotificationService, NOTIFICATION_SERVICE_URL } from "@/constants/notifications";
import type { TrackedOrder } from "@/lib/tracked-orders-service";

async function api<T>(path: string, options: RequestInit & { json?: object } = {}): Promise<T> {
  const { json, ...rest } = options;
  const res = await fetch(`${NOTIFICATION_SERVICE_URL}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(rest.headers as Record<string, string>) },
    body: json ? JSON.stringify(json) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

/**
 * Registrar el Expo Push Token en el microservicio de notificaciones.
 * Debe llamarse cuando el token esté disponible (solo móvil, no web ni Expo Go).
 */
export async function registerPushToken(pushToken: string): Promise<void> {
  if (!hasNotificationService()) return;
  await api("/api/register", { method: "POST", json: { pushToken } });
}

/**
 * Sincronizar la lista de órdenes rastreadas con el microservicio.
 * Debe llamarse al registrar el token, al añadir/quitar órdenes y periódicamente.
 */
export async function syncTrackedOrders(pushToken: string, orders: TrackedOrder[]): Promise<void> {
  if (!hasNotificationService()) return;
  const payload = orders.map((o) => ({
    orderNumber: o.orderNumber,
    cliente: o.cliente,
    lastKnownStatus: o.lastKnownStatus,
  }));
  await api("/api/tracked", { method: "PUT", json: { pushToken, orders: payload } });
}

/**
 * Dar de baja el token en el microservicio (p. ej. al desactivar notificaciones).
 */
export async function unregisterPushToken(pushToken: string): Promise<void> {
  if (!hasNotificationService()) return;
  await api("/api/unregister", { method: "POST", json: { pushToken } });
}

export interface TestConnectionResult {
  ok: boolean;
  error?: string;
  url?: string;
}

/**
 * Probar conexión con el microservicio (GET /api/health).
 * Útil en dev para verificar EXPO_PUBLIC_NOTIFICATION_SERVICE_URL y que Render responde.
 */
export async function testNotificationServiceConnection(): Promise<TestConnectionResult> {
  if (!hasNotificationService()) {
    return { ok: false, error: "EXPO_PUBLIC_NOTIFICATION_SERVICE_URL no configurada", url: "" };
  }
  try {
    const res = await fetch(`${NOTIFICATION_SERVICE_URL}/api/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error: (data as { error?: string }).error ?? `HTTP ${res.status}`,
        url: NOTIFICATION_SERVICE_URL,
      };
    }
    return { ok: !!data.ok, url: NOTIFICATION_SERVICE_URL };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg, url: NOTIFICATION_SERVICE_URL };
  }
}
