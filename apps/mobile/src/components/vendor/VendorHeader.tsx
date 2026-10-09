import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RESTAURANT_NAME } from "@/data/mockVendor";
import { colors, radii, spacing, typography } from "@/theme";

/** Green top band used on every vendor screen, like the Surfa vendor mockups. */
export function VendorHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>🍽️</Text>
        </View>
        <View style={styles.restaurantChip}>
          <Text style={styles.restaurantText} numberOfLines={1}>
            {RESTAURANT_NAME}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>VENDOR</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logo: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: { fontSize: 16 },
  restaurantChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  restaurantText: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: typography.weightSemibold,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  badgeText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: typography.weightBold,
  },
  title: {
    marginTop: spacing.lg,
    color: colors.white,
    fontSize: typography.display,
    fontWeight: typography.weightHeavy,
  },
  subtitle: {
    marginTop: spacing.xxs,
    color: "rgba(255,255,255,0.8)",
    fontSize: typography.body,
  },
});
