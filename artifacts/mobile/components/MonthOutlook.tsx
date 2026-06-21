import React, { useState } from "react";
import {
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Polygon,
  Polyline,
  Stop,
} from "react-native-svg";

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
const PAD_X = 6;
const PAD_TOP = 14;
const PAD_BOTTOM = 6;

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
  const innerW = Math.max(width - PAD_X * 2, 0);
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const step = count > 1 ? innerW / (count - 1) : 0;

  const points = monthData.map((item, i) => {
    const x = PAD_X + step * i;
    const ratio = maxTotal > 0 ? item.rawTotal / maxTotal : 0;
    const y = PAD_TOP + (1 - ratio) * plotH;
    return { x, y, item };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints =
    points.length > 0
      ? `${PAD_X},${CHART_HEIGHT - PAD_BOTTOM} ${linePoints} ${
          PAD_X + step * (count - 1)
        },${CHART_HEIGHT - PAD_BOTTOM}`
      : "";

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.mutedForeground }]}>
        6-Month Outlook
      </Text>

      <View style={styles.chart} onLayout={onLayout}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="outlookArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.primary} stopOpacity={0.22} />
                <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            <Line
              x1={0}
              y1={CHART_HEIGHT - PAD_BOTTOM}
              x2={width}
              y2={CHART_HEIGHT - PAD_BOTTOM}
              stroke={colors.border}
              strokeWidth={1}
            />

            {areaPoints !== "" && (
              <Polygon points={areaPoints} fill="url(#outlookArea)" />
            )}

            <Polyline
              points={linePoints}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {points.map((p, i) => (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={colors.card}
                stroke={colors.primary}
                strokeWidth={2.5}
              />
            ))}
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
    gap: 12,
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
