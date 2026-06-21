import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADII } from "@/constants/colors";
import { useDebts } from "@/context/DebtContext";
import { useColors } from "@/hooks/useColors";
import type { Bill } from "@/types/bill";
import { getCategoryColor, MAX_BILLS } from "@/types/bill";
import {
  formatCurrency,
  formatCurrencyTotals,
  getOrdinalSuffix,
  groupBillTotalsByCurrency,
} from "@/utils/calculations";

function BillRow({
  bill,
  onEdit,
  onDelete,
}: {
  bill: Bill;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const dot = getCategoryColor(bill.category);
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          ...colors.cardShadow,
        },
      ]}
    >
      <View style={[styles.rowAccent, { backgroundColor: dot }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.rowName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {bill.name}
          </Text>
          <Text style={[styles.rowAmount, { color: colors.foreground }]}>
            {formatCurrency(bill.amount, bill.currency)}
          </Text>
        </View>
        <View style={styles.rowMeta}>
          <View style={[styles.catBadge, { backgroundColor: colors.secondary }]}>
            <View style={[styles.catDot, { backgroundColor: dot }]} />
            <Text
              style={[styles.catText, { color: colors.mutedForeground }]}
            >
              {bill.category}
            </Text>
          </View>
          <Text style={[styles.rowDue, { color: colors.mutedForeground }]}>
            Due {getOrdinalSuffix(bill.dayOfMonth)}
          </Text>
        </View>
      </View>
      <View style={styles.rowActions}>
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
        >
          <Feather name="edit-2" size={15} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={[styles.iconBtn, { backgroundColor: colors.destructiveSoft }]}
        >
          <Feather name="trash-2" size={15} color={colors.destructive} />
        </Pressable>
      </View>
    </View>
  );
}

export default function BillsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bills, deleteBill } = useDebts();

  const totals = groupBillTotalsByCurrency(bills);
  const atLimit = bills.length >= MAX_BILLS;
  const sorted = [...bills].sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  const handleDelete = (bill: Bill) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete bill", `Remove "${bill.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteBill(bill.id),
      },
    ]);
  };

  const handleAdd = () => {
    if (atLimit) {
      Alert.alert("Limit reached", `You can track up to ${MAX_BILLS} bills.`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/add-bill");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === "web" ? 24 : insets.top + 12,
            paddingBottom: 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
              Recurring
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Monthly Bills
            </Text>
          </View>
          <Pressable
            onPress={handleAdd}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <View
          style={[
            styles.summary,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...colors.cardShadow,
            },
          ]}
        >
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
            Total recurring / month
          </Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>
            {totals.length > 0 ? formatCurrencyTotals(totals) : formatCurrency(0)}
          </Text>
          <Text style={[styles.summaryCount, { color: colors.mutedForeground }]}>
            {bills.length} {bills.length === 1 ? "bill" : "bills"}
          </Text>
        </View>

        {sorted.length === 0 ? (
          <View
            style={[
              styles.empty,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <Feather name="file-text" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No bills yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add rent, subscriptions, and utilities to see them across your
              calendar and forecast.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sorted.map((bill) => (
              <BillRow
                key={bill.id}
                bill={bill}
                onEdit={() => router.push(`/add-bill?editId=${bill.id}`)}
                onDelete={() => handleDelete(bill)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 30,
    fontFamily: "Inter_300Light",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  summaryCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADII.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  rowAccent: { width: 4, alignSelf: "stretch" },
  rowBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rowName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  rowAmount: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  catDot: { width: 7, height: 7, borderRadius: 4 },
  catText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  rowDue: { fontSize: 12, fontFamily: "Inter_400Regular" },
  rowActions: { flexDirection: "row", gap: 8, paddingRight: 12 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: RADII.md,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
  },
});
