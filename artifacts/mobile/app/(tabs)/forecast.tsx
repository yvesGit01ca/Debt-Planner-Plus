import { Feather } from "@expo/vector-icons";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CurrencyPicker } from "@/components/CurrencyPicker";
import { useDebts } from "@/context/DebtContext";
import { useColors } from "@/hooks/useColors";
import { MONTHS } from "@/types/debt";
import { formatCurrency, isDebtActiveInMonth } from "@/utils/calculations";

export default function ForecastScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { debts, profile, updateProfile } = useDebts();
  const [editing, setEditing] = useState(false);
  const [salary, setSalary] = useState(String(profile.monthlySalary || ""));
  const [revenue, setRevenue] = useState(
    String(profile.additionalRevenue || ""),
  );

  const dc = profile.defaultCurrency || "USD";

  const totalIncome =
    (profile.monthlySalary || 0) + (profile.additionalRevenue || 0);

  const forecast = useMemo(() => {
    const now = new Date();
    let cumulative = 0;
    return Array.from({ length: 12 }, (_, i) => {
      let m = now.getMonth() + i;
      let y = now.getFullYear();
      while (m > 11) {
        m -= 12;
        y++;
      }
      const obligations = debts.reduce((s, d) => {
        if (
          isDebtActiveInMonth(
            d.startMonth,
            d.startYear,
            d.totalMonths,
            m,
            y,
          )
        ) {
          return s + d.monthlyPayment;
        }
        return s;
      }, 0);
      const net = totalIncome - obligations;
      cumulative += net;
      return {
        month: MONTHS[m],
        year: y,
        income: totalIncome,
        obligations,
        net,
        cumulative,
        danger: obligations > totalIncome && totalIncome > 0,
      };
    });
  }, [debts, totalIncome]);

  const handleSaveProfile = () => {
    updateProfile({
      monthlySalary: parseFloat(salary) || 0,
      additionalRevenue: parseFloat(revenue) || 0,
      defaultCurrency: dc,
    });
    setEditing(false);
  };

  const handleCurrencyChange = (code: string) => {
    updateProfile({
      ...profile,
      monthlySalary: parseFloat(salary) || profile.monthlySalary || 0,
      additionalRevenue: parseFloat(revenue) || profile.additionalRevenue || 0,
      defaultCurrency: code,
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop:
              Platform.OS === "web" ? 67 + 16 : insets.top + 16,
            paddingBottom:
              Platform.OS === "web" ? 34 + 80 : insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Financial Forecast
        </Text>

        <View
          style={[styles.incomeCard, { backgroundColor: colors.card }]}
        >
          <View style={styles.incomeHeader}>
            <Text
              style={[
                styles.incomeTitle,
                { color: colors.mutedForeground },
              ]}
            >
              Monthly Income
            </Text>
            <Pressable onPress={() => setEditing(!editing)}>
              <Feather
                name={editing ? "x" : "edit-2"}
                size={16}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>

          {editing ? (
            <View style={styles.incomeForm}>
              <CurrencyPicker
                selected={dc}
                onSelect={handleCurrencyChange}
                label="Default Currency"
              />
              <View style={styles.incomeField}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Salary
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
                  onChangeText={setSalary}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardAppearance="dark"
                />
              </View>
              <View style={styles.incomeField}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Other Revenue
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
                  onChangeText={setRevenue}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardAppearance="dark"
                />
              </View>
              <Pressable
                onPress={handleSaveProfile}
                style={[
                  styles.saveIncomeBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.saveIncomeText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.incomeDisplay}>
              <View style={styles.incomeRow}>
                <Text
                  style={[
                    styles.incomeLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Salary
                </Text>
                <Text
                  style={[
                    styles.incomeValue,
                    { color: colors.foreground },
                  ]}
                >
                  {profile.monthlySalary
                    ? formatCurrency(profile.monthlySalary, dc)
                    : "Not set"}
                </Text>
              </View>
              <View style={styles.incomeRow}>
                <Text
                  style={[
                    styles.incomeLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Other Revenue
                </Text>
                <Text
                  style={[
                    styles.incomeValue,
                    { color: colors.foreground },
                  ]}
                >
                  {profile.additionalRevenue
                    ? formatCurrency(profile.additionalRevenue, dc)
                    : "Not set"}
                </Text>
              </View>
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <View style={styles.incomeRow}>
                <Text
                  style={[
                    styles.incomeLabel,
                    { color: colors.foreground },
                  ]}
                >
                  Total
                </Text>
                <Text
                  style={[
                    styles.incomeTotalValue,
                    { color: colors.primary },
                  ]}
                >
                  {formatCurrency(totalIncome, dc)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {totalIncome > 0 ? (
          <View>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.mutedForeground },
              ]}
            >
              12-Month Projection
            </Text>

            {forecast.map((row, i) => (
              <View
                key={i}
                style={[
                  styles.forecastRow,
                  {
                    backgroundColor: row.danger
                      ? "rgba(226,59,74,0.08)"
                      : colors.card,
                    borderColor: row.danger
                      ? "rgba(226,59,74,0.3)"
                      : colors.border,
                  },
                ]}
              >
                <View style={styles.forecastHeader}>
                  <Text
                    style={[
                      styles.forecastMonth,
                      { color: colors.foreground },
                    ]}
                  >
                    {row.month} {row.year}
                  </Text>
                  {row.danger && (
                    <View style={[styles.dangerBadge, { backgroundColor: "rgba(226,59,74,0.15)" }]}>
                      <Feather
                        name="alert-triangle"
                        size={10}
                        color={colors.destructive}
                      />
                      <Text style={[styles.dangerText, { color: colors.destructive }]}>At Risk</Text>
                    </View>
                  )}
                </View>
                <View style={styles.forecastDetails}>
                  <View style={styles.forecastItem}>
                    <Text
                      style={[
                        styles.forecastLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Income
                    </Text>
                    <Text
                      style={[
                        styles.forecastValue,
                        { color: colors.accent },
                      ]}
                    >
                      {formatCurrency(row.income, dc)}
                    </Text>
                  </View>
                  <View style={styles.forecastItem}>
                    <Text
                      style={[
                        styles.forecastLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Obligations
                    </Text>
                    <Text
                      style={[
                        styles.forecastValue,
                        { color: colors.destructive },
                      ]}
                    >
                      {formatCurrency(row.obligations, dc)}
                    </Text>
                  </View>
                  <View style={styles.forecastItem}>
                    <Text
                      style={[
                        styles.forecastLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Net
                    </Text>
                    <Text
                      style={[
                        styles.forecastValue,
                        {
                          color:
                            row.net >= 0
                              ? colors.accent
                              : colors.destructive,
                        },
                      ]}
                    >
                      {formatCurrency(row.net, dc)}
                    </Text>
                  </View>
                  <View style={styles.forecastItem}>
                    <Text
                      style={[
                        styles.forecastLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Cumulative
                    </Text>
                    <Text
                      style={[
                        styles.forecastValue,
                        {
                          color:
                            row.cumulative >= 0
                              ? colors.primary
                              : colors.destructive,
                        },
                      ]}
                    >
                      {formatCurrency(row.cumulative, dc)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noIncome}>
            <Feather
              name="dollar-sign"
              size={32}
              color={colors.mutedForeground}
            />
            <Text
              style={[
                styles.noIncomeText,
                { color: colors.mutedForeground },
              ]}
            >
              Enter your monthly income above to see your financial
              forecast
            </Text>
          </View>
        )}
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
  incomeCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  incomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  incomeTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontFamily: "Inter_600SemiBold",
  },
  incomeForm: {
    gap: 10,
  },
  incomeField: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.24,
  },
  saveIncomeBtn: {
    alignItems: "center",
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 4,
  },
  saveIncomeText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  incomeDisplay: {
    gap: 8,
  },
  incomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  incomeLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.24,
  },
  incomeValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  incomeTotalValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: "Inter_600SemiBold",
  },
  forecastRow: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  forecastHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  forecastMonth: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  dangerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dangerText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  forecastDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  forecastItem: {
    width: "47%",
  },
  forecastLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
    fontFamily: "Inter_500Medium",
  },
  forecastValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  noIncome: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  noIncomeText: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.24,
  },
});
