import Constants from "expo-constants";

/** URL por defecto del microservicio (Render). Garantiza funcionamiento en production. */
const DEFAULT_NOTIFICATION_SERVICE_URL = "https://foteria-tracking-app2-0.onrender.com";

/**
 * URL base del microservicio de notificaciones (cloud).
 * Prioridad: app.config extra > EXPO_PUBLIC_* > fallback hardcodeado (para production).
 */
const baseUrl = (
  (Constants.expoConfig?.extra as { notificationServiceUrl?: string } | undefined)
    ?.notificationServiceUrl ??
  process.env.EXPO_PUBLIC_NOTIFICATION_SERVICE_URL ??
  DEFAULT_NOTIFICATION_SERVICE_URL
)
  .replace(/\/$/, "");

export const NOTIFICATION_SERVICE_URL = baseUrl;

export function hasNotificationService(): boolean {
  return baseUrl.length > 0;
}
