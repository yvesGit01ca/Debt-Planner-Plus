---
name: Expo dual tab layouts
description: Why adding/removing a tab in this Expo app must touch two layout components.
---

The mobile app's `app/(tabs)/_layout.tsx` renders one of two tab layouts at runtime:
`NativeTabLayout` (uses `NativeTabs` from `expo-router/unstable-native-tabs`, chosen when
`isLiquidGlassAvailable()` — newer iOS) and `ClassicTabLayout` (uses `Tabs` from
`expo-router`, used on web, Android, and older iOS).

**Rule:** Any tab added or removed must be reflected in BOTH layouts, with consistent
order, title, and icon. Native uses SF Symbol names; Classic uses SF Symbols on iOS and
Feather icons elsewhere.

**Why:** A tab added only to `NativeTabs` still works as a route but disappears from the
bottom bar on web/Android/classic-iOS — a silent navigation regression that typecheck and
a single-platform screenshot won't catch.

**How to apply:** When changing tabs, grep `_layout.tsx` for the screen name in both
`NativeTabs.Trigger` and `Tabs.Screen`. Verify on a Classic-layout target (web preview)
in addition to native.
