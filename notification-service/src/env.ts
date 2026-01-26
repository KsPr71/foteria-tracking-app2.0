import "dotenv/config";

const SUPABASE_ORDERS_URL =
  process.env.SUPABASE_ORDERS_URL ??
  "https://lcuaqykvynaqtyqofdsv.supabase.co/storage/v1/object/public/datos/datos-ordenes.json";
const PORT = parseInt(process.env.PORT ?? "3100", 10);
const CRON_INTERVAL_MINUTES = Math.max(1, parseInt(process.env.CRON_INTERVAL_MINUTES ?? "10", 10));
const DB_PATH = process.env.DB_PATH ?? "./data/notifications.db";
const EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN ?? undefined;
const NODE_ENV = process.env.NODE_ENV ?? "development";

export const ENV = {
  SUPABASE_ORDERS_URL,
  PORT,
  CRON_INTERVAL_MINUTES,
  DB_PATH,
  EXPO_ACCESS_TOKEN,
  NODE_ENV,
} as const;
