import Constants from "expo-constants";

/**
 * URL base del microservicio de notificaciones (cloud).
 * Si no está configurada, la app no registrará tokens ni sincronizará órdenes rastreadas con el servicio.
 * Prioridad: app.config extra > EXPO_PUBLIC_NOTIFICATION_SERVICE_URL
 */
const baseUrl = (
  (Constants.expoConfig?.extra as { notificationServiceUrl?: string } | undefined)
    ?.notificationServiceUrl ??
  process.env.EXPO_PUBLIC_NOTIFICATION_SERVICE_URL ??
  ""
)
  .replace(/\/$/, "");

export const NOTIFICATION_SERVICE_URL = baseUrl;

export function hasNotificationService(): boolean {
  return baseUrl.length > 0;
}
