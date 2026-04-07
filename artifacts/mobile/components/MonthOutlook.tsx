import React from "react";
import { type DimensionValue, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Debt } from "@/types/debt";
import { MONTHS } from "@/types/debt";
import { formatCurrency, isDebtActiveInMonth } from "@/utils/calculations";

interface Props {
  debts: Debt[];
}

export function MonthOutlook({ debts }: Props) {
  const colors = useColors();
  const now = new Date();

  const monthData = Array.from({ length: 6 }, (_, i) => {
    let m = now.getMonth() + i;
    let y = now.getFullYear();
    if (m > 11) {
      m -= 12;
      y++;
    }
    const total = debts.reduce((s, d) => {
      if (isDebtActiveInMonth(d.startMonth, d.startYear, d.totalMonths, m, y)) {
        return s + d.monthlyPayment;
      }
      return s;
    }, 0);
    return { month: MONTHS[m], total };
  });

  const maxTotal =
    Math.max(...monthData.map((d) => d.total), 1);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.mutedForeground }]}>
        6-Month Outlook
      </Text>
      {monthData.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text
            style={[styles.monthLabel, { color: colors.mutedForeground }]}
          >
            {item.month}
          </Text>
          <View
            style={[styles.barBg, { backgroundColor: colors.card }]}
          >
            <View
              style={[
                styles.barFill,
                {
                  backgroundColor: colors.primary,
                  width: `${(item.total / maxTotal) * 100}%` as DimensionValue,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.amount,
              {
                color: item.total > 0
                  ? colors.foreground
                  : colors.mutedForeground,
              },
            ]}
          >
            {item.total > 0 ? formatCurrency(item.total) : "--"}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  title: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: "Inter_600SemiBold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  monthLabel: {
    width: 32,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  amount: {
    width: 72,
    fontSize: 12,
    textAlign: "right",
    fontFamily: "Inter_700Bold",
  },
});
