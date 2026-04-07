import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  type DimensionValue,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PayoffSimulator } from "@/components/PayoffSimulator";
import { useDebts } from "@/context/DebtContext";
import { useColors } from "@/hooks/useColors";
import type { Debt } from "@/types/debt";
import { formatCurrency, getMonthsLeft, getProgress } from "@/utils/calculations";

interface Props {
  debt: Debt;
  onEdit: (debt: Debt) => void;
}

export function DebtCard({ debt, onEdit }: Props) {
  const colors = useColors();
  const { deleteDebt } = useDebts();
  const [expanded, setExpanded] = useState(false);

  const monthsLeft = getMonthsLeft(
    debt.startMonth,
    debt.startYear,
    debt.totalMonths,
  );
  const progress = getProgress(
    debt.startMonth,
    debt.startYear,
    debt.totalMonths,
  );

  const handleDelete = () => {
    Alert.alert(
      "Delete Debt",
      `Remove "${debt.name}" from your tracker?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            deleteDebt(debt.id);
          },
        },
      ],
    );
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(!expanded);
      }}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: expanded ? debt.color + "55" : colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[styles.dot, { backgroundColor: debt.color }]}
          />
          <View>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {debt.name}
            </Text>
            <Text
              style={[styles.meta, { color: colors.mutedForeground }]}
            >
              {debt.type === "loan"
                ? `${debt.annualRate}% APR`
                : "BNPL"}{" "}
              · {monthsLeft} mo left
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.amount, { color: debt.color }]}>
            {formatCurrency(debt.monthlyPayment)}
          </Text>
          <Text
            style={[styles.dueDay, { color: colors.mutedForeground }]}
          >
            Due day {debt.dueDay}
          </Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View
          style={[styles.progressBg, { backgroundColor: colors.muted }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: debt.color,
                width: `${progress}%` as DimensionValue,
              },
            ]}
          />
        </View>
        <Text
          style={[styles.progressText, { color: colors.mutedForeground }]}
        >
          {Math.round(progress)}%
        </Text>
      </View>

      {expanded && (
        <View style={styles.detail}>
          <View style={styles.detailRow}>
            {[
              {
                label: "Remaining",
                val: formatCurrency(debt.remaining),
              },
              {
                label: "Total Paid",
                val: formatCurrency(debt.principal - debt.remaining),
              },
              {
                label: "Monthly",
                val: formatCurrency(debt.monthlyPayment),
              },
            ].map((item) => (
              <View
                key={item.label}
                style={[
                  styles.detailCard,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Text
                  style={[
                    styles.detailLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: colors.foreground },
                  ]}
                >
                  {item.val}
                </Text>
              </View>
            ))}
          </View>

          {debt.type === "loan" && <PayoffSimulator debt={debt} />}

          <View style={styles.actions}>
            <Pressable
              onPress={() => onEdit(debt)}
              style={[
                styles.actionBtn,
                { backgroundColor: colors.muted },
              ]}
            >
              <Feather
                name="edit-2"
                size={14}
                color={colors.foreground}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: colors.foreground },
                ]}
              >
                Edit
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={[styles.actionBtn, { backgroundColor: "#2a1111" }]}
            >
              <Feather name="trash-2" size={14} color="#FF6B6B" />
              <Text style={[styles.actionText, { color: "#FF6B6B" }]}>
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  meta: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  amount: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  dueDay: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  detail: {
    marginTop: 14,
  },
  detailRow: {
    flexDirection: "row",
    gap: 8,
  },
  detailCard: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
  },
  detailLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
    fontFamily: "Inter_500Medium",
  },
  detailValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
