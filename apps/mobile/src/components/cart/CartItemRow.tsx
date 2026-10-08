import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PriceTag } from "@/components/common/PriceTag";
import type { CartItem } from "@/context/CartContext";
import { colors, radii, spacing, typography } from "@/theme";

interface CartItemRowProps {
  item: CartItem;
  onAdd: () => void;
  onRemove: () => void;
}

function CartItemRow({ item, onAdd, onRemove }: CartItemRowProps) {
  const { food, quantity } = item;

  return (
    <View style={styles.card}>
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        placeholder={{ blurhash: food.image_blurhash }}
        source={{ uri: food.image_url ?? undefined }}
        style={styles.image}
        transition={200}
      />
      <View style={styles.details}>
        <Text numberOfLines={1} style={styles.name}>
          {food.name}
        </Text>
        <Text numberOfLines={1} style={styles.restaurant}>
          {food.restaurant_name}
        </Text>
        <PriceTag price={food.price * quantity} />
      </View>
      <View style={styles.quantity}>
        <Pressable
          accessibilityLabel={`Remove one ${food.name} from cart`}
          accessibilityRole="button"
          onPress={onRemove}
          style={styles.quantityButton}
        >
          <Ionicons name="remove" size={spacing.icon} color={colors.primary} />
        </Pressable>
        <Text accessibilityLabel={`Quantity ${quantity}`} style={styles.count}>
          {quantity}
        </Text>
        <Pressable
          accessibilityLabel={`Add one ${food.name} to cart`}
          accessibilityRole="button"
          onPress={onAdd}
          style={styles.quantityButton}
        >
          <Ionicons name="add" size={spacing.icon} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

export const MemoCartItemRow = React.memo(CartItemRow);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  image: {
    width: spacing.cartItemImageSize,
    height: spacing.cartItemImageSize,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weightBold,
  },
  restaurant: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
  quantity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  quantityButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
  },
  count: {
    minWidth: spacing.cartQtyMinWidth,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weightSemibold,
    textAlign: "center",
  },
});
