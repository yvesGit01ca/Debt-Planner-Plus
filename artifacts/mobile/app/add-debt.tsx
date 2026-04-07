import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DebtForm } from "@/components/DebtForm";
import { useDebts } from "@/context/DebtContext";
import { useColors } from "@/hooks/useColors";
import type { Debt } from "@/types/debt";

const VALID_ID_PATTERN = /^[a-zA-Z0-9]{1,50}$/;

function validateEditId(raw: string | string[] | undefined): string | null {
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  if (!VALID_ID_PATTERN.test(value)) return null;
  return value;
}

function safeInt(raw: string | string[] | undefined, min: number, max: number): number | undefined {
  if (!raw) return undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(value, 10);
  if (isNaN(n) || n < min || n > max) return undefined;
  return n;
}

export default function AddDebtScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { debts, addDebt, updateDebt } = useDebts();
  const params = useLocalSearchParams<{
    editId?: string;
    prefillDay?: string;
    prefillMonth?: string;
    prefillYear?: string;
  }>();

  const safeEditId = validateEditId(params.editId);
  const editingDebt = safeEditId
    ? debts.find((d) => d.id === safeEditId) ?? null
    : null;

  const prefill = useMemo(() => {
    if (editingDebt) return undefined;
    const dueDay = safeInt(params.prefillDay, 1, 31);
    const startMonth = safeInt(params.prefillMonth, 0, 11);
    const startYear = safeInt(params.prefillYear, 2000, 2100);
    if (dueDay === undefined && startMonth === undefined && startYear === undefined) {
      return undefined;
    }
    return { dueDay, startMonth, startYear };
  }, [params.prefillDay, params.prefillMonth, params.prefillYear, editingDebt]);

  const handleSave = (
    data: Omit<Debt, "id" | "color" | "monthlyPayment"> &
      Partial<Pick<Debt, "id" | "color">>,
  ) => {
    if (editingDebt && data.id) {
      updateDebt({
        ...editingDebt,
        ...data,
        id: data.id,
        color: data.color ?? editingDebt.color,
        monthlyPayment: editingDebt.monthlyPayment,
      });
    } else {
      addDebt(data);
    }
    router.back();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop:
              Platform.OS === "web" ? 67 + 16 : insets.top + 16,
            paddingBottom:
              Platform.OS === "web" ? 34 + 20 : insets.bottom + 20,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.primary }]}>
          {editingDebt ? "Edit Debt" : "New Debt"}
        </Text>
        <DebtForm
          initial={editingDebt}
          prefill={prefill}
          onSave={handleSave}
          onCancel={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 16,
  },
});
