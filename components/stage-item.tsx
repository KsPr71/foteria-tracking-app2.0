import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { Stage } from "@/types/order";

interface StageItemProps {
  stage: Stage;
  status: "completed" | "current" | "pending";
  isLast: boolean;
  index: number;
}

export function StageItem({ stage, status, isLast, index }: StageItemProps) {
  const colors = useColors();
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);
  const scale = useSharedValue(1);

  // Animación de entrada
  useEffect(() => {
    const delay = index * 100;
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      translateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    }, delay);
  }, [index]);

  // Animación de pulso para etapa actual
  useEffect(() => {
    if (status === "current") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getIconName = (icon: string): any => {
    const iconMap: Record<string, any> = {
      camera: "camera.fill",
      folder: "folder.fill",
      edit: "pencil",
      print: "printer.fill",
      package: "shippingbox.fill",
      "check-circle": "checkmark.circle.fill",
    };
    return iconMap[icon] || "checkmark.circle.fill";
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return colors.success;
      case "current":
        return colors.primary;
      case "pending":
        return colors.muted;
      default:
        return colors.muted;
    }
  };

  const statusColor = getStatusColor();

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.leftColumn}>
        <Animated.View
          style={[
            styles.circle,
            { backgroundColor: statusColor, borderColor: statusColor },
            circleAnimatedStyle,
          ]}
        >
          <IconSymbol
            name={getIconName(stage.icon)}
            size={20}
            color={status === "pending" ? colors.background : "#ffffff"}
          />
        </Animated.View>
        {!isLast && <View style={[styles.line, { backgroundColor: colors.border }]} />}
      </View>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: status === "pending" ? colors.muted : colors.foreground },
          ]}
        >
          {stage.title}
        </Text>
        <Text style={[styles.description, { color: colors.muted }]}>{stage.description}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 8,
  },
  leftColumn: {
    alignItems: "center",
    marginRight: 16,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  line: {
    width: 3,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  content: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
