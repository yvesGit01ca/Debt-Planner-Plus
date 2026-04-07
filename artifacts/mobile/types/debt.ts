export interface Debt {
  id: string;
  name: string;
  type: "loan" | "bnpl";
  principal: number;
  remaining: number;
  monthlyPayment: number;
  dueDay: number;
  startMonth: number;
  startYear: number;
  annualRate: number;
  totalMonths: number;
  color: string;
}

export interface FinancialProfile {
  monthlySalary: number;
  additionalRevenue: number;
}

export const DEBT_COLORS = [
  "#FF6B6B",
  "#FFB347",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#DDA0DD",
  "#F0E68C",
  "#87CEEB",
  "#FF8C94",
  "#A8E6CF",
];

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
