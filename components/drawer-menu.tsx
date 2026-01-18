import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { updateBackgroundFetchInterval } from "@/lib/background-tasks";
import { useThemeContext } from "@/lib/theme-provider";
import { TrackedOrdersService } from "@/lib/tracked-orders-service";
import { FontAwesome } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const APP_NAME = Constants.expoConfig?.name ?? "La Fotería Tracking";
const PHONE_NUMBER = "+5353710376";
const EMAIL = "foteriaestudio@gmail.com";

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const isDarkMode = colorScheme === "dark";
  const translateX = useSharedValue(-300);
  const [shouldRender, setShouldRender] = useState(false);
  const insets = useSafeAreaInsets();

  // Intervalo de actualización
  const [updateInterval, setUpdateInterval] = useState(15);
  const intervalOptions = [15, 60, 180, 360, 720, 1440]; // 15m, 1h, 3h, 6h, 12h, 24h

  useEffect(() => {
    TrackedOrdersService.getInstance().getUpdateInterval().then(setUpdateInterval);
  }, []);

  const getIntervalLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? "hora" : "horas"}`;
  };

  const getCurrentStepIndex = () => {
    const index = intervalOptions.indexOf(updateInterval);
    return index >= 0 ? index : 0;
  };

  const handleIntervalChange = (value: number) => {
    const minutes = intervalOptions[Math.round(value)];
    setUpdateInterval(minutes);
  };

  const handleIntervalComplete = async (value: number) => {
    const minutes = intervalOptions[Math.round(value)];
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await TrackedOrdersService.getInstance().setUpdateInterval(minutes);
    await updateBackgroundFetchInterval();
  };

  // Animar entrada/salida del drawer
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const backdropOpacity = useSharedValue(0);

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  // Efecto para mostrar/ocultar drawer
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Pequeño delay para asegurar que el componente está montado
      setTimeout(() => {
        translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
        backdropOpacity.value = withSpring(0.5, { damping: 20, stiffness: 90 });
      }, 0);
    } else if (shouldRender) {
      // Solo animar si ya está renderizado
      // Usar withTiming con easing suave para el cierre para evitar brusquedad
      translateX.value = withTiming(-300, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      });
      backdropOpacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      }, () => {
        runOnJS(setShouldRender)(false);
      });
    }
  }, [visible, shouldRender, translateX, backdropOpacity]);

  const handleBackdropPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  // Gestura de swipe para cerrar
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = event.translationX;
        backdropOpacity.value = 0.5 + event.translationX / 600;
      }
    })
    .onEnd((event) => {
      if (event.translationX < -100) {
        translateX.value = withTiming(-300, {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        });
        backdropOpacity.value = withTiming(0, {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        });
        runOnJS(onClose)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
        backdropOpacity.value = withSpring(0.5, { damping: 20, stiffness: 90 });
      }
    });

  const handleToggleTheme = (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setColorScheme(value ? "dark" : "light");
  };

  const handleSocialPress = (url: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url).catch((err) => {
      console.error("Error opening URL:", err);
    });
  };

  const handleNavigate = (path: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
    router.push(path as any);
  };

  const handleContact = (type: "email" | "phone" | "whatsapp") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    let url = "";
    switch (type) {
      case "email":
        url = `mailto:${EMAIL}`;
        break;
      case "phone":
        url = `tel:${PHONE_NUMBER}`;
        break;
      case "whatsapp":
        url = `https://wa.me/${PHONE_NUMBER.replace(/\+/g, "")}`;
        break;
    }
    Linking.openURL(url).catch((err) => {
      console.error("Error opening URL:", err);
    });
  };

  if (!shouldRender) return null;

  return (
    <Modal visible={shouldRender} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container} pointerEvents="box-none">
        {/* Backdrop - Captura toques para cerrar */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={StyleSheet.absoluteFill}>
            <Animated.View style={[styles.backdrop, backdropStyle]} />
          </View>
        </TouchableWithoutFeedback>

        {/* Drawer */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.drawer,
              { backgroundColor: colors.background, borderRightColor: colors.border },
              animatedStyle,
            ]}
            pointerEvents="box-none"
          >
            <View
              style={[
                styles.drawerContent,
                {
                  paddingTop: Math.max(insets.top, 20),
                  paddingBottom: Math.max(insets.bottom, 20)
                }
              ]}
              pointerEvents="auto"
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="info.circle.fill" size={32} color="#fff" />
                </View>
                <View style={styles.headerContent}>
                  <Text style={[styles.brand, { color: colors.primary }]}>La Fotería</Text>
                  <Text style={[styles.version, { color: colors.muted }]}>{APP_VERSION}</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: colors.surface }]}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="xmark" size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* Scrollable Content */}
              <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Configuración */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Configuración</Text>
                  <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.settingRow}>
                      <View style={styles.settingLeft}>
                        <IconSymbol
                          name={isDarkMode ? "moon.fill" : "sun.max.fill"}
                          size={22}
                          color={colors.primary}
                        />
                        <View style={styles.settingContent}>
                          <Text style={[styles.settingLabel, { color: colors.foreground }]}>Tema</Text>
                          <Text style={[styles.settingDescription, { color: colors.muted }]}>
                            {isDarkMode ? "Modo oscuro" : "Modo claro"}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={isDarkMode}
                        onValueChange={handleToggleTheme}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={Platform.OS === "ios" ? "#ffffff" : colors.surface}
                        ios_backgroundColor={colors.border}
                      />
                    </View>

                    {/* Separator */}
                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

                    {/* Update Interval */}
                    <View style={styles.settingRow}>
                      <View style={styles.settingLeft}>
                        <IconSymbol name="clock.fill" size={22} color={colors.primary} />
                        <View style={styles.settingContent}>
                          <Text style={[styles.settingLabel, { color: colors.foreground }]}>Actualización</Text>
                          <Text style={[styles.settingDescription, { color: colors.muted }]}>
                            Cada {getIntervalLabel(updateInterval)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
                      <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={0}
                        maximumValue={intervalOptions.length - 1}
                        step={1}
                        value={getCurrentStepIndex()}
                        onValueChange={handleIntervalChange}
                        onSlidingComplete={handleIntervalComplete}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor={colors.border}
                        thumbTintColor={colors.primary}
                      />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                        <Text style={{ fontSize: 10, color: colors.muted }}>15m</Text>
                        <Text style={{ fontSize: 10, color: colors.muted }}>24h</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Navegación */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Navegación</Text>
                  <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleNavigate("/contratos")}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="dollarsign.circle.fill" size={22} color={colors.primary} />
                    <Text style={[styles.menuItemText, { color: colors.foreground }]}>Ofertas</Text>
                    <IconSymbol name="chevron.right" size={18} color={colors.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleNavigate("/FAQ")}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="questionmark.circle.fill" size={22} color={colors.primary} />
                    <Text style={[styles.menuItemText, { color: colors.foreground }]}>FAQ</Text>
                    <IconSymbol name="chevron.right" size={18} color={colors.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleNavigate("/modal")}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="info.circle.fill" size={22} color={colors.primary} />
                    <Text style={[styles.menuItemText, { color: colors.foreground }]}>Acerca de</Text>
                    <IconSymbol name="chevron.right" size={18} color={colors.muted} />
                  </TouchableOpacity>
                </View>

                {/* Contacto */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contacto</Text>
                  <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TouchableOpacity style={styles.contactRow} onPress={() => handleContact("email")} activeOpacity={0.7}>
                      <IconSymbol name="envelope.fill" size={20} color={colors.primary} />
                      <Text style={[styles.contactText, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">{EMAIL}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactRow} onPress={() => handleContact("phone")} activeOpacity={0.7}>
                      <IconSymbol name="phone.fill" size={20} color={colors.primary} />
                      <Text style={[styles.contactText, { color: colors.foreground }]}>+53 5371 0376</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.contactRow}
                      onPress={() => handleContact("whatsapp")}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="whatsapp" size={20} color="#25D366" />
                      <Text style={[styles.contactText, { color: "#25D366" }]}>WhatsApp</Text>
                    </TouchableOpacity>
                    <View style={styles.contactRow}>
                      <IconSymbol name="mappin.circle.fill" size={20} color={colors.muted} />
                      <Text style={[styles.contactText, { color: colors.muted }]} numberOfLines={2}>
                        Calle Ignacio Agramonte nº 110
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Redes Sociales */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Redes Sociales</Text>
                  <View style={[styles.socialCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.socialIcons}>
                      <TouchableOpacity
                        onPress={() => handleSocialPress("https://www.facebook.com/foteriaestudio")}
                        style={[styles.socialIconButton, { backgroundColor: colors.background }]}
                        activeOpacity={0.7}
                      >
                        <FontAwesome name="facebook" size={24} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleSocialPress("https://x.com/Foteria_estudio")}
                        style={[styles.socialIconButton, { backgroundColor: colors.background }]}
                        activeOpacity={0.7}
                      >
                        <FontAwesome name="twitter" size={24} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleSocialPress("https://www.instagram.com/la_foteria_fotostudio/")}
                        style={[styles.socialIconButton, { backgroundColor: colors.background }]}
                        activeOpacity={0.7}
                      >
                        <FontAwesome name="instagram" size={24} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleSocialPress("https://lafoteria-gallery.mypixieset.com/")}
                        style={[styles.socialIconButton, { backgroundColor: colors.background }]}
                        activeOpacity={0.7}
                      >
                        <FontAwesome name="globe" size={24} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Copyright - Fixed at bottom */}
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Text style={[styles.copyright, { color: colors.muted }]} numberOfLines={2}>
                  © {new Date().getFullYear()} La Fotería. Todos los derechos reservados.
                </Text>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    borderRightWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
  },
  brand: {
    fontSize: 20,
    fontWeight: "700",
  },
  version: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  contactCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
  },
  socialCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  socialIcons: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  socialIconButton: {
    width: 28,
    height: 28,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingVertical: 6,
    paddingBottom: 30,
    alignItems: "center",
    borderTopWidth: 1,
  },
  copyright: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
});
