import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";

interface RatingProps {
  value: number;
  count: number;
}

export function Rating({ value, count }: RatingProps) {
  return (
    <View
      accessibilityLabel={`Rated ${value.toFixed(1)} out of 5 from ${count} reviews`}
      style={styles.container}
    >
      <Ionicons name="star" size={spacing.iconSmall} color={colors.star} />
      <Text style={styles.value}>{value.toFixed(1)}</Text>
      <Text style={styles.count}>({count})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  value: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: typography.weightSemibold,
  },
  count: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
});
