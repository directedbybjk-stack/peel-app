import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';

import { REVENUECAT_IOS_API_KEY, REVENUECAT_PREMIUM_ENTITLEMENT } from '@/lib/appConfig';

let configurePromise: Promise<void> | null = null;

export async function configureRevenueCat(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }

  const alreadyConfigured = await Purchases.isConfigured();
  if (alreadyConfigured) {
    return;
  }

  if (!configurePromise) {
    configurePromise = (async () => {
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      Purchases.configure({
        apiKey: REVENUECAT_IOS_API_KEY,
      });
    })().finally(() => {
      configurePromise = null;
    });
  }

  await configurePromise;
}

export function hasPremiumAccess(customerInfo: CustomerInfo | null | undefined): boolean {
  return Boolean(customerInfo?.entitlements.active[REVENUECAT_PREMIUM_ENTITLEMENT]?.isActive);
}

export function getPackageForPlan(
  offering: PurchasesOffering | null,
  plan: 'monthly' | 'yearly'
): PurchasesPackage | null {
  if (!offering) {
    return null;
  }

  return plan === 'monthly' ? offering.monthly : offering.annual;
}
