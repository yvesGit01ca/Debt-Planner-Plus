import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { RADII } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import type { CurrencyTotal } from "@/utils/calculations";
import { formatCurrency, formatCurrencyTotals } from "@/utils/calculations";

export interface SummaryItem {
  label: string;
  totals: CurrencyTotal[];
  accent: string;
}

interface Props {
  items: SummaryItem[];
}

export function SummaryCards({ items }: Props) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      {items.map((item) => {
        const formatted = formatCurrencyTotals(item.totals) || formatCurrency(0);
        return (
          <View
            key={item.label}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...colors.cardShadow,
              },
            ]}
          >
            <View style={[styles.accentBar, { backgroundColor: item.accent }]} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              {item.label}
            </Text>
            <Text
              style={[styles.value, { color: colors.foreground }]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {formatted}
            </Text>
          </View>
        );
      })}
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
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  label: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: "Inter_500Medium",
  },
  value: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
});
