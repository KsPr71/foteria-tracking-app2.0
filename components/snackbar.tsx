import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "./ui/icon-symbol";

interface SnackbarProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function Snackbar({ message, visible, onDismiss, duration = 6000 }: SnackbarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    console.log("Snackbar visible changed:", visible, "message:", message);
    if (visible) {
      // Retrasar la aparición del snackbar (500ms de delay)
      const showTimer = setTimeout(() => {
        setShowSnackbar(true);
        // Animar entrada después del delay
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, 500);

      // Auto-dismiss después de la duración (incluyendo el delay)
      const dismissTimer = setTimeout(() => {
        handleDismiss();
      }, duration + 500);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(dismissTimer);
      };
    } else {
      setShowSnackbar(false);
      handleDismiss();
    }
  }, [visible, message, duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible || !showSnackbar) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingTop: Math.max(insets.top, 16),
        },
      ]}
      pointerEvents={visible && showSnackbar ? "auto" : "none"}
    >
      <View style={[styles.snackbar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
        <Text style={[styles.message, { color: colors.foreground }]}>{message}</Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <IconSymbol name="xmark" size={18} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        paddingTop: 0, // Se ajustará con insets
      },
      android: {
        paddingTop: 0, // Se ajustará con insets
      },
      default: {
        paddingTop: 16,
      },
    }),
  },
  snackbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
});
