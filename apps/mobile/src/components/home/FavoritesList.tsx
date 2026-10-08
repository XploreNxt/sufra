import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { MemoFoodCard } from "@/components/home/FoodCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import type { FoodItem } from "@/types";
import { colors, spacing, typography } from "@/theme";

interface FavoritesListProps {
  foods: FoodItem[];
  onFoodPress: (food: FoodItem) => void;
  onAdd: (food: FoodItem) => void;
  onToggleFavorite: (food: FoodItem) => void;
}

export function FavoritesList({
  foods,
  onFoodPress,
  onAdd,
  onToggleFavorite,
}: FavoritesListProps) {
  const renderItem = React.useCallback(
    ({ item }: { item: FoodItem }) => (
      <MemoFoodCard
        food={item}
        isFavorite
        onPress={() => onFoodPress(item)}
        onAdd={() => onAdd(item)}
        onToggleFavorite={() => onToggleFavorite(item)}
      />
    ),
    [onAdd, onFoodPress, onToggleFavorite],
  );

  return (
    <View>
      <SectionHeader title="My Favorites" />
      <FlatList
        data={foods}
        horizontal
        ItemSeparatorComponent={FoodCardSeparator}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Save a dish and it will show up here.</Text>
        }
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

function FoodCardSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  separator: {
    width: spacing.lg,
  },
  empty: {
    paddingVertical: spacing.lg,
    color: colors.textSecondary,
    fontSize: typography.body,
  },
});
