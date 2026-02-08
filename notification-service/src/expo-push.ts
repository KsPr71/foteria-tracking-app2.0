import Expo from "expo-server-sdk";
import { ENV } from "./env.js";

let expo: any | null = null;

function getExpo(): any {
  if (!expo) {
    const ExpoLib = Expo as any;
    try {
      const Ctor = ExpoLib?.default ?? ExpoLib?.Expo ?? ExpoLib;
      expo = new Ctor({ accessToken: ENV.EXPO_ACCESS_TOKEN });
    } catch (e) {
      // Last resort: try calling as function
      try {
        expo = (ExpoLib as any)({ accessToken: ENV.EXPO_ACCESS_TOKEN });
      } catch {
        expo = ExpoLib;
      }
    }
  }
  return expo;
}

export interface SendPushParams {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

function isExpoPushToken(token: unknown): boolean {
  const t = typeof token === "string" ? token : "";
  const lib = Expo as any;
  if (lib && typeof lib.isExpoPushToken === "function") {
    try {
      return !!lib.isExpoPushToken(t);
    } catch {}
  }
  try {
    const client = getExpo();
    if (client && typeof client.isExpoPushToken === "function") {
      try {
        return !!client.isExpoPushToken(t);
      } catch {}
    }
  } catch {}
  return t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken[");
}

export async function sendPushNotification(
  params: SendPushParams,
): Promise<boolean> {
  const client = getExpo();
  if (!isExpoPushToken(params.to)) {
    console.warn("[ExpoPush] Invalid Expo push token:", params.to);
    return false;
  }
  try {
    const chunks = client.chunkPushNotifications([
      {
        to: params.to,
        title: params.title,
        body: params.body,
        sound: "default",
        data: params.data ?? {},
      },
    ]);
    for (const chunk of chunks) {
      const tickets = await client.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket && "status" in ticket && ticket.status === "error") {
          const msg = "message" in ticket ? ticket.message : "Unknown error";
          const details = "details" in ticket ? ticket.details : undefined;
          console.warn("[ExpoPush] Ticket error:", msg, details);
          if (
            details &&
            typeof details === "object" &&
            "error" in details &&
            details.error === "DeviceNotRegistered"
          ) {
            // Caller should unregister this token
            return false;
          }
        }
      }
    }
    return true;
  } catch (err) {
    // Fallback: sometimes Expo requires the 'expo-platform' header when no access token is used.
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ExpoPush] Send failed via SDK:", msg);
    if (msg.includes("expo-platform") || msg.includes("Must specify")) {
      try {
        const endpoint = "https://exp.host/--/api/v2/push/send";
        const body = [
          {
            to: params.to,
            title: params.title,
            body: params.body,
            sound: "default",
            data: params.data ?? {},
          },
        ];
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "expo-platform": "android",
        };
        if (ENV.EXPO_ACCESS_TOKEN) {
          headers["Authorization"] = `Bearer ${ENV.EXPO_ACCESS_TOKEN}`;
        }
        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("[ExpoPush] Fallback fetch failed:", data);
          return false;
        }
        // Response is an object with "data" array of tickets or array directly; accept success if HTTP OK
        return true;
      } catch (e2) {
        console.error("[ExpoPush] Fallback send failed:", e2);
        return false;
      }
    }
    return false;
  }
}
