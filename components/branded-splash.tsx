import Constants from "expo-constants";
import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const DISPLAY_DURATION = 900;
const FADE_DURATION = 250;

export function BrandedSplash({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const isDark = useColorScheme() === "dark";
  const appName = Constants.expoConfig?.name ?? "La Fotería Tracking";
  const appVersion = Constants.expoConfig?.version ?? "2.0.0";

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(onFinish);
    }, DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, [onFinish, opacity]);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#ffffff", opacity },
      ]}
    >
      <View style={styles.brand}>
        <Image
          source={require("@/assets/images/android-icon-foreground.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={[styles.appName, { color: isDark ? "#ffffff" : "#11181c" }]}>
          {appName}
        </Text>
        <Text style={[styles.version, { color: isDark ? "#9ba1a6" : "#687076" }]}>
          Versión {appVersion}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    alignItems: "center",
  },
  logo: {
    width: 250,
    height: 250,
  },
  appName: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "700",
  },
  version: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
  },
});
