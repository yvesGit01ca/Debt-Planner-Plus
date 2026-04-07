import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/utils/calculations";

interface Props {
  totalMonthly: number;
  totalRemaining: number;
  activeCount: number;
}

export function SummaryCards({
  totalMonthly,
  totalRemaining,
  activeCount,
}: Props) {
  const colors = useColors();
  const items = [
    {
      label: "Due This Month",
      value: formatCurrency(totalMonthly),
      accent: colors.primary,
    },
    {
      label: "Total Remaining",
      value: formatCurrency(totalRemaining),
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
          <Text style={[styles.value, { color: item.accent }]}>
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
