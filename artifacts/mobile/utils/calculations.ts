import { getCurrencyInfo } from "@/constants/currencies";
import type { Bill } from "@/types/bill";
import type { Debt } from "@/types/debt";

export function formatCurrency(n: number, currencyCode: string = "USD"): string {
  const info = getCurrencyInfo(currencyCode);
  return new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency: info.code,
    maximumFractionDigits: info.decimals,
    minimumFractionDigits: info.decimals,
  }).format(n);
}

export function calcMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number,
): number {
  if (months <= 0) return 0;
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return (
    (principal * r * Math.pow(1 + r, months)) /
    (Math.pow(1 + r, months) - 1)
  );
}

export function calcPayoffWithExtra(
  principal: number,
  annualRate: number,
  baseMonthly: number,
  extraMonthly: number,
): { months: number; totalPaid: number } {
  if (principal <= 0) return { months: 0, totalPaid: 0 };
  const r = annualRate / 100 / 12;
  const payment = baseMonthly + extraMonthly;
  if (payment <= 0) return { months: 600, totalPaid: 0 };
  let balance = principal;
  let months = 0;
  let totalPaid = 0;
  while (balance > 0.01 && months < 600) {
    const interest = balance * r;
    balance = balance + interest - payment;
    totalPaid += payment;
    months++;
    if (balance < 0) {
      totalPaid += balance;
      balance = 0;
    }
  }
  return { months, totalPaid };
}

export function isDebtActiveInMonth(
  startMonth: number,
  startYear: number,
  totalMonths: number,
  checkMonth: number,
  checkYear: number,
): boolean {
  const startTotal = startYear * 12 + startMonth;
  const endTotal = startTotal + totalMonths;
  const checkTotal = checkYear * 12 + checkMonth;
  return checkTotal >= startTotal && checkTotal < endTotal;
}

export function getMonthsLeft(
  startMonth: number,
  startYear: number,
  totalMonths: number,
): number {
  const now = new Date();
  const elapsed =
    now.getFullYear() * 12 +
    now.getMonth() -
    (startYear * 12 + startMonth);
  return Math.max(0, totalMonths - elapsed);
}

export function getProgress(
  startMonth: number,
  startYear: number,
  totalMonths: number,
): number {
  const monthsLeft = getMonthsLeft(startMonth, startYear, totalMonths);
  if (totalMonths <= 0) return 100;
  return Math.min(100, ((totalMonths - monthsLeft) / totalMonths) * 100);
}

export interface CurrencyTotal {
  currency: string;
  total: number;
}

export function groupTotalsByCurrency(
  debts: Debt[],
  valueExtractor: (d: Debt) => number,
): CurrencyTotal[] {
  const map = new Map<string, number>();
  for (const d of debts) {
    const cc = d.currency || "USD";
    map.set(cc, (map.get(cc) || 0) + valueExtractor(d));
  }
  return Array.from(map.entries())
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total);
}

export function formatCurrencyTotals(totals: CurrencyTotal[]): string {
  return totals
    .filter((t) => t.total !== 0)
    .map((t) => formatCurrency(t.total, t.currency))
    .join(" + ");
}

// Clamps a bill's dayOfMonth to the last valid day of the given month, so a bill
// due on the 31st falls on the 30th (or 28th/29th) instead of disappearing.
export function effectiveDayInMonth(
  dayOfMonth: number,
  year: number,
  month: number,
): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(dayOfMonth, lastDay);
}

export function getOrdinalSuffix(i: number): string {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) return i + "st";
  if (j === 2 && k !== 12) return i + "nd";
  if (j === 3 && k !== 13) return i + "rd";
  return i + "th";
}

// Recurring bills repeat every month, so they always count toward a month's totals.
export function groupBillTotalsByCurrency(bills: Bill[]): CurrencyTotal[] {
  const map = new Map<string, number>();
  for (const b of bills) {
    const cc = b.currency || "USD";
    map.set(cc, (map.get(cc) || 0) + b.amount);
  }
  return Array.from(map.entries())
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total);
}

export function combineTotals(...lists: CurrencyTotal[][]): CurrencyTotal[] {
  const map = new Map<string, number>();
  for (const list of lists) {
    for (const t of list) {
      map.set(t.currency, (map.get(t.currency) || 0) + t.total);
    }
  }
  return Array.from(map.entries())
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total);
}

// Amount still due in the current month: obligations whose effective due day has
// not yet passed today. Debts are only counted while active in the month.
export function stillDueThisMonth(
  debts: Debt[],
  bills: Bill[],
): CurrencyTotal[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const dueDebts = debts.filter(
    (d) =>
      isDebtActiveInMonth(d.startMonth, d.startYear, d.totalMonths, month, year) &&
      effectiveDayInMonth(d.dueDay, year, month) >= today,
  );
  const dueBills = bills.filter(
    (b) => effectiveDayInMonth(b.dayOfMonth, year, month) >= today,
  );

  return combineTotals(
    groupTotalsByCurrency(dueDebts, (d) => d.monthlyPayment),
    groupBillTotalsByCurrency(dueBills),
  );
}
