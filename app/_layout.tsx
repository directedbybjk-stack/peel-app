import { useEffect, useState, createContext, useContext } from 'react';
import { LogBox, Platform } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import 'react-native-reanimated';

LogBox.ignoreAllLogs();

import { useColorScheme } from '@/components/useColorScheme';
import { configureRevenueCat, hasPremiumAccess } from '@/lib/revenuecat';
import { isOnboardingComplete } from '@/lib/storage';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  '[RevenueCat]',
]);

const OnboardingContext = createContext<{ done: boolean | null }>({ done: null });
export const useOnboarding = () => useContext(OnboardingContext);

const SubscriptionContext = createContext<{ premium: boolean | null }>({ premium: null });
export const useSubscription = () => useContext(SubscriptionContext);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [premiumActive, setPremiumActive] = useState<boolean | null>(Platform.OS === 'ios' ? null : true);
  const colorScheme = useColorScheme();
  const segments = useSegments();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    isOnboardingComplete().then(setOnboardingDone);
  }, []);

  useEffect(() => {
    let mounted = true;

    if (Platform.OS !== 'ios') {
      setPremiumActive(true);
      return () => {
        mounted = false;
      };
    }

    const handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
      if (mounted) {
        setPremiumActive(hasPremiumAccess(customerInfo));
      }
    };

    configureRevenueCat()
      .then(() => Purchases.getCustomerInfo())
      .then((customerInfo) => {
        if (mounted) {
          setPremiumActive(hasPremiumAccess(customerInfo));
        }
      })
      .catch(() => {
        if (mounted) {
          setPremiumActive(false);
        }
      });

    Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

    return () => {
      mounted = false;
      Purchases.removeCustomerInfoUpdateListener(handleCustomerInfoUpdate);
    };
  }, []);

  useEffect(() => {
    if (!loaded || onboardingDone === null || premiumActive === null) return;
    SplashScreen.hideAsync();

    const inOnboarding = segments[0] === 'onboarding';
    const inPaywall = segments[0] === 'paywall';
    const inTabs = segments[0] === '(tabs)';

    if (!onboardingDone && !inOnboarding && !inPaywall) {
      router.replace('/onboarding');
    } else if (onboardingDone && !premiumActive && !inPaywall) {
      router.replace('/paywall');
    } else if (onboardingDone && premiumActive && (inOnboarding || inPaywall || !inTabs)) {
      router.replace('/(tabs)');
    }
  }, [loaded, onboardingDone, premiumActive, segments]);

  if (!loaded || onboardingDone === null || premiumActive === null) {
    return null;
  }

  return (
    <OnboardingContext.Provider value={{ done: onboardingDone }}>
      <SubscriptionContext.Provider value={{ premium: premiumActive }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen
              name="product/[barcode]"
              options={{
                presentation: 'card',
                gestureEnabled: true,
                headerShown: true,
                headerTitle: '',
                headerBackTitle: 'Back',
                headerTintColor: '#374151',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#F5F7F5' },
              }}
            />
            <Stack.Screen name="paywall" options={{ presentation: 'modal', gestureEnabled: true }} />
          </Stack>
        </ThemeProvider>
      </SubscriptionContext.Provider>
    </OnboardingContext.Provider>
  );
}
