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

import { useColors } from "@/hooks/useColors";
import type { Debt } from "@/types/debt";
import { MONTHS } from "@/types/debt";
import { calcMonthlyPayment, formatCurrency } from "@/utils/calculations";

interface Props {
  initial?: Debt | null;
  onSave: (data: Omit<Debt, "id" | "color" | "monthlyPayment"> & Partial<Pick<Debt, "id" | "color">>) => void;
  onCancel: () => void;
}

interface ValidationErrors {
  name?: string;
  principal?: string;
  remaining?: string;
  annualRate?: string;
  totalMonths?: string;
  dueDay?: string;
  startYear?: string;
}

function validateForm(fields: {
  name: string;
  type: "loan" | "bnpl";
  principal: string;
  remaining: string;
  annualRate: string;
  totalMonths: string;
  dueDay: string;
  startYear: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Name is required";
  } else if (fields.name.trim().length > 100) {
    errors.name = "Name must be 100 characters or less";
  }

  const principalVal = parseFloat(fields.principal);
  if (!fields.principal) {
    errors.principal = "Principal is required";
  } else if (isNaN(principalVal) || principalVal <= 0) {
    errors.principal = "Must be a positive number";
  } else if (principalVal > 10_000_000) {
    errors.principal = "Maximum $10,000,000";
  }

  if (fields.remaining) {
    const remainingVal = parseFloat(fields.remaining);
    if (isNaN(remainingVal) || remainingVal < 0) {
      errors.remaining = "Must be zero or positive";
    } else if (remainingVal > 10_000_000) {
      errors.remaining = "Maximum $10,000,000";
    }
  }

  if (fields.type === "loan") {
    const rateVal = parseFloat(fields.annualRate);
    if (!fields.annualRate) {
      errors.annualRate = "Rate is required for loans";
    } else if (isNaN(rateVal) || rateVal < 0) {
      errors.annualRate = "Must be zero or positive";
    } else if (rateVal > 100) {
      errors.annualRate = "Maximum 100%";
    }
  }

  const monthsVal = parseInt(fields.totalMonths, 10);
  if (!fields.totalMonths) {
    errors.totalMonths = "Required";
  } else if (isNaN(monthsVal) || monthsVal < 1) {
    errors.totalMonths = "At least 1 month";
  } else if (monthsVal > 600) {
    errors.totalMonths = "Maximum 600 months";
  }

  const dayVal = parseInt(fields.dueDay, 10);
  if (!fields.dueDay) {
    errors.dueDay = "Required";
  } else if (isNaN(dayVal) || dayVal < 1 || dayVal > 31) {
    errors.dueDay = "Must be 1-31";
  }

  const yearVal = parseInt(fields.startYear, 10);
  if (!fields.startYear) {
    errors.startYear = "Required";
  } else if (isNaN(yearVal) || yearVal < 2000 || yearVal > 2100) {
    errors.startYear = "2000-2100";
  }

  return errors;
}

