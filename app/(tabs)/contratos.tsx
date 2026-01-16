import { PageHeader } from "@/components/page-header";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { PriceService } from "@/lib/price-service";
import type { CategoryGroup } from "@/types/price";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Contratos() {
  const colors = useColors();
  const [priceGroups, setPriceGroups] = useState<CategoryGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const priceService = PriceService.getInstance();

  const loadPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const grouped = await priceService.getPricesGroupedByCategory(false);
      setPriceGroups(grouped);
    } catch (err) {
      console.error("Error loading prices:", err);
      setError("No se pudieron cargar los precios. Verifica tu conexión e intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, [priceService]);

  // Recargar precios cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadPrices();
    }, [loadPrices])
  );

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const handleCategorySelect = (category: string | null) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(category);
  };

  // Filtrar grupos por categoría seleccionada
  const filteredGroups = useMemo(() => {
    if (!selectedCategory) {
      return priceGroups;
    }
    return priceGroups.filter((group) => group.categoria === selectedCategory);
  }, [priceGroups, selectedCategory]);

  // Obtener todas las categorías únicas
  const categories = useMemo(() => {
    return priceGroups.map((group) => group.categoria);
  }, [priceGroups]);

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 8, flexGrow: 1 }}>
        <PageHeader 
          icon="dollarsign.circle.fill"
          title="Lista de Precios"
          subtitle="Consulta nuestros servicios y precios"
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: 12, color: colors.muted }}>
              Cargando precios...
            </ThemedText>
          </View>
        ) : error ? (
          <View style={[styles.errorCard, { backgroundColor: colors.surface, borderColor: colors.error }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.error} />
            <ThemedText style={{ marginTop: 8, color: colors.error }}>{error}</ThemedText>
          </View>
        ) : priceGroups.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={{ color: colors.muted }}>
              No hay precios disponibles en este momento.
            </ThemedText>
          </View>
        ) : (
          <View>
            {/* Badges de categorías */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.badgesContainer}
              contentContainerStyle={styles.badgesContent}
            >
              <TouchableOpacity
                onPress={() => handleCategorySelect(null)}
                activeOpacity={0.7}
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: selectedCategory === null ? colors.primary : colors.surface,
                    borderColor: selectedCategory === null ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: selectedCategory === null ? "#ffffff" : colors.foreground,
                    },
                  ]}
                >
                  Todas
                </Text>
              </TouchableOpacity>

              {categories.map((category, index) => {
                const isSelected = selectedCategory === category;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleCategorySelect(category)}
                    activeOpacity={0.7}
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: isSelected ? "#ffffff" : colors.foreground,
                        },
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Lista de productos filtrados */}
            {filteredGroups.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 24 }]}>
                <ThemedText style={{ color: colors.muted }}>
                  No hay productos en esta categoría.
                </ThemedText>
              </View>
            ) : (
              <>
                {filteredGroups.map((group, groupIndex) => (
                  <View key={groupIndex} style={{ marginBottom: 24 }}>
                    <View style={styles.categoryHeader}>
                      <ThemedText type="subtitle" style={[styles.categoryTitle, { color: colors.primary }]}>
                        {group.categoria}
                      </ThemedText>
                    </View>

                    {group.productos.map((product, productIndex) => (
                      <View
                        key={productIndex}
                        style={[
                          styles.productCard,
                          { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                        ]}
                      >
                        <View style={styles.productHeader}>
                          <ThemedText type="defaultSemiBold" style={styles.productName}>
                            {product.producto}
                          </ThemedText>
                          <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.priceText}>{formatPrice(product.precio)}</Text>
                          </View>
                        </View>

                        {product.descripcion && (
                          <ThemedText style={[styles.productDescription, { color: colors.muted }]}>
                            {product.descripcion}
                          </ThemedText>
                        )}

                        {/* Lista de productos incluidos */}
                        {product.productos && 
                         Array.isArray(product.productos) && 
                         product.productos.length > 0 && (
                          <View style={[styles.productItemsContainer, { borderTopColor: colors.border }]}>
                            <View style={styles.productItemsHeader}>
                              <IconSymbol name="shippingbox.fill" size={18} color={colors.primary} />
                              <ThemedText type="defaultSemiBold" style={[styles.productItemsTitle, { color: colors.foreground }]}>
                                Incluye:
                              </ThemedText>
                            </View>
                            <View style={styles.productItemsList}>
                              {product.productos.map((item, itemIndex) => (
                                <View
                                  key={itemIndex}
                                  style={[styles.productItemBadge, { backgroundColor: colors.primary }]}
                                >
                                  <Text style={styles.productItemBadgeText}>
                                    {item.nombre} {item.cantidad > 1 ? `(x${item.cantidad})` : ''}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  categoryHeader: {
    marginBottom: 12,
    paddingBottom: 8,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  productCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productName: {
    flex: 1,
    fontSize: 16,
    marginRight: 12,
  },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  priceText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  productItemsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  productItemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  productItemsTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  productItemsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  productItemBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  productItemBadgeText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  errorCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 24,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 24,
  },
  badgesContainer: {
    marginBottom: 20,
  },
  badgesContent: {
    paddingRight: 8,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
