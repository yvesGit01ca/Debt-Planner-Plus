export type ColorScheme = "light" | "dark";

// Stripe-inspired light palette: white canvas, deep-navy ink, single purple
// accent, success green reserved for positive/paid states, blue-tinted borders.
const light = {
  background: "#ffffff",
  foreground: "#061b31",
  card: "#ffffff",
  cardForeground: "#061b31",
  primary: "#533afd",
  primaryForeground: "#ffffff",
  secondary: "#f6f9fc",
  secondaryForeground: "#0a2540",
  muted: "#eef3f9",
  mutedForeground: "#687385",
  accent: "#15be53",
  accentForeground: "#ffffff",
  destructive: "#df1b41",
  destructiveForeground: "#ffffff",
  warning: "#bb5504",
  border: "#e5edf5",
  input: "#f6f9fc",
  surface: "#f6f9fc",
  surfaceForeground: "#0a2540",
  overlay: "rgba(10,37,64,0.45)",
  tint: "#533afd",
  primarySoft: "rgba(83,58,253,0.10)",
  accentSoft: "rgba(21,190,83,0.12)",
  destructiveSoft: "rgba(223,27,65,0.10)",
};

// Stripe-inspired dark palette: deep indigo/navy surfaces, lifted purple accent
// and green for legibility on dark.
const dark: typeof light = {
  background: "#0a2540",
  foreground: "#ffffff",
  card: "#0f2e4e",
  cardForeground: "#ffffff",
  primary: "#8b7bff",
  primaryForeground: "#ffffff",
  secondary: "#163a5d",
  secondaryForeground: "#ffffff",
  muted: "#163a5d",
  mutedForeground: "#9fb6cf",
  accent: "#3ecf8e",
  accentForeground: "#04130b",
  destructive: "#ff6b85",
  destructiveForeground: "#1a0408",
  warning: "#f5a623",
  border: "rgba(255,255,255,0.10)",
  input: "#12314f",
  surface: "#163a5d",
  surfaceForeground: "#ffffff",
  overlay: "rgba(2,12,24,0.6)",
  tint: "#8b7bff",
  primarySoft: "rgba(139,123,255,0.18)",
  accentSoft: "rgba(62,207,142,0.18)",
  destructiveSoft: "rgba(255,107,133,0.18)",
};

// Conservative Stripe radii (4-8px) with a pill option for tags/chips.
export const RADII = { sm: 6, md: 8, lg: 8, pill: 9999 };
export const RADIUS = 8;

// Blue-tinted layered shadow approximation (Stripe rgba(50,50,93,...) family).
export const CARD_SHADOW = {
  light: {
    shadowColor: "#32325d",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  dark: {
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
} as const;

const colors = { light, dark, radius: RADIUS };

export default colors;
