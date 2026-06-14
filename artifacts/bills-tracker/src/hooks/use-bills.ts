import { useState, useEffect } from 'react';
import { Bill, SEED_BILLS, MAX_BILLS } from '../lib/types';

const STORAGE_KEY = 'bills_tracker_data';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readStorage(): Bill[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return null;
    return parsed as Bill[];
  } catch {
    return null;
  }
}

function writeStorage(bills: Bill[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    return true;
  } catch {
    return false;
  }
}

export type AddBillResult =
  | { ok: true; bill: Bill }
  | { ok: false; error: string };

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = readStorage();
    if (stored) {
      setBills(stored);
    } else {
      setBills(SEED_BILLS);
      writeStorage(SEED_BILLS);
    }
    setIsLoaded(true);
  }, []);

  const saveBills = (newBills: Bill[]): boolean => {
    // Persist first; only update in-memory state if the write succeeds so the
    // visible UI never diverges from what's actually stored.
    if (!writeStorage(newBills)) {
      return false;
    }
    setBills(newBills);
    return true;
  };

  const addBill = (input: Omit<Bill, 'id'>): AddBillResult => {
    if (bills.length >= MAX_BILLS) {
      return { ok: false, error: `You can track up to ${MAX_BILLS} bills.` };
    }
    const bill: Bill = { ...input, id: generateId() };
    const persisted = saveBills([...bills, bill]);
    if (!persisted) {
      return { ok: false, error: 'Could not save your bill. Storage may be full or unavailable.' };
    }
    return { ok: true, bill };
  };

  const updateBill = (updatedBill: Bill): boolean => {
    return saveBills(bills.map((b) => (b.id === updatedBill.id ? updatedBill : b)));
  };

  const deleteBill = (id: string): boolean => {
    return saveBills(bills.filter((b) => b.id !== id));
  };

  return { bills, addBill, updateBill, deleteBill, isLoaded };
}
