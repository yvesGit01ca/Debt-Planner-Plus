import { router, useLocalSearchParams } from "expo-router";
import React from "react";
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

export default function AddDebtScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { debts, addDebt, updateDebt } = useDebts();
  const params = useLocalSearchParams<{ editId?: string }>();

  const editingDebt = params.editId
    ? debts.find((d) => d.id === params.editId) ?? null
    : null;

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
