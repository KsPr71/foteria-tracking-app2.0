/**
 * URL base del microservicio de notificaciones (cloud).
 * Si no está configurada, la app no registrará tokens ni sincronizará órdenes rastreadas con el servicio.
 */
const baseUrl = (process.env.EXPO_PUBLIC_NOTIFICATION_SERVICE_URL ?? "").replace(/\/$/, "");

export const NOTIFICATION_SERVICE_URL = baseUrl;

export function hasNotificationService(): boolean {
  return baseUrl.length > 0;
}
