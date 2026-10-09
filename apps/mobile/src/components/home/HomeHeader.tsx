import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SearchBar } from "@/components/common/SearchBar";
import { SurfaLogo } from "@/components/common/SurfaLogo";
import { colors, radii, spacing, typography } from "@/theme";

interface HomeHeaderProps {
  topInset: number;
  search: string;
  onSearchChange: (value: string) => void;
  cartCount: number;
  onCartPress: () => void;
}

export function HomeHeader({
  topInset,
  search,
  onSearchChange,
  cartCount,
  onCartPress,
}: HomeHeaderProps) {
  return (
    <View style={[styles.container, { paddingTop: topInset + spacing.headerTopPadding }]}>
      <View style={styles.topRow}>
        <View style={styles.brandBlock}>
          <View style={styles.brand}>
            <SurfaLogo />
          </View>
          <Text style={styles.locationLabel}>DELIVERING TO</Text>
          <View style={styles.location}>
            <Ionicons name="location" size={spacing.iconSmall} color={colors.accent} />
            <Text style={styles.locationText}>Gulberg, Lahore</Text>
            <Ionicons name="chevron-down" size={spacing.iconSmall} color={colors.white} />
          </View>
        </View>
        <Pressable
          accessibilityLabel={
            cartCount > 0
              ? `Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`
              : "Open cart"
          }
          accessibilityRole="button"
          onPress={onCartPress}
          style={styles.cartButton}
        >
          <Ionicons
            name="bag-handle-outline"
            size={spacing.iconLarge}
            color={colors.primaryDark}
          />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      <SearchBar value={search} onChangeText={onSearchChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.headerBottomPadding,
    gap: spacing.lg,
    backgroundColor: colors.primary,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandBlock: {
    gap: spacing.xxs,
  },
  brand: {
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  locationLabel: {
    color: colors.primaryLight,
    fontSize: typography.caption,
    fontWeight: typography.weightSemibold,
    letterSpacing: spacing.borderHairline,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  locationText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: typography.weightSemibold,
  },
  cartButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: radii.md,
  },
  cartBadge: {
    position: "absolute",
    right: -spacing.xs,
    top: -spacing.xs,
    minWidth: spacing.lg,
    height: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: typography.weightBold,
  },
});
