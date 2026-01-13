import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const APP_VERSION = "1.2.0";
const APP_NAME = "La Fotería Tracking";

export default function AboutModal() {
  const colors = useColors();
  const currentYear = new Date().getFullYear();

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 8, flexGrow: 1 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
            <IconSymbol name="info.circle" size={42} color="#fff" />
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.brand, { color: colors.primary }]}>La Fotería</Text>
            <ThemedText type="title">Acerca de</ThemedText>
            <ThemedText type="subtitle">Información de la aplicación</ThemedText>
          </View>
        </View>

        {/* App Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <IconSymbol name="app.fill" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <ThemedText type="defaultSemiBold">Aplicación</ThemedText>
              <ThemedText>{APP_NAME}</ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <IconSymbol name="number" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <ThemedText type="defaultSemiBold">Versión</ThemedText>
              <ThemedText>{APP_VERSION}</ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <IconSymbol name="camera.fill" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <ThemedText type="defaultSemiBold">Descripción</ThemedText>
              <ThemedText>
                Aplicación para el seguimiento de pedidos fotográficos. Consulta el estado de tu orden en tiempo real.
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Contact Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Contacto</ThemedText>
          
          <View style={styles.contactRow}>
            <IconSymbol name="envelope.fill" size={20} color={colors.muted} />
            <ThemedText style={styles.contactText}>foteriaestudio@gmail.com</ThemedText>
          </View>

          <View style={styles.contactRow}>
            <IconSymbol name="phone.fill" size={20} color={colors.muted} />
            <ThemedText style={styles.contactText}>+53 5371 0376</ThemedText>
          </View>

          <View style={styles.contactRow}>
            <IconSymbol name="mappin.circle.fill" size={20} color={colors.muted} />
            <ThemedText style={styles.contactText}>
              Calle Ignacio Agramonte nº 110, entre Palma y Verges
            </ThemedText>
          </View>
        </View>

        {/* Copyright Card */}
        <View style={[styles.copyrightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText style={[styles.copyrightText, { color: colors.muted }]}>
            © {currentYear} La Fotería. Todos los derechos reservados.
          </ThemedText>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.primary }]}
          onPress={handleClose}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.closeButtonText}>Cerrar</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  brand: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
  },
  copyrightCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: "center",
  },
  copyrightText: {
    fontSize: 12,
    textAlign: "center",
  },
  closeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
