import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ONBOARDING_KEY = 'peel_onboarding_complete';
const PREFERENCES_KEY = 'peel_user_preferences';
const SCAN_HISTORY_KEY = 'peel_scan_history';
const SCAN_COUNT_KEY = 'peel_daily_scan_count';
const SCAN_DATE_KEY = 'peel_daily_scan_date';

export interface UserPreferences {
  goal: string;
  allergies: string[];
}

export interface ScanHistoryItem {
  barcode: string;
  productName: string;
  brand: string;
  score: number;
  imageUrl?: string;
  scannedAt: string;
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

export async function isOnboardingComplete(): Promise<boolean> {
  const val = await getItem(ONBOARDING_KEY);
  return val === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await setItem(ONBOARDING_KEY, 'true');
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  await setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

export async function getPreferences(): Promise<UserPreferences | null> {
  const val = await getItem(PREFERENCES_KEY);
  if (!val) return null;
  return JSON.parse(val);
}

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  const val = await getItem(SCAN_HISTORY_KEY);
  if (!val) return [];
  return JSON.parse(val);
}

export async function addToScanHistory(item: ScanHistoryItem): Promise<void> {
  const history = await getScanHistory();
  history.unshift(item);
  // Keep last 500 scans
  if (history.length > 500) history.length = 500;
  await setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
}

export async function getDailyScanCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const savedDate = await getItem(SCAN_DATE_KEY);
  if (savedDate !== today) {
    await setItem(SCAN_DATE_KEY, today);
    await setItem(SCAN_COUNT_KEY, '0');
    return 0;
  }
  const count = await getItem(SCAN_COUNT_KEY);
  return count ? parseInt(count, 10) : 0;
}

export async function incrementScanCount(): Promise<number> {
  const count = await getDailyScanCount();
  const newCount = count + 1;
  await setItem(SCAN_COUNT_KEY, String(newCount));
  return newCount;
}
