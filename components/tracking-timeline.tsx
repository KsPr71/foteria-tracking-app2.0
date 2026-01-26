import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { StageItem } from "./stage-item";
import { ProgressBar } from "./progress-bar";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { Order, OrderStatus } from "@/types/order";
import { STAGES } from "@/types/order";
import { TrackedOrdersService } from "@/lib/tracked-orders-service";
import { useNotifications } from "@/contexts/notifications-context";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

interface TrackingTimelineProps {
  order: Order;
  onNewSearch: () => void;
}

export function TrackingTimeline({ order, onNewSearch }: TrackingTimelineProps) {
  const colors = useColors();
  const { syncTrackedOrdersNow } = useNotifications();
  const [isTracked, setIsTracked] = useState(false);
  const trackedOrdersService = TrackedOrdersService.getInstance();

  useEffect(() => {
    checkIfTracked();
    // Marcar la orden como vista cuando se muestra
    markOrderAsRead();
  }, [order.orden]);

  const markOrderAsRead = async () => {
    try {
      await trackedOrdersService.markOrderAsRead(order.orden);
      // Actualizar badge inmediatamente
      const unreadCount = await trackedOrdersService.getUnreadChangesCount();
      await Notifications.setBadgeCountAsync(unreadCount);
    } catch (error) {
      console.error("Error marking order as read:", error);
    }
  };

  const checkIfTracked = async () => {
    const tracked = await trackedOrdersService.isOrderTracked(order.orden);
    setIsTracked(tracked);
  };

  const handleToggleTracking = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (isTracked) {
        await trackedOrdersService.removeTrackedOrder(order.orden);
        setIsTracked(false);
        const unreadCount = await trackedOrdersService.getUnreadChangesCount();
        await Notifications.setBadgeCountAsync(unreadCount);
        await syncTrackedOrdersNow();
        Alert.alert("Éxito", "Ya no recibirás notificaciones de esta orden");
      } else {
        await trackedOrdersService.addTrackedOrder(order);
        setIsTracked(true);
        const unreadCount = await trackedOrdersService.getUnreadChangesCount();
        await Notifications.setBadgeCountAsync(unreadCount);
        await syncTrackedOrdersNow();
        Alert.alert(
          "Orden guardada",
          "Recibirás notificaciones cuando el estado de esta orden cambie",
        );
      }
    } catch (error) {
      console.error("Error toggling tracking:", error);
      Alert.alert("Error", "No se pudo actualizar el rastreo de la orden");
    }
  };

  const getStageStatus = (stageId: OrderStatus): "completed" | "current" | "pending" => {
    if (stageId < order.estado) return "completed";
    if (stageId === order.estado) return "current";
    return "pending";
  };

  const formatDate = (dateString: string): string => {
    try {
      // Parsear la fecha como fecha local para evitar problemas de zona horaria
      // Si la fecha viene en formato YYYY-MM-DD, parsearla correctamente
      const fechaParts = String(dateString).split("-");
      if (fechaParts.length === 3) {
        const year = parseInt(fechaParts[0], 10);
        const month = parseInt(fechaParts[1], 10) - 1; // Los meses en JS son 0-indexed
        const day = parseInt(fechaParts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
        }
      }
      // Fallback: intentar parsear normalmente
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getProductsList = (): string[] => {
    if (!order.productos_entrega_parcial) return [];

    // Manejar diferentes formatos: string separado por comas o array
    if (typeof order.productos_entrega_parcial === "string") {
      return order.productos_entrega_parcial
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    }

    if (Array.isArray(order.productos_entrega_parcial)) {
      return order.productos_entrega_parcial;
    }

    return [];
  };

  // Calcular progreso: si hay entrega parcial, contar como 5/6 (antes de entrega total)
  // Si no hay entrega parcial, usar el estado actual
  const getProgress = (): number => {
    const products = getProductsList();
    if (products.length > 0 && order.estado === 5) {
      // Entrega parcial: mostrar 5/6 de progreso
      return 5 / 6;
    }
    return order.estado / 6;
  };

  // Determinar qué etapas mostrar
  const getVisibleStages = () => {
    const products = getProductsList();
    if (products.length > 0 && order.estado === 5) {
      // Si hay entrega parcial, mostrar solo hasta entrega parcial
      return STAGES.filter((s) => s.id <= 5);
    }
    return STAGES;
  };

  const products = getProductsList();
  const visibleStages = getVisibleStages();
  const progress = getProgress();

  return (
    <View style={styles.container}>
      {/* Header con información del cliente */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.orderNumber, { color: colors.primary }]}>{order.orden}</Text>
        <Text style={[styles.clientName, { color: colors.foreground }]}>{order.cliente}</Text>
        <Text style={[styles.date, { color: colors.muted }]}>
          Fecha de sesión: {formatDate(order.fecha)}
        </Text>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressSection}>
        <ProgressBar progress={progress} label="Progreso de tu orden" />
      </View>

      {/* Timeline de etapas */}
      <View style={styles.timeline}>
        {visibleStages.map((stage, index) => (
          <StageItem
            key={stage.id}
            stage={stage}
            status={getStageStatus(stage.id)}
            isLast={index === visibleStages.length - 1}
            index={index}
          />
        ))}
      </View>

      {/* Productos de entrega parcial */}
      {products.length > 0 && (
        <View style={[styles.productsCard, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
          <View style={styles.productsHeader}>
            <IconSymbol name="shippingbox.fill" size={20} color={colors.warning} />
            <Text style={[styles.productsTitle, { color: colors.foreground }]}>
              Productos disponibles para entrega
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          >
            {products.map((product, index) => (
              <View
                key={index}
                style={[styles.productBadge, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.productText}>{product}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Botón para guardar/quitar rastreo */}
      <TouchableOpacity
        style={[
          styles.trackButton,
          {
            backgroundColor: isTracked ? colors.error : colors.surface,
            borderColor: isTracked ? colors.error : colors.border,
          },
        ]}
        onPress={handleToggleTracking}
        activeOpacity={0.8}
      >
        <IconSymbol
          name={isTracked ? "bell.slash.fill" : "bell.fill"}
          size={20}
          color={isTracked ? "#ffffff" : colors.primary}
        />
        <Text
          style={[
            styles.trackButtonText,
            { color: isTracked ? "#ffffff" : colors.foreground },
          ]}
        >
          {isTracked ? "Dejar de rastrear" : "Activar notificaciones"}
        </Text>
      </TouchableOpacity>

      {/* Botón para nueva búsqueda */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onNewSearch}
        activeOpacity={0.8}
      >
        <IconSymbol name="magnifyingglass" size={20} color="#ffffff" />
        <Text style={styles.buttonText}>Buscar otra orden</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  clientName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  progressSection: {
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  productsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
    gap: 12,
  },
  productsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  productsTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  productsList: {
    gap: 8,
    paddingRight: 8,
  },
  productBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  productText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    borderWidth: 2,
  },
  trackButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
