import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DebtProvider, useDebts } from "@/context/DebtContext";
import { ThemeProvider, useThemeMode } from "@/context/ThemeContext";
import { reminderRouteFromData } from "@/utils/notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Routes a tapped reminder to its debt/bill edit screen. Handles both the
// foreground/background case (addNotificationResponseReceivedListener) and the
// cold-start case (getLastNotificationResponseAsync, which returns the response
// that launched the app). We dedupe by notification id so the launch response is
// not navigated to twice.
//
// Navigation is gated on debt/bill hydration: on cold start the store loads
// asynchronously, so a tap can arrive before debts/bills exist. Navigating then
// would land on an edit screen that can't resolve the item yet. We hold the
// response until `isLoading` is false, then route to the now-resolvable item.
function useReminderRouting() {
  const { isLoading } = useDebts();
  const loadedRef = useRef(false);
  const pendingRef = useRef<Notifications.NotificationResponse | null>(null);
  const handledIdRef = useRef<string | null>(null);

  const navigate = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (id && id === handledIdRef.current) return;
      handledIdRef.current = id;
      const route = reminderRouteFromData(
        response.notification.request.content.data,
      );
      if (route) router.push(route);
    },
    [],
  );

  // Either route immediately (data ready) or stash the response for the flush
  // effect below to handle once hydration completes.
  const handle = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      if (loadedRef.current) {
        navigate(response);
      } else {
        pendingRef.current = response;
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (Platform.OS === "web") return;
    Notifications.getLastNotificationResponseAsync()
      .then(handle)
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [handle]);

  // Track hydration and flush any response captured before data was ready.
  useEffect(() => {
    loadedRef.current = !isLoading;
    if (!isLoading && pendingRef.current) {
      const pending = pendingRef.current;
      pendingRef.current = null;
      navigate(pending);
    }
  }, [isLoading, navigate]);
}

function RootLayoutNav() {
  const { scheme } = useThemeMode();
  useReminderRouting();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-debt"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="add-bill"
          options={{ headerShown: false, presentation: "modal" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <ThemeProvider>
                <DebtProvider>
                  <RootLayoutNav />
                </DebtProvider>
              </ThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
