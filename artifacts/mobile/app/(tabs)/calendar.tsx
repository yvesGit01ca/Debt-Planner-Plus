import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarGrid } from "@/components/CalendarGrid";
import { useDebts } from "@/context/DebtContext";
import { useColors } from "@/hooks/useColors";
import { MONTHS } from "@/types/debt";

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { debts, profile } = useDebts();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

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

        <CalendarGrid debts={debts} year={year} month={month} defaultCurrency={profile.defaultCurrency} />
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
});
