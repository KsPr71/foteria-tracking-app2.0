import {
  registerPushToken,
  syncTrackedOrders,
  testNotificationServiceConnection,
  type TestConnectionResult,
} from "@/lib/notification-service-client";
import { OrderService } from "@/lib/order-service";
import { TrackedOrdersService } from "@/lib/tracked-orders-service";
import type { Order, OrderStatus } from "@/types/order";
import { STAGES } from "@/types/order";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

// Detectar si está en Expo Go (donde las notificaciones push remotas no funcionan)
const isExpoGo = Constants.executionEnvironment === "storeClient";

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
// Solo en móvil
if (Platform.OS !== "web") {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Silenciar errores en Expo Go
    console.warn("Notifications not available in Expo Go");
  }
}

const CHECK_INTERVAL = 1000 * 60 * 15; // Verificar cada 15 minutos

export interface StatusChangeNotification {
  orderNumber: string;
  cliente: string;
  newStatus: OrderStatus;
  message: string;
}

export function useOrderNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderService = OrderService.getInstance();
  const trackedOrdersService = TrackedOrdersService.getInstance();

  const updateBadge = useCallback(async () => {
    try {
      // Contar solo las órdenes con cambios no vistos
      const unreadCount = await trackedOrdersService.getUnreadChangesCount();
      // Solo actualizar badge en móvil (no en web)
      if (Platform.OS !== "web") {
        try {
          await Notifications.setBadgeCountAsync(unreadCount);
        } catch (error) {
          // Silenciar errores de badge en Expo Go
          console.warn("Error updating badge:", error);
        }
      }
      setNotificationCount(unreadCount);
    } catch (error) {
      // No romper la app si falla el badge
      console.warn("Error updating badge:", error);
    }
  }, [trackedOrdersService]);

  const sendStatusChangeNotification = useCallback(async (
    tracked: { orderNumber: string; cliente: string },
    newStatus: OrderStatus,
  ) => {
    const stage = STAGES.find((s) => s.id === newStatus);
    if (!stage) {
      console.warn("[Notifications] Stage not found for status:", newStatus);
      return;
    }

    // Crear mensaje con el formato solicitado
    const message = `La orden ${tracked.orderNumber} del cliente ${tracked.cliente} ha cambiado a ${stage.title}`;

    console.log("[Notifications] Sending status change notification");
    console.log("[Notifications] Message:", message);
    console.log("[Notifications] Setting snackbar visible to true");

    // Siempre mostrar snackbar cuando se detecta un cambio
    setSnackbarMessage(message);
    setSnackbarVisible(true);

    console.log("[Notifications] Snackbar state updated");

    // Enviar notificación push solo en móvil (no en web)
    // En Expo Go, las notificaciones locales funcionan
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
          },
          trigger: null, // Enviar inmediatamente
        });
      } catch (error) {
        // Si falla la notificación push, al menos el snackbar ya se mostró
        console.warn("Error sending push notification:", error);
      }
    }
  }, [setSnackbarMessage, setSnackbarVisible]);

  const checkForStatusChanges = useCallback(async () => {
    try {
      console.log("[Notifications] Checking for status changes...");
      const trackedOrders = await trackedOrdersService.getTrackedOrders();
      console.log(`[Notifications] Found ${trackedOrders.length} tracked orders`);

      if (trackedOrders.length === 0) {
        await updateBadge();
        return;
      }

      // Obtener todas las órdenes actuales (forzar refresh para detectar cambios)
      const allOrders = await orderService.fetchOrders(true);
      const ordersMap = new Map<string, Order>();
      allOrders.forEach((order) => {
        ordersMap.set(order.orden, order);
      });

      // Verificar cada orden rastreada
      let changesDetected = 0;
      for (const tracked of trackedOrders) {
        const currentOrder = ordersMap.get(tracked.orderNumber);
        if (!currentOrder) {
          console.log(`[Notifications] Order ${tracked.orderNumber} not found in current data`);
          continue;
        }

        console.log(`[Notifications] Checking order ${tracked.orderNumber}: lastKnown=${tracked.lastKnownStatus}, current=${currentOrder.estado}`);

        // Si el estado cambió, enviar notificación
        if (currentOrder.estado !== tracked.lastKnownStatus) {
          console.log(`[Notifications] Status change detected for ${tracked.orderNumber}: ${tracked.lastKnownStatus} -> ${currentOrder.estado}`);
          changesDetected++;
          await sendStatusChangeNotification(tracked, currentOrder.estado);
          await trackedOrdersService.updateOrderStatus(tracked.orderNumber, currentOrder.estado);
        }
      }

      console.log(`[Notifications] Check complete. Changes detected: ${changesDetected}`);

      // Actualizar badge siempre para reflejar el estado actual
      await updateBadge();

      // Sincronizar órdenes rastreadas con el microservicio de notificaciones (cloud)
      if (expoPushToken) {
        try {
          const tracked = await trackedOrdersService.getTrackedOrders();
          await syncTrackedOrders(expoPushToken, tracked);
        } catch (e) {
          console.warn("[Notifications] Cloud sync failed:", e);
        }
      }
    } catch (error) {
      console.error("[Notifications] Error checking for status changes:", error);
    }
  }, [
    trackedOrdersService,
    orderService,
    updateBadge,
    sendStatusChangeNotification,
    expoPushToken,
  ]);

  // Registrar para notificaciones push (solo en móvil, no en web ni Expo Go)
  useEffect(() => {
    if (Platform.OS === "web" || isExpoGo) {
      // En web o Expo Go, no intentar registrar notificaciones push remotas
      // El snackbar seguirá funcionando
      return;
    }

    registerForPushNotificationsAsync()
      .then(async (token) => {
        setExpoPushToken(token);
        if (token) {
          try {
            await registerPushToken(token);
            const tracked = await trackedOrdersService.getTrackedOrders();
            await syncTrackedOrders(token, tracked);
          } catch (e) {
            console.warn("[Notifications] Cloud service register/sync failed:", e);
          }
        }
      })
      .catch((error) => {
        console.warn("Error registering for push notifications:", error);
      });

    // Listener para notificaciones recibidas cuando la app está en primer plano
    let notificationListener: Notifications.Subscription | null = null;
    let responseListener: Notifications.Subscription | null = null;

    try {
      notificationListener = Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
        // Si la app está en primer plano, mostrar snackbar
        if (AppState.currentState === "active") {
          const data = notification.request.content.data;
          if (data?.message && typeof data.message === "string") {
            setSnackbarMessage(data.message);
            setSnackbarVisible(true);
          }
        }
      });

      // Listener para cuando el usuario toca una notificación
      responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
        const data = response.notification.request.content.data;
        if (data?.message && typeof data.message === "string") {
          setSnackbarMessage(data.message);
          setSnackbarVisible(true);
        }
      });
    } catch (error) {
      console.warn("Error setting up notification listeners:", error);
    }

    return () => {
      if (notificationListener) {
        try {
          notificationListener.remove();
        } catch {
          // Ignorar errores al limpiar
        }
      }
      if (responseListener) {
        try {
          responseListener.remove();
        } catch {
          // Ignorar errores al limpiar
        }
      }
    };
  }, []);

  // Actualizar badge cuando cambien las órdenes rastreadas
  useEffect(() => {
    // Actualizar badge inmediatamente y luego cada minuto
    updateBadge();
    const badgeInterval = setInterval(() => {
      updateBadge();
    }, 60000);

    return () => {
      clearInterval(badgeInterval);
    };
  }, [updateBadge]);

  // Iniciar verificación periódica de cambios
  useEffect(() => {
    // Esperar un poco después de montar para que la app termine de cargar
    const initialCheck = setTimeout(() => {
      console.log("[Notifications] Initial check after app load");
      checkForStatusChanges();
    }, 2000); // 2 segundos después de cargar

    // Configurar intervalo para verificar periódicamente
    intervalRef.current = setInterval(() => {
      checkForStatusChanges();
    }, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialCheck);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkForStatusChanges]);

  // Verificar manualmente
  const checkNow = async () => {
    await checkForStatusChanges();
  };

  // Sincronizar órdenes rastreadas con el microservicio (p. ej. tras añadir/quitar)
  const syncTrackedOrdersNow = useCallback(async () => {
    if (!expoPushToken) return;
    try {
      const tracked = await trackedOrdersService.getTrackedOrders();
      await syncTrackedOrders(expoPushToken, tracked);
    } catch (e) {
      console.warn("[Notifications] Cloud sync failed:", e);
    }
  }, [expoPushToken, trackedOrdersService]);

  // En dev: registrar + sincronizar con un token de prueba (Expo Go no tiene token real).
  const syncTrackedOrdersWithMockToken = useCallback(async () => {
    const MOCK_TOKEN = "ExponentPushToken[expo-dev-test]";
    try {
      await registerPushToken(MOCK_TOKEN);
      const tracked = await trackedOrdersService.getTrackedOrders();
      await syncTrackedOrders(MOCK_TOKEN, tracked);
    } catch (e) {
      console.warn("[Notifications] Mock sync failed:", e);
      throw e;
    }
  }, [trackedOrdersService]);

  const testSnackbar = useCallback(() => {
    const testMessage = "La orden Orden 01005-001-0003 del cliente Test Cliente ha cambiado a Edición";
    console.log("testSnackbar called, setting message:", testMessage);
    setSnackbarMessage(testMessage);
    setSnackbarVisible(true);
    console.log("Snackbar state updated");
  }, [setSnackbarMessage, setSnackbarVisible]);

  const testConnection = useCallback((): Promise<TestConnectionResult> => {
    return testNotificationServiceConnection();
  }, []);

  const diagnosePushToken = useCallback(async (): Promise<{
    token: string | null;
    permissionsStatus: string;
    error?: string;
    projectId: string;
  }> => {
    if (Platform.OS === "web" || isExpoGo) {
      return {
        token: null,
        permissionsStatus: "N/A (web o Expo Go)",
        projectId: "",
      };
    }
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? "8cf6ab93-8443-4163-b138-8764fae210bb";
      if (finalStatus !== "granted") {
        return {
          token: null,
          permissionsStatus: finalStatus,
          projectId,
          error: "Permisos de notificaciones no concedidos",
        };
      }
      const result = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = result.data;
      if (token) setExpoPushToken(token);
      return {
        token,
        permissionsStatus: finalStatus,
        projectId,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        token: null,
        permissionsStatus: "unknown",
        projectId: Constants.expoConfig?.extra?.eas?.projectId ?? "8cf6ab93-8443-4163-b138-8764fae210bb",
        error: msg,
      };
    }
  }, []);

  return {
    expoPushToken,
    notificationCount,
    checkNow,
    checkForChanges: checkForStatusChanges,
    syncTrackedOrdersNow,
    syncTrackedOrdersWithMockToken,
    updateBadge,
    snackbarMessage,
    snackbarVisible,
    setSnackbarVisible,
    testSnackbar,
    testConnection,
    diagnosePushToken,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // No intentar registrar notificaciones push en web o Expo Go
  if (Platform.OS === "web" || isExpoGo) {
    return null;
  }

  let token: string | null = null;

  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    } catch (error) {
      console.warn("Error setting notification channel:", error);
      return null;
    }
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Failed to get push token for push notification!");
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? "8cf6ab93-8443-4163-b138-8764fae210bb";
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (error) {
    // No romper la app si falla, solo loggear
    // En Expo Go esto fallará silenciosamente
    console.warn("Error getting Expo push token (expected in Expo Go):", error);
  }

  return token;
}
