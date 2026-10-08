import { useCallback, useEffect, useState } from "react";
import { mockCategories, mockFavorites, mockFood } from "@/data/mockFood";
import type { FoodCategory, FoodItem } from "@/types";

interface HomeData {
  popular: FoodItem[];
  favorites: FoodItem[];
  categories: FoodCategory[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useHomeData(): HomeData {
  const [popular, setPopular] = useState<FoodItem[]>([]);
  const [favorites, setFavorites] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.resolve();
      setPopular(mockFood);
      setFavorites(mockFavorites);
      setCategories(mockCategories);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause
          : new Error("We couldn't load the menu. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { popular, favorites, categories, loading, error, refresh };
}
