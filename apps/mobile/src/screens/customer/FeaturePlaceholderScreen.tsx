import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@/theme";

interface FeaturePlaceholderScreenProps {
  title: string;
  message: string;
}

export function FeaturePlaceholderScreen({
  title,
  message,
}: FeaturePlaceholderScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.container}>
        <Ionicons
          name="restaurant-outline"
          size={spacing.iconXLarge}
          color={colors.primary}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    color: colors.white,
    fontSize: typography.subtitle,
    fontWeight: typography.weightBold,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xxxl,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: "center",
  },
});
