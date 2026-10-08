import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";

interface FeaturePlaceholderScreenProps {
  title: string;
  message: string;
}

export function FeaturePlaceholderScreen({
  title,
  message,
}: FeaturePlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <Ionicons
        name="restaurant-outline"
        size={spacing.iconXLarge}
        color={colors.primary}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xxxl,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: typography.weightBold,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: "center",
  },
});
