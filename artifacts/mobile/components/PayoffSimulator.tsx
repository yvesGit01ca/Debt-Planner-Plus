import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";

import { useColors } from "@/hooks/useColors";
import type { Debt } from "@/types/debt";
import { calcPayoffWithExtra, formatCurrency } from "@/utils/calculations";

interface Props {
  debt: Debt;
}

export function PayoffSimulator({ debt }: Props) {
  const colors = useColors();
  const [extra, setExtra] = useState(0);
  const maxExtra = Math.max(debt.monthlyPayment * 3, 100);

  const base = calcPayoffWithExtra(
    debt.remaining,
    debt.annualRate,
    debt.monthlyPayment,
    0,
  );
  const accelerated = calcPayoffWithExtra(
    debt.remaining,
    debt.annualRate,
    debt.monthlyPayment,
    extra,
  );
  const monthsSaved = base.months - accelerated.months;
  const moneySaved = base.totalPaid - accelerated.totalPaid;

  const stats = [
    {
      label: "Payoff in",
      value: `${accelerated.months} mo`,
      sub: `${Math.floor(accelerated.months / 12)}y ${accelerated.months % 12}m`,
      highlight: false,
    },
    {
      label: "Total paid",
      value: formatCurrency(accelerated.totalPaid),
      highlight: false,
    },
    {
      label: "Months saved",
      value: monthsSaved > 0 ? `-${monthsSaved} mo` : "--",
      highlight: monthsSaved > 0,
    },
    {
      label: "Money saved",
      value: moneySaved > 0.5 ? formatCurrency(moneySaved) : "--",
      highlight: moneySaved > 0.5,
    },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.secondary }]}
    >
      <Text style={[styles.title, { color: colors.mutedForeground }]}>
        Extra monthly contribution
      </Text>
      <View style={styles.sliderRow}>
        <Text style={[styles.dollar, { color: colors.mutedForeground }]}>
          $
        </Text>
        <View style={styles.sliderWrap}>
          <Slider
            minimumValue={0}
            maximumValue={maxExtra}
            step={10}
            value={extra}
            onValueChange={setExtra}
            minimumTrackTintColor={debt.color}
            maximumTrackTintColor={colors.muted}
            thumbTintColor={debt.color}
          />
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.input,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          keyboardType="numeric"
          value={String(Math.round(extra))}
          onChangeText={(t) => {
            const n = parseInt(t) || 0;
            setExtra(Math.min(n, maxExtra));
          }}
        />
      </View>
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={[styles.statCard, { backgroundColor: colors.card }]}
          >
            <Text
              style={[
                styles.statLabel,
                { color: colors.mutedForeground },
              ]}
            >
              {stat.label}
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: stat.highlight ? colors.accent : colors.foreground,
                },
              ]}
            >
              {stat.value}
            </Text>
            {stat.sub && (
              <Text
                style={[
                  styles.statSub,
                  { color: colors.mutedForeground },
                ]}
              >
                {stat.sub}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 12,
    marginBottom: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.24,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  dollar: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  sliderWrap: {
    flex: 1,
  },
  input: {
    width: 70,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: "right",
    fontFamily: "Inter_500Medium",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    width: "47%",
    borderRadius: 12,
    padding: 10,
  },
  statLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: "Inter_500Medium",
  },
  statValue: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  statSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.24,
  },
});
