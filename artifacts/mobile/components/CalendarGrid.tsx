import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Debt } from "@/types/debt";
import { formatCurrency, isDebtActiveInMonth } from "@/utils/calculations";

interface Props {
  debts: Debt[];
  year: number;
  month: number;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarGrid({ debts, year, month }: Props) {
  const colors = useColors();
  const days = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= days; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const now = new Date();
  const isCurrentMonth =
    month === now.getMonth() && year === now.getFullYear();

  const debtsOnDay = (day: number | null): Debt[] => {
    if (!day) return [];
    return debts.filter(
      (d) =>
        d.dueDay === day &&
        isDebtActiveInMonth(d.startMonth, d.startYear, d.totalMonths, month, year),
    );
  };

  return (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                { color: colors.mutedForeground },
              ]}
            >
              {d}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          const hits = debtsOnDay(day);
          const isToday = isCurrentMonth && day === now.getDate();
          return (
            <View
              key={i}
              style={[
                styles.cell,
                {
                  backgroundColor: day
                    ? isToday
                      ? "rgba(232,197,71,0.12)"
                      : colors.card
                    : "transparent",
                  borderColor: isToday
                    ? "rgba(232,197,71,0.4)"
                    : "transparent",
                },
              ]}
            >
              {day !== null && (
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: isToday
                        ? colors.primary
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  {day}
                </Text>
              )}
              {hits.map((d) => (
                <View
                  key={d.id}
                  style={[
                    styles.debtChip,
                    { backgroundColor: d.color },
                  ]}
                >
                  <Text style={styles.chipText} numberOfLines={1}>
                    {d.name}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        {debts.map((d) => (
          <View
            key={d.id}
            style={[
              styles.legendItem,
              { backgroundColor: colors.card },
            ]}
          >
            <View
              style={[
                styles.legendDot,
                { backgroundColor: d.color },
              ]}
            />
            <Text
              style={[
                styles.legendName,
                { color: colors.mutedForeground },
              ]}
            >
              {d.name}
            </Text>
            <Text
              style={[
                styles.legendAmount,
                { color: d.color },
              ]}
            >
              {formatCurrency(d.monthlyPayment)}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={[styles.totalBar, { backgroundColor: colors.card }]}
      >
        <Text
          style={[
            styles.totalLabel,
            { color: colors.mutedForeground },
          ]}
        >
          Total due this month
        </Text>
        <Text style={[styles.totalValue, { color: colors.primary }]}>
          {formatCurrency(
            debts.reduce((s, d) => {
              if (
                isDebtActiveInMonth(
                  d.startMonth,
                  d.startYear,
                  d.totalMonths,
                  month,
                  year,
                )
              ) {
                return s + d.monthlyPayment;
              }
              return s;
            }, 0),
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Inter_500Medium",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.28%",
    minHeight: 52,
    borderRadius: 6,
    padding: 4,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 11,
    marginBottom: 2,
    fontFamily: "Inter_500Medium",
  },
  debtChip: {
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginBottom: 1,
  },
  chipText: {
    fontSize: 7,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  legendAmount: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 14,
  },
  totalLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "Inter_500Medium",
  },
  totalValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});
