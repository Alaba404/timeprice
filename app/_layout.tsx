import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useProfileStore } from '../src/store/profileStore';
import { useHistoryStore } from '../src/store/historyStore';
import { useLocaleStore } from '../src/store/localeStore';
import { runMigrations } from '../src/db/schema';
import { colors } from '../src/theme';

import type PurchasesType from 'react-native-purchases';
let Purchases: typeof PurchasesType | null = null;
try {
  Purchases = (require('react-native-purchases') as { default: typeof PurchasesType }).default;
} catch {}

const REVENUECAT_API_KEY = Platform.select({
  ios: 'YOUR_IOS_REVENUECAT_KEY',
  android: 'YOUR_ANDROID_REVENUECAT_KEY',
  default: '',
});

export default function RootLayout() {
  const hydrateProfiles = useProfileStore((s) => s.hydrate);
  const hydrateHistory  = useHistoryStore((s) => s.hydrate);
  const profilesHydrated = useProfileStore((s) => s.hydrated);
  // Subscribe to locale: when it changes, the key on Stack changes → full re-render
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    runMigrations();
    void hydrateProfiles();
    hydrateHistory();

    if (Purchases && REVENUECAT_API_KEY) {
      try {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      } catch {}
    }
  }, [hydrateProfiles, hydrateHistory]);

  if (!profilesHydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {/*
          key={locale} forces a full remount of the navigation tree when the
          language switches — every call to t() will return the new language.
        */}
        <Stack
          key={locale}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="scanner"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="paywall"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
