import React, { useCallback, useState } from "react";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { MemoCartItemRow } from "@/components/cart/CartItemRow";
import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/context/CartContext";
import type { CustomerTabParamList } from "@/navigation/types";
import { formatPrice } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

type PaymentMethodId = "cash" | "visa" | "mastercard" | "apple-pay";

interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  icon: React.ReactNode;
}

const DELIVERY_FEE = 150;

const paymentMethods: PaymentMethod[] = [
  {
    id: "cash",
    label: "Cash on delivery",
    icon: (
      <Ionicons name="cash-outline" size={spacing.iconLarge} color={colors.primary} />
    ),
  },
  {
    id: "visa",
    label: "Visa",
    icon: <FontAwesome name="cc-visa" size={spacing.iconLarge} color={colors.visa} />,
  },
  {
    id: "mastercard",
    label: "Mastercard",
    icon: (
      <FontAwesome
        name="cc-mastercard"
        size={spacing.iconLarge}
        color={colors.mastercard}
      />
    ),
  },
  {
    id: "apple-pay",
    label: "Apple Pay",
    icon: <Ionicons name="logo-apple" size={spacing.iconLarge} color={colors.text} />,
  },
];

export function CartScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<BottomTabNavigationProp<CustomerTabParamList, "Cart">>();
  const { items, itemCount, subtotal, addItem, decrementItem } = useCart();
  const [paymentId, setPaymentId] = useState<PaymentMethodId>("cash");
  const total = subtotal + DELIVERY_FEE;

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <MemoCartItemRow
        item={item}
        onAdd={() => addItem(item.food)}
        onRemove={() => decrementItem(item.food.id)}
      />
    ),
    [addItem, decrementItem],
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityLabel="Back to menu"
          accessibilityRole="button"
          onPress={() => navigation.navigate("Home")}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={spacing.iconLarge} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={styles.headerButton} />
      </View>
      <FlatList
        contentContainerStyle={[styles.list, items.length === 0 && styles.emptyList]}
        data={items}
        ItemSeparatorComponent={CartItemSeparator}
        keyExtractor={(item) => item.food.id}
        ListEmptyComponent={<EmptyCart onBrowse={() => navigation.navigate("Home")} />}
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Checkout</Text>
              <Text style={styles.sectionMeta}>
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.sectionTitle}>Payment options</Text>
              <View style={styles.paymentRow}>
                {paymentMethods.map((method) => {
                  const selected = method.id === paymentId;
                  return (
                    <Pressable
                      accessibilityLabel={`Pay with ${method.label}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      key={method.id}
                      onPress={() => setPaymentId(method.id)}
                      style={[styles.paymentTile, selected && styles.paymentTileSelected]}
                    >
                      {method.icon}
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.paymentLabel}>
                {paymentMethods.find((method) => method.id === paymentId)?.label}
              </Text>

              <View style={styles.totals}>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Subtotal</Text>
                  <Text style={styles.totalsValue}>{formatPrice(subtotal)}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Delivery fee</Text>
                  <Text style={styles.totalsValue}>{formatPrice(DELIVERY_FEE)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.totalsRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatPrice(total)}</Text>
                </View>
              </View>
            </View>
          ) : null
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
      {items.length > 0 ? (
        <View style={styles.bottomBar}>
          <Pressable
            accessibilityLabel={`Place order for ${total} rupees`}
            accessibilityRole="button"
            onPress={() =>
              Alert.alert(
                "Checkout is coming soon",
                "Your items are safely in your cart. Ordering will be available in a future update.",
              )
            }
            style={({ pressed }) => [
              styles.checkoutButton,
              pressed && styles.checkoutButtonPressed,
            ]}
          >
            <Text style={styles.checkoutText}>Place order</Text>
            <Text style={styles.checkoutText}>{formatPrice(total)}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function CartItemSeparator() {
  return <View style={styles.separator} />;
}

interface EmptyCartProps {
  onBrowse: () => void;
}

function EmptyCart({ onBrowse }: EmptyCartProps) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="bag-handle-outline"
          size={spacing.iconXLarge}
          color={colors.primary}
        />
      </View>
      <Text style={styles.emptyTitle}>Your next favourite is waiting</Text>
      <Text style={styles.emptyMessage}>
        Explore the menu and add something delicious to your cart.
      </Text>
      <Pressable
        accessibilityLabel="Browse the menu"
        accessibilityRole="button"
        onPress={onBrowse}
        style={styles.browseButton}
      >
        <Text style={styles.browseText}>Browse the menu</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.primary,
  },
  headerButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.white,
    fontSize: typography.subtitle,
    fontWeight: typography.weightBold,
  },
  list: {
    flexGrow: 1,
    padding: spacing.pageHorizontal,
  },
  emptyList: {
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    lineHeight: typography.lineSubtitle,
    fontWeight: typography.weightBold,
  },
  sectionMeta: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: typography.weightSemibold,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    gap: spacing.md,
    marginTop: spacing.section,
  },
  paymentRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  paymentTile: {
    flex: 1,
    height: spacing.touchTarget + spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    borderWidth: spacing.xxs,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  paymentTileSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  paymentLabel: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
  totals: {
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  totalsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalsLabel: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  totalsValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weightSemibold,
  },
  divider: {
    height: spacing.borderHairline,
    backgroundColor: colors.border,
  },
  totalLabel: {
    color: colors.text,
    fontSize: typography.bodyLarge,
    fontWeight: typography.weightBold,
  },
  totalValue: {
    color: colors.primaryDark,
    fontSize: typography.subtitle,
    fontWeight: typography.weightHeavy,
  },
  bottomBar: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.md,
    borderTopColor: colors.border,
    borderTopWidth: spacing.borderHairline,
    backgroundColor: colors.surface,
  },
  checkoutButton: {
    minHeight: spacing.touchTarget + spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
  },
  checkoutButtonPressed: {
    opacity: 0.85,
  },
  checkoutText: {
    color: colors.white,
    fontSize: typography.bodyLarge,
    fontWeight: typography.weightBold,
  },
  empty: {
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    width: spacing.emptyCartIconSize,
    height: spacing.emptyCartIconSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    lineHeight: typography.lineSubtitle,
    fontWeight: typography.weightBold,
    textAlign: "center",
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: typography.lineBody,
    textAlign: "center",
  },
  browseButton: {
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  browseText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: typography.weightSemibold,
  },
});
