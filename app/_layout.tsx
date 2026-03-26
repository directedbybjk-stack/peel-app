import { useEffect, useState, createContext, useContext } from 'react';
import { LogBox } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

LogBox.ignoreAllLogs();

import { useColorScheme } from '@/components/useColorScheme';
import { isOnboardingComplete } from '@/lib/storage';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const OnboardingContext = createContext<{ done: boolean | null }>({ done: null });
export const useOnboarding = () => useContext(OnboardingContext);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();
  const segments = useSegments();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    isOnboardingComplete().then(setOnboardingDone);
  }, []);

  useEffect(() => {
    if (!loaded || onboardingDone === null) return;
    SplashScreen.hideAsync();

    const inOnboarding = segments[0] === 'onboarding';

    if (!onboardingDone && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingDone && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [loaded, onboardingDone, segments]);

  if (!loaded || onboardingDone === null) {
    return null;
  }

  return (
    <OnboardingContext.Provider value={{ done: onboardingDone }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="product/[barcode]" options={{ presentation: 'card', gestureEnabled: true }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', gestureEnabled: true }} />
        </Stack>
      </ThemeProvider>
    </OnboardingContext.Provider>
  );
}
