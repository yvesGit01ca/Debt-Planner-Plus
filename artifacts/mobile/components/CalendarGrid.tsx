import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RADII } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import type { Bill } from "@/types/bill";
import { getCategoryColor } from "@/types/bill";
import type { Debt } from "@/types/debt";
import {
  combineTotals,
  effectiveDayInMonth,
  formatCurrency,
  groupBillTotalsByCurrency,
  groupTotalsByCurrency,
  isDebtActiveInMonth,
} from "@/utils/calculations";

interface Props {
  debts: Debt[];
  bills: Bill[];
  year: number;
  month: number;
  selectedDay?: number | null;
  onSelectDay?: (day: number) => void;
  hideSummary?: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarGrid({
  debts,
  bills,
  year,
  month,
  selectedDay,
  onSelectDay,
  hideSummary,
}: Props) {
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

  const dotsOnDay = (day: number | null): string[] => {
    if (!day) return [];
    const debtDots = debts
      .filter(
        (d) =>
          d.dueDay === day &&
          isDebtActiveInMonth(
            d.startMonth,
            d.startYear,
            d.totalMonths,
            month,
            year,
          ),
      )
      .map((d) => d.color);
    const billDots = bills
      .filter((b) => effectiveDayInMonth(b.dayOfMonth, year, month) === day)
      .map((b) => getCategoryColor(b.category));
    return [...debtDots, ...billDots];
  };

  const handleDayPress = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDay?.(day);
  };

  return (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: colors.mutedForeground }]}>
              {d}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          const dots = dotsOnDay(day);
          const isToday = isCurrentMonth && day === now.getDate();
          const isSelected = day !== null && day === selectedDay;

          const bgColor = day
            ? isSelected
              ? colors.primarySoft
              : isToday
                ? colors.primarySoft
                : colors.card
            : "transparent";

          const borderCol = isSelected
            ? colors.primary
            : isToday
              ? colors.primary + "66"
              : colors.border;

          const dayColor =
            isSelected || isToday ? colors.primary : colors.foreground;

          const cellContent = (
            <>
              {day !== null && (
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: dayColor,
                      fontFamily: isSelected
                        ? "Inter_700Bold"
                        : "Inter_500Medium",
                    },
                  ]}
                >
                  {day}
                </Text>
              )}
              {dots.length > 0 && (
                <View style={styles.dotRow}>
                  {dots.slice(0, 4).map((color, idx) => (
                    <View
                      key={idx}
                      style={[styles.debtDot, { backgroundColor: color }]}
                    />
                  ))}
                </View>
              )}
            </>
          );

          if (day !== null) {
            return (
              <Pressable
                key={i}
                onPress={() => handleDayPress(day)}
                style={[
                  styles.cell,
                  { backgroundColor: bgColor, borderColor: borderCol },
                ]}
              >
                {cellContent}
              </Pressable>
            );
          }

          return (
            <View
              key={i}
              style={[
                styles.cell,
                { backgroundColor: "transparent", borderColor: "transparent" },
              ]}
            >
              {cellContent}
            </View>
          );
        })}
      </View>

      {!hideSummary && (
        <>
          <View style={styles.legend}>
            {debts.map((d) => (
              <View
                key={d.id}
                style={[
                  styles.legendItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                <Text
                  style={[styles.legendName, { color: colors.mutedForeground }]}
                >
                  {d.name}
                </Text>
              </View>
            ))}
            {bills.map((b) => (
              <View
                key={b.id}
                style={[
                  styles.legendItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: getCategoryColor(b.category) },
                  ]}
                />
                <Text
                  style={[styles.legendName, { color: colors.mutedForeground }]}
                >
                  {b.name}
                </Text>
              </View>
            ))}
          </View>

          {(() => {
            const activeDebts = debts.filter((d) =>
              isDebtActiveInMonth(
                d.startMonth,
                d.startYear,
                d.totalMonths,
                month,
                year,
              ),
            );
            const totals = combineTotals(
              groupTotalsByCurrency(activeDebts, (d) => d.monthlyPayment),
              groupBillTotalsByCurrency(bills),
            );
            return (
              <View
                style={[
                  styles.totalBar,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    ...colors.cardShadow,
                  },
                ]}
              >
                <Text
                  style={[styles.totalLabel, { color: colors.mutedForeground }]}
                >
                  Total due this month
                </Text>
                <View style={styles.totalValues}>
                  {totals.length > 0 ? (
                    totals.map((t) => (
                      <Text
                        key={t.currency}
                        style={[styles.totalValue, { color: colors.foreground }]}
                      >
                        {formatCurrency(t.total, t.currency)}
                      </Text>
                    ))
                  ) : (
                    <Text
                      style={[styles.totalValue, { color: colors.foreground }]}
                    >
                      {formatCurrency(0)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })()}
        </>
      )}
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
    borderRadius: RADII.md,
    padding: 4,
    borderWidth: 1,
    alignItems: "center",
  },
  dayText: {
    fontSize: 11,
    marginBottom: 2,
    fontFamily: "Inter_500Medium",
    fontVariant: ["tabular-nums"],
  },
  dotRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  debtDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.24,
  },
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "Inter_500Medium",
  },
  totalValues: {
    alignItems: "flex-end" as const,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
});
