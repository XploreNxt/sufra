import { StyleSheet, Text } from "react-native";
import { formatPrice } from "@/types";
import { colors, typography } from "@/theme";

interface PriceTagProps {
  price: number;
}

export function PriceTag({ price }: PriceTagProps) {
  return <Text style={styles.price}>{formatPrice(price)}</Text>;
}

const styles = StyleSheet.create({
  price: {
    color: colors.primaryDark,
    fontSize: typography.bodyLarge,
    fontWeight: typography.weightBold,
  },
});
