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

import { DebtCard } from "@/components/DebtCard";
import { MonthOutlook } from "@/components/MonthOutlook";
import { SummaryCards } from "@/components/SummaryCards";
import { useDebts } from "@/context/DebtContext";
import { useColors } from "@/hooks/useColors";
import type { Debt } from "@/types/debt";
import { MONTHS } from "@/types/debt";
import { isDebtActiveInMonth } from "@/utils/calculations";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { debts } = useDebts();
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

  const totalMonthly = useMemo(
    () => activeDebts.reduce((s, d) => s + d.monthlyPayment, 0),
    [activeDebts],
  );

  const totalRemaining = useMemo(
    () => debts.reduce((s, d) => s + d.remaining, 0),
    [debts],
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
            paddingTop:
              Platform.OS === "web" ? 67 + 16 : insets.top + 16,
            paddingBottom:
              Platform.OS === "web" ? 34 + 80 : insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.subtitle,
                { color: colors.mutedForeground },
              ]}
            >
              Debt Tracker
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              LEDGER
              <Text style={{ color: colors.primary }}>.</Text>
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/add-debt");
            }}
            style={[
              styles.addBtn,
              { backgroundColor: colors.primary },
            ]}
          >
            <Feather
              name="plus"
              size={18}
              color={colors.primaryForeground}
            />
            <Text
              style={[
                styles.addBtnText,
                { color: colors.primaryForeground },
              ]}
            >
              Add
            </Text>
          </Pressable>
        </View>

        <SummaryCards
          totalMonthly={totalMonthly}
          totalRemaining={totalRemaining}
          activeCount={activeDebts.length}
        />

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.mutedForeground },
          ]}
        >
          {MONTHS[now.getMonth()]} {now.getFullYear()} -- Payment Schedule
        </Text>

        {activeDebts.length === 0 ? (
          <View style={styles.empty}>
            <Feather
              name="check-circle"
              size={32}
              color={colors.mutedForeground}
            />
            <Text
              style={[
                styles.emptyText,
                { color: colors.mutedForeground },
              ]}
            >
              No active debts this month
            </Text>
          </View>
        ) : (
          activeDebts.map((d) => (
            <DebtCard key={d.id} debt={d} onEdit={handleEdit} />
          ))
        )}

        <MonthOutlook debts={debts} />

        {inactiveDebts.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.mutedForeground },
              ]}
            >
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
    alignItems: "flex-end",
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
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: "Inter_600SemiBold",
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
