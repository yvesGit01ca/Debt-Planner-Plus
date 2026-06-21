export type BillCategory =
  | "Housing"
  | "Streaming"
  | "Utilities"
  | "Insurance"
  | "Phone"
  | "Transport"
  | "Subscription"
  | "Loan"
  | "Other";

export interface Bill {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: BillCategory;
  dayOfMonth: number; // 1-31
}

export const BILL_CATEGORIES: BillCategory[] = [
  "Housing",
  "Streaming",
  "Utilities",
  "Insurance",
  "Phone",
  "Transport",
  "Subscription",
  "Loan",
  "Other",
];

// Per-category accent colors for dots/badges. These are functional color-coding
// (like debt colors), distinct from the single purple brand accent.
export const CATEGORY_COLORS: Record<BillCategory, string> = {
  Housing: "#6366f1",
  Streaming: "#f43f5e",
  Utilities: "#f59e0b",
  Insurance: "#10b981",
  Phone: "#0ea5e9",
  Transport: "#8b5cf6",
  Subscription: "#d946ef",
  Loan: "#f97316",
  Other: "#64748b",
};

export const MAX_BILLS = 50;
export const MAX_BILL_NAME_LENGTH = 50;

export function getCategoryColor(category: BillCategory): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
}
