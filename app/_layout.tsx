import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { isOnboardingComplete } from '@/lib/storage';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    isOnboardingComplete().then((done) => {
      setOnboardingDone(done);
    });
  }, []);

  useEffect(() => {
    if (loaded && onboardingDone !== null) {
      SplashScreen.hideAsync();
      if (!onboardingDone) {
        router.replace('/onboarding');
      }
    }
  }, [loaded, onboardingDone]);

  if (!loaded || onboardingDone === null) {
    return null;
  }

  return <RootLayoutNav initialRoute={onboardingDone ? '(tabs)' : 'onboarding'} />;
}

function RootLayoutNav({ initialRoute }: { initialRoute: string }) {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[barcode]"
          options={{
            headerShown: true,
            title: 'Product Details',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
