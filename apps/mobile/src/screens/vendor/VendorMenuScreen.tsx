import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { VendorHeader } from "@/components/vendor/VendorHeader";
import { CATEGORIES } from "@/data/mockVendor";
import { useVendor } from "@/context/VendorContext";
import type { VendorMenuItem } from "@/types/vendor";
import { formatPrice } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

const ALL = "All";

/** Menu management: category chips, item cards, edit/delete, and bulk stock edits. */
export function VendorMenuScreen() {
  const { menu, setAvailability, addItem, updateItem, deleteItem } = useVendor();
  const [category, setCategory] = useState(ALL);
  const [bulk, setBulk] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<VendorMenuItem | "new" | null>(null);

  const visible = useMemo(
    () => (category === ALL ? menu : menu.filter((m) => m.category === category)),
    [menu, category]
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkSet(isAvailable: boolean) {
    setAvailability([...selected], isAvailable);
    setSelected(new Set());
    setBulk(false);
  }

  function confirmDelete(item: VendorMenuItem) {
    Alert.alert("Delete item", `Remove "${item.name}" from the menu?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteItem(item.id) },
    ]);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <VendorHeader title="Menu Management" subtitle={`${menu.length} items · ${CATEGORIES.length} categories`} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
        {[ALL, ...CATEGORIES].map((c) => {
          const active = c === category;
          return (
            <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.toolbar}>
        <Pressable
          onPress={() => {
            setBulk((b) => !b);
            setSelected(new Set());
          }}
          style={[styles.toolBtn, bulk && styles.toolBtnActive]}
        >
          <Text style={[styles.toolBtnText, bulk && styles.toolBtnTextActive]}>
            {bulk ? "Done" : "Bulk edit"}
          </Text>
        </Pressable>
        <Pressable onPress={() => setEditing("new")} style={styles.addBtn}>
          <Ionicons name="add" size={spacing.iconSmall} color={colors.white} />
          <Text style={styles.addBtnText}>Add item</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {visible.map((item) => {
          const checked = selected.has(item.id);
          return (
            <Pressable
              key={item.id}
              disabled={!bulk}
              onPress={() => toggleSelect(item.id)}
              style={[
                styles.card,
                checked && styles.cardChecked,
                !item.isAvailable && styles.cardMuted,
              ]}
            >
              {bulk ? (
                <Ionicons
                  name={checked ? "checkbox" : "square-outline"}
                  size={spacing.iconLarge}
                  color={checked ? colors.accent : colors.muted}
                />
              ) : null}
              <View style={styles.thumb}>
                <Text style={styles.thumbEmoji}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.price}>
                  {formatPrice(item.price)}
                  <Text style={styles.category}> · {item.category}</Text>
                </Text>
                <View style={styles.tagRow}>
                  <View style={[styles.tag, item.isAvailable ? styles.tagLive : styles.tagOut]}>
                    <Text style={[styles.tagText, item.isAvailable ? styles.tagLiveText : styles.tagOutText]}>
                      {item.isAvailable ? "● In stock" : "Out of stock"}
                    </Text>
                  </View>
                </View>
              </View>
              {!bulk ? (
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.isAvailable ? `Mark ${item.name} out of stock` : `Restock ${item.name}`}
                    onPress={() => setAvailability([item.id], !item.isAvailable)}
                    style={styles.iconBtn}
                  >
                    <Ionicons
                      name={item.isAvailable ? "checkmark-circle-outline" : "refresh-outline"}
                      size={spacing.iconLarge}
                      color={item.isAvailable ? colors.primary : colors.accent}
                    />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Edit item" onPress={() => setEditing(item)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={spacing.iconLarge} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Delete item" onPress={() => confirmDelete(item)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={spacing.iconLarge} color={colors.danger} />
                  </Pressable>
                </View>
              ) : null}
            </Pressable>
          );
        })}
        {visible.length === 0 ? <Text style={styles.empty}>No items in this category yet.</Text> : null}
      </ScrollView>

      {bulk && selected.size > 0 ? (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkCount}>{selected.size} selected</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable onPress={() => bulkSet(true)} style={[styles.bulkBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.bulkBtnText}>In stock</Text>
            </Pressable>
            <Pressable onPress={() => bulkSet(false)} style={[styles.bulkBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.bulkBtnText}>Out of stock</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {editing ? (
        <ItemEditor
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          defaultCategory={category === ALL ? CATEGORIES[0] : category}
          onCancel={() => setEditing(null)}
          onSave={(values) => {
            if (editing === "new") addItem(values);
            else updateItem(editing.id, values);
            setEditing(null);
          }}
        />
      ) : null}
    </View>
  );
}

function ItemEditor({
  initial,
  defaultCategory,
  onCancel,
  onSave,
}: {
  initial: VendorMenuItem | null;
  defaultCategory: string;
  onCancel: () => void;
  onSave: (values: Omit<VendorMenuItem, "id" | "isAvailable">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [cat, setCat] = useState(initial?.category ?? defaultCategory);
  const canSave = name.trim().length > 0 && Number(price) > 0;

  return (
    <View style={styles.sheetBackdrop}>
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{initial ? "Edit item" : "New menu item"}</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Item name" placeholderTextColor={colors.muted} style={styles.input} />
        <View style={styles.row}>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="number-pad"
            placeholder="Price (Rs)"
            placeholderTextColor={colors.muted}
            style={[styles.input, { flex: 1 }]}
          />
        </View>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setCat(c)} style={[styles.chip, c === cat && styles.chipActive]}>
              <Text style={[styles.chipText, c === cat && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={styles.note}>Changes are reviewed by Sufra before customers see them.</Text>
        <View style={styles.sheetActions}>
          <Pressable onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            disabled={!canSave}
            onPress={() => onSave({ name: name.trim(), price: Number(price), description, category: cat, emoji: initial?.emoji ?? "🍽️" })}
            style={[styles.saveBtn, !canSave && { opacity: 0.5 }]}
          >
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  chipsScroll: { flexGrow: 0, marginTop: spacing.md },
  chips: { paddingHorizontal: spacing.pageHorizontal, gap: spacing.sm, flexDirection: "row", flexWrap: "wrap" },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: typography.small, fontWeight: typography.weightSemibold },
  chipTextActive: { color: colors.white },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.md,
  },
  toolBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: spacing.borderHairline,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  toolBtnActive: { backgroundColor: colors.primaryDark },
  toolBtnText: { color: colors.primary, fontSize: typography.small, fontWeight: typography.weightBold },
  toolBtnTextActive: { color: colors.white },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  addBtnText: { color: colors.white, fontSize: typography.small, fontWeight: typography.weightBold },
  list: { paddingHorizontal: spacing.pageHorizontal, paddingBottom: 120, gap: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
  },
  cardChecked: { borderColor: colors.accent, borderWidth: 2 },
  cardMuted: { opacity: 0.7 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbEmoji: { fontSize: 28 },
  name: { color: colors.text, fontSize: typography.body, fontWeight: typography.weightBold },
  price: { color: colors.primary, fontSize: typography.small, fontWeight: typography.weightSemibold, marginTop: 2 },
  category: { color: colors.textSecondary, fontWeight: typography.weightRegular },
  tagRow: { flexDirection: "row", marginTop: spacing.xs },
  tag: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs },
  tagLive: { backgroundColor: colors.primaryLight },
  tagOut: { backgroundColor: "#FEE4E2" },
  tagText: { fontSize: typography.caption, fontWeight: typography.weightBold },
  tagLiveText: { color: colors.primaryDark },
  tagOutText: { color: colors.danger },
  actions: { flexDirection: "column", gap: spacing.xs },
  iconBtn: { width: spacing.touchTarget - 8, height: spacing.touchTarget - 8, alignItems: "center", justifyContent: "center" },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
  bulkBar: {
    position: "absolute",
    left: spacing.pageHorizontal,
    right: spacing.pageHorizontal,
    bottom: spacing.lg,
    backgroundColor: colors.text,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bulkCount: { color: colors.white, fontWeight: typography.weightBold, marginLeft: spacing.xs },
  bulkBtn: { borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bulkBtnText: { color: colors.white, fontSize: typography.small, fontWeight: typography.weightBold },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  sheetTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weightBold },
  row: { flexDirection: "row", gap: spacing.sm },
  label: { color: colors.textSecondary, fontSize: typography.small, fontWeight: typography.weightSemibold },
  input: {
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  note: { color: colors.textSecondary, fontSize: typography.caption },
  sheetActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.md, alignItems: "center" },
  cancelBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  cancelText: { color: colors.textSecondary, fontWeight: typography.weightSemibold },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radii.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  saveText: { color: colors.white, fontWeight: typography.weightBold },
});
