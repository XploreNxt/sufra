import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons
        name="search"
        size={spacing.icon}
        color={colors.textSecondary}
        accessibilityElementsHidden
      />
      <TextInput
        accessibilityLabel="Search for food"
        accessibilityRole="search"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder="Search for food"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          onPress={() => onChangeText("")}
          style={styles.clearButton}
        >
          <Ionicons
            name="close-circle"
            size={spacing.icon}
            color={colors.muted}
            accessibilityElementsHidden
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: spacing.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: typography.body,
  },
  clearButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
