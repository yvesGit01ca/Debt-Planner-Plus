import colors, { CARD_SHADOW } from "@/constants/colors";
import { useThemeMode } from "@/context/ThemeContext";

export function useColors() {
  const { scheme } = useThemeMode();
  const palette = scheme === "dark" ? colors.dark : colors.light;
  return {
    ...palette,
    radius: colors.radius,
    scheme,
    cardShadow: CARD_SHADOW[scheme],
  };
}
