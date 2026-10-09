import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { VendorHeader } from "@/components/vendor/VendorHeader";
import { useVendor } from "@/context/VendorContext";
import type { VendorTabParamList } from "@/navigation/types";
import { formatPrice } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

/** Inventory dashboard: live stock, out-of-stock alerts, one-tap restock. */
export function VendorDashboardScreen() {
  const { menu, setAvailability } = useVendor();
  const navigation = useNavigation<BottomTabNavigationProp<VendorTabParamList>>();

  const outOfStock = menu.filter((m) => !m.isAvailable);
  const liveCount = menu.length - outOfStock.length;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <VendorHeader title="Dashboard" subtitle="Inventory & stock alerts" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.liveCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.liveTitle}>Live stock</Text>
            <Text style={styles.liveSub}>{liveCount} items available to order</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Stock alerts</Text>
        {outOfStock.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nothing is out of stock. 🎉</Text>
          </View>
        ) : (
          outOfStock.map((item) => (
            <View key={item.id} style={styles.alertCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle} numberOfLines={1}>
                  Out of stock · {item.name}
                </Text>
                <Text style={styles.alertSub} numberOfLines={1}>
                  {item.category} · {formatPrice(item.price)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Restock ${item.name}`}
                onPress={() => setAvailability([item.id], true)}
                style={styles.restockBtn}
              >
                <Text style={styles.restockText}>Restock</Text>
              </Pressable>
            </View>
          ))
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Inventory</Text>
          <Text style={styles.summaryValue}>{menu.length}</Text>
          <Text style={styles.summarySub}>items on your menu · {outOfStock.length} out of stock</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Menu")}
            style={styles.manageBtn}
          >
            <Text style={styles.manageText}>Full product management</Text>
            <Ionicons name="arrow-forward" size={spacing.iconSmall} color={colors.white} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageHorizontal, paddingBottom: spacing.xxxl, gap: spacing.md },
  liveCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: spacing.borderHairline,
    borderColor: colors.primary,
  },
  liveTitle: { color: colors.primaryDark, fontSize: typography.bodyLarge, fontWeight: typography.weightBold },
  liveSub: { color: colors.primaryDark, opacity: 0.75, fontSize: typography.small, marginTop: 2 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  liveBadgeText: { color: colors.white, fontSize: typography.caption, fontWeight: typography.weightBold },
  sectionTitle: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weightBold,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#FEF3F2",
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: spacing.borderHairline,
    borderColor: "#FECDCA",
  },
  alertTitle: { color: colors.danger, fontSize: typography.body, fontWeight: typography.weightBold },
  alertSub: { color: colors.textSecondary, fontSize: typography.small, marginTop: 2 },
  restockBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
  },
  restockText: { color: colors.white, fontSize: typography.small, fontWeight: typography.weightBold },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
  },
  emptyText: { color: colors.textSecondary, textAlign: "center", fontSize: typography.body },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  summaryLabel: { color: colors.textSecondary, fontSize: typography.small, fontWeight: typography.weightSemibold },
  summaryValue: { color: colors.text, fontSize: typography.display, fontWeight: typography.weightHeavy, marginTop: spacing.xxs },
  summarySub: { color: colors.textSecondary, fontSize: typography.small, marginTop: 2 },
  manageBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    minHeight: spacing.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  manageText: { color: colors.white, fontSize: typography.body, fontWeight: typography.weightBold },
});
