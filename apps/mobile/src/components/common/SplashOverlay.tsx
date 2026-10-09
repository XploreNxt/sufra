import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { SurfaLogo } from "@/components/common/SurfaLogo";
import { animation, colors, spacing } from "@/theme";

export function SplashOverlay() {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.delay(animation.splashHoldMs),
      Animated.timing(opacity, {
        toValue: 0,
        duration: animation.splashFadeMs,
        useNativeDriver: true,
      }),
    ]);
    sequence.start(({ finished }) => {
      if (finished) setVisible(false);
    });

    return () => sequence.stop();
  }, [opacity, scale]);

  if (!visible) return null;

  return (
    <Animated.View
      accessibilityLabel="Surfa is loading"
      style={[styles.overlay, { opacity }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <SurfaLogo size={spacing.touchTarget} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
});
