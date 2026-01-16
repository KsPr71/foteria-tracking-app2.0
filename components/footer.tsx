import { useColors } from "@/hooks/use-colors";
import { FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function Footer() {
  const colors = useColors();
  const currentYear = new Date().getFullYear();

  const handleSocialPress = (url: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url).catch((err) => {
      console.error("Error opening URL:", err);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.muted }]}>© {currentYear} La Fotería. Todos los derechos reservados.</Text>
      
      {/* Iconos de redes sociales */}
      <View style={styles.socialIcons}>
        <TouchableOpacity
          onPress={() => handleSocialPress("https://www.facebook.com/foteriaestudio")}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome name="facebook" size={16} color={colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSocialPress("https://x.com/Foteria_estudio")}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome name="twitter" size={16} color={colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSocialPress("https://www.instagram.com/la_foteria_fotostudio/")}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome name="instagram" size={16} color={colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSocialPress("https://lafoteria-gallery.mypixieset.com/")}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome name="globe" size={16} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    alignItems: "center",
    marginTop: 24,
  },
  text: {
    fontSize: 12,
    textAlign: "center",
  },
  socialIcons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
});
