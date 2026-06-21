import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BillsPieChart } from "@/components/BillsPieChart";
import { DebtCard } from "@/components/DebtCard";
import { MonthOutlook } from "@/components/MonthOutlook";
import { SummaryCards } from "@/components/SummaryCards";
import { RADII } from "@/constants/colors";
import { useDebts } from "@/context/DebtContext";
import { useThemeMode } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { getCategoryColor } from "@/types/bill";
import type { Debt } from "@/types/debt";
import { MONTHS } from "@/types/debt";
import {
  combineTotals,
  effectiveDayInMonth,
  formatCurrency,
  getOrdinalSuffix,
  groupBillTotalsByCurrency,
  groupTotalsByCurrency,
  isDebtActiveInMonth,
  stillDueThisMonth,
} from "@/utils/calculations";

export default function DashboardScreen() {
  const colors = useColors();
  const { scheme, toggle } = useThemeMode();
  const insets = useSafeAreaInsets();
  const { debts, bills } = useDebts();
  const now = new Date();

  const activeDebts = useMemo(
    () =>
      debts
        .filter((d) =>
          isDebtActiveInMonth(
            d.startMonth,
            d.startYear,
            d.totalMonths,
            now.getMonth(),
            now.getFullYear(),
          ),
        )
        .sort((a, b) => a.dueDay - b.dueDay),
    [debts],
  );

  const inactiveDebts = useMemo(
    () =>
      debts.filter(
        (d) =>
          !isDebtActiveInMonth(
            d.startMonth,
            d.startYear,
            d.totalMonths,
            now.getMonth(),
            now.getFullYear(),
          ),
      ),
    [debts],
  );

  const monthlyTotals = useMemo(
    () =>
      combineTotals(
        groupTotalsByCurrency(activeDebts, (d) => d.monthlyPayment),
        groupBillTotalsByCurrency(bills),
      ),
    [activeDebts, bills],
  );

  const stillDueTotals = useMemo(
    () => stillDueThisMonth(debts, bills),
    [debts, bills],
  );

  const remainingTotals = useMemo(
    () => groupTotalsByCurrency(debts, (d) => d.remaining),
    [debts],
  );

  const monthBills = useMemo(
    () =>
      [...bills].sort(
        (a, b) =>
          effectiveDayInMonth(a.dayOfMonth, now.getFullYear(), now.getMonth()) -
          effectiveDayInMonth(b.dayOfMonth, now.getFullYear(), now.getMonth()),
      ),
    [bills],
  );

  const handleEdit = (debt: Debt) => {
    router.push({ pathname: "/add-debt", params: { editId: debt.id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === "web" ? 67 + 16 : insets.top + 16,
            paddingBottom: Platform.OS === "web" ? 34 + 80 : insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Debt + Bills Planner
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Debt Planner
              <Text style={{ color: colors.primary }}> Plus</Text>
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggle();
            }}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Feather
              name={scheme === "dark" ? "sun" : "moon"}
              size={18}
              color={colors.foreground}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/add-debt");
            }}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>
              Debt
            </Text>
          </Pressable>
        </View>

        <SummaryCards
          items={[
            { label: "Per Month", totals: monthlyTotals, accent: colors.primary },
            { label: "Still Due", totals: stillDueTotals, accent: colors.warning },
            {
              label: "Remaining Debt",
              totals: remainingTotals,
              accent: colors.destructive,
            },
          ]}
        />

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {MONTHS[now.getMonth()]} {now.getFullYear()} — Payment Schedule
        </Text>

        {activeDebts.length === 0 ? (
          <View style={styles.empty}>
            <Feather
              name="check-circle"
              size={32}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No active debts this month
            </Text>
          </View>
        ) : (
          activeDebts.map((d) => (
            <DebtCard key={d.id} debt={d} onEdit={handleEdit} />
          ))
        )}

        {monthBills.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={styles.sectionRow}>
              <Text
                style={[styles.sectionTitle, { color: colors.mutedForeground }]}
              >
                Recurring Bills
              </Text>
              <Pressable onPress={() => router.push("/bills")} hitSlop={8}>
                <Text style={[styles.manageLink, { color: colors.primary }]}>
                  Manage
                </Text>
              </Pressable>
            </View>
            <View
              style={[
                styles.billsCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  ...colors.cardShadow,
                },
              ]}
            >
              <BillsPieChart bills={monthBills} />
              <Text style={[styles.pieHint, { color: colors.mutedForeground }]}>
                Pinch to zoom · double-tap to reset
              </Text>
              <View style={styles.legend}>
                {monthBills.map((b, i) => (
                  <Pressable
                    key={b.id}
                    onPress={() => router.push(`/add-bill?editId=${b.id}`)}
                    style={[
                      styles.billRow,
                      i < monthBills.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.billDot,
                        { backgroundColor: getCategoryColor(b.category) },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.billName, { color: colors.foreground }]}
                      >
                        {b.name}
                      </Text>
                      <Text
                        style={[
                          styles.billMeta,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {b.category} · {getOrdinalSuffix(b.dayOfMonth)}
                      </Text>
                    </View>
                    <Text
                      style={[styles.billAmount, { color: colors.foreground }]}
                    >
                      {formatCurrency(b.amount, b.currency)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={{ marginTop: 24 }}>
          <MonthOutlook debts={debts} bills={bills} />
        </View>

        {inactiveDebts.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              Inactive / Upcoming Debts
            </Text>
            {inactiveDebts.map((d) => (
              <DebtCard key={d.id} debt={d} onEdit={handleEdit} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
    fontFamily: "Inter_500Medium",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: RADII.md,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: "Inter_600SemiBold",
  },
  manageLink: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  billsCard: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  pieHint: {
    fontSize: 11,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    marginBottom: 4,
  },
  legend: {
    marginTop: 4,
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  billDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  billName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  billMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  billAmount: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.24,
  },
});
