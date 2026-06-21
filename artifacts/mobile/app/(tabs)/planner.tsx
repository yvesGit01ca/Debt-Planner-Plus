import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CurrencyPicker } from "@/components/CurrencyPicker";
import { RADII } from "@/constants/colors";
import { useDebts } from "@/context/DebtContext";
import { useColors } from "@/hooks/useColors";
import type { Bill } from "@/types/bill";
import { getCategoryColor, MAX_BILLS } from "@/types/bill";
import { MONTHS } from "@/types/debt";
import {
  combineTotals,
  formatCurrency,
  formatCurrencyTotals,
  getOrdinalSuffix,
  groupBillTotalsByCurrency,
  groupTotalsByCurrency,
  isDebtActiveInMonth,
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

export default function PlannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { debts, bills, profile, updateProfile, deleteBill } = useDebts();

  const totals = groupBillTotalsByCurrency(bills);
  const atLimit = bills.length >= MAX_BILLS;
  const sorted = [...bills].sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  const [editing, setEditing] = useState(false);
  const [salary, setSalary] = useState(String(profile.monthlySalary || ""));
  const [revenue, setRevenue] = useState(
    String(profile.additionalRevenue || ""),
  );
  const [editCurrency, setEditCurrency] = useState(
    profile.defaultCurrency || "USD",
  );

  const dc = profile.defaultCurrency || "USD";

  const totalIncome =
    (profile.monthlySalary || 0) + (profile.additionalRevenue || 0);

  const billTotals = useMemo(() => groupBillTotalsByCurrency(bills), [bills]);

  const forecast = useMemo(() => {
    const now = new Date();
    let cumulative = 0;
    return Array.from({ length: 12 }, (_, i) => {
      let m = now.getMonth() + i;
      let y = now.getFullYear();
      while (m > 11) {
        m -= 12;
        y++;
      }
      const activeDebts = debts.filter((d) =>
        isDebtActiveInMonth(d.startMonth, d.startYear, d.totalMonths, m, y),
      );
      const obligationTotals = combineTotals(
        groupTotalsByCurrency(activeDebts, (d) => d.monthlyPayment),
        billTotals,
      );
      const dcOnly = obligationTotals.find((t) => t.currency === dc)?.total || 0;
      const net = totalIncome - dcOnly;
      cumulative += net;
      return {
        month: MONTHS[m],
        year: y,
        income: totalIncome,
        obligationTotals,
        net,
        cumulative,
        danger: dcOnly > totalIncome && totalIncome > 0,
      };
    });
  }, [debts, billTotals, totalIncome, dc]);

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

  const handleSaveProfile = () => {
    updateProfile({
      ...profile,
      monthlySalary: parseFloat(salary) || 0,
      additionalRevenue: parseFloat(revenue) || 0,
      defaultCurrency: editCurrency,
    });
    setEditing(false);
  };

  const handleStartEditing = () => {
    setSalary(String(profile.monthlySalary || ""));
    setRevenue(String(profile.additionalRevenue || ""));
    setEditCurrency(dc);
    setEditing(true);
  };

  const handleCancelEditing = () => {
    setEditing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === "web" ? 24 : insets.top + 12,
            paddingBottom: Platform.OS === "web" ? 34 + 80 : insets.bottom + 90,
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

        <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

        <Text style={[styles.title, styles.forecastTitle, { color: colors.foreground }]}>
          Financial Forecast
        </Text>

        <View
          style={[
            styles.incomeCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...colors.cardShadow,
            },
          ]}
        >
          <View style={styles.incomeHeader}>
            <Text style={[styles.incomeTitle, { color: colors.mutedForeground }]}>
              Monthly Income
            </Text>
            <Pressable
              onPress={() =>
                editing ? handleCancelEditing() : handleStartEditing()
              }
            >
              <Feather
                name={editing ? "x" : "edit-2"}
                size={16}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>

          {editing ? (
            <View style={styles.incomeForm}>
              <CurrencyPicker
                selected={editCurrency}
                onSelect={setEditCurrency}
                label="Default Currency"
              />
              <View style={styles.incomeField}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Salary
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={salary}
                  onChangeText={setSalary}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardAppearance={colors.scheme}
                />
              </View>
              <View style={styles.incomeField}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Other Revenue
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={revenue}
                  onChangeText={setRevenue}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardAppearance={colors.scheme}
                />
              </View>
              <Pressable
                onPress={handleSaveProfile}
                style={[styles.saveIncomeBtn, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[
                    styles.saveIncomeText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.incomeDisplay}>
              <View style={styles.incomeRow}>
                <Text style={[styles.incomeLabel, { color: colors.mutedForeground }]}>
                  Salary
                </Text>
                <Text style={[styles.incomeValue, { color: colors.foreground }]}>
                  {profile.monthlySalary
                    ? formatCurrency(profile.monthlySalary, dc)
                    : "Not set"}
                </Text>
              </View>
              <View style={styles.incomeRow}>
                <Text style={[styles.incomeLabel, { color: colors.mutedForeground }]}>
                  Other Revenue
                </Text>
                <Text style={[styles.incomeValue, { color: colors.foreground }]}>
                  {profile.additionalRevenue
                    ? formatCurrency(profile.additionalRevenue, dc)
                    : "Not set"}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.incomeRow}>
                <Text style={[styles.incomeLabel, { color: colors.foreground }]}>
                  Total
                </Text>
                <Text style={[styles.incomeTotalValue, { color: colors.primary }]}>
                  {formatCurrency(totalIncome, dc)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {totalIncome > 0 ? (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              12-Month Projection
            </Text>

            {forecast.map((row, i) => (
              <View
                key={i}
                style={[
                  styles.forecastRow,
                  {
                    backgroundColor: row.danger
                      ? colors.destructiveSoft
                      : colors.card,
                    borderColor: row.danger
                      ? colors.destructive + "55"
                      : colors.border,
                    ...colors.cardShadow,
                  },
                ]}
              >
                <View style={styles.forecastHeader}>
                  <Text style={[styles.forecastMonth, { color: colors.foreground }]}>
                    {row.month} {row.year}
                  </Text>
                  {row.danger && (
                    <View
                      style={[
                        styles.dangerBadge,
                        { backgroundColor: colors.destructiveSoft },
                      ]}
                    >
                      <Feather
                        name="alert-triangle"
                        size={10}
                        color={colors.destructive}
                      />
                      <Text style={[styles.dangerText, { color: colors.destructive }]}>
                        At Risk
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.forecastDetails}>
                  <View style={styles.forecastItem}>
                    <Text
                      style={[styles.forecastLabel, { color: colors.mutedForeground }]}
                    >
                      Income
                    </Text>
                    <Text style={[styles.forecastValue, { color: colors.accent }]}>
                      {formatCurrency(row.income, dc)}
                    </Text>
                  </View>
                  <View style={styles.forecastItem}>
                    <Text
                      style={[styles.forecastLabel, { color: colors.mutedForeground }]}
                    >
                      Obligations
                    </Text>
                    {row.obligationTotals.map((t) => (
                      <Text
                        key={t.currency}
                        style={[styles.forecastValue, { color: colors.destructive }]}
                      >
                        {formatCurrency(t.total, t.currency)}
                      </Text>
                    ))}
                    {row.obligationTotals.length === 0 && (
                      <Text
                        style={[styles.forecastValue, { color: colors.destructive }]}
                      >
                        {formatCurrency(0, dc)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.forecastItem}>
                    <Text
                      style={[styles.forecastLabel, { color: colors.mutedForeground }]}
                    >
                      Net ({dc})
                    </Text>
                    <Text
                      style={[
                        styles.forecastValue,
                        {
                          color: row.net >= 0 ? colors.accent : colors.destructive,
                        },
                      ]}
                    >
                      {formatCurrency(row.net, dc)}
                    </Text>
                  </View>
                  <View style={styles.forecastItem}>
                    <Text
                      style={[styles.forecastLabel, { color: colors.mutedForeground }]}
                    >
                      Cumulative ({dc})
                    </Text>
                    <Text
                      style={[
                        styles.forecastValue,
                        {
                          color:
                            row.cumulative >= 0
                              ? colors.primary
                              : colors.destructive,
                        },
                      ]}
                    >
                      {formatCurrency(row.cumulative, dc)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noIncome}>
            <Feather name="dollar-sign" size={32} color={colors.mutedForeground} />
            <Text style={[styles.noIncomeText, { color: colors.mutedForeground }]}>
              Enter your monthly income above to see your financial forecast
            </Text>
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
  sectionDivider: {
    height: 1,
    marginTop: 28,
    marginBottom: 24,
  },
  forecastTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  incomeCard: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  incomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  incomeTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontFamily: "Inter_600SemiBold",
  },
  incomeForm: {
    gap: 10,
  },
  incomeField: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.24,
    fontVariant: ["tabular-nums"],
  },
  saveIncomeBtn: {
    alignItems: "center",
    borderRadius: RADII.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 4,
  },
  saveIncomeText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  incomeDisplay: {
    gap: 8,
  },
  incomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  incomeLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.24,
  },
  incomeValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  incomeTotalValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: "Inter_600SemiBold",
  },
  forecastRow: {
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  forecastHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  forecastMonth: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  dangerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dangerText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  forecastDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  forecastItem: {
    width: "47%",
  },
  forecastLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
    fontFamily: "Inter_500Medium",
  },
  forecastValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  noIncome: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  noIncomeText: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.24,
  },
});
