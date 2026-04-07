import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { CurrencyTotal } from "@/utils/calculations";
import { formatCurrency, formatCurrencyTotals } from "@/utils/calculations";

interface Props {
  monthlyTotals: CurrencyTotal[];
  remainingTotals: CurrencyTotal[];
  activeCount: number;
}

export function SummaryCards({
  monthlyTotals,
  remainingTotals,
  activeCount,
}: Props) {
  const colors = useColors();

  const monthlyFormatted = formatCurrencyTotals(monthlyTotals);
  const monthlyDisplay = monthlyFormatted || formatCurrency(0);
  const remainingFormatted = formatCurrencyTotals(remainingTotals);
  const remainingDisplay = remainingFormatted || formatCurrency(0);

  const items = [
    {
      label: "Due This Month",
      value: monthlyDisplay,
      accent: colors.primary,
    },
    {
      label: "Total Remaining",
      value: remainingDisplay,
      accent: colors.destructive,
    },
    {
      label: "Active Debts",
      value: String(activeCount),
      accent: colors.accent,
    },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.card, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            {item.label}
          </Text>
          <Text
            style={[styles.value, { color: item.accent }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
  },
  label: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: "Inter_500Medium",
  },
  value: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});
