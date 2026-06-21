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

import { DEFAULT_CURRENCY } from "@/constants/currencies";
import type { Bill } from "@/types/bill";
import { MAX_BILLS } from "@/types/bill";
import type { Debt, FinancialProfile } from "@/types/debt";
import { DEBT_COLORS } from "@/types/debt";
import { calcMonthlyPayment } from "@/utils/calculations";

const DEBTS_KEY = "@ledger_debts";
const PROFILE_KEY = "@ledger_profile";
const BILLS_KEY = "@ledger_bills";
const SECURE_STORE_MAX = 2048;

async function clearStaleChunks(key: string, keepCount: number): Promise<void> {
  for (let i = keepCount; i < 100; i++) {
    const existing = await SecureStore.getItemAsync(`${key}_${i}`);
    if (!existing) break;
    await SecureStore.deleteItemAsync(`${key}_${i}`);
  }
}

async function secureSetItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  if (value.length <= SECURE_STORE_MAX) {
    await SecureStore.setItemAsync(key, value);
    const prevChunks = await SecureStore.getItemAsync(`${key}_chunks`);
    if (prevChunks) {
      await clearStaleChunks(key, 0);
      await SecureStore.deleteItemAsync(`${key}_chunks`);
    }
  } else {
    const chunkCount = Math.ceil(value.length / SECURE_STORE_MAX);
    const prevChunksStr = await SecureStore.getItemAsync(`${key}_chunks`);
    const prevCount = prevChunksStr ? parseInt(prevChunksStr, 10) : 0;
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunkCount));
    for (let i = 0; i < chunkCount; i++) {
      const chunk = value.slice(i * SECURE_STORE_MAX, (i + 1) * SECURE_STORE_MAX);
      await SecureStore.setItemAsync(`${key}_${i}`, chunk);
    }
    if (prevCount > chunkCount) {
      await clearStaleChunks(key, chunkCount);
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
    const bills = await AsyncStorage.getItem(BILLS_KEY);
    if (debts) {
      await secureSetItem(DEBTS_KEY, debts);
      await AsyncStorage.removeItem(DEBTS_KEY);
    }
    if (profile) {
      await secureSetItem(PROFILE_KEY, profile);
      await AsyncStorage.removeItem(PROFILE_KEY);
    }
    if (bills) {
      await secureSetItem(BILLS_KEY, bills);
      await AsyncStorage.removeItem(BILLS_KEY);
    }
  } catch {}
}

function migrateDebts(debts: Debt[]): Debt[] {
  return debts.map((d) => ({
    ...d,
    currency: d.currency || DEFAULT_CURRENCY,
  }));
}

function migrateProfile(profile: FinancialProfile): FinancialProfile {
  return {
    ...profile,
    defaultCurrency: profile.defaultCurrency || DEFAULT_CURRENCY,
  };
}

interface DebtContextType {
  debts: Debt[];
  bills: Bill[];
  profile: FinancialProfile;
  addDebt: (debt: Omit<Debt, "id" | "color" | "monthlyPayment">) => void;
  updateDebt: (debt: Debt) => void;
  deleteDebt: (id: string) => void;
  addBill: (bill: Omit<Bill, "id">) => boolean;
  updateBill: (bill: Bill) => void;
  deleteBill: (id: string) => void;
  updateProfile: (profile: FinancialProfile) => void;
  clearAllData: () => void;
  isLoading: boolean;
}

const DEFAULT_PROFILE: FinancialProfile = {
  monthlySalary: 0,
  additionalRevenue: 0,
  defaultCurrency: DEFAULT_CURRENCY,
};

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
    currency: DEFAULT_CURRENCY,
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
    currency: DEFAULT_CURRENCY,
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
    currency: DEFAULT_CURRENCY,
  },
];

