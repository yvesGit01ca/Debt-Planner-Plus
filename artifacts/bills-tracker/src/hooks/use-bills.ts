import { useState, useEffect } from 'react';
import { Bill, SEED_BILLS } from '../lib/types';

const STORAGE_KEY = 'bills_tracker_data';

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBills(JSON.parse(stored));
      } catch (e) {
        setBills(SEED_BILLS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_BILLS));
      }
    } else {
      setBills(SEED_BILLS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_BILLS));
    }
    setIsLoaded(true);
  }, []);

  const saveBills = (newBills: Bill[]) => {
    setBills(newBills);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBills));
  };

  const addBill = (bill: Bill) => {
    saveBills([...bills, bill]);
  };

  const updateBill = (updatedBill: Bill) => {
    saveBills(bills.map(b => (b.id === updatedBill.id ? updatedBill : b)));
  };

  const deleteBill = (id: string) => {
    saveBills(bills.filter(b => b.id !== id));
  };

  return { bills, addBill, updateBill, deleteBill, isLoaded };
}
