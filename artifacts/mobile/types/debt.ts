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
  currency: string;
}

export interface FinancialProfile {
  monthlySalary: number;
  additionalRevenue: number;
  defaultCurrency: string;
  notificationsEnabled: boolean;
  notificationLeadHours: number; // 24 or 48
}

export const DEBT_COLORS = [
  "#494fdf",
  "#00a87e",
  "#ec7e00",
  "#e23b4a",
  "#007bc2",
  "#936d62",
  "#b09000",
  "#428619",
  "#e61e49",
  "#505a63",
];

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
