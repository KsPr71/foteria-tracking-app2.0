import { View, Text } from "react-native";
import Animated, { withTiming, useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useEffect } from "react";
import { useColors } from "@/hooks/use-colors";

interface ProgressBarProps {
  progress: number; // 0-1
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  const colors = useColors();
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 600 });
  }, [progress, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
    };
  });

  const percentage = Math.round(progress * 100);

  return (
    <View style={{ gap: 8 }}>
      {label && (
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
          {label}
        </Text>
      )}
      <View
        style={{
          height: 8,
          backgroundColor: colors.border,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            {
              height: "100%",
              backgroundColor: colors.primary,
              borderRadius: 4,
            },
            animatedStyle,
          ]}
        />
      </View>
      <Text style={{ color: colors.muted, fontSize: 12, textAlign: "right" }}>
        {percentage}%
      </Text>
    </View>
  );
}
