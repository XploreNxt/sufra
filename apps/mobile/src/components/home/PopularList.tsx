import React, { useCallback } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SectionHeader } from "@/components/common/SectionHeader";
import { MemoFoodCard } from "@/components/home/FoodCard";
import type { FoodItem } from "@/types";
import { colors, spacing, typography } from "@/theme";

interface PopularListProps {
  foods: FoodItem[];
  isFavorite: (food: FoodItem) => boolean;
  onFoodPress: (food: FoodItem) => void;
  onAdd: (food: FoodItem) => void;
  onToggleFavorite: (food: FoodItem) => void;
  onViewAll: () => void;
}

export function PopularList({
  foods,
  isFavorite,
  onFoodPress,
  onAdd,
  onToggleFavorite,
  onViewAll,
}: PopularListProps) {
  const renderItem = useCallback(
    ({ item }: { item: FoodItem }) => (
      <MemoFoodCard
        food={item}
        isFavorite={isFavorite(item)}
        onPress={() => onFoodPress(item)}
        onAdd={() => onAdd(item)}
        onToggleFavorite={() => onToggleFavorite(item)}
      />
    ),
    [isFavorite, onAdd, onFoodPress, onToggleFavorite],
  );

  return (
    <View>
      <SectionHeader
        title="Popular Offerings"
        actionLabel="View All"
        onActionPress={onViewAll}
      />
      <FlatList
        data={foods}
        horizontal
        ItemSeparatorComponent={CardSeparator}
        keyExtractor={(food) => food.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No popular dishes match your search.</Text>
        }
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

function CardSeparator() {
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
