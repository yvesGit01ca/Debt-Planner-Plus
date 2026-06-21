import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADII } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";

interface Props {
  hour: number; // 0–23
  minute: number; // 0–59
  onChange: (hour: number, minute: number) => void;
  label?: string;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,…,55

// Formats a 24h hour/minute pair as a 12h clock string, e.g. (9, 0) -> "9:00 AM".
export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  let h12 = hour % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
}

function to24Hour(h12: number, period: "AM" | "PM"): number {
  const base = h12 % 12; // 12 -> 0
  return period === "PM" ? base + 12 : base;
}

export function TimePicker({ hour, minute, onChange, label }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const period: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
  const hour12 = ((hour % 12) === 0 ? 12 : hour % 12);
  // Snap the displayed minute to the nearest 5-minute step for highlighting,
  // while still allowing any stored minute value to round-trip.
  const selectedMinute = MINUTES.includes(minute)
    ? minute
    : Math.round(minute / 5) * 5 % 60;

  const pickHour = (h12: number) => {
    onChange(to24Hour(h12, period), minute);
  };

  const pickMinute = (m: number) => {
    onChange(hour, m);
  };

  const pickPeriod = (p: "AM" | "PM") => {
    if (p === period) return;
    onChange(to24Hour(hour12, p), minute);
  };

  return (
    <View>
      {label && (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          { backgroundColor: colors.input, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.triggerText, { color: colors.foreground }]}>
          {formatTime(hour, minute)}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={[
            styles.modal,
            {
              backgroundColor: colors.background,
              paddingTop: Platform.OS === "web" ? 16 : 20,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Reminder time
            </Text>
            <Pressable
              onPress={() => setOpen(false)}
              style={[styles.closeBtn, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.closeText, { color: colors.foreground }]}>
                Done
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.preview, { color: colors.primary }]}>
            {formatTime(hour, minute)}
          </Text>

          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={[styles.colLabel, { color: colors.mutedForeground }]}>
                Hour
              </Text>
              <FlatList
                data={HOURS_12}
                keyExtractor={(h) => `h${h}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.colList}
                renderItem={({ item }) => {
                  const active = item === hour12;
                  return (
                    <Pressable
                      onPress={() => pickHour(item)}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          {
                            color: active
                              ? colors.primaryForeground
                              : colors.foreground,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>

            <View style={styles.column}>
              <Text style={[styles.colLabel, { color: colors.mutedForeground }]}>
                Minute
              </Text>
              <FlatList
                data={MINUTES}
                keyExtractor={(m) => `m${m}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.colList}
                renderItem={({ item }) => {
                  const active = item === selectedMinute;
                  return (
                    <Pressable
                      onPress={() => pickMinute(item)}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          {
                            color: active
                              ? colors.primaryForeground
                              : colors.foreground,
                          },
                        ]}
                      >
                        {String(item).padStart(2, "0")}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>

            <View style={styles.column}>
              <Text style={[styles.colLabel, { color: colors.mutedForeground }]}>
                AM / PM
              </Text>
              <View style={styles.colList}>
                {(["AM", "PM"] as const).map((p) => {
                  const active = p === period;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => pickPeriod(p)}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          {
                            color: active
                              ? colors.primaryForeground
                              : colors.foreground,
                          },
                        ]}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  triggerText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  modal: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  closeBtn: {
    borderRadius: RADII.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  preview: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    marginVertical: 12,
  },
  columns: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  colLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    textAlign: "center",
  },
  colList: {
    gap: 8,
    paddingBottom: 8,
  },
  cell: {
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  cellText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
});
