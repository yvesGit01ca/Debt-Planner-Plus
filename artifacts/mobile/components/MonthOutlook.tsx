import React, { useState } from "react";
import {
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Line, Rect } from "react-native-svg";

import { RADII } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import type { Bill } from "@/types/bill";
import type { Debt } from "@/types/debt";
import { MONTHS } from "@/types/debt";
import {
  combineTotals,
  formatCurrencyCompact,
  groupBillTotalsByCurrency,
  groupTotalsByCurrency,
  isDebtActiveInMonth,
} from "@/utils/calculations";

interface Props {
  debts: Debt[];
  bills: Bill[];
}

const CHART_HEIGHT = 140;
const BAR_RADIUS = 4;
const BAR_GAP = 12;

export function MonthOutlook({ debts, bills }: Props) {
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const now = new Date();

  const billTotals = groupBillTotalsByCurrency(bills);
  const billRaw = bills.reduce((s, b) => s + b.amount, 0);

  const monthData = Array.from({ length: 6 }, (_, i) => {
    let m = now.getMonth() + i;
    let y = now.getFullYear();
    if (m > 11) {
      m -= 12;
      y++;
    }
    const activeDebts = debts.filter((d) =>
      isDebtActiveInMonth(d.startMonth, d.startYear, d.totalMonths, m, y),
    );
    const debtTotals = groupTotalsByCurrency(activeDebts, (d) => d.monthlyPayment);
    const totals = combineTotals(debtTotals, billTotals);
    const rawTotal =
      activeDebts.reduce((s, d) => s + d.monthlyPayment, 0) + billRaw;
    return { month: MONTHS[m], totals, rawTotal };
  });

  const maxTotal = Math.max(...monthData.map((d) => d.rawTotal), 1);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const count = monthData.length;
  const barWidth =
    width > 0 ? (width - BAR_GAP * (count - 1)) / count : 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.mutedForeground }]}>
        6-Month Outlook
      </Text>

      <View style={styles.chart} onLayout={onLayout}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            <Line
              x1={0}
              y1={CHART_HEIGHT - 0.5}
              x2={width}
              y2={CHART_HEIGHT - 0.5}
              stroke={colors.border}
              strokeWidth={1}
            />
            {monthData.map((item, i) => {
              const h =
                item.rawTotal > 0
                  ? Math.max((item.rawTotal / maxTotal) * CHART_HEIGHT, 3)
                  : 0;
              const x = i * (barWidth + BAR_GAP);
              const y = CHART_HEIGHT - h;
              return (
                <Rect
                  key={i}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx={BAR_RADIUS}
                  fill={item.rawTotal > 0 ? colors.primary : colors.muted}
                />
              );
            })}
          </Svg>
        )}
      </View>

      <View style={styles.labelRow}>
        {monthData.map((item, i) => (
          <View key={i} style={styles.labelCol}>
            <Text
              style={[
                styles.amount,
                {
                  color:
                    item.rawTotal > 0
                      ? colors.foreground
                      : colors.mutedForeground,
                },
              ]}
              numberOfLines={item.totals.length > 1 ? 2 : 1}
              adjustsFontSizeToFit
            >
              {item.totals.length > 0
                ? item.totals
                    .map((t) => formatCurrencyCompact(t.total, t.currency))
                    .join("\n")
                : "--"}
            </Text>
            <Text
              style={[styles.monthLabel, { color: colors.mutedForeground }]}
            >
              {item.month}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  title: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 16,
    fontFamily: "Inter_600SemiBold",
  },
  chart: {
    height: CHART_HEIGHT,
    width: "100%",
    borderRadius: RADII.sm,
  },
  labelRow: {
    flexDirection: "row",
    gap: BAR_GAP,
    marginTop: 8,
  },
  labelCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  amount: {
    fontSize: 11,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  monthLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
