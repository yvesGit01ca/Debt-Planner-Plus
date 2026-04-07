import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarGrid } from "@/components/CalendarGrid";
import { useDebts } from "@/context/DebtContext";
import { useColors } from "@/hooks/useColors";
import type { Debt } from "@/types/debt";
import { MONTHS } from "@/types/debt";
import { formatCurrency, isDebtActiveInMonth } from "@/utils/calculations";

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { debts } = useDebts();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const navMonth = (dir: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let m = month + dir;
    let y = year;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    setMonth(m);
    setYear(y);
    setSelectedDay(null);
  };

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const handleSelectDay = (day: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay((prev) => (prev === day ? null : day));
  };

  const dayDebts: Debt[] = useMemo(() => {
    if (selectedDay === null) return [];
    return debts.filter(
      (d) =>
        d.dueDay === selectedDay &&
        isDebtActiveInMonth(d.startMonth, d.startYear, d.totalMonths, month, year),
    );
  }, [debts, selectedDay, month, year]);

  const handleAddDebtOnDay = () => {
    if (selectedDay === null) return;
    router.push({
      pathname: "/add-debt",
      params: {
        prefillDay: String(selectedDay),
        prefillMonth: String(month),
        prefillYear: String(year),
      },
    });
  };

  const dateLabel = selectedDay !== null
    ? `${MONTHS[month]} ${selectedDay}, ${year}`
    : "";

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
          Calendar
        </Text>

        <View style={styles.nav}>
          <Pressable
            onPress={() => navMonth(-1)}
            style={[
              styles.navBtn,
              { backgroundColor: colors.card },
            ]}
          >
            <Feather
              name="chevron-left"
              size={20}
              color={colors.foreground}
            />
          </Pressable>
          <Text
            style={[styles.monthTitle, { color: colors.foreground }]}
          >
            {MONTHS[month]} {year}
          </Text>
          <Pressable
            onPress={() => navMonth(1)}
            style={[
              styles.navBtn,
              { backgroundColor: colors.card },
            ]}
          >
            <Feather
              name="chevron-right"
              size={20}
              color={colors.foreground}
            />
          </Pressable>
        </View>

        <CalendarGrid
          debts={debts}
          year={year}
          month={month}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
          hideSummary={selectedDay !== null}
        />

        {selectedDay !== null && (
          <View style={[styles.dayPanel, { backgroundColor: colors.card }]}>
            <View style={styles.dayPanelHeader}>
              <View>
                <Text style={[styles.dayPanelDate, { color: colors.foreground }]}>
                  {dateLabel}
                </Text>
                <Text style={[styles.dayPanelSub, { color: colors.mutedForeground }]}>
                  {dayDebts.length === 0
                    ? "No debts due"
                    : `${dayDebts.length} debt${dayDebts.length > 1 ? "s" : ""} due`}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedDay(null);
                }}
                hitSlop={8}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {dayDebts.length > 0 && (
              <View style={styles.dayDebtList}>
                {dayDebts.map((d) => (
                  <Pressable
                    key={d.id}
                    style={[styles.dayDebtRow, { borderColor: colors.border }]}
                    onPress={() => {
                      router.push({ pathname: "/add-debt", params: { editId: d.id } });
                    }}
                  >
                    <View style={[styles.dayDebtDot, { backgroundColor: d.color }]} />
                    <View style={styles.dayDebtInfo}>
                      <Text style={[styles.dayDebtName, { color: colors.foreground }]}>
                        {d.name}
                      </Text>
                      <Text style={[styles.dayDebtType, { color: colors.mutedForeground }]}>
                        {d.type === "loan" ? `${d.annualRate}% APR` : "BNPL"}
                      </Text>
                    </View>
                    <Text style={[styles.dayDebtAmount, { color: d.color }]}>
                      {formatCurrency(d.monthlyPayment, d.currency || "USD")}
                    </Text>
                    <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable
              onPress={handleAddDebtOnDay}
              style={[styles.addDebtBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.addDebtBtnText}>
                Add Debt on {MONTHS[month]} {selectedDay}
              </Text>
            </Pressable>
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
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navBtn: {
    borderRadius: 9999,
    padding: 10,
  },
  monthTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  dayPanel: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  dayPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  dayPanelDate: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  dayPanelSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  dayDebtList: {
    gap: 8,
    marginBottom: 14,
  },
  dayDebtRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  dayDebtDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayDebtInfo: {
    flex: 1,
  },
  dayDebtName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  dayDebtType: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  dayDebtAmount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginRight: 4,
  },
  addDebtBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  addDebtBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