export function DebtForm({ initial, onSave, onCancel }: Props) {
  const colors = useColors();
  const now = new Date();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"loan" | "bnpl">(
    initial?.type ?? "loan",
  );
  const [principal, setPrincipal] = useState(
    initial ? String(initial.principal) : "",
  );
  const [remaining, setRemaining] = useState(
    initial ? String(initial.remaining) : "",
  );
  const [annualRate, setAnnualRate] = useState(
    initial ? String(initial.annualRate) : "",
  );
  const [totalMonths, setTotalMonths] = useState(
    initial ? String(initial.totalMonths) : "",
  );
  const [dueDay, setDueDay] = useState(
    initial ? String(initial.dueDay) : "",
  );
  const [startMonth, setStartMonth] = useState(
    initial?.startMonth ?? now.getMonth(),
  );
  const [startYear, setStartYear] = useState(
    initial ? String(initial.startYear) : String(now.getFullYear()),
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const monthlyPayment = useMemo(() => {
    const p = parseFloat(remaining || principal) || 0;
    const r = parseFloat(annualRate) || 0;
    const m = parseInt(totalMonths) || 1;
    if (type === "bnpl") return p / m;
    return calcMonthlyPayment(p, r, m);
  }, [remaining, principal, annualRate, totalMonths, type]);

  const handleSave = () => {
    setSubmitted(true);
    const validationErrors = validateForm({
      name,
      type,
      principal,
      remaining,
      annualRate,
      totalMonths,
      dueDay,
      startYear,
    });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      ...(initial?.color ? { color: initial.color } : {}),
      name: name.trim(),
      type,
      principal: parseFloat(principal) || 0,
      remaining: parseFloat(remaining || principal) || 0,
      annualRate: type === "loan" ? parseFloat(annualRate) || 0 : 0,
      totalMonths: parseInt(totalMonths) || 1,
      dueDay: Math.min(31, Math.max(1, parseInt(dueDay) || 1)),
      startMonth,
      startYear: parseInt(startYear) || now.getFullYear(),
    });
  };

  const renderField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: { placeholder?: string; keyboard?: "numeric" | "default"; errorKey?: keyof ValidationErrors },
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            color: colors.foreground,
            borderColor: submitted && opts?.errorKey && errors[opts.errorKey]
              ? colors.destructive
              : colors.border,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={opts?.placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={opts?.keyboard ?? "default"}
        keyboardAppearance="dark"
      />
      {submitted && opts?.errorKey && errors[opts.errorKey] && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          {errors[opts.errorKey]}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {renderField("Debt Name", name, setName, {
        placeholder: "e.g. iPhone Installment",
        errorKey: "name",
      })}

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Type
        </Text>
        <View style={styles.typeRow}>
          {(["loan", "bnpl"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[
                styles.typeBtn,
                {
                  backgroundColor:
                    type === t ? colors.primary : colors.input,
                  borderColor:
                    type === t ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  {
                    color:
                      type === t
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {t === "loan" ? "Loan" : "BNPL"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        {renderField("Principal ($)", principal, setPrincipal, {
          placeholder: "5000",
          keyboard: "numeric",
          errorKey: "principal",
        })}
        {renderField("Remaining ($)", remaining, setRemaining, {
          placeholder: "5000",
          keyboard: "numeric",
          errorKey: "remaining",
        })}
      </View>

      <View style={styles.row}>
        {type === "loan" &&
          renderField("Annual Rate (%)", annualRate, setAnnualRate, {
            placeholder: "8.5",
            keyboard: "numeric",
            errorKey: "annualRate",
          })}
        {renderField("Months Left", totalMonths, setTotalMonths, {
          placeholder: "36",
          keyboard: "numeric",
          errorKey: "totalMonths",
        })}
      </View>

      <View style={styles.row}>
        {renderField("Due Day", dueDay, setDueDay, {
          placeholder: "15",
          keyboard: "numeric",
          errorKey: "dueDay",
        })}
        {renderField("Start Year", startYear, setStartYear, {
          placeholder: String(now.getFullYear()),
          keyboard: "numeric",
          errorKey: "startYear",
        })}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Start Month
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthRow}
        >
          {MONTHS.map((m, i) => (
            <Pressable
              key={i}
              onPress={() => setStartMonth(i)}
              style={[
                styles.monthBtn,
                {
                  backgroundColor:
                    startMonth === i ? colors.primary : colors.input,
                  borderColor:
                    startMonth === i ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.monthBtnText,
                  {
                    color:
                      startMonth === i
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {m}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {monthlyPayment > 0 && (
        <View
          style={[
            styles.estimate,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Text
            style={[
              styles.estimateLabel,
              { color: colors.mutedForeground },
            ]}
          >
            Estimated monthly payment
          </Text>
          <Text
            style={[
              styles.estimateValue,
              { color: colors.foreground },
            ]}
          >
            {formatCurrency(monthlyPayment)}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          style={[
            styles.cancelBtn,
            { borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.cancelText,
              { color: colors.mutedForeground },
            ]}
          >
            Cancel
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          style={[
            styles.saveBtn,
            { backgroundColor: colors.primary },
          ]}
        >
          <Feather
            name="check"
            size={16}
            color={colors.primaryForeground}
          />
          <Text
            style={[
              styles.saveText,
              { color: colors.primaryForeground },
            ]}
          >
            Save
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  field: {
    flex: 1,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
  },
  typeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  monthRow: {
    gap: 6,
  },
  monthBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthBtnText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  estimate: {
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  estimateLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  estimateValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 12,
  },
  saveText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
