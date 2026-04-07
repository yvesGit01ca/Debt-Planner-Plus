export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
  flag: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US", decimals: 2, flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE", decimals: 2, flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB", decimals: 2, flag: "🇬🇧" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP", decimals: 0, flag: "🇯🇵" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN", decimals: 2, flag: "🇨🇳" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN", decimals: 2, flag: "🇮🇳" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar", locale: "en-CA", decimals: 2, flag: "🇨🇦" },
  { code: "AUD", symbol: "$", name: "Australian Dollar", locale: "en-AU", decimals: 2, flag: "🇦🇺" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc", locale: "de-CH", decimals: 2, flag: "🇨🇭" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR", decimals: 2, flag: "🇧🇷" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", locale: "ko-KR", decimals: 0, flag: "🇰🇷" },
  { code: "MXN", symbol: "$", name: "Mexican Peso", locale: "es-MX", decimals: 2, flag: "🇲🇽" },
  { code: "SGD", symbol: "$", name: "Singapore Dollar", locale: "en-SG", decimals: 2, flag: "🇸🇬" },
  { code: "HKD", symbol: "$", name: "Hong Kong Dollar", locale: "en-HK", decimals: 2, flag: "🇭🇰" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", locale: "sv-SE", decimals: 2, flag: "🇸🇪" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", locale: "nb-NO", decimals: 2, flag: "🇳🇴" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", locale: "da-DK", decimals: 2, flag: "🇩🇰" },
  { code: "NZD", symbol: "$", name: "New Zealand Dollar", locale: "en-NZ", decimals: 2, flag: "🇳🇿" },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA", decimals: 2, flag: "🇿🇦" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", locale: "tr-TR", decimals: 2, flag: "🇹🇷" },
];

export const DEFAULT_CURRENCY = "USD";

export function getCurrencyInfo(code: string): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyInfo(code).symbol;
}
