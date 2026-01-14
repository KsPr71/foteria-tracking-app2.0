import { ProgressBar } from "@/components/progress-bar";
import { useNotifications } from "@/contexts/notifications-context";
import { useColors } from "@/hooks/use-colors";
import { OrderService } from "@/lib/order-service";
import { TrackedOrdersService } from "@/lib/tracked-orders-service";
import type { Order } from "@/types/order";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";

export default function RefreshScreen() {
  const colors = useColors();
  const { checkForChanges } = useNotifications();
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Iniciando actualización...");
  const isRefreshingRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    // Evitar múltiples ejecuciones simultáneas
    if (isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    setProgress(0);

    const orderService = OrderService.getInstance();
    const trackedOrdersService = TrackedOrdersService.getInstance();

    try {
      // Paso 1: Limpiar caché (10%)
      setProgress(0.1);
      setStatusMessage("Limpiando caché... (10%)");
      await orderService.clearCache();
      
      // Paso 2: Obtener todas las órdenes del JSON (20% a 40%)
      setProgress(0.2);
      setStatusMessage("Obteniendo órdenes del servidor... (20%)");
      const allOrders = await orderService.fetchOrders(true);
      const totalOrders = allOrders.length;
      setProgress(0.4);
      setStatusMessage(`Órdenes obtenidas: ${totalOrders} órdenes encontradas (40%)`);
      
      if (totalOrders === 0) {
        setProgress(1);
        setStatusMessage("No se encontraron órdenes (100%)");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.replace("/(tabs)/");
        return;
      }

      // Paso 3: Obtener órdenes rastreadas (40% a 50%)
      setProgress(0.45);
      setStatusMessage("Obteniendo órdenes rastreadas... (45%)");
      const trackedOrders = await trackedOrdersService.getTrackedOrders();
      const totalTracked = trackedOrders.length;
      setProgress(0.5);
      setStatusMessage(`Órdenes rastreadas: ${totalTracked} órdenes a verificar (50%)`);
      
      if (totalTracked === 0) {
        // Si no hay órdenes rastreadas, solo actualizar badge
        setProgress(0.9);
        setStatusMessage("Actualizando badge... (90%)");
        await checkForChanges();
        setProgress(1);
        setStatusMessage("Actualización completada (100%)");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.replace("/(tabs)/");
        return;
      }

      // Paso 4: Verificar cada orden rastreada (50% a 90%)
      // El 40% restante se divide entre el número de órdenes rastreadas
      const progressPerOrder = 0.4 / totalTracked;
      const ordersMap = new Map<string, Order>();
      allOrders.forEach((order) => {
        ordersMap.set(order.orden, order);
      });

      let processedOrders = 0;
      for (const tracked of trackedOrders) {
        const currentOrder = ordersMap.get(tracked.orderNumber);
        if (currentOrder) {
          // Verificar si el estado cambió
          if (currentOrder.estado !== tracked.lastKnownStatus) {
            // Actualizar estado en el servicio
            await trackedOrdersService.updateOrderStatus(tracked.orderNumber, currentOrder.estado);
          }
        }
        processedOrders++;
        // Actualizar progreso: 50% + (progreso por orden * órdenes procesadas)
        const currentProgress = 0.5 + (progressPerOrder * processedOrders);
        const progressPercent = Math.round(currentProgress * 100);
        setProgress(Math.min(currentProgress, 0.9));
        setStatusMessage(`Verificando orden ${processedOrders} de ${totalTracked}... (${progressPercent}%)`);
      }

      // Paso 5: Actualizar badge y finalizar (90% a 100%)
      setProgress(0.9);
      setStatusMessage("Actualizando notificaciones... (90%)");
      await checkForChanges();
      setProgress(1);
      setStatusMessage("Actualización completada exitosamente (100%)");

      // Esperar un momento para mostrar el 100%
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // Redirigir a la pantalla de tracking después de actualizar
      router.replace("/(tabs)/");
    } catch (error) {
      console.error("Error refreshing data:", error);
      setProgress(1);
      Alert.alert("Error", "No se pudieron actualizar los datos");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      // Redirigir también en caso de error
      router.replace("/(tabs)/");
    } finally {
      isRefreshingRef.current = false;
    }
  }, [checkForChanges]);

  // Ejecutar la actualización cuando la pantalla reciba foco
  useFocusEffect(
    useCallback(() => {
      // Resetear el estado cuando la pantalla recibe foco para permitir múltiples actualizaciones
      isRefreshingRef.current = false;
      setProgress(0);
      setStatusMessage("Iniciando actualización...");
      handleRefresh();
      
      return () => {
        // Limpiar cuando la pantalla pierde el foco
        isRefreshingRef.current = false;
      };
    }, [handleRefresh])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ProgressBar progress={progress} label="Actualizando datos..." />
        <Text style={[styles.statusText, { color: colors.muted }]}>
          {statusMessage}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    gap: 16,
  },
  statusText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
