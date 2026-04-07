import { getCurrencyInfo } from "@/constants/currencies";

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
