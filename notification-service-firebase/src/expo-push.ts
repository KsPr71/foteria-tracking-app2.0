import expoServerSdk from "expo-server-sdk";
import { CONFIG } from "./config.js";

const Expo = (expoServerSdk as { default?: unknown }).default ?? expoServerSdk;
const ExpoClass = Expo as new (opts?: { accessToken?: string }) => {
  chunkPushNotifications: (msgs: unknown[]) => unknown[][];
  sendPushNotificationsAsync: (chunk: unknown[]) => Promise<unknown[]>;
};

let client: InstanceType<typeof ExpoClass> | null = null;

function getExpo(): InstanceType<typeof ExpoClass> {
  if (!client) {
    client = new ExpoClass({ accessToken: CONFIG.EXPO_ACCESS_TOKEN });
  }
  return client;
}

export interface SendPushParams {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const EXPO_TOKEN_REGEX = /^ExponentPushToken\[.+\]$/;

export async function sendPushNotification(params: SendPushParams): Promise<boolean> {
  if (!EXPO_TOKEN_REGEX.test(params.to)) {
    console.warn("[ExpoPush] Invalid Expo push token:", params.to);
    return false;
  }
  const expo = getExpo();
  try {
    const chunks = expo.chunkPushNotifications([
      {
        to: params.to,
        title: params.title,
        body: params.body,
        sound: "default",
        data: params.data ?? {},
      },
    ]);
    for (const chunk of chunks) {
      const tickets = (await expo.sendPushNotificationsAsync(chunk)) as {
        status?: string;
        message?: string;
        details?: { error?: string };
      }[];
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket?.status === "error") {
          console.warn("[ExpoPush] Ticket error:", ticket.message, ticket.details);
          if (ticket.details?.error === "DeviceNotRegistered") {
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
