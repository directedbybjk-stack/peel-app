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
    flush: () => void;
    getAnonymousID: () => Promise<string | null | undefined>;
    AppEvents: Record<string, string>;
    AppEventParams: Record<string, string>;
  };
  AEMReporterIOS?: {
    logAEMEvent: (
      eventName: string,
      value: number,
      currency?: string,
      otherParameters?: Record<string, string | number>
    ) => void;
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

async function syncMetaTrackingPermission(sdk: MetaSdk): Promise<boolean> {
  const permission = await getTrackingPermissionsAsync();
  const granted = permission.status === 'granted';

  sdk.Settings.setAutoLogAppEventsEnabled(true);
  sdk.Settings.setAdvertiserIDCollectionEnabled(granted);
  await sdk.Settings.setAdvertiserTrackingEnabled(granted);

  return granted;
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

  const { AppEventsLogger, AEMReporterIOS, Settings } = sdk;

  if (!initPromise) {
    initPromise = (async () => {
      Settings.initializeSDK();
      await syncMetaTrackingPermission(sdk);

      AppEventsLogger.logEvent('fb_mobile_activate_app');
      AEMReporterIOS?.logAEMEvent('fb_mobile_activate_app', 0);
      AppEventsLogger.flush();
    })().finally(() => {
      initPromise = null;
    });
  }

  await initPromise;
}

export async function requestMetaTrackingPermission(): Promise<boolean> {
  const sdk = loadMetaSdk();
  if (!sdk) {
    return false;
  }

  await initializeMetaTracking();

  const existingPermission = await getTrackingPermissionsAsync();
  const permission =
    existingPermission.status === 'undetermined'
      ? await requestTrackingPermissionsAsync()
      : existingPermission;

  const granted = permission.status === 'granted';
  sdk.Settings.setAdvertiserIDCollectionEnabled(granted);
  await sdk.Settings.setAdvertiserTrackingEnabled(granted);

  return granted;
}

export async function getMetaAnonymousId(): Promise<string | null> {
  await initializeMetaTracking();
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
  await initializeMetaTracking();
  const sdk = loadMetaSdk();
  if (!sdk) {
    return;
  }

  if (await hasTrackedMetaRegistration()) {
    return;
  }

  const { AppEventsLogger, AEMReporterIOS } = sdk;
  const eventName = AppEventsLogger.AppEvents.CompletedRegistration;
  const params = {
    [AppEventsLogger.AppEventParams.RegistrationMethod]: method,
  };

  AppEventsLogger.logEvent(eventName, undefined, params);
  AEMReporterIOS?.logAEMEvent(eventName, 0, undefined, params);
  AppEventsLogger.flush();
  await setMetaRegistrationTracked();
}

export async function trackMetaStartTrial(params: {
  value?: number;
  currency?: string;
  plan?: string;
}): Promise<void> {
  await initializeMetaTracking();
  const sdk = loadMetaSdk();
  if (!sdk) {
    return;
  }

  const value = typeof params.value === 'number' ? params.value : 0;
  const currency = params.currency?.trim() || 'USD';
  const plan = params.plan?.trim();

  const { AppEventsLogger, AEMReporterIOS } = sdk;
  const eventName = AppEventsLogger.AppEvents.StartTrial;
  const eventParams = {
    [AppEventsLogger.AppEventParams.Currency]: currency,
    ...(plan ? { plan } : {}),
  };

  AppEventsLogger.logEvent(eventName, value, eventParams);
  AEMReporterIOS?.logAEMEvent(eventName, value, currency, eventParams);
  AppEventsLogger.flush();
}

export async function trackMetaPurchase(params: {
  value?: number;
  currency?: string;
  plan?: string;
}): Promise<void> {
  await initializeMetaTracking();
  const sdk = loadMetaSdk();
  if (!sdk) {
    return;
  }

  const value = typeof params.value === 'number' ? params.value : 0;
  const currency = params.currency?.trim() || 'USD';
  const plan = params.plan?.trim();

  const { AppEventsLogger, AEMReporterIOS } = sdk;
  AppEventsLogger.logPurchase(value, currency, {
    ...(plan ? { plan } : {}),
  });
  AEMReporterIOS?.logAEMEvent('fb_mobile_purchase', value, currency, {
    ...(plan ? { plan } : {}),
  });
  AppEventsLogger.flush();
}
