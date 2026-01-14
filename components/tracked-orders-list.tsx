import { TrackedOrdersService } from "@/lib/tracked-orders-service";
import type { TrackedOrder } from "@/lib/tracked-orders-service";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";

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

  if (trackedOrders.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>Órdenes seguidas</Text>
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
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContainer: {
    flex: 1,
    maxHeight: 300,
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
