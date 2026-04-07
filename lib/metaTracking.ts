import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

import { META_TRACKING_ENABLED } from '@/lib/appConfig';
import { hasTrackedMetaRegistration, setMetaRegistrationTracked } from '@/lib/storage';

let initPromise: Promise<void> | null = null;
let metaSdkLoadFailed = false;

type MetaSdk = {
  AppEventsLogger: {
    logEvent: (...args: any[]) => void;
    logPurchase: (amount: number, currency: string, params?: Record<string, any>) => void;
    getAnonymousID: () => Promise<string | null | undefined>;
    AppEvents: Record<string, string>;
    AppEventParams: Record<string, string>;
  };
  Settings: {
    initializeSDK: () => void;
    setAutoLogAppEventsEnabled: (enabled: boolean) => void;
    setAdvertiserIDCollectionEnabled: (enabled: boolean) => void;
    setAdvertiserTrackingEnabled: (enabled: boolean) => Promise<void>;
  };
};

export function isMetaTrackingEnabled(): boolean {
  return Platform.OS === 'ios' && META_TRACKING_ENABLED && Constants.isDevice;
}

function loadMetaSdk(): MetaSdk | null {
  if (!isMetaTrackingEnabled() || metaSdkLoadFailed) {
    return null;
  }

  try {
    const sdk = require('react-native-fbsdk-next') as MetaSdk;
    if (!sdk?.AppEventsLogger || !sdk?.Settings) {
      metaSdkLoadFailed = true;
      return null;
    }
    return sdk;
  } catch (error) {
    metaSdkLoadFailed = true;
    console.warn('Meta SDK unavailable in this runtime', error);
    return null;
  }
}

export async function initializeMetaTracking(): Promise<void> {
  const sdk = loadMetaSdk();
  if (!sdk) {
    return;
  }

  const { AppEventsLogger, Settings } = sdk;

  if (!initPromise) {
    initPromise = (async () => {
      const existingPermission = await getTrackingPermissionsAsync();
      const permission =
        existingPermission.status === 'granted'
          ? existingPermission
          : await requestTrackingPermissionsAsync();

      Settings.initializeSDK();
      Settings.setAutoLogAppEventsEnabled(true);
      Settings.setAdvertiserIDCollectionEnabled(permission.status === 'granted');
      await Settings.setAdvertiserTrackingEnabled(permission.status === 'granted');

      AppEventsLogger.logEvent('fb_mobile_activate_app');
    })().finally(() => {
      initPromise = null;
    });
  }

  await initPromise;
}

export async function getMetaAnonymousId(): Promise<string | null> {
  const sdk = loadMetaSdk();
  if (!sdk) {
    return null;
  }

  try {
    const { AppEventsLogger } = sdk;
    return (await AppEventsLogger.getAnonymousID()) ?? null;
  } catch {
    return null;
  }
}

export async function trackMetaRegistration(method = 'onboarding'): Promise<void> {
  const sdk = loadMetaSdk();
  if (!sdk) {
    return;
  }

  if (await hasTrackedMetaRegistration()) {
    return;
  }

  const { AppEventsLogger } = sdk;
  AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedRegistration, {
    [AppEventsLogger.AppEventParams.RegistrationMethod]: method,
  });
  await setMetaRegistrationTracked();
}

export async function trackMetaStartTrial(params: {
  value?: number;
  currency?: string;
  plan?: string;
}): Promise<void> {
  const sdk = loadMetaSdk();
  if (!sdk) {
    return;
  }

  const value = typeof params.value === 'number' ? params.value : 0;
  const currency = params.currency?.trim() || 'USD';
  const plan = params.plan?.trim();

  const { AppEventsLogger } = sdk;
  AppEventsLogger.logEvent('fb_mobile_start_trial', value, {
    [AppEventsLogger.AppEventParams.Currency]: currency,
    ...(plan ? { plan } : {}),
  });
}

export async function trackMetaPurchase(params: {
  value?: number;
  currency?: string;
  plan?: string;
}): Promise<void> {
  const sdk = loadMetaSdk();
  if (!sdk) {
    return;
  }

  const value = typeof params.value === 'number' ? params.value : 0;
  const currency = params.currency?.trim() || 'USD';
  const plan = params.plan?.trim();

  const { AppEventsLogger } = sdk;
  AppEventsLogger.logPurchase(value, currency, {
    ...(plan ? { plan } : {}),
  });
}
