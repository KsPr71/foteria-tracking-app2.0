import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { FontAwesome } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const APP_NAME = Constants.expoConfig?.name ?? "La Fotería Tracking";
const PHONE_NUMBER = "+5353710376";
const EMAIL = "foteriaestudio@gmail.com";

export default function AboutModal() {
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const currentYear = new Date().getFullYear();
  const isDarkMode = colorScheme === "dark";

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleToggleTheme = (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setColorScheme(value ? "dark" : "light");
  };
  const handleAdminAccess = () => {
    router.push("/admin");
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
                Aplicación para el seguimiento de pedidos fotográficos del estudio La Fotería. Consulta el estado de tu orden en tiempo real.
              </ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <IconSymbol name={isDarkMode ? "moon.fill" : "sun.max.fill"} size={24} color={colors.primary} />
              <View style={styles.infoContent}>
              <ThemedText type="defaultSemiBold">Tema</ThemedText>
              <View style={styles.themeRow}>
                <ThemedText style={{ flexShrink: 1 }}>{isDarkMode ? "Modo oscuro" : "Modo claro"}</ThemedText>
                <Switch
                  value={isDarkMode}
                  onValueChange={handleToggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={Platform.OS === "ios" ? "#ffffff" : colors.surface}
                  ios_backgroundColor={colors.border}
                  style={{ marginLeft: 12 }}
                />

              </View>
            </View>
          </View>
        </View>
        

        {/* Contact Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Contacto</ThemedText>
          
          <TouchableOpacity 
            style={styles.contactRow}
            onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
            activeOpacity={0.7}
          >
            <IconSymbol name="envelope.fill" size={20} color={colors.primary} />
            <ThemedText style={[styles.contactText, { color: colors.primary }]}>{EMAIL}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactRow}
            onPress={() => Linking.openURL(`tel:${PHONE_NUMBER}`)}
            activeOpacity={0.7}
          >
            <IconSymbol name="phone.fill" size={20} color={colors.primary} />
            <ThemedText style={[styles.contactText, { color: colors.primary }]}>+53 5371 0376</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactRow}
            onPress={() => Linking.openURL(`https://wa.me/${PHONE_NUMBER.replace(/\+/g, "")}`)}
            activeOpacity={0.7}
          >
            <FontAwesome name="whatsapp" size={20} color="#25D366" />
            <ThemedText style={[styles.contactText, { color: "#25D366" }]}>WhatsApp</ThemedText>
          </TouchableOpacity>

          <View style={styles.contactRow}>
            <IconSymbol name="mappin.circle.fill" size={20} color={colors.muted} />
            <ThemedText style={styles.contactText}>
              Calle Ignacio Agramonte nº 110, entre Palma y Verges
            </ThemedText>
          </View>
        </View>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
           
              <View style={styles.infoContent}>
              <ThemedText type="defaultSemiBold">Acceso</ThemedText>
              <View style={styles.themeRow}>
                <ThemedText style={{ flexShrink: 1 }}>{"Administrador" }</ThemedText>
                <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleAdminAccess}
            activeOpacity={0.7}
          >
            <IconSymbol name="gearshape.fill" size={24} color={colors.muted} />
          </TouchableOpacity>            

              </View>
            </View>
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
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
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
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    width: "100%",
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
