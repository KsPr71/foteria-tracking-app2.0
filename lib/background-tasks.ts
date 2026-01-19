import type { Order } from "@/types/order";
import { STAGES } from "@/types/order";
import * as BackgroundFetch from "expo-background-fetch";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { OrderService } from "./order-service";
import { TrackedOrdersService } from "./tracked-orders-service";

const BACKGROUND_FETCH_TASK = "background-order-check";

// Detectar si está en Expo Go
const isExpoGo = Constants.executionEnvironment === "storeClient";

/**
 * Tarea de background que verifica cambios en las órdenes rastreadas
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log("[BackgroundTask] Starting background order check...");

    const orderService = OrderService.getInstance();
    const trackedOrdersService = TrackedOrdersService.getInstance();

    // Limpiar caché para asegurar que se carguen datos frescos del servidor
    console.log("[BackgroundTask] Clearing cache to force fresh data from server...");
    await orderService.clearCache();

    // Cargar todas las órdenes del servidor (forzar refresh para obtener datos frescos)
    console.log("[BackgroundTask] Fetching orders from server...");
    const allOrders = await orderService.fetchOrders(true);
    console.log(`[BackgroundTask] Loaded ${allOrders.length} orders from server`);

    // Obtener órdenes rastreadas después de cargar del servidor
    const trackedOrders = await trackedOrdersService.getTrackedOrders();

    if (trackedOrders.length === 0) {
      console.log("[BackgroundTask] No tracked orders, but data refreshed from server");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const ordersMap = new Map<string, Order>();
    allOrders.forEach((order) => {
      ordersMap.set(order.orden, order);
    });

    // Verificar cada orden rastreada
    let changesDetected = 0;
    for (const tracked of trackedOrders) {
      const currentOrder = ordersMap.get(tracked.orderNumber);
      if (!currentOrder) {
        continue;
      }

      // Si el estado cambió, enviar notificación
      if (currentOrder.estado !== tracked.lastKnownStatus) {
        changesDetected++;
        const stage = STAGES.find((s) => s.id === currentOrder.estado);
        const message = `La orden ${tracked.orderNumber} del cliente ${tracked.cliente} ha cambiado a ${stage?.title || "nuevo estado"}`;

        // Actualizar el estado conocido primero para que el conteo sea correcto
        await trackedOrdersService.updateOrderStatus(tracked.orderNumber, currentOrder.estado);

        // Obtener conteo actualizado
        const newUnreadCount = await trackedOrdersService.getUnreadChangesCount();

        // Enviar notificación push (local)
        if (Platform.OS !== "web") {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Actualización de pedido: ${tracked.orderNumber}`,
                body: message,
                data: {
                  orderNumber: tracked.orderNumber,
                  cliente: tracked.cliente,
                  message: message,
                },
                sound: true,
                badge: newUnreadCount,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: null, // Enviar inmediatamente
            });
          } catch (error) {
            console.warn("[BackgroundTask] Error sending notification:", error);
          }
        }
      }
    }

    // Actualizar badge
    if (Platform.OS !== "web") {
      try {
        const unreadCount = await trackedOrdersService.getUnreadChangesCount();
        await Notifications.setBadgeCountAsync(unreadCount);
      } catch (error) {
        console.warn("[BackgroundTask] Error updating badge:", error);
      }
    }

    console.log(`[BackgroundTask] Check complete. Changes detected: ${changesDetected}`);

    return changesDetected > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error("[BackgroundTask] Error in background task:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registra la tarea de background fetch
 */
export async function registerBackgroundFetch(): Promise<void> {
  // No registrar en web ni Expo Go
  // No registrar en web
  if (Platform.OS === "web") {
    console.log("[BackgroundTask] Skipping registration (web)");
    return;
  }

  if (isExpoGo) {
    console.log("[BackgroundTask] Attempting to register in Expo Go (might not work on all platforms)");
  }

  try {
    // Esperar un poco para asegurar que la tarea esté definida
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verificar si la tarea ya está registrada
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    if (isRegistered) {
      console.log("[BackgroundTask] Task already registered");
      return;
    }

    // Verificar el estado de background fetch
    const status = await BackgroundFetch.getStatusAsync();

    // Verificar si está disponible
    if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
      console.warn("[BackgroundTask] Background fetch is not available. Status:", status);
      console.warn("[BackgroundTask] Note: Background fetch requires a native build and may not work in Expo Go");
      return;
    }

    // Obtener intervalo configurado
    const updateInterval = await TrackedOrdersService.getInstance().getUpdateInterval();
    console.log(`[BackgroundTask] Registering task with interval: ${updateInterval} minutes`);

    // Registrar la tarea
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: updateInterval * 60, // Convertir a segundos
      stopOnTerminate: false, // Continuar incluso si la app se cierra
      startOnBoot: true, // Iniciar cuando el dispositivo se reinicia
    });

    console.log("[BackgroundTask] Background fetch task registered successfully");
  } catch (error) {
    console.error("[BackgroundTask] Error registering background fetch:", error);
    // No lanzar el error para no romper la app si falla
    if (error instanceof Error) {
      console.error("[BackgroundTask] Error details:", error.message);
    }
  }
}

/**
 * Actualiza el intervalo de la tarea de background fetch
 */
export async function updateBackgroundFetchInterval(): Promise<void> {
  await unregisterBackgroundFetch();
  await registerBackgroundFetch();
}

/**
 * Cancela el registro de la tarea de background fetch
 */
export async function unregisterBackgroundFetch(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log("[BackgroundTask] Background fetch task unregistered");
    }
  } catch (error) {
    console.error("[BackgroundTask] Error unregistering background fetch:", error);
  }
}

/**
 * Obtiene el estado de la tarea de background fetch
 */
export async function getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
  if (Platform.OS === "web") {
    return null;
  }

  try {
    return await BackgroundFetch.getStatusAsync();
  } catch (error) {
    console.error("[BackgroundTask] Error getting background fetch status:", error);
    return null;
  }
}
