import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform, useColorScheme } from "react-native";

import type { ColorScheme } from "@/constants/colors";

export type ThemeMode = "light" | "dark" | "system";

const THEME_KEY = "@ledger_theme";

async function getStoredMode(): Promise<ThemeMode | null> {
  try {
    const value =
      Platform.OS === "web"
        ? await AsyncStorage.getItem(THEME_KEY)
        : await SecureStore.getItemAsync(THEME_KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

async function setStoredMode(mode: ThemeMode): Promise<void> {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } else {
      await SecureStore.setItemAsync(THEME_KEY, mode);
    }
  } catch {}
}

interface ThemeContextType {
  mode: ThemeMode;
  scheme: ColorScheme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    (async () => {
      const stored = await getStoredMode();
      if (stored) setModeState(stored);
    })();
  }, []);

  const scheme: ColorScheme =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setStoredMode(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const current: ColorScheme =
        prev === "system" ? (systemScheme === "dark" ? "dark" : "light") : prev;
      const next: ThemeMode = current === "dark" ? "light" : "dark";
      setStoredMode(next);
      return next;
    });
  }, [systemScheme]);

  return (
    <ThemeContext.Provider value={{ mode, scheme, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return ctx;
}
