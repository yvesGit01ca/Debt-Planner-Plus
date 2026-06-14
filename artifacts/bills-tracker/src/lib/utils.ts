import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Bill, Category, Currency, CURRENCIES, CATEGORIES, MAX_NAME_LENGTH } from "./types"

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

// Strips characters that could be used for HTML/script injection and trims
// surrounding whitespace. Defense-in-depth: React already escapes rendered
// text, but we sanitize before persisting so stored data stays clean.
export function sanitizeText(input: string): string {
  return input.replace(/[<>&"']/g, '').trim();
}

export type CategoryColor = {
  dot: string;
  chip: string;
  badge: string;
};

// Static, literal Tailwind class strings (so the JIT compiler can detect them)
// for consistent per-category color coding that works in light and dark mode.
export const CATEGORY_COLORS: Record<Category, CategoryColor> = {
  Housing: {
    dot: 'bg-indigo-500',
    chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20',
  },
  Streaming: {
    dot: 'bg-rose-500',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20',
  },
  Utilities: {
    dot: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20',
  },
  Insurance: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20',
  },
  Phone: {
    dot: 'bg-sky-500',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/20',
  },
  Transport: {
    dot: 'bg-violet-500',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20',
  },
  Subscription: {
    dot: 'bg-fuchsia-500',
    chip: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-200',
    badge: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300 border border-fuchsia-500/20',
  },
  Loan: {
    dot: 'bg-orange-500',
    chip: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200',
    badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-300 border border-orange-500/20',
  },
  Other: {
    dot: 'bg-slate-500',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
    badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20',
  },
};

export function getCategoryColor(category: Category): CategoryColor {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
}

export type BillFormInput = {
  name: string;
  amount: string;
  currency: string;
  category: string;
  day: string;
};

export type BillFieldErrors = Partial<Record<'name' | 'amount' | 'currency' | 'category' | 'day', string>>;

export type BillValidationResult =
  | { valid: true; value: Omit<Bill, 'id'> }
  | { valid: false; errors: BillFieldErrors };

// Validates and normalizes raw form input into a safe Bill payload (without id).
export function validateBillInput(raw: BillFormInput): BillValidationResult {
  const errors: BillFieldErrors = {};

  const name = sanitizeText(raw.name);
  if (!name) {
    errors.name = 'Please enter a name.';
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `Keep the name under ${MAX_NAME_LENGTH} characters.`;
  }

  const amount = Number(raw.amount);
  if (raw.amount.trim() === '' || Number.isNaN(amount)) {
    errors.amount = 'Enter a valid amount.';
  } else if (amount <= 0) {
    errors.amount = 'Amount must be greater than zero.';
  } else if (!Number.isFinite(amount)) {
    errors.amount = 'Enter a valid amount.';
  }

  const day = Number(raw.day);
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    errors.day = 'Day must be a whole number from 1 to 31.';
  }

  if (!CURRENCIES.includes(raw.currency as Currency)) {
    errors.currency = 'Choose a valid currency.';
  }

  if (!CATEGORIES.includes(raw.category as Category)) {
    errors.category = 'Choose a valid category.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      name,
      amount: Math.round(amount * 100) / 100,
      currency: raw.currency as Currency,
      category: raw.category as Category,
      dayOfMonth: day,
    },
  };
}
