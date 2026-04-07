import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

import type { Debt, FinancialProfile } from "@/types/debt";
import { DEBT_COLORS } from "@/types/debt";
import { calcMonthlyPayment } from "@/utils/calculations";

const DEBTS_KEY = "@ledger_debts";
const PROFILE_KEY = "@ledger_profile";
const SECURE_STORE_MAX = 2048;

async function secureSetItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  if (value.length <= SECURE_STORE_MAX) {
    await SecureStore.setItemAsync(key, value);
    await SecureStore.deleteItemAsync(`${key}_chunks`);
  } else {
    const chunkCount = Math.ceil(value.length / SECURE_STORE_MAX);
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunkCount));
    for (let i = 0; i < chunkCount; i++) {
      const chunk = value.slice(i * SECURE_STORE_MAX, (i + 1) * SECURE_STORE_MAX);
      await SecureStore.setItemAsync(`${key}_${i}`, chunk);
    }
  }
}

async function secureGetItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(key);
  }
  const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunks`);
  if (chunkCountStr) {
    const chunkCount = parseInt(chunkCountStr, 10);
    let result = "";
    for (let i = 0; i < chunkCount; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
      if (chunk === null) return null;
      result += chunk;
    }
    return result;
  }
  return SecureStore.getItemAsync(key);
}

async function migrateFromAsyncStorage(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const debts = await AsyncStorage.getItem(DEBTS_KEY);
    const profile = await AsyncStorage.getItem(PROFILE_KEY);
    if (debts) {
      await secureSetItem(DEBTS_KEY, debts);
      await AsyncStorage.removeItem(DEBTS_KEY);
    }
    if (profile) {
      await secureSetItem(PROFILE_KEY, profile);
      await AsyncStorage.removeItem(PROFILE_KEY);
    }
  } catch {}
}

interface DebtContextType {
  debts: Debt[];
  profile: FinancialProfile;
  addDebt: (debt: Omit<Debt, "id" | "color" | "monthlyPayment">) => void;
  updateDebt: (debt: Debt) => void;
  deleteDebt: (id: string) => void;
  updateProfile: (profile: FinancialProfile) => void;
  isLoading: boolean;
}

const DebtContext = createContext<DebtContextType | null>(null);

const SAMPLE_DEBTS: Debt[] = [
  {
    id: "1",
    name: "MacBook Pro",
    type: "bnpl",
    principal: 1200,
    remaining: 1200,
    monthlyPayment: 200,
    dueDay: 5,
    startMonth: 0,
    startYear: 2025,
    annualRate: 0,
    totalMonths: 6,
    color: DEBT_COLORS[0],
  },
  {
    id: "2",
    name: "Personal Loan",
    type: "loan",
    principal: 5000,
    remaining: 4200,
    monthlyPayment: 158.07,
    dueDay: 15,
    startMonth: 2,
    startYear: 2025,
    annualRate: 8.5,
    totalMonths: 36,
    color: DEBT_COLORS[1],
  },
  {
    id: "3",
    name: "Phone BNPL",
    type: "bnpl",
    principal: 600,
    remaining: 300,
    monthlyPayment: 100,
    dueDay: 22,
    startMonth: 3,
    startYear: 2025,
    annualRate: 0,
    totalMonths: 6,
    color: DEBT_COLORS[3],
  },
];

export function DebtProvider({ children }: { children: React.ReactNode }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [profile, setProfile] = useState<FinancialProfile>({
    monthlySalary: 0,
    additionalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await migrateFromAsyncStorage();
        const stored = await secureGetItem(DEBTS_KEY);
        const storedProfile = await secureGetItem(PROFILE_KEY);
        if (stored) {
          setDebts(JSON.parse(stored));
        } else {
          setDebts(SAMPLE_DEBTS);
          await secureSetItem(DEBTS_KEY, JSON.stringify(SAMPLE_DEBTS));
        }
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
      } catch {
        setDebts(SAMPLE_DEBTS);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (updated: Debt[]) => {
    try {
      await secureSetItem(DEBTS_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  const addDebt = useCallback(
    (input: Omit<Debt, "id" | "color" | "monthlyPayment">) => {
      const monthlyPayment =
        input.type === "bnpl"
          ? input.remaining / (input.totalMonths || 1)
          : calcMonthlyPayment(
              input.remaining,
              input.annualRate,
              input.totalMonths,
            );
      const newDebt: Debt = {
        ...input,
        id:
          Date.now().toString() +
          Math.random().toString(36).substr(2, 9),
        color: DEBT_COLORS[debts.length % DEBT_COLORS.length],
        monthlyPayment,
      };
      const updated = [...debts, newDebt];
      setDebts(updated);
      persist(updated);
    },
    [debts, persist],
  );

  const updateDebt = useCallback(
    (debt: Debt) => {
      const monthlyPayment =
        debt.type === "bnpl"
          ? debt.remaining / (debt.totalMonths || 1)
          : calcMonthlyPayment(
              debt.remaining,
              debt.annualRate,
              debt.totalMonths,
            );
      const updated = debts.map((d) =>
        d.id === debt.id ? { ...debt, monthlyPayment } : d,
      );
      setDebts(updated);
      persist(updated);
    },
    [debts, persist],
  );

  const deleteDebt = useCallback(
    (id: string) => {
      const updated = debts.filter((d) => d.id !== id);
      setDebts(updated);
      persist(updated);
    },
    [debts, persist],
  );

  const updateProfile = useCallback(
    (p: FinancialProfile) => {
      setProfile(p);
      secureSetItem(PROFILE_KEY, JSON.stringify(p)).catch(() => {});
    },
    [],
  );

  return (
    <DebtContext.Provider
      value={{
        debts,
        profile,
        addDebt,
        updateDebt,
        deleteDebt,
        updateProfile,
        isLoading,
      }}
    >
      {children}
    </DebtContext.Provider>
  );
}

export function useDebts() {
  const ctx = useContext(DebtContext);
  if (!ctx) throw new Error("useDebts must be used within DebtProvider");
  return ctx;
}
