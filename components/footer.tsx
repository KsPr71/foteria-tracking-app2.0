import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

export function Footer() {
  const colors = useColors();
  const currentYear = new Date().getFullYear();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.muted }]}>
        © {currentYear} La Fotería. Todos los derechos reservados.
      </Text>
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
});