const SAMPLE_BILLS: Bill[] = [
  { id: "b1", name: "Rent", amount: 850, currency: "EUR", dayOfMonth: 1, category: "Housing" },
  { id: "b2", name: "Netflix", amount: 17.99, currency: "EUR", dayOfMonth: 5, category: "Streaming" },
  { id: "b3", name: "Electricity", amount: 65, currency: "EUR", dayOfMonth: 10, category: "Utilities" },
  { id: "b4", name: "Spotify", amount: 10.99, currency: "EUR", dayOfMonth: 12, category: "Streaming" },
  { id: "b5", name: "Phone", amount: 19.99, currency: "EUR", dayOfMonth: 20, category: "Phone" },
  { id: "b6", name: "Health insurance", amount: 120, currency: "EUR", dayOfMonth: 25, category: "Insurance" },
];

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}

export function DebtProvider({ children }: { children: React.ReactNode }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [profile, setProfile] = useState<FinancialProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await migrateFromAsyncStorage();
        const stored = await secureGetItem(DEBTS_KEY);
        const storedProfile = await secureGetItem(PROFILE_KEY);
        const storedBills = await secureGetItem(BILLS_KEY);
        if (stored) {
          setDebts(migrateDebts(JSON.parse(stored)));
        } else {
          setDebts(SAMPLE_DEBTS);
          await secureSetItem(DEBTS_KEY, JSON.stringify(SAMPLE_DEBTS));
        }
        if (storedProfile) {
          setProfile(migrateProfile(JSON.parse(storedProfile)));
        }
        if (storedBills) {
          setBills(JSON.parse(storedBills));
        } else {
          setBills(SAMPLE_BILLS);
          await secureSetItem(BILLS_KEY, JSON.stringify(SAMPLE_BILLS));
        }
      } catch {
        setDebts(SAMPLE_DEBTS);
        setBills(SAMPLE_BILLS);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistDebts = useCallback(async (updated: Debt[]) => {
    try {
      await secureSetItem(DEBTS_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  const persistBills = useCallback(async (updated: Bill[]) => {
    try {
      await secureSetItem(BILLS_KEY, JSON.stringify(updated));
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
        id: generateId(),
        color: DEBT_COLORS[debts.length % DEBT_COLORS.length],
        monthlyPayment,
      };
      const updated = [...debts, newDebt];
      setDebts(updated);
      persistDebts(updated);
    },
    [debts, persistDebts],
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
      persistDebts(updated);
    },
    [debts, persistDebts],
  );

  const deleteDebt = useCallback(
    (id: string) => {
      const updated = debts.filter((d) => d.id !== id);
      setDebts(updated);
      persistDebts(updated);
    },
    [debts, persistDebts],
  );

  const addBill = useCallback(
    (input: Omit<Bill, "id">): boolean => {
      if (bills.length >= MAX_BILLS) return false;
      const newBill: Bill = { ...input, id: generateId() };
      const updated = [...bills, newBill];
      setBills(updated);
      persistBills(updated);
      return true;
    },
    [bills, persistBills],
  );

  const updateBill = useCallback(
    (bill: Bill) => {
      const updated = bills.map((b) => (b.id === bill.id ? bill : b));
      setBills(updated);
      persistBills(updated);
    },
    [bills, persistBills],
  );

  const deleteBill = useCallback(
    (id: string) => {
      const updated = bills.filter((b) => b.id !== id);
      setBills(updated);
      persistBills(updated);
    },
    [bills, persistBills],
  );

  const updateProfile = useCallback((p: FinancialProfile) => {
    setProfile(p);
    secureSetItem(PROFILE_KEY, JSON.stringify(p)).catch(() => {});
  }, []);

  const clearAllData = useCallback(() => {
    setDebts([]);
    setBills([]);
    setProfile(DEFAULT_PROFILE);
    persistDebts([]);
    persistBills([]);
    secureSetItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE)).catch(() => {});
  }, [persistDebts, persistBills]);

  return (
    <DebtContext.Provider
      value={{
        debts,
        bills,
        profile,
        addDebt,
        updateDebt,
        deleteDebt,
        addBill,
        updateBill,
        deleteBill,
        updateProfile,
        clearAllData,
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
