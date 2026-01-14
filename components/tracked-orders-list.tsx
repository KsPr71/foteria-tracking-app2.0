import { TrackedOrdersService } from "@/lib/tracked-orders-service";
import type { TrackedOrder } from "@/lib/tracked-orders-service";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface TrackedOrdersListProps {
  onOrderPress: (orderNumber: string) => void;
}

export function TrackedOrdersList({ onOrderPress }: TrackedOrdersListProps) {
  const colors = useColors();
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([]);
  const trackedOrdersService = TrackedOrdersService.getInstance();

  const loadTrackedOrders = useCallback(async () => {
    const orders = await trackedOrdersService.getTrackedOrders();
    // Ordenar por fecha de adición (más recientes primero)
    const sorted = orders.sort((a, b) => b.addedAt - a.addedAt);
    setTrackedOrders(sorted);
  }, [trackedOrdersService]);

  // Recargar órdenes cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadTrackedOrders();
    }, [loadTrackedOrders])
  );

  const formatDate = (dateString: string) => {
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
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        }
      }
      // Fallback: intentar parsear normalmente
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatOrderNumber = (orderNumber: string) => {
    // Remover "Orden " del inicio si existe
    return orderNumber.replace(/^Orden\s+/i, "");
  };

  const handleClearAllData = useCallback(async () => {
    Alert.alert(
      "Eliminar datos de seguimiento",
      "¿Estás seguro de que deseas eliminar todos los datos de seguimiento almacenados localmente? Esta acción no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            try {
              await trackedOrdersService.clearAllTrackedOrders();
              await loadTrackedOrders(); // Recargar para actualizar la UI
              
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error("Error clearing all tracked orders:", error);
              Alert.alert("Error", "No se pudieron eliminar los datos de seguimiento");
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            }
          },
        },
      ]
    );
  }, [trackedOrdersService, loadTrackedOrders]);

  if (trackedOrders.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.foreground }]}>Órdenes seguidas</Text>
        <TouchableOpacity
          onPress={handleClearAllData}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clearButton}
        >
          <IconSymbol name="xmark.circle.fill" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {trackedOrders.map((order) => (
          <TouchableOpacity
            key={order.orderNumber}
            style={[
              styles.orderCard,
              {
                backgroundColor: colors.surface,
                borderColor: order.hasUnreadChanges ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onOrderPress(order.orderNumber)}
            activeOpacity={0.7}
          >
            <View style={styles.orderContent}>
              <View style={styles.orderHeader}>
                <Text style={[styles.clientName, { color: colors.foreground }]}>
                  {order.cliente}
                </Text>
                {order.hasUnreadChanges && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <View style={styles.badgeDot} />
                  </View>
                )}
              </View>
              <View style={styles.orderInfo}>
                <View style={styles.orderInfoRow}>
                  <IconSymbol name="number" size={16} color={colors.muted} />
                  <Text style={[styles.orderNumber, { color: colors.muted }]}>
                    {formatOrderNumber(order.orderNumber)}
                  </Text>
                </View>
                <View style={styles.orderInfoRow}>
                  <IconSymbol name="calendar" size={16} color={colors.muted} />
                  <Text style={[styles.orderDate, { color: colors.muted }]}>
                    {formatDate(order.fecha)}
                  </Text>
                </View>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: 8,
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  clearButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
    maxHeight: 500,
  },
  ordersList: {
    gap: 12,
    paddingBottom: 8,
  },
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  orderContent: {
    flex: 1,
    gap: 8,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  orderInfo: {
    gap: 6,
  },
  orderInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderNumber: {
    fontSize: 14,
  },
  orderDate: {
    fontSize: 14,
  },
});
