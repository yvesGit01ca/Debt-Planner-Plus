import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { CurrencyPicker } from "@/components/CurrencyPicker";
import { RADII } from "@/constants/colors";
import { DEFAULT_CURRENCY, getCurrencySymbol } from "@/constants/currencies";
import { useDebts } from "@/context/DebtContext";
import { useColors } from "@/hooks/useColors";
import type { Bill, BillCategory } from "@/types/bill";
import {
  BILL_CATEGORIES,
  getCategoryColor,
  MAX_BILL_NAME_LENGTH,
} from "@/types/bill";
import { formatCurrency } from "@/utils/calculations";

interface Props {
  initial?: Bill | null;
  prefill?: { dayOfMonth?: number };
  onSave: (data: Omit<Bill, "id"> & Partial<Pick<Bill, "id">>) => void;
  onCancel: () => void;
}

interface ValidationErrors {
  name?: string;
  amount?: string;
  dayOfMonth?: string;
}

const NUMERIC_FLOAT = /^-?\d+(\.\d+)?$/;
const NUMERIC_INT = /^\d+$/;

function sanitize(input: string): string {
  return input.replace(/[<>&"']/g, "").trim();
}

export function BillForm({ initial, prefill, onSave, onCancel }: Props) {
  const colors = useColors();
  const { profile } = useDebts();

  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [currency, setCurrency] = useState(
    initial?.currency ?? profile.defaultCurrency ?? DEFAULT_CURRENCY,
  );
  const [category, setCategory] = useState<BillCategory>(
    initial?.category ?? "Housing",
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    initial
      ? String(initial.dayOfMonth)
      : prefill?.dayOfMonth !== undefined
        ? String(prefill.dayOfMonth)
        : "",
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const sym = getCurrencySymbol(currency);

  const previewAmount = useMemo(() => parseFloat(amount) || 0, [amount]);

  const validate = (): ValidationErrors => {
    const e: ValidationErrors = {};
    const cleanName = sanitize(name);
    if (!cleanName) e.name = "Name is required";
    else if (cleanName.length > MAX_BILL_NAME_LENGTH)
      e.name = `Keep it under ${MAX_BILL_NAME_LENGTH} characters`;

    if (!amount.trim()) e.amount = "Amount is required";
    else if (!NUMERIC_FLOAT.test(amount.trim())) e.amount = "Enter a valid number";
    else if (parseFloat(amount) <= 0) e.amount = "Must be greater than zero";
    else if (parseFloat(amount) > 10_000_000) e.amount = "Maximum 10,000,000";

    if (!dayOfMonth.trim()) e.dayOfMonth = "Required";
    else if (!NUMERIC_INT.test(dayOfMonth.trim())) e.dayOfMonth = "Whole number";
    else {
      const d = parseInt(dayOfMonth, 10);
      if (d < 1 || d > 31) e.dayOfMonth = "Must be 1-31";
    }
    return e;
  };

  const handleSave = () => {
    setSubmitted(true);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      name: sanitize(name),
      amount: Math.round(parseFloat(amount) * 100) / 100,
      currency,
      category,
      dayOfMonth: Math.min(31, Math.max(1, parseInt(dayOfMonth, 10) || 1)),
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Bill Name
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.input,
              color: colors.foreground,
              borderColor:
                submitted && errors.name ? colors.destructive : colors.border,
            },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Rent, Netflix"
          placeholderTextColor={colors.mutedForeground}
          keyboardAppearance={colors.scheme}
        />
        {submitted && errors.name && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {errors.name}
          </Text>
        )}
      </View>

      <CurrencyPicker selected={currency} onSelect={setCurrency} label="Currency" />

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Amount ({sym})
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.money,
              {
                backgroundColor: colors.input,
                color: colors.foreground,
                borderColor:
                  submitted && errors.amount
                    ? colors.destructive
                    : colors.border,
              },
            ]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor={colors.mutedForeground}
            keyboardAppearance={colors.scheme}
          />
          {submitted && errors.amount && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {errors.amount}
            </Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Due Day
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.money,
              {
                backgroundColor: colors.input,
                color: colors.foreground,
                borderColor:
                  submitted && errors.dayOfMonth
                    ? colors.destructive
                    : colors.border,
              },
            ]}
            value={dayOfMonth}
            onChangeText={setDayOfMonth}
            placeholder="1"
            keyboardType="numeric"
            placeholderTextColor={colors.mutedForeground}
            keyboardAppearance={colors.scheme}
          />
          {submitted && errors.dayOfMonth && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {errors.dayOfMonth}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Category
        </Text>
        <View style={styles.categoryWrap}>
          {BILL_CATEGORIES.map((c) => {
            const selected = category === c;
            const dot = getCategoryColor(c);
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selected ? colors.primarySoft : colors.input,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={[styles.categoryDot, { backgroundColor: dot }]} />
                <Text
                  style={[
                    styles.categoryText,
                    { color: selected ? colors.primary : colors.foreground },
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {previewAmount > 0 && (
        <View style={[styles.estimate, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.estimateLabel, { color: colors.mutedForeground }]}>
            Recurring monthly
          </Text>
          <Text style={[styles.estimateValue, { color: colors.foreground }]}>
            {formatCurrency(previewAmount, currency)}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          style={[
            styles.cancelBtn,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cancelText, { color: colors.secondaryForeground }]}>
            Cancel
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="check" size={16} color={colors.primaryForeground} />
          <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
            Save
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  field: { flex: 1, marginBottom: 16 },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.24,
  },
  money: { fontVariant: ["tabular-nums"] },
  errorText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  row: { flexDirection: "row", gap: 10 },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  estimate: {
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: 24,
  },
  estimateLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: "Inter_500Medium",
  },
  estimateValue: {
    fontSize: 22,
    fontFamily: "Inter_300Light",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: RADII.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  saveText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
