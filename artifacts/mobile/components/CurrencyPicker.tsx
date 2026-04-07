import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CURRENCIES, type CurrencyInfo, getCurrencyInfo } from "@/constants/currencies";
import { useColors } from "@/hooks/useColors";

interface Props {
  selected: string;
  onSelect: (code: string) => void;
  label?: string;
}

export function CurrencyPicker({ selected, onSelect, label }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const info = getCurrencyInfo(selected);

  const filtered = search.trim()
    ? CURRENCIES.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : CURRENCIES;

  const renderItem = ({ item }: { item: CurrencyInfo }) => {
    const isSelected = item.code === selected;
    return (
      <Pressable
        onPress={() => {
          onSelect(item.code);
          setOpen(false);
          setSearch("");
        }}
        style={[
          styles.option,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.optionText}>
          <Text
            style={[
              styles.optionCode,
              { color: isSelected ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {item.code}
          </Text>
          <Text
            style={[
              styles.optionName,
              { color: isSelected ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            {item.name}
          </Text>
        </View>
        <Text
          style={[
            styles.optionSymbol,
            { color: isSelected ? colors.primaryForeground : colors.mutedForeground },
          ]}
        >
          {item.symbol}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={styles.triggerFlag}>{info.flag}</Text>
        <Text style={[styles.triggerCode, { color: colors.foreground }]}>
          {info.code}
        </Text>
        <Text style={[styles.triggerSymbol, { color: colors.mutedForeground }]}>
          {info.symbol}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setOpen(false);
          setSearch("");
        }}
      >
        <View
          style={[
            styles.modal,
            {
              backgroundColor: colors.background,
              paddingTop: Platform.OS === "ios" ? insets.top + 8 : 16,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Select Currency
            </Text>
            <Pressable
              onPress={() => {
                setOpen(false);
                setSearch("");
              }}
              style={[styles.closeBtn, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.closeText, { color: colors.foreground }]}>
                Done
              </Text>
            </Pressable>
          </View>

          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.input,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search currencies..."
            placeholderTextColor={colors.mutedForeground}
            keyboardAppearance="dark"
            autoCorrect={false}
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 16 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    fontFamily: "Inter_500Medium",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  triggerFlag: {
    fontSize: 18,
  },
  triggerCode: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  triggerSymbol: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  modal: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  closeBtn: {
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  listContent: {
    gap: 6,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  flag: {
    fontSize: 22,
  },
  optionText: {
    flex: 1,
  },
  optionCode: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  optionName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  optionSymbol: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
});
