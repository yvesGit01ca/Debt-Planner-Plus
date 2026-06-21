import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BillForm } from "@/components/BillForm";
import { useDebts } from "@/context/DebtContext";
import { useColors } from "@/hooks/useColors";
import type { Bill } from "@/types/bill";

const VALID_ID_PATTERN = /^[a-zA-Z0-9]{1,50}$/;

function validateEditId(raw: string | string[] | undefined): string | null {
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  if (!VALID_ID_PATTERN.test(value)) return null;
  return value;
}

function safeInt(
  raw: string | string[] | undefined,
  min: number,
  max: number,
): number | undefined {
  if (!raw) return undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(value, 10);
  if (isNaN(n) || n < min || n > max) return undefined;
  return n;
}

export default function AddBillScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bills, addBill, updateBill } = useDebts();
  const params = useLocalSearchParams<{ editId?: string; prefillDay?: string }>();

  const safeEditId = validateEditId(params.editId);
  const editingBill = safeEditId
    ? bills.find((b) => b.id === safeEditId) ?? null
    : null;

  const prefill = useMemo(() => {
    if (editingBill) return undefined;
    const dayOfMonth = safeInt(params.prefillDay, 1, 31);
    if (dayOfMonth === undefined) return undefined;
    return { dayOfMonth };
  }, [params.prefillDay, editingBill]);

  const handleSave = (
    data: Omit<Bill, "id"> & Partial<Pick<Bill, "id">>,
  ) => {
    if (editingBill && data.id) {
      updateBill({ ...editingBill, ...data, id: data.id });
    } else {
      const { id: _omit, ...rest } = data;
      addBill(rest);
    }
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Platform.OS === "web" ? 67 + 16 : insets.top + 16,
            paddingBottom: Platform.OS === "web" ? 34 + 20 : insets.bottom + 20,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.primary }]}>
          {editingBill ? "Edit Bill" : "New Bill"}
        </Text>
        <BillForm
          key={editingBill?.id ?? "new"}
          initial={editingBill}
          prefill={prefill}
          onSave={handleSave}
          onCancel={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  title: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 16,
  },
});
