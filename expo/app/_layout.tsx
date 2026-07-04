import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import { BlockingProvider } from "@/providers/BlockingProvider";
import { LicenseProvider } from "@/providers/LicenseProvider";
import { OnboardingProvider, useOnboarding } from "@/providers/OnboardingProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { TimerProvider, useTimer } from "@/providers/TimerProvider";
import type { TimerPhase } from "@/types";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/** Automatically presents the full-screen break when a focus block completes. */
function useBreakRouting() {
  const { phase, hydrated } = useTimer();
  const router = useRouter();
  const prevPhaseRef = useRef<TimerPhase>("idle");

  useEffect(() => {
    if (!hydrated) return;
    if (phase === "break" && prevPhaseRef.current !== "break") {
      router.push("/break");
    }
    prevPhaseRef.current = phase;
  }, [phase, hydrated, router]);
}

/** Routes to onboarding for first-time users, or to the main app otherwise. */
function useOnboardingRouting() {
  const { hydrated, completed } = useOnboarding();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!completed) {
      router.replace("/onboarding");
    } else {
      router.replace("/(tabs)");
    }
  }, [hydrated, completed, router]);
}

function RootLayoutNav() {
  useBreakRouting();
  useOnboardingRouting();

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="break"
        options={{ headerShown: false, presentation: "fullScreenModal", gestureEnabled: false }}
      />
      <Stack.Screen
        name="paywall"
        options={{ headerShown: false, presentation: "modal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <SettingsProvider>
          <LicenseProvider>
            <AnalyticsProvider>
              <BlockingProvider>
                <TimerProvider>
                  <OnboardingProvider>
                    <RootLayoutNav />
                  </OnboardingProvider>
                </TimerProvider>
              </BlockingProvider>
            </AnalyticsProvider>
          </LicenseProvider>
        </SettingsProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
