import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  'EUR €': '€',
  'USD $': '$',
  'GBP £': '£',
  'GHS': 'GHS ',
};

export function formatCurrency(amount: number, currencyString: string) {
  const symbol = CURRENCY_SYMBOLS[currencyString] ?? '';
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Clamps a bill's day_of_month to the last valid day of the given month, so a
// bill due on the 31st falls on the 30th (or 28th/29th in February) instead of
// disappearing or leaking into an adjacent month.
export function effectiveDayInMonth(dayOfMonth: number, year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(dayOfMonth, lastDay);
}

export function getOrdinalSuffix(i: number) {
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return i + "st";
  if (j === 2 && k !== 12) return i + "nd";
  if (j === 3 && k !== 13) return i + "rd";
  return i + "th";
}

const PASTEL_COLORS = [
  { bg: 'bg-[#FFD1DC]', text: 'text-[#B3304B]' }, // Pink
  { bg: 'bg-[#FFDFBA]', text: 'text-[#B35200]' }, // Peach
  { bg: 'bg-[#FFFFBA]', text: 'text-[#999900]' }, // Yellow
  { bg: 'bg-[#BAFFC9]', text: 'text-[#1A8033]' }, // Green
  { bg: 'bg-[#BAE1FF]', text: 'text-[#005B99]' }, // Blue
  { bg: 'bg-[#E6B3FF]', text: 'text-[#330099]' }, // Purple
  { bg: 'bg-[#FFB3E6]', text: 'text-[#800099]' }, // Violet
  { bg: 'bg-[#E2F0CB]', text: 'text-[#3B7300]' }, // Lime
];

export function getBillColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_COLORS.length;
  return PASTEL_COLORS[index];
}