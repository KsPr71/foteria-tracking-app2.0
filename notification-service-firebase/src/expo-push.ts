import Expo from "expo-server-sdk";
import { CONFIG } from "./config.js";

let expo: Expo | null = null;

function getExpo(): Expo {
  if (!expo) {
    expo = new Expo({ accessToken: CONFIG.EXPO_ACCESS_TOKEN });
  }
  return expo;
}

export interface SendPushParams {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(params: SendPushParams): Promise<boolean> {
  const client = getExpo();
  if (!Expo.isExpoPushToken(params.to)) {
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
            return false;
          }
        }
      }
    }
    return true;
  } catch (err) {
    console.error("[ExpoPush] Send failed:", err);
    return false;
  }
}
