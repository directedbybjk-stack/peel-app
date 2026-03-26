import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { brand } from '@/constants/Colors';
import { getScanHistory, getDailyScanCount, type ScanHistoryItem } from '@/lib/storage';

const FREE_SCAN_LIMIT = 10;

export default function HomeScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [dailyScans, setDailyScans] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const h = await getScanHistory();
        setHistory(h.slice(0, 10));
        const count = await getDailyScanCount();
        setDailyScans(count);
      };
      load();
    }, [])
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return brand.score.excellent;
    if (score >= 60) return brand.score.good;
    if (score >= 30) return brand.score.limit;
    return brand.score.avoid;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 30) return 'Limit';
    return 'Avoid';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
          <Text style={styles.appName}>Peel</Text>
        </View>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF' }}>P</Text>
        </View>
      </View>

      <View style={styles.scanCounter}>
        <View style={styles.scanCounterLeft}>
          <Text style={styles.scanCounterLabel}>Today's Scans</Text>
          <Text style={styles.scanCounterValue}>{dailyScans} / {FREE_SCAN_LIMIT}</Text>
        </View>
        <View style={styles.scanProgressOuter}>
          <View style={[styles.scanProgressInner, { width: `${Math.min((dailyScans / FREE_SCAN_LIMIT) * 100, 100)}%` }]} />
        </View>
        <Text style={styles.scanCounterHint}>
          {FREE_SCAN_LIMIT - dailyScans > 0
            ? `${FREE_SCAN_LIMIT - dailyScans} free scans remaining`
            : 'Upgrade to Peel Pro for unlimited scans'}
        </Text>
      </View>

      <Pressable
        testID="home-scan-button"
        style={({ pressed }) => [styles.scanCTA, pressed && styles.scanCTAPressed]}
        onPress={() => router.push('/(tabs)/scan')}
      >
        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFF' }}>Scan</Text>
        </View>
        <View>
          <Text style={styles.scanCTATitle}>Scan a Product</Text>
          <Text style={styles.scanCTASubtitle}>Point your camera at any barcode</Text>
        </View>
      </Pressable>

      {history.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <Pressable onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {history.slice(0, 5).map((item, i) => (
            <Pressable key={i} style={styles.historyItem} onPress={() => router.push(`/product/${item.barcode}`)}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.historyImage} />
              ) : (
                <View style={[styles.historyImage, styles.placeholder]}>
                  <Text style={{ fontSize: 14, color: '#9CA3AF' }}>N/A</Text>
                </View>
              )}
              <View style={styles.historyInfo}>
                <Text style={styles.historyName} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.historyBrand}>{item.brand}</Text>
              </View>
              <View style={[styles.historyScore, { backgroundColor: getScoreColor(item.score) + '20' }]}>
                <Text style={[styles.historyScoreText, { color: getScoreColor(item.score) }]}>{item.score}</Text>
                <Text style={[styles.historyScoreLabel, { color: getScoreColor(item.score) }]}>{getScoreLabel(item.score)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {history.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>---</Text>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptySubtitle}>Scan your first product to see what's really inside</Text>
        </View>
      )}
    </ScrollView>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: '#9CA3AF' },
  appName: { fontSize: 32, fontWeight: '800', color: '#111827' },
  logo: { fontSize: 32, fontWeight: '800' as const, color: '#16A34A' },
  scanCounter: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 16 },
  scanCounterLeft: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  scanCounterLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  scanCounterValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  scanProgressOuter: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 8 },
  scanProgressInner: { height: 6, backgroundColor: brand.primary, borderRadius: 3 },
  scanCounterHint: { fontSize: 12, color: '#9CA3AF' },
  scanCTA: { flexDirection: 'row', alignItems: 'center', backgroundColor: brand.primary, borderRadius: 16, padding: 20, gap: 16, marginBottom: 28 },
  scanCTAPressed: { backgroundColor: brand.primaryDark },
  scanCTAEmoji: { fontSize: 36 },
  scanCTATitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  scanCTASubtitle: { fontSize: 14, color: '#DCFCE7', marginTop: 2 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  seeAll: { fontSize: 14, fontWeight: '600', color: brand.primary },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12, gap: 12 },
  historyImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#E5E7EB' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  historyBrand: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  historyScore: { alignItems: 'center', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 },
  historyScoreText: { fontSize: 18, fontWeight: '800' },
  historyScoreLabel: { fontSize: 10, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 32, marginBottom: 16, color: '#D1D5DB' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
});
