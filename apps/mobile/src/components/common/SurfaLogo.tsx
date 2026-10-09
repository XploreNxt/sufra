import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";

interface SurfaLogoProps {
  size?: number;
}

export function SurfaLogo({ size = spacing.iconLarge }: SurfaLogoProps) {
  const leaf = {
    width: size * 0.8,
    height: size * 0.56,
    borderTopLeftRadius: size * 0.56,
    borderBottomRightRadius: size * 0.56,
    borderTopRightRadius: size * 0.1,
    borderBottomLeftRadius: size * 0.1,
  };

  return (
    <View accessibilityLabel="Surfa" accessibilityRole="image" style={styles.logo}>
      <View style={{ width: size, height: size }}>
        <View style={[styles.leaf, styles.topLeaf, leaf]} />
        <View style={[styles.leaf, styles.bottomLeaf, leaf]} />
      </View>
      <Text style={[styles.wordmark, { fontSize: size * 0.9, lineHeight: size * 1.15 }]}>
        Surfa
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  leaf: {
    position: "absolute",
  },
  topLeaf: {
    top: spacing.zero,
    right: spacing.zero,
    backgroundColor: colors.accent,
  },
  bottomLeaf: {
    bottom: spacing.zero,
    left: spacing.zero,
    backgroundColor: colors.primary,
  },
  wordmark: {
    color: colors.primary,
    fontWeight: typography.weightHeavy,
  },
});
