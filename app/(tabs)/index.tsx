import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Footer } from "@/components/footer";
import { useColors } from "@/hooks/use-colors";
import { OrderService } from "@/lib/order-service";
import { formatOrderNumber, isOrderNumberComplete } from "@/lib/order-mask";
import type { Order } from "@/types/order";
import { router } from "expo-router";

export default function HomeScreen() {
  const colors = useColors();
  const [orderNumber, setOrderNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderService = OrderService.getInstance();

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
      // Agregar "Orden" al inicio para buscar
      const fullOrderNumber = `Orden ${orderNumber}`;
      const order = await orderService.findOrder(fullOrderNumber);

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

  const handleAdminAccess = () => {
    router.push("/admin");
  };

  const handleRefreshData = async () => {
    setIsSearching(true);
    try {
      await orderService.clearCache();
      Alert.alert("Éxito", "Datos actualizados correctamente");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron actualizar los datos");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Si se encontró una orden, mostrar el tracking
  if (foundOrder) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <TrackingTimeline order={foundOrder} onNewSearch={handleNewSearch} />
        </ScrollView>
        <Footer />
      </ScreenContainer>
    );
  }

  // Pantalla de búsqueda
  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.searchContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.logo, { color: colors.primary }]}>La Fotería</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>Tracking de Pedidos</Text>
            </View>
            <TouchableOpacity
              style={[styles.adminButton, { backgroundColor: colors.surface }]}
              onPress={handleAdminAccess}
              activeOpacity={0.7}
            >
              <IconSymbol name="gearshape.fill" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Formulario de búsqueda */}
          <View style={styles.searchForm}>
            <Text style={[styles.label, { color: colors.foreground }]}>Número de orden</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border },
              ]}
            >
              <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="01005-001-0003"
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

            {error && (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.searchButton,
                { backgroundColor: colors.primary },
                isSearching && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={isSearching}
              activeOpacity={0.8}
            >
              {isSearching ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <IconSymbol name="magnifyingglass" size={20} color="#ffffff" />
                  <Text style={styles.searchButtonText}>Buscar orden</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Botón de actualizar datos */}
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.primary }]}
            onPress={handleRefreshData}
            disabled={isSearching}
            activeOpacity={0.8}
          >
            <IconSymbol name="arrow.clockwise" size={18} color="#ffffff" />
            <Text style={styles.refreshButtonText}>Actualizar datos</Text>
          </TouchableOpacity>

          {/* Ayuda */}
          <View style={[styles.helpCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.helpTitle, { color: colors.foreground }]}>¿Cómo buscar tu orden?</Text>
            <Text style={[styles.helpText, { color: colors.muted }]}>
              Ingresa el número de orden que recibiste al finalizar tu sesión fotográfica. El formato es:{" "}
              <Text style={{ fontWeight: "600" }}>XXXXX-XXX-XXXX</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
      <Footer />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
  },
  headerContent: {
    flex: 1,
  },
  logo: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  adminButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  searchForm: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: -8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  errorContainer: {
    marginTop: -8,
  },
  errorText: {
    fontSize: 14,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  helpCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
