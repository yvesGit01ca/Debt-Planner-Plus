import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CurrencyPicker } from "@/components/CurrencyPicker";
import { RADII } from "@/constants/colors";
import { useDebts } from "@/context/DebtContext";
import { useThemeMode, type ThemeMode } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { mode: "light", label: "Light", icon: "sun" },
  { mode: "dark", label: "Dark", icon: "moon" },
  { mode: "system", label: "System", icon: "smartphone" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mode, setMode } = useThemeMode();
  const { profile, updateProfile, clearAllData } = useDebts();

  const [currency, setCurrency] = useState(profile.defaultCurrency || "USD");
  const [salary, setSalary] = useState(String(profile.monthlySalary || ""));
  const [revenue, setRevenue] = useState(
    String(profile.additionalRevenue || ""),
  );
  // Only fields the user actually edited on this screen are eligible for
  // auto-save, so we never overwrite newer values saved elsewhere (e.g. the
  // Forecast income editor) with stale local state.
  const [touched, setTouched] = useState(false);

  const incomeDirty =
    touched &&
    (salary !== String(profile.monthlySalary || "") ||
      revenue !== String(profile.additionalRevenue || ""));

  const handleSalaryChange = (v: string) => {
    setTouched(true);
    setSalary(v);
  };

  const handleRevenueChange = (v: string) => {
    setTouched(true);
    setRevenue(v);
  };

  const persistIncome = (nextSalary: string, nextRevenue: string) => {
    updateProfile({
      ...profile,
      monthlySalary: parseFloat(nextSalary) || 0,
      additionalRevenue: parseFloat(nextRevenue) || 0,
    });
  };

  const handleSaveIncome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    persistIncome(salary, revenue);
    setTouched(false);
  };

  // Auto-save any pending income edits when leaving this screen, so switching
  // tabs never silently discards changes on platforms where TextInput onBlur
  // doesn't fire. A ref keeps the latest values without re-running the effect.
  const autosaveRef = useRef<() => void>(() => {});
  autosaveRef.current = () => {
    if (incomeDirty) persistIncome(salary, revenue);
  };
  // A ref lets the focus effect read the current dirty state without listing it
  // as a dependency (which would re-run the effect on every keystroke).
  const incomeDirtyRef = useRef(incomeDirty);
  incomeDirtyRef.current = incomeDirty;
  useFocusEffect(
    useCallback(() => {
      // When the screen regains focus, pull in the latest stored profile values
      // so income changed elsewhere (e.g. the Forecast income editor) is
      // reflected here — but never clobber unsaved local edits the user is
      // still working on.
      // The currency picker saves immediately on selection, so there's never an
      // unsaved local edit to protect — always pull the latest stored value so a
      // change made in the Forecast income editor is reflected here.
      setCurrency(profile.defaultCurrency || "USD");
      if (!incomeDirtyRef.current) {
        setSalary(String(profile.monthlySalary || ""));
        setRevenue(String(profile.additionalRevenue || ""));
        setTouched(false);
      }
      return () => {
        autosaveRef.current();
      };
    }, [profile.defaultCurrency, profile.monthlySalary, profile.additionalRevenue]),
  );

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    updateProfile({ ...profile, defaultCurrency: code });
  };

  const handleReset = () => {
    Alert.alert(
      "Clear all data",
      "This permanently removes all debts, bills, and your income profile, restoring the app to its defaults. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear everything",
          style: "destructive",
          onPress: () => {
            clearAllData();
            setCurrency("USD");
            setSalary("");
            setRevenue("");
            setTouched(false);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === "web" ? 67 + 16 : insets.top + 16,
            paddingBottom: Platform.OS === "web" ? 34 + 80 : insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Settings
        </Text>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          Appearance
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...colors.cardShadow,
            },
          ]}
        >
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Theme
          </Text>
          <View style={styles.segment}>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  onPress={() => setMode(opt.mode)}
                  style={[
                    styles.segmentItem,
                    {
                      backgroundColor: active ? colors.primary : colors.input,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={opt.icon}
                    size={15}
                    color={active ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: active
                          ? colors.primaryForeground
                          : colors.foreground,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Currency */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          Currency
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...colors.cardShadow,
            },
          ]}
        >
          <CurrencyPicker
            selected={currency}
            onSelect={handleCurrencyChange}
            label="Default Currency"
          />
        </View>

        {/* Income */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          Income
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...colors.cardShadow,
            },
          ]}
        >
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Monthly Salary
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              value={salary}
              onChangeText={handleSalaryChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              keyboardAppearance={colors.scheme}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Additional Revenue
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              value={revenue}
              onChangeText={handleRevenueChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              keyboardAppearance={colors.scheme}
            />
          </View>
          {incomeDirty && (
            <View style={styles.saveRow}>
              <Text style={[styles.unsavedHint, { color: colors.mutedForeground }]}>
                Unsaved changes
              </Text>
              <Pressable
                onPress={handleSaveIncome}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[styles.saveText, { color: colors.primaryForeground }]}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Data */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          Data
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...colors.cardShadow,
            },
          ]}
        >
          <Text style={[styles.dataDesc, { color: colors.mutedForeground }]}>
            Remove all debts, bills, and your income profile from this device.
          </Text>
          <Pressable
            onPress={handleReset}
            style={[
              styles.resetBtn,
              {
                backgroundColor: colors.destructiveSoft,
                borderColor: colors.destructive + "55",
              },
            ]}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[styles.resetText, { color: colors.destructive }]}>
              Clear all data
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 8,
    fontFamily: "Inter_600SemiBold",
  },
  card: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  segment: {
    flexDirection: "row",
    gap: 8,
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingVertical: 12,
  },
  segmentText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  field: {
    marginBottom: 12,
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  unsavedHint: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  saveBtn: {
    borderRadius: RADII.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  saveText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.24,
    fontVariant: ["tabular-nums"],
  },
  dataDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginBottom: 12,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingVertical: 14,
  },
  resetText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
