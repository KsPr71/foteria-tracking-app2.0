import { PageHeader } from "@/components/page-header";
import { ScreenContainer } from "@/components/screen-container";
import { TrackedOrdersList } from "@/components/tracked-orders-list";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatOrderNumber, isOrderNumberComplete } from "@/lib/order-mask";
import { OrderService } from "@/lib/order-service";
import { TrackedOrdersService } from "@/lib/tracked-orders-service";
import type { Order } from "@/types/order";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const SUPABASE_ORDERS_URL =
  "https://vzpulvvkhralddzwthap.supabase.co/storage/v1/object/public/ordenes/datos-ordenes.json";
const SUPABASE_PRICES_URL =
  "https://vzpulvvkhralddzwthap.supabase.co/storage/v1/object/public/ordenes/precios.json";

export default function HomeScreen() {
  const colors = useColors();
  const [orderNumber, setOrderNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [fechaFin, setFechaFin] = useState<string | null>(null);

  const orderService = OrderService.getInstance();
  const trackedOrdersService = TrackedOrdersService.getInstance();

  // Obtener fecha de actualización
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Obtener fecha de órdenes
        const ordersRes = await fetch(SUPABASE_ORDERS_URL);
        let ordersDate: string | null = null;
        if (ordersRes.ok) {
          const ordersJson = await ordersRes.json();
          ordersDate = ordersJson?.metadata?.filtros_aplicados?.fecha_fin ?? null;
        }

        // Obtener fecha de precios
        const pricesRes = await fetch(SUPABASE_PRICES_URL);
        let pricesDate: string | null = null;
        if (pricesRes.ok) {
          const pricesJson = await pricesRes.json();
          const fechaGen = pricesJson?.metadata?.fecha_generacion;
          if (fechaGen) {
            pricesDate = fechaGen.split("T")[0];
          }
        }

        // Usar la fecha más reciente
        let fechaActualizada: string | null = ordersDate;
        if (ordersDate && pricesDate) {
          const ordersDateObj = new Date(ordersDate);
          const pricesDateObj = new Date(pricesDate);
          fechaActualizada = ordersDateObj >= pricesDateObj ? ordersDate : pricesDate;
        } else if (pricesDate) {
          fechaActualizada = pricesDate;
        }

        if (mounted && fechaActualizada) {
          setFechaFin(fechaActualizada);
        }
      } catch (e) {
        // ignore fetch errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Formatear fecha para el subtítulo
  const formattedDate = (() => {
    if (!fechaFin) return "Busca y registra tus ordenes";
    try {
      const fechaParts = String(fechaFin).split("-");
      if (fechaParts.length === 3) {
        const year = parseInt(fechaParts[0], 10);
        const month = parseInt(fechaParts[1], 10) - 1;
        const day = parseInt(fechaParts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          const formatted = d.toLocaleDateString("es-ES", { 
            day: "numeric", 
            month: "long", 
            year: "numeric",
          });
          return `Actualizado: ${formatted}`;
        }
      }
      const d = new Date(fechaFin);
      if (!isNaN(d.getTime())) {
        const formatted = d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
        return `Actualizado: ${formatted}`;
      }
    } catch (e) {
      // fallback
    }
    return "Busca y registra tus ordenes";
  })();

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      setError("Por favor ingresa un número de orden");
      return;
    }

    // Validar formato completo
    if (!isOrderNumberComplete(orderNumber)) {
      setError("Ingresa el número completo: XXXXX-XXX-XXXX");
      return;
    }

    setIsSearching(true);
    setError(null);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Limpiar caché en memoria antes de buscar para asegurar datos frescos
      orderService.clearMemoryCache();
      
      // Agregar "Orden" al inicio para buscar
      const fullOrderNumber = `Orden ${orderNumber}`;
      // Forzar refresh para obtener los datos más recientes del servidor
      const order = await orderService.findOrder(fullOrderNumber, true);

      if (order) {
        setFoundOrder(order);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setError("Orden no encontrada. Verifica el número e intenta nuevamente.");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err) {
      console.error("Error searching order:", err);
      setError("Error al buscar la orden. Verifica tu conexión e intenta nuevamente.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleNewSearch = () => {
    setFoundOrder(null);
    setOrderNumber("");
    setError(null);
  };


  const handleTrackedOrderPress = useCallback(async (orderNumber: string) => {
    setIsSearching(true);
    setError(null);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Limpiar caché en memoria antes de buscar para asegurar datos frescos
      orderService.clearMemoryCache();
      
      // Buscar la orden (forzar refresh para obtener los datos más recientes)
      const order = await orderService.findOrder(orderNumber, true);

      if (order) {
        setFoundOrder(order);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setError("Orden no encontrada. Verifica el número e intenta nuevamente.");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err) {
      console.error("Error searching order:", err);
      setError("Error al buscar la orden. Verifica tu conexión e intenta nuevamente.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSearching(false);
    }
  }, [orderService]);

  // Si se encontró una orden, mostrar el tracking
  if (foundOrder) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <TrackingTimeline order={foundOrder} onNewSearch={handleNewSearch} />
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Pantalla de búsqueda
  return (
    <ScreenContainer className="p-4">
      <View style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <PageHeader 
            icon="magnifyingglass"
            title="Tracking de Pedidos"
            subtitle={formattedDate}
          />

          {/* Formulario de búsqueda */}
          <View style={styles.searchForm}>
            <View style={styles.labelContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>Número de orden</Text>
              <TouchableOpacity
                onPress={() => setShowHelpModal(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <IconSymbol name="questionmark.circle" size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchRow}>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Número de Orden"
                  placeholderTextColor={colors.muted}
                  value={orderNumber}
                  onChangeText={(text) => {
                    const formatted = formatOrderNumber(text);
                    setOrderNumber(formatted);
                    setError(null);
                  }}
                  keyboardType="numeric"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                  editable={!isSearching}
                  maxLength={14}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.searchButtonInline,
                  { 
                    backgroundColor: colors.primary,
                    borderColor: error ? colors.error : colors.border,
                  },
                  isSearching && styles.searchButtonDisabled,
                ]}
                onPress={handleSearch}
                disabled={isSearching}
                activeOpacity={0.8}
              >
                {isSearching ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <IconSymbol name="magnifyingglass" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}
          </View>

          {/* Modal de ayuda */}
          <Modal
            visible={showHelpModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowHelpModal(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowHelpModal(false)}
            >
              <TouchableOpacity
                style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.foreground }]}>¿Cómo buscar tu orden?</Text>
                  <TouchableOpacity
                    onPress={() => setShowHelpModal(false)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <IconSymbol name="xmark.circle.fill" size={24} color={colors.muted} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalText, { color: colors.muted }]}>
                  Ingresa el número de orden que recibiste al finalizar tu sesión fotográfica. El formato es:{" "}
                  <Text style={{ fontWeight: "600", color: colors.foreground }}>XXXXX-XXX-XXXX</Text>
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* Órdenes seguidas */}
          <TrackedOrdersList onOrderPress={handleTrackedOrderPress} />
        </View>
      </View>
      
    </ScreenContainer>
  );
}

export const styles = StyleSheet.create({
  searchContainer: {
    gap: 24,
  },
  searchForm: {
    gap: 12,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  searchRow: {
    flexDirection: "row",
    gap: 0,
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderRightWidth: 0,
    minHeight: 48,
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    paddingVertical: 0,
  },
  searchButtonInline: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderLeftWidth: 0,
  },
  errorContainer: {
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
