import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useMemo } from "react";
import { Linking, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PHONE = "5352708602"; // nacional sin +56 style, user requested +5352708602
const MESSAGE = "Hola, necesito ayuda con mi orden";

export function WhatsAppButton() {
  const encoded = useMemo(() => encodeURIComponent(MESSAGE), []);
  const insets = useSafeAreaInsets();
  
  // Calcular posición: tab bar (56px) + padding (12 web, insets.bottom mobile) + footer height aproximado (90px) + espacio (32px para más espacio)
  const tabBarHeight = 56 + (Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8));
  const footerHeight = 40; // Aproximado: padding + contenido
  const spacing = 10; // Aumentado de 16 a 32 para bajar más el botón
  const bottomPosition = tabBarHeight + footerHeight + spacing;

  const openChat = async () => {
    // Try the native whatsapp scheme first, then fallback to web wa.me
    const native = `whatsapp://send?phone=${PHONE}&text=${encoded}`;
    const web = `https://wa.me/${PHONE}?text=${encoded}`;

    try {
      const supported = await Linking.canOpenURL(native);
      if (supported) {
        await Linking.openURL(native);
        return;
      }
    } catch (e) {
      // ignore and fallback
    }

    // fallback to web link
    try {
      await Linking.openURL(web);
    } catch (e) {
      // nothing we can do if even the web link fails
      console.warn("Failed to open WhatsApp link", e);
    }
  };

  return (
    <View style={[styles.container, { bottom: bottomPosition }]} pointerEvents="box-none">
      <TouchableOpacity
        accessibilityLabel="Contactar por WhatsApp"
        activeOpacity={0.85}
        onPress={openChat}
        style={styles.button}
      >
        <FontAwesome name="whatsapp" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    zIndex: 80,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});
