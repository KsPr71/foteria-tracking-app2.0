import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

interface PageHeaderProps {
  icon?: string;
  iconSize?: number;
  title?: string;
  subtitle?: string;
}

export function PageHeader({ icon, iconSize = 42, title, subtitle }: PageHeaderProps) {
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const isDarkMode = colorScheme === "dark";

  const handleAdminAccess = () => {
    router.push("/admin");
  };

  const handleAboutPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/modal");
  };

  const handleToggleTheme = (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setColorScheme(value ? "dark" : "light");
  };

  return (
    <View style={styles.container}>
      {/* Header compartido: La Fotería + Switch + Botón */}
      <View style={styles.sharedHeader}>
        <Text style={[styles.brand, { color: colors.primary }]}>La Fotería</Text>
        <View style={styles.headerActions}>
          <View style={styles.themeSwitchContainer}>
            <IconSymbol 
              name={isDarkMode ? "moon.fill" : "sun.max.fill"} 
              size={18} 
              color={colors.muted} 
            />
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === "ios" ? "#ffffff" : colors.surface}
              ios_backgroundColor={colors.border}
            />
          </View>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleAboutPress}
            activeOpacity={0.7}
          >
            <IconSymbol name="info.circle.fill" size={24} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleAdminAccess}
            activeOpacity={0.7}
          >
            <IconSymbol name="gearshape.fill" size={24} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Header específico de la página: Icono + Título */}
      {icon && (title || subtitle) && (
        <View style={styles.pageHeader}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
            <IconSymbol name={icon as any} size={iconSize} color="#fff" />
          </View>
          <View style={styles.pageHeaderContent}>
            {title && <Text style={[styles.pageTitle, { color: colors.primary }]}>{title}</Text>}
            {subtitle && <Text style={[styles.pageSubtitle, { color: colors.muted }]}>{subtitle}</Text>}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  sharedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  themeSwitchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  pageHeaderContent: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
  },
});
