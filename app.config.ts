import type { ExpoConfig } from 'expo/config';

const metaAppId = process.env.EXPO_PUBLIC_META_APP_ID ?? '';
const metaClientToken = process.env.EXPO_PUBLIC_META_CLIENT_TOKEN ?? '';
const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';

if (isProductionBuild && (!metaAppId || !metaClientToken)) {
  throw new Error(
    'Missing Meta build configuration. EXPO_PUBLIC_META_APP_ID and EXPO_PUBLIC_META_CLIENT_TOKEN are required for production iOS builds.'
  );
}

const metaPluginEnabled = metaAppId.length > 0 && metaClientToken.length > 0;
const metaPlugin: [string, Record<string, string | boolean>] | null = metaPluginEnabled
  ? [
      'react-native-fbsdk-next',
      {
        appID: metaAppId,
        clientToken: metaClientToken,
        displayName: 'Peel',
        scheme: `fb${metaAppId}`,
        advertiserIDCollectionEnabled: false,
        autoLogAppEventsEnabled: false,
        isAutoInitEnabled: false,
        iosUserTrackingPermission:
          'Peel uses tracking to measure installs, subscriptions, and onboarding performance from ads.',
      },
    ]
  : null;

const config: ExpoConfig = {
  name: 'Peel',
  slug: 'peel-app',
  version: '1.0.4',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'peelapp',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ECFDF5',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.anonymous.peel-app',
    buildNumber: '15',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSUserTrackingUsageDescription:
        'Peel uses tracking to measure installs, subscriptions, and onboarding performance from ads.',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
    ],
    package: 'com.anonymous.peel-app',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          'Peel uses tracking to measure installs, subscriptions, and onboarding performance from ads.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Peel needs camera access to scan product barcodes.',
      },
    ],
    ...(metaPlugin ? [metaPlugin] : []),
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    chompApiKey: process.env.CHOMP_API_KEY ?? '',
    devLaunchReviewUnlock: process.env.DEV_LAUNCH_REVIEW_UNLOCK === 'true',
    devSimulatorForcePaywall: process.env.DEV_SIMULATOR_FORCE_PAYWALL === 'true',
    devSimulatorUnlock: process.env.DEV_SIMULATOR_UNLOCK === 'true',
    metaAppId,
    metaClientToken,
    eas: {
      projectId: '16e0789b-a29f-43c8-84a2-fceaebbd2355',
    },
  },
};

export default config;
