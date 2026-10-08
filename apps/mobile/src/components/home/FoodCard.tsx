import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { PriceTag } from "@/components/common/PriceTag";
import { Rating } from "@/components/common/Rating";
import type { FoodItem } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

interface FoodCardProps {
  food: FoodItem;
  isFavorite: boolean;
  onPress: () => void;
  onAdd: () => void;
  onToggleFavorite: () => void;
}

function FoodCard({ food, isFavorite, onPress, onAdd, onToggleFavorite }: FoodCardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - spacing.pageHorizontal * 2, spacing.cardWidthMax);

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View>
        <Pressable
          accessibilityLabel={`View ${food.name} from ${food.restaurant_name}`}
          accessibilityRole="button"
          onPress={onPress}
        >
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash: food.image_blurhash }}
            source={{ uri: food.image_url ?? undefined }}
            style={[styles.image, { height: spacing.cardImageHeight }]}
            transition={200}
          />
        </Pressable>
        <Pressable
          accessibilityLabel={
            isFavorite
              ? `Remove ${food.name} from favorites`
              : `Add ${food.name} to favorites`
          }
          accessibilityRole="button"
          accessibilityState={{ selected: isFavorite }}
          onPress={onToggleFavorite}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={spacing.icon}
            color={isFavorite ? colors.danger : colors.primaryDark}
          />
        </Pressable>
      </View>
      <Pressable
        accessibilityLabel={`View ${food.name} details`}
        accessibilityRole="button"
        onPress={onPress}
        style={styles.details}
      >
        <Text numberOfLines={1} style={styles.name}>
          {food.name}
        </Text>
        <Text numberOfLines={1} style={styles.restaurant}>
          {food.restaurant_name} · {food.cuisine}
        </Text>
        <View style={styles.rating}>
          <Rating value={food.rating_avg} count={food.rating_count} />
        </View>
      </Pressable>
      <View style={styles.footer}>
        <PriceTag price={food.price} />
        <Pressable
          accessibilityLabel={`Add ${food.name} to cart`}
          accessibilityRole="button"
          onPress={onAdd}
          style={styles.addButton}
        >
          <Ionicons name="add" size={spacing.iconLarge} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

export const MemoFoodCard = React.memo(FoodCard);

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    paddingBottom: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: spacing.zero, height: spacing.xs },
    shadowOpacity: spacing.shadowOpacity,
    shadowRadius: spacing.shadowRadius,
    elevation: spacing.shadowElevation,
  },
  image: {
    width: "100%",
    backgroundColor: colors.primaryLight,
  },
  favoriteButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  details: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
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
  rating: {
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  addButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
});
